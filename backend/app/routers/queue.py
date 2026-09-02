from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import QueueEntry, Procurement, ProcurementCentre, User, QueueStatus, ProcurementStatus
from app.schemas import QueueEntryOut, ProcurementOut
from app.routers.procurements import enrich_procurement
from app.auth import get_current_user

router = APIRouter(prefix="/queue", tags=["Live Queue Management"])

@router.get("/centre/{centre_id}", response_model=List[ProcurementOut])
def get_centre_queue(centre_id: int, db: Session = Depends(get_db)):
    """Returns all active queue items (waiting or in-progress) for a given Mandi centre."""
    procurements = db.query(Procurement).join(QueueEntry).filter(
        Procurement.centre_id == centre_id,
        QueueEntry.status.in_([QueueStatus.WAITING, QueueStatus.IN_PROGRESS])
    ).order_by(QueueEntry.queue_number.asc()).all()
    
    return [enrich_procurement(p, db) for p in procurements]

@router.get("/stats/{centre_id}")
def get_queue_stats(centre_id: int, db: Session = Depends(get_db)):
    centre = db.query(ProcurementCentre).filter(ProcurementCentre.id == centre_id).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")

    waiting_count = db.query(QueueEntry).filter(
        QueueEntry.centre_id == centre_id,
        QueueEntry.status == QueueStatus.WAITING
    ).count()

    in_progress_count = db.query(QueueEntry).filter(
        QueueEntry.centre_id == centre_id,
        QueueEntry.status == QueueStatus.IN_PROGRESS
    ).count()

    completed_today = db.query(Procurement).filter(
        Procurement.centre_id == centre_id,
        Procurement.status == ProcurementStatus.COMPLETED
    ).count()

    total_registered = db.query(Procurement).filter(
        Procurement.centre_id == centre_id
    ).count()

    return {
        "centre_id": centre_id,
        "centre_name": centre.name,
        "waiting_farmers": waiting_count,
        "currently_processing": in_progress_count,
        "completed_today": completed_today,
        "total_farmers_today": total_registered,
        "active_weighing_counters": centre.active_weighing_counters,
        "active_quality_counters": centre.active_quality_counters,
        "active_staff_count": centre.active_staff_count
    }
