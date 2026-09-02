from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User, Farmer, Procurement, Payment, Notification
from app.schemas import FarmerProfileOut, ProcurementOut, UserOut
from app.routers.procurements import enrich_procurement
from app.auth import get_current_farmer, get_current_user

router = APIRouter(prefix="/farmers", tags=["Farmers"])

@router.get("/me", response_model=UserOut)
def get_farmer_profile(current_user: User = Depends(get_current_farmer)):
    return current_user

@router.get("/me/procurements", response_model=List[ProcurementOut])
def get_my_procurements(db: Session = Depends(get_db), current_user: User = Depends(get_current_farmer)):
    if not current_user.farmer_profile:
        return []
    procurements = db.query(Procurement).filter(
        Procurement.farmer_id == current_user.farmer_profile.id
    ).order_by(Procurement.created_at.desc()).all()
    return [enrich_procurement(p, db) for p in procurements]

@router.get("/me/active-token", response_model=ProcurementOut)
def get_my_active_token(db: Session = Depends(get_db), current_user: User = Depends(get_current_farmer)):
    if not current_user.farmer_profile:
        raise HTTPException(status_code=404, detail="Farmer profile not found")
    
    # Active procurement: not yet completed or rejected
    p = db.query(Procurement).filter(
        Procurement.farmer_id == current_user.farmer_profile.id,
        Procurement.status.notin_(["COMPLETED", "REJECTED"])
    ).order_by(Procurement.created_at.desc()).first()

    if not p:
        # Fallback to most recent procurement
        p = db.query(Procurement).filter(
            Procurement.farmer_id == current_user.farmer_profile.id
        ).order_by(Procurement.created_at.desc()).first()

    if not p:
        raise HTTPException(status_code=404, detail="No active procurement found")

    return enrich_procurement(p, db)
