import datetime
import random
import uuid
import sys
import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import (
    User, Farmer, Officer, ProcurementCentre, Procurement,
    QueueEntry, StatusHistory, Payment, Notification,
    ProcurementStatus, QueueStatus, PaymentStatus
)
from app.schemas import (
    ProcurementCreate, ProcurementStageUpdate, ProcurementOut
)
from app.auth import get_current_user, get_current_farmer, get_current_officer
from app.msp_rates import get_msp_rate

# Add ml folder to sys.path
ml_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../ml"))
if ml_dir not in sys.path:
    sys.path.insert(0, ml_dir)

try:
    from predict import predict_waiting_time
except ImportError:
    def predict_waiting_time(**kwargs):
        ahead = kwargs.get("farmers_ahead", 0)
        mins = max(5.0, ahead * 12.0 + 8.0)
        return {
            "predicted_minutes": mins,
            "formatted_time": f"{int(mins)} mins",
            "range_minutes": {"min": mins - 5, "max": mins + 10, "formatted": f"{int(mins-5)} - {int(mins+10)} mins"},
            "confidence_score": 85.0,
            "std_deviation": 3.5,
            "factors": [{"factor": f"{ahead} farmers ahead", "impact": f"+{ahead*10} mins", "type": "neutral"}]
        }

router = APIRouter(prefix="/procurements", tags=["Procurements"])

def generate_token(centre_code: str, db: Session) -> str:
    today_str = datetime.date.today().strftime("%y%m%d")
    count = db.query(Procurement).count() + 1
    rand_suffix = random.randint(10, 99)
    return f"KQ-{centre_code[:3].upper()}-{today_str}-{count:03d}{rand_suffix}"

def enrich_procurement(p: Procurement, db: Session) -> dict:
    """Enriches procurement model with live queue position, AI wait predictions and details."""
    farmer_user = p.farmer.user if p.farmer else None
    centre = p.centre
    
    # Calculate queue info
    queue_number = None
    farmers_ahead = 0
    if p.queue_entry:
        queue_number = p.queue_entry.queue_number
        if p.status in [ProcurementStatus.REGISTERED, ProcurementStatus.WAITING]:
            farmers_ahead = db.query(QueueEntry).filter(
                QueueEntry.centre_id == p.centre_id,
                QueueEntry.status == QueueStatus.WAITING,
                QueueEntry.queue_number < p.queue_entry.queue_number
            ).count()
        else:
            farmers_ahead = 0
            
    # AI waiting time estimate if in waiting stage
    pred_mins = 0.0
    pred_formatted = "0 mins"
    confidence = 90.0
    factors = []
    
    if p.status in [ProcurementStatus.REGISTERED, ProcurementStatus.WAITING]:
        pred_res = predict_waiting_time(
            farmers_ahead=farmers_ahead,
            crop_type=p.crop_type,
            quantity_quintals=p.estimated_quantity,
            active_weighing_counters=centre.active_weighing_counters if centre else 2,
            active_quality_counters=centre.active_quality_counters if centre else 2,
            active_staff_count=centre.active_staff_count if centre else 8,
            hour_of_day=datetime.datetime.now().hour
        )
        pred_mins = pred_res["predicted_minutes"]
        pred_formatted = pred_res["formatted_time"]
        confidence = pred_res["confidence_score"]
        factors = pred_res["factors"]
    elif p.status in [ProcurementStatus.WEIGHING, ProcurementStatus.QUALITY_CHECK]:
        pred_mins = 8.0
        pred_formatted = "~8 mins (In Progress)"
        confidence = 95.0
        factors = [{"factor": "Counter assigned", "impact": "Currently on bench", "type": "positive"}]
    else:
        pred_mins = 0.0
        pred_formatted = "Completed"
        confidence = 100.0

    return {
        "id": p.id,
        "token_number": p.token_number,
        "farmer_id": p.farmer_id,
        "centre_id": p.centre_id,
        "crop_type": p.crop_type,
        "variety": p.variety,
        "estimated_quantity": p.estimated_quantity,
        "actual_quantity": p.actual_quantity,
        "vehicle_number": p.vehicle_number,
        "slot_date": p.slot_date,
        "slot_time": p.slot_time,
        "status": p.status,
        "grade": p.grade,
        "moisture_percentage": p.moisture_percentage,
        "foreign_matter_percentage": p.foreign_matter_percentage,
        "gross_weight": p.gross_weight,
        "tare_weight": p.tare_weight,
        "net_weight": p.net_weight,
        "msp_rate": p.msp_rate,
        "total_amount": p.total_amount,
        "rejection_reason": p.rejection_reason,
        "officer_remarks": p.officer_remarks,
        "created_at": p.created_at,
        "updated_at": p.updated_at,
        "farmer_name": farmer_user.full_name if farmer_user else "Farmer",
        "farmer_phone": farmer_user.phone if farmer_user else "",
        "farmer_id_card": p.farmer.farmer_id_card if p.farmer else "",
        "centre_name": centre.name if centre else "Mandi",
        "queue_number": queue_number,
        "farmers_ahead": farmers_ahead,
        "estimated_waiting_minutes": pred_mins,
        "estimated_waiting_formatted": pred_formatted,
        "prediction_confidence": confidence,
        "prediction_factors": factors,
        "status_history": p.status_history,
        "payment": p.payment
    }

