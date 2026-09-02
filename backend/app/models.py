import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
import enum
from app.database import Base

class UserRole(str, enum.Enum):
    FARMER = "farmer"
    OFFICER = "officer"
    ADMIN = "admin"

class ProcurementStatus(str, enum.Enum):
    REGISTERED = "REGISTERED"
    WAITING = "WAITING"
    WEIGHING = "WEIGHING"
    QUALITY_CHECK = "QUALITY_CHECK"
    ACCEPTED = "ACCEPTED"
    PAYMENT_PENDING = "PAYMENT_PENDING"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"

class QueueStatus(str, enum.Enum):
    WAITING = "waiting"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    CREDITED = "credited"
    FAILED = "failed"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    phone = Column(String(15), nullable=False)
    role = Column(String(20), default=UserRole.FARMER, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    farmer_profile = relationship("Farmer", back_populates="user", uselist=False)
    officer_profile = relationship("Officer", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    farmer_id_card = Column(String(50), unique=True, index=True, nullable=False)
    aadhaar_last4 = Column(String(4), nullable=False)
    state = Column(String(50), nullable=False)
    district = Column(String(50), nullable=False)
    village = Column(String(100), nullable=True)
    land_area_acres = Column(Float, default=2.5)
    bank_name = Column(String(100), default="State Bank of India")
    bank_account_no = Column(String(30), nullable=False)
    ifsc_code = Column(String(15), default="SBIN0001234")
    preferred_language = Column(String(10), default="en")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="farmer_profile")
    procurements = relationship("Procurement", back_populates="farmer")
    payments = relationship("Payment", back_populates="farmer")


class ProcurementCentre(Base):
    __tablename__ = "procurement_centres"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    code = Column(String(30), unique=True, index=True, nullable=False)
    state = Column(String(50), nullable=False)
    district = Column(String(50), nullable=False)
    address = Column(Text, nullable=False)
    active_weighing_counters = Column(Integer, default=2)
    active_quality_counters = Column(Integer, default=2)
    active_staff_count = Column(Integer, default=8)
    daily_capacity_quintals = Column(Float, default=1500.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    officers = relationship("Officer", back_populates="centre")
    procurements = relationship("Procurement", back_populates="centre")
    queue_entries = relationship("QueueEntry", back_populates="centre")


class Officer(Base):
    __tablename__ = "officers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    centre_id = Column(Integer, ForeignKey("procurement_centres.id"), nullable=False)
    badge_number = Column(String(50), unique=True, nullable=False)
    designation = Column(String(100), default="Procurement Inspector")
    assigned_counter = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="officer_profile")
    centre = relationship("ProcurementCentre", back_populates="officers")


class Procurement(Base):
    __tablename__ = "procurements"

    id = Column(Integer, primary_key=True, index=True)
    token_number = Column(String(50), unique=True, index=True, nullable=False)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=False)
    centre_id = Column(Integer, ForeignKey("procurement_centres.id"), nullable=False)
    crop_type = Column(String(50), nullable=False)
    variety = Column(String(50), default="Standard")
    estimated_quantity = Column(Float, nullable=False)  # Quintals
    actual_quantity = Column(Float, nullable=True)     # Quintals
    vehicle_number = Column(String(30), nullable=True)
    slot_date = Column(String(20), nullable=False)     # YYYY-MM-DD
    slot_time = Column(String(20), default="09:00 AM")
    
    # 7-stage workflow status
    status = Column(String(30), default=ProcurementStatus.REGISTERED, nullable=False, index=True)
    
    # Quality & Weighing details
    grade = Column(String(10), nullable=True)           # Grade A, Grade B, FAQ (Fair Average Quality)
    moisture_percentage = Column(Float, nullable=True)  # e.g., 12.5%
    foreign_matter_percentage = Column(Float, nullable=True)
    gross_weight = Column(Float, nullable=True)         # Quintals
    tare_weight = Column(Float, nullable=True)          # Quintals
    net_weight = Column(Float, nullable=True)           # Quintals
    
    # Financials
    msp_rate = Column(Float, nullable=True)             # Rs per quintal
    total_amount = Column(Float, nullable=True)         # Rs
    
    # Notes & Exceptions
    rejection_reason = Column(Text, nullable=True)
    officer_remarks = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    farmer = relationship("Farmer", back_populates="procurements")
    centre = relationship("ProcurementCentre", back_populates="procurements")
    queue_entry = relationship("QueueEntry", back_populates="procurement", uselist=False, cascade="all, delete-orphan")
    status_history = relationship("StatusHistory", back_populates="procurement", cascade="all, delete-orphan", order_by="StatusHistory.created_at.asc()")
    payment = relationship("Payment", back_populates="procurement", uselist=False, cascade="all, delete-orphan")
    prediction_logs = relationship("PredictionLog", back_populates="procurement", cascade="all, delete-orphan")


class QueueEntry(Base):
    __tablename__ = "queue_entries"

    id = Column(Integer, primary_key=True, index=True)
    procurement_id = Column(Integer, ForeignKey("procurements.id"), unique=True, nullable=False)
    centre_id = Column(Integer, ForeignKey("procurement_centres.id"), nullable=False)
    queue_number = Column(Integer, nullable=False, index=True)
    priority = Column(Integer, default=1)               # 1=Normal, 2=Senior/Urgent
    status = Column(String(20), default=QueueStatus.WAITING, nullable=False, index=True)
    assigned_counter = Column(String(30), nullable=True)
    called_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    procurement = relationship("Procurement", back_populates="queue_entry")
    centre = relationship("ProcurementCentre", back_populates="queue_entries")


class StatusHistory(Base):
    __tablename__ = "status_history"

    id = Column(Integer, primary_key=True, index=True)
    procurement_id = Column(Integer, ForeignKey("procurements.id"), nullable=False, index=True)
    from_status = Column(String(30), nullable=True)
    to_status = Column(String(30), nullable=False)
    remarks = Column(Text, nullable=True)
    changed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    counter_number = Column(String(30), nullable=True)
    stage_duration_seconds = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    procurement = relationship("Procurement", back_populates="status_history")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    procurement_id = Column(Integer, ForeignKey("procurements.id"), unique=True, nullable=False)
    farmer_id = Column(Integer, ForeignKey("farmers.id"), nullable=False)
    amount = Column(Float, nullable=False)
    msp_rate = Column(Float, nullable=False)
    quantity_quintals = Column(Float, nullable=False)
    status = Column(String(20), default=PaymentStatus.PENDING, nullable=False)
    payment_mode = Column(String(50), default="Direct Benefit Transfer (PFMS / DBT)")
    transaction_ref = Column(String(100), nullable=True)
    bank_ref = Column(String(100), nullable=True)
    credited_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    procurement = relationship("Procurement", back_populates="payment")
    farmer = relationship("Farmer", back_populates="payments")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    procurement_id = Column(Integer, ForeignKey("procurements.id"), nullable=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(30), default="info")  # turn_alert, stage_update, payment, rejection, info
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notifications")


class PredictionLog(Base):
    __tablename__ = "prediction_logs"

    id = Column(Integer, primary_key=True, index=True)
    procurement_id = Column(Integer, ForeignKey("procurements.id"), nullable=False)
    farmers_ahead = Column(Integer, nullable=False)
    predicted_minutes = Column(Float, nullable=False)
    confidence_score = Column(Float, nullable=False)
    features_json = Column(Text, nullable=True)
    actual_minutes = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    procurement = relationship("Procurement", back_populates="prediction_logs")
