from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import ProcurementCentre, User
from app.schemas import CentreOut, CentreCreate, CentreUpdate
from app.auth import get_current_user, get_current_admin

router = APIRouter(prefix="/centres", tags=["Procurement Centres"])

@router.get("", response_model=List[CentreOut])
def list_centres(db: Session = Depends(get_db)):
    centres = db.query(ProcurementCentre).filter(ProcurementCentre.is_active == True).all()
    return centres

@router.get("/{centre_id}", response_model=CentreOut)
def get_centre(centre_id: int, db: Session = Depends(get_db)):
    centre = db.query(ProcurementCentre).filter(ProcurementCentre.id == centre_id).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Procurement centre not found")
    return centre

@router.post("", response_model=CentreOut)
def create_centre(centre_in: CentreCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_admin)):
    centre = ProcurementCentre(**centre_in.dict())
    db.add(centre)
    db.commit()
    db.refresh(centre)
    return centre

@router.patch("/{centre_id}", response_model=CentreOut)
def update_centre(centre_id: int, centre_update: CentreUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    centre = db.query(ProcurementCentre).filter(ProcurementCentre.id == centre_id).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Procurement centre not found")
    
    update_data = centre_update.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(centre, field, val)
        
    db.commit()
    db.refresh(centre)
    return centre