@router.get("", response_model=List[ProcurementOut])
def list_procurements(
    centre_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Procurement)
    if current_user.role == "farmer":
        if current_user.farmer_profile:
            query = query.filter(Procurement.farmer_id == current_user.farmer_profile.id)
    elif centre_id:
        query = query.filter(Procurement.centre_id == centre_id)
        
    if status:
        query = query.filter(Procurement.status == status)
        
    procurements = query.order_by(Procurement.created_at.desc()).all()
    return [enrich_procurement(p, db) for p in procurements]

@router.get("/token/{token_number}", response_model=ProcurementOut)
def get_by_token(token_number: str, db: Session = Depends(get_db)):
    """Public token status tracker lookup."""
    p = db.query(Procurement).filter(Procurement.token_number == token_number).first()
    if not p:
        raise HTTPException(status_code=404, detail="Token not found")
    return enrich_procurement(p, db)

@router.get("/{procurement_id}", response_model=ProcurementOut)
def get_procurement(procurement_id: int, db: Session = Depends(get_db)):
    p = db.query(Procurement).filter(Procurement.id == procurement_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Procurement not found")
    return enrich_procurement(p, db)

@router.post("", response_model=ProcurementOut)
def create_procurement(
    proc_in: ProcurementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Determine farmer
    if current_user.role == "farmer":
        if not current_user.farmer_profile:
            raise HTTPException(status_code=400, detail="Farmer profile not found")
        farmer_id = current_user.farmer_profile.id
    else:
        # For admin/demo, pick first farmer or create
        first_farmer = db.query(Farmer).first()
        if not first_farmer:
            raise HTTPException(status_code=400, detail="No farmers in system")
        farmer_id = first_farmer.id

    centre = db.query(ProcurementCentre).filter(ProcurementCentre.id == proc_in.centre_id).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")

    token = generate_token(centre.code, db)
    slot_date = proc_in.slot_date or datetime.date.today().isoformat()
    
    # Calculate default MSP rate
    rate = get_msp_rate(proc_in.crop_type, proc_in.variety)

    procurement = Procurement(
        token_number=token,
        farmer_id=farmer_id,
        centre_id=centre.id,
        crop_type=proc_in.crop_type,
        variety=proc_in.variety or "Standard",
        estimated_quantity=proc_in.estimated_quantity,
        vehicle_number=proc_in.vehicle_number or "PB-10-AZ-2041",
        slot_date=slot_date,
        slot_time=proc_in.slot_time or "09:30 AM",
        status=ProcurementStatus.WAITING,
        msp_rate=rate,
        total_amount=round(rate * proc_in.estimated_quantity, 2)
    )
    db.add(procurement)
    db.flush()

    # Calculate queue number for centre
    max_q = db.query(func.max(QueueEntry.queue_number)).filter(
        QueueEntry.centre_id == centre.id
    ).scalar() or 0
    
    next_q = max_q + 1

    queue_entry = QueueEntry(
        procurement_id=procurement.id,
        centre_id=centre.id,
        queue_number=next_q,
        status=QueueStatus.WAITING,
        priority=1
    )
    db.add(queue_entry)

    # Status history initial entry
    history = StatusHistory(
        procurement_id=procurement.id,
        from_status=None,
        to_status=ProcurementStatus.REGISTERED,
        remarks=f"Procurement slot booked for {proc_in.crop_type} ({proc_in.estimated_quantity} Qtl)",
        changed_by_user_id=current_user.id,
        stage_duration_seconds=0
    )
    db.add(history)
    
    # Secondary history entry for entering waiting queue
    history_waiting = StatusHistory(
        procurement_id=procurement.id,
        from_status=ProcurementStatus.REGISTERED,
        to_status=ProcurementStatus.WAITING,
        remarks=f"Entered live queue at {centre.name}. Queue Position: #{next_q}",
        changed_by_user_id=current_user.id,
        stage_duration_seconds=120
    )
    db.add(history_waiting)

    # In-app notification for farmer
    farmer = db.query(Farmer).filter(Farmer.id == farmer_id).first()
    if farmer and farmer.user:
        notif = Notification(
            user_id=farmer.user.id,
            procurement_id=procurement.id,
            title="Digital Token Generated",
            message=f"Token {token} confirmed for {proc_in.crop_type}. Queue Position #{next_q} at {centre.name}.",
            type="turn_alert"
        )
        db.add(notif)

    db.commit()
    db.refresh(procurement)
    return enrich_procurement(procurement, db)

@router.patch("/{procurement_id}/stage", response_model=ProcurementOut)
def update_stage(
    procurement_id: int,
    stage_update: ProcurementStageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_officer)
):
    procurement = db.query(Procurement).filter(Procurement.id == procurement_id).first()
    if not procurement:
        raise HTTPException(status_code=404, detail="Procurement not found")

    prev_status = procurement.status
    new_status = stage_update.to_status
    now = datetime.datetime.utcnow()

    # Calculate stage duration in seconds from last history entry
    last_history = db.query(StatusHistory).filter(
        StatusHistory.procurement_id == procurement.id
    ).order_by(StatusHistory.created_at.desc()).first()
    
    stage_duration = 0
    if last_history and last_history.created_at:
        stage_duration = max(30, int((now - last_history.created_at).total_seconds()))

    # Apply stage-specific updates
    procurement.status = new_status
    if stage_update.remarks:
        procurement.officer_remarks = stage_update.remarks

    # 1. Weighing Stage
    if new_status == ProcurementStatus.WEIGHING:
        if procurement.queue_entry:
            procurement.queue_entry.status = QueueStatus.IN_PROGRESS
            procurement.queue_entry.assigned_counter = stage_update.counter_number or "Weighbridge 1"
            procurement.queue_entry.called_at = now
            
    elif new_status == ProcurementStatus.QUALITY_CHECK:
        if stage_update.gross_weight and stage_update.tare_weight:
            procurement.gross_weight = stage_update.gross_weight
            procurement.tare_weight = stage_update.tare_weight
            procurement.net_weight = round(stage_update.gross_weight - stage_update.tare_weight, 2)
            procurement.actual_quantity = procurement.net_weight
        elif stage_update.net_weight:
            procurement.net_weight = stage_update.net_weight
            procurement.actual_quantity = stage_update.net_weight
            
        if procurement.queue_entry:
            procurement.queue_entry.assigned_counter = stage_update.counter_number or "Quality Lab 1"

    # 2. Acceptance / Rejection
    elif new_status == ProcurementStatus.ACCEPTED:
        procurement.grade = stage_update.grade or "Grade A"
        procurement.moisture_percentage = stage_update.moisture_percentage or 12.8
        procurement.foreign_matter_percentage = stage_update.foreign_matter_percentage or 0.8
        
        # Calculate final MSP value
        final_qty = procurement.actual_quantity or procurement.estimated_quantity
        rate = get_msp_rate(procurement.crop_type, procurement.grade)
        procurement.msp_rate = rate
        procurement.total_amount = round(rate * final_qty, 2)

    elif new_status == ProcurementStatus.REJECTED:
        procurement.rejection_reason = stage_update.rejection_reason or "Moisture content exceeds permissible 17% limit (FAQ norms)."
        if procurement.queue_entry:
            procurement.queue_entry.status = QueueStatus.CANCELLED
            procurement.queue_entry.completed_at = now

    # 3. Payment Pending
    elif new_status == ProcurementStatus.PAYMENT_PENDING:
        # Create or update Payment entry
        final_amt = procurement.total_amount or round((procurement.msp_rate or 2300.0) * (procurement.actual_quantity or procurement.estimated_quantity), 2)
        payment = db.query(Payment).filter(Payment.procurement_id == procurement.id).first()
        if not payment:
            payment = Payment(
                procurement_id=procurement.id,
                farmer_id=procurement.farmer_id,
                amount=final_amt,
                msp_rate=procurement.msp_rate or 2300.0,
                quantity_quintals=procurement.actual_quantity or procurement.estimated_quantity,
                status=PaymentStatus.PENDING,
                payment_mode="Direct Benefit Transfer (PFMS / DBT)",
                transaction_ref=f"PFMS-DBT-{uuid.uuid4().hex[:10].upper()}"
            )
            db.add(payment)

    # 4. Completed
    elif new_status == ProcurementStatus.COMPLETED:
        if procurement.queue_entry:
            procurement.queue_entry.status = QueueStatus.COMPLETED
            procurement.queue_entry.completed_at = now
            
        payment = db.query(Payment).filter(Payment.procurement_id == procurement.id).first()
        if payment:
            payment.status = PaymentStatus.CREDITED
            payment.credited_at = now
            payment.bank_ref = f"UTR{random.randint(1000000000, 9999999999)}"

    # Save to status history
    history = StatusHistory(
        procurement_id=procurement.id,
        from_status=prev_status,
        to_status=new_status,
        remarks=stage_update.remarks or f"Stage advanced to {new_status}",
        changed_by_user_id=current_user.id,
        counter_number=stage_update.counter_number,
        stage_duration_seconds=stage_duration
    )
    db.add(history)

    # Trigger smart in-app notification to farmer
    farmer = procurement.farmer
    if farmer and farmer.user:
        notif_msg = ""
        notif_type = "stage_update"
        if new_status == ProcurementStatus.WEIGHING:
            notif_msg = f"Your turn has arrived! Please bring your vehicle to {stage_update.counter_number or 'Weighbridge 1'}."
            notif_type = "turn_alert"
        elif new_status == ProcurementStatus.QUALITY_CHECK:
            notif_msg = f"Weighing complete ({procurement.net_weight or procurement.actual_quantity} Qtl). Quality sample testing underway."
        elif new_status == ProcurementStatus.ACCEPTED:
            notif_msg = f"Crop passed inspection ({procurement.grade})! Payout of ₹{procurement.total_amount:,.2f} calculated."
        elif new_status == ProcurementStatus.PAYMENT_PENDING:
            notif_msg = f"DBT PFMS Payment of ₹{procurement.total_amount:,.2f} is being processed to your bank account."
            notif_type = "payment"
        elif new_status == ProcurementStatus.COMPLETED:
            notif_msg = f"Procurement completed! ₹{procurement.total_amount:,.2f} successfully credited via DBT."
            notif_type = "payment"
        elif new_status == ProcurementStatus.REJECTED:
            notif_msg = f"Crop consignment not accepted. Reason: {procurement.rejection_reason}"
            notif_type = "rejection"

        if notif_msg:
            notif = Notification(
                user_id=farmer.user.id,
                procurement_id=procurement.id,
                title=f"Update: Token {procurement.token_number}",
                message=notif_msg,
                type=notif_type
            )
            db.add(notif)

    db.commit()
    db.refresh(procurement)
    return enrich_procurement(procurement, db)
