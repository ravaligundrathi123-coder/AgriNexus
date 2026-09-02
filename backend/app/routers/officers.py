from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import User, Officer, Procurement, QueueEntry, ProcurementCentre, StatusHistory
from app.schemas import ProcurementOut
from app.routers.procurements import enrich_procurement
from app.auth import get_current_officer

router = APIRouter(prefix="/officers", tags=["Procurement Officers"])

@router.get("/dashboard-summary")
def get_officer_dashboard_summary(
    centre_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_officer)
):
    # Determine centre
    if not centre_id:
        if current_user.officer_profile:
            centre_id = current_user.officer_profile.centre_id
        else:
            first_centre = db.query(ProcurementCentre).first()
            centre_id = first_centre.id if first_centre else 1

    centre = db.query(ProcurementCentre).filter(ProcurementCentre.id == centre_id).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")

    # Counts
    total_today = db.query(Procurement).filter(Procurement.centre_id == centre_id).count()
    waiting_count = db.query(Procurement).filter(
        Procurement.centre_id == centre_id,
        Procurement.status.in_(["REGISTERED", "WAITING"])
    ).count()
    processing_count = db.query(Procurement).filter(
        Procurement.centre_id == centre_id,
        Procurement.status.in_(["WEIGHING", "QUALITY_CHECK", "ACCEPTED", "PAYMENT_PENDING"])
    ).count()
    completed_count = db.query(Procurement).filter(
        Procurement.centre_id == centre_id,
        Procurement.status == "COMPLETED"
    ).count()
    rejected_count = db.query(Procurement).filter(
        Procurement.centre_id == centre_id,
        Procurement.status == "REJECTED"
    ).count()

    # Calculate average waiting time from status histories
    weighing_histories = db.query(StatusHistory).join(Procurement).filter(
        Procurement.centre_id == centre_id,
        StatusHistory.to_status == "WEIGHING"
    ).all()

    avg_wait = 24.5  # default baseline
    if weighing_histories:
        total_sec = sum(h.stage_duration_seconds for h in weighing_histories if h.stage_duration_seconds > 0)
        if total_sec > 0:
            avg_wait = round(total_sec / (len(weighing_histories) * 60), 1)

    # Average processing time (completed procurements)
    completed_histories = db.query(StatusHistory).join(Procurement).filter(
        Procurement.centre_id == centre_id,
        StatusHistory.to_status == "COMPLETED"
    ).all()
    avg_proc = 18.0
    if completed_histories:
        total_sec = sum(h.stage_duration_seconds for h in completed_histories if h.stage_duration_seconds > 0)
        if total_sec > 0:
            avg_proc = round(total_sec / (len(completed_histories) * 60), 1)

    # Active Queue
    active_queue = db.query(Procurement).join(QueueEntry).filter(
        Procurement.centre_id == centre_id,
        QueueEntry.status.in_(["waiting", "in_progress"])
    ).order_by(QueueEntry.queue_number.asc()).all()

    return {
        "centre": {
            "id": centre.id,
            "name": centre.name,
            "code": centre.code,
            "district": centre.district,
            "state": centre.state,
            "active_weighing_counters": centre.active_weighing_counters,
            "active_quality_counters": centre.active_quality_counters,
            "active_staff_count": centre.active_staff_count,
        },
        "stats": {
            "total_farmers_today": total_today,
            "waiting_farmers": waiting_count,
            "currently_processing": processing_count,
            "completed_procurements": completed_count,
            "rejected_procurements": rejected_count,
            "average_waiting_time_minutes": avg_wait,
            "average_processing_time_minutes": avg_proc,
        },
        "active_queue": [enrich_procurement(p, db) for p in active_queue]
    }
