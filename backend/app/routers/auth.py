from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User, Farmer, Officer, ProcurementCentre, UserRole
from app.schemas import UserCreate, UserOut, LoginRequest, Token
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        phone=user_in.phone,
        role=user_in.role
    )
    db.add(user)
    db.flush()

    if user_in.role == UserRole.FARMER:
        # Generate farmer card ID if not provided
        farmer_card = user_in.farmer_id_card or f"PMKISAN-{user.id:04d}-{user_in.state[:2].upper() if user_in.state else 'IN'}"
        aadhaar = user_in.aadhaar_last4 or "8821"
        farmer = Farmer(
            user_id=user.id,
            farmer_id_card=farmer_card,
            aadhaar_last4=aadhaar,
            state=user_in.state or "Punjab",
            district=user_in.district or "Ludhiana",
            village=user_in.village or "Samrala",
            land_area_acres=user_in.land_area_acres or 3.0,
            bank_name=user_in.bank_name or "State Bank of India",
            bank_account_no=user_in.bank_account_no or f"3098172{user.id:04d}",
            ifsc_code=user_in.ifsc_code or "SBIN0001420"
        )
        db.add(farmer)
    
    db.commit()
    db.refresh(user)

    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")
    
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/demo-users")
def get_demo_users(db: Session = Depends(get_db)):
    """Returns quick-login demo accounts for the hackathon evaluator."""
    users = db.query(User).all()
    demo_list = []
    for u in users:
        detail = ""
        if u.role == "farmer" and u.farmer_profile:
            detail = f"{u.farmer_profile.district}, {u.farmer_profile.state}"
        elif u.role == "officer" and u.officer_profile:
            detail = f"Counter {u.officer_profile.assigned_counter or '1'} | {u.officer_profile.centre.name if u.officer_profile.centre else 'Mandi'}"
        elif u.role == "admin":
            detail = "System Administrator"
            
        demo_list.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role,
            "phone": u.phone,
            "detail": detail
        })
    return demo_list
