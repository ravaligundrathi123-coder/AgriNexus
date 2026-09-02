from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field
import datetime

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserOut"

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str
    role: str = "farmer"
    # Farmer specific fields
    farmer_id_card: Optional[str] = None
    aadhaar_last4: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    land_area_acres: Optional[float] = 2.5
    bank_account_no: Optional[str] = None
    bank_name: Optional[str] = "State Bank of India"
    ifsc_code: Optional[str] = "SBIN0001234"

class FarmerProfileOut(BaseModel):
    id: int
    farmer_id_card: str
    aadhaar_last4: str
    state: str
    district: str
    village: Optional[str]
    land_area_acres: float
    bank_name: str
    bank_account_no: str
    ifsc_code: str
    preferred_language: str

    class Config:
        from_attributes = True

class OfficerProfileOut(BaseModel):
    id: int
    centre_id: int
    badge_number: str
    designation: str
    assigned_counter: Optional[str]

    class Config:
        from_attributes = True

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    phone: str
    role: str
    is_active: bool
    created_at: datetime.datetime
    farmer_profile: Optional[FarmerProfileOut] = None
    officer_profile: Optional[OfficerProfileOut] = None

    class Config:
        from_attributes = True

# --- Procurement Centre Schemas ---
class CentreBase(BaseModel):
    name: str
    code: str
    state: str
    district: str
    address: str
    active_weighing_counters: int = 2
    active_quality_counters: int = 2
    active_staff_count: int = 8
    daily_capacity_quintals: float = 1500.0

class CentreCreate(CentreBase):
    pass

class CentreUpdate(BaseModel):
    name: Optional[str] = None
    active_weighing_counters: Optional[int] = None
    active_quality_counters: Optional[int] = None
    active_staff_count: Optional[int] = None
    daily_capacity_quintals: Optional[float] = None
    is_active: Optional[bool] = None

class CentreOut(CentreBase):
    id: int
    is_active: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Status History Schemas ---
class StatusHistoryOut(BaseModel):
    id: int
    from_status: Optional[str]
    to_status: str
    remarks: Optional[str]
    counter_number: Optional[str]
    stage_duration_seconds: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Queue Schemas ---
class QueueEntryOut(BaseModel):
    id: int
    queue_number: int
    priority: int
    status: str
    assigned_counter: Optional[str]
    called_at: Optional[datetime.datetime]
    completed_at: Optional[datetime.datetime]
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Payment Schemas ---
class PaymentOut(BaseModel):
    id: int
    amount: float
    msp_rate: float
    quantity_quintals: float
    status: str
    payment_mode: str
    transaction_ref: Optional[str]
    bank_ref: Optional[str]
    credited_at: Optional[datetime.datetime]
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Procurement Schemas ---
class ProcurementCreate(BaseModel):
    centre_id: int
    crop_type: str
    variety: Optional[str] = "Standard"
    estimated_quantity: float
    vehicle_number: Optional[str] = None
    slot_date: Optional[str] = None
    slot_time: Optional[str] = "09:00 AM"

class ProcurementStageUpdate(BaseModel):
    to_status: str
    remarks: Optional[str] = None
    counter_number: Optional[str] = None
    
    # Weighing data
    gross_weight: Optional[float] = None
    tare_weight: Optional[float] = None
    net_weight: Optional[float] = None
    
    # Quality inspection data
    grade: Optional[str] = None
    moisture_percentage: Optional[float] = None
    foreign_matter_percentage: Optional[float] = None
    rejection_reason: Optional[str] = None

class ProcurementOut(BaseModel):
    id: int
    token_number: str
    farmer_id: int
    centre_id: int
    crop_type: str
    variety: str
    estimated_quantity: float
    actual_quantity: Optional[float]
    vehicle_number: Optional[str]
    slot_date: str
    slot_time: str
    status: str
    grade: Optional[str]
    moisture_percentage: Optional[float]
    foreign_matter_percentage: Optional[float]
    gross_weight: Optional[float]
    tare_weight: Optional[float]
    net_weight: Optional[float]
    msp_rate: Optional[float]
    total_amount: Optional[float]
    rejection_reason: Optional[str]
    officer_remarks: Optional[str]
    created_at: datetime.datetime
    updated_at: datetime.datetime

    # Expanded relation fields
    farmer_name: Optional[str] = None
    farmer_phone: Optional[str] = None
    farmer_id_card: Optional[str] = None
    centre_name: Optional[str] = None
    queue_number: Optional[int] = None
    farmers_ahead: Optional[int] = None
    estimated_waiting_minutes: Optional[float] = None
    estimated_waiting_formatted: Optional[str] = None
    prediction_confidence: Optional[float] = None
    prediction_factors: Optional[List[Dict[str, Any]]] = None
    status_history: List[StatusHistoryOut] = []
    payment: Optional[PaymentOut] = None

    class Config:
        from_attributes = True

# --- Waiting Time Prediction Schema ---
class PredictionRequest(BaseModel):
    farmers_ahead: int
    crop_type: str
    quantity_quintals: float
    active_weighing_counters: Optional[int] = 2
    active_quality_counters: Optional[int] = 2
    active_staff_count: Optional[int] = 8
    avg_recent_stage_duration: Optional[float] = 14.0
    hour_of_day: Optional[int] = 10
    is_peak_season: Optional[int] = 1

class PredictionResponse(BaseModel):
    predicted_minutes: float
    formatted_time: str
    range_minutes: Dict[str, Any]
    confidence_score: float
    std_deviation: float
    factors: List[Dict[str, Any]]

# --- Notification Schema ---
class NotificationOut(BaseModel):
    id: int
    user_id: int
    procurement_id: Optional[int]
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Analytics Schemas ---
class BottleneckAnalysis(BaseModel):
    is_bottleneck: bool
    bottleneck_stage: str
    avg_stage_times: Dict[str, float]
    slowdown_percentage: float
    alert_title: str
    alert_description: str
    recommendation: str
    estimated_reduction_percentage: int

class MandiAnalyticsResponse(BaseModel):
    centre_id: int
    centre_name: str
    total_farmers_today: int
    waiting_count: int
    in_processing_count: int
    completed_count: int
    rejected_count: int
    avg_waiting_time_minutes: float
    avg_processing_time_minutes: float
    total_procured_quintals: float
    total_disbursed_inr: float
    hourly_arrivals: List[Dict[str, Any]]
    crop_distribution: List[Dict[str, Any]]
    stage_durations: List[Dict[str, Any]]
    bottleneck: BottleneckAnalysis

Token.model_rebuild()
