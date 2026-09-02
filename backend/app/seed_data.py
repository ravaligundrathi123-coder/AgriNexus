"""
KisanQueue Database Seeder
Seeds realistic APMC Mandi centres, users (Farmers, Officers, Admins),
active queue entries, multi-stage procurements, status histories, and notifications.
"""

import datetime
import random
from sqlalchemy.orm import Session

from app.database import engine, Base, SessionLocal
from app.models import (
    User, Farmer, Officer, ProcurementCentre, Procurement,
    QueueEntry, StatusHistory, Payment, Notification,
    UserRole, ProcurementStatus, QueueStatus, PaymentStatus
)
from app.auth import get_password_hash
from app.msp_rates import get_msp_rate

def seed_database():
    print("Creating tables in database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).count() > 0:
            print("Database already contains records. Skipping seed.")
            return

        print("Seeding initial Mandi data...")

        # 1. Procurement Centres
        centres_data = [
            {
                "name": "Punjab APMC Grain Mandi, Samrala",
                "code": "PB-SAM-01",
                "state": "Punjab",
                "district": "Ludhiana",
                "address": "GT Road, Near Railway Crossing, Samrala, Punjab 141114",
                "active_weighing_counters": 3,
                "active_quality_counters": 2,
                "active_staff_count": 12,
                "daily_capacity_quintals": 3500.0
            },
            {
                "name": "Karnal Central Agriculture Market",
                "code": "HR-KAR-02",
                "state": "Haryana",
                "district": "Karnal",
                "address": "Sector 4 Anaj Mandi, Karnal, Haryana 132001",
                "active_weighing_counters": 2,
                "active_quality_counters": 2,
                "active_staff_count": 8,
                "daily_capacity_quintals": 2200.0
            },
            {
                "name": "Indore Krishi Upaj Mandi, Laxmibai Nagar",
                "code": "MP-IND-03",
                "state": "Madhya Pradesh",
                "district": "Indore",
                "address": "Laxmibai Nagar Mandi Complex, Indore, MP 452006",
                "active_weighing_counters": 3,
                "active_quality_counters": 3,
                "active_staff_count": 14,
                "daily_capacity_quintals": 4000.0
            }
        ]

        centres = []
        for c in centres_data:
            centre = ProcurementCentre(**c)
            db.add(centre)
            centres.append(centre)
        db.flush()

        main_centre = centres[0]

        # 2. Administrator
        admin_user = User(
            email="admin@kisannexus.gov.in",
            password_hash=get_password_hash("admin123"),
            full_name="Rajesh Verma (Director APMC)",
            phone="+91 98140 12001",
            role=UserRole.ADMIN
        )
        db.add(admin_user)

        # 3. Procurement Officers
        officers_data = [
            {
                "email": "officer.priya@kisannexus.gov.in",
                "name": "Priya Sharma",
                "phone": "+91 98765 43210",
                "badge": "OFF-PB-2024-08",
                "designation": "Chief Procurement Officer",
                "counter": "Weighbridge 1 & Lab A",
                "centre_id": main_centre.id
            },
            {
                "email": "officer.vikram@kisannexus.gov.in",
                "name": "Vikram Rathore",
                "phone": "+91 98722 11002",
                "badge": "OFF-PB-2024-12",
                "designation": "Senior Quality Inspector",
                "counter": "Quality Lab 2",
                "centre_id": main_centre.id
            }
        ]

        officer_users = []
        for off in officers_data:
            u = User(
                email=off["email"],
                password_hash=get_password_hash("officer123"),
                full_name=off["name"],
                phone=off["phone"],
                role=UserRole.OFFICER
            )
            db.add(u)
            db.flush()

            officer = Officer(
                user_id=u.id,
                centre_id=off["centre_id"],
                badge_number=off["badge"],
                designation=off["designation"],
                assigned_counter=off["counter"]
            )
            db.add(officer)
            officer_users.append(u)

        # 4. Farmers & Profiles
        farmers_data = [
            {
                "email": "ramesh.kumar@kisannexus.gov.in",
                "name": "Ramesh Kumar",
                "phone": "+91 98150 44211",
                "card": "PB-KISAN-2024-001",
                "aadhaar": "4892",
                "village": "Samrala Kalan",
                "acres": 6.5,
                "crop": "Paddy",
                "variety": "Grade A",
                "qty": 45.0
            },
            {
                "email": "gurpreet.singh@kisannexus.gov.in",
                "name": "Sardar Gurpreet Singh",
                "phone": "+91 98760 11992",
                "card": "PB-KISAN-2024-002",
                "aadhaar": "9012",
                "village": "Kotla Shamshpur",
                "acres": 12.0,
                "crop": "Wheat",
                "variety": "Standard",
                "qty": 80.0
            },
            {
                "email": "harpreet.kaur@kisannexus.gov.in",
                "name": "Harpreet Kaur",
                "phone": "+91 98881 22334",
                "card": "PB-KISAN-2024-003",
                "aadhaar": "7731",
                "village": "Macchiwara",
                "acres": 4.0,
                "crop": "Mustard",
                "variety": "Standard",
                "qty": 28.0
            },
            {
                "email": "suresh.patel@kisannexus.gov.in",
                "name": "Suresh Patel",
                "phone": "+91 94250 88712",
                "card": "MP-KISAN-2024-004",
                "aadhaar": "3341",
                "village": "Sanwer",
                "acres": 8.0,
                "crop": "Soybean",
                "variety": "Yellow",
                "qty": 65.0
            },
            {
                "email": "manoj.sharma@kisannexus.gov.in",
                "name": "Manoj Sharma",
                "phone": "+91 98120 55667",
                "card": "HR-KISAN-2024-005",
                "aadhaar": "1209",
                "village": "Gharaunda",
                "acres": 5.5,
                "crop": "Paddy",
                "variety": "Common",
                "qty": 52.0
            },
            {
                "email": "jaswinder.singh@kisannexus.gov.in",
                "name": "Jaswinder Singh",
                "phone": "+91 98761 99887",
                "card": "PB-KISAN-2024-006",
                "aadhaar": "6643",
                "village": "Khanna Khurd",
                "acres": 9.0,
                "crop": "Cotton",
                "variety": "Long Staple",
                "qty": 35.0
            },
            {
                "email": "baldev.raj@kisannexus.gov.in",
                "name": "Baldev Raj",
                "phone": "+91 98144 33221",
                "card": "PB-KISAN-2024-007",
                "aadhaar": "5512",
                "village": "Doraha",
                "acres": 7.0,
                "crop": "Maize",
                "variety": "Standard",
                "qty": 40.0
            },
            {
                "email": "satnam.singh@kisannexus.gov.in",
                "name": "Satnam Singh",
                "phone": "+91 98720 44556",
                "card": "PB-KISAN-2024-008",
                "aadhaar": "8819",
                "village": "Samrala",
                "acres": 5.0,
                "crop": "Wheat",
                "variety": "Standard",
                "qty": 55.0
            }
        ]

        farmers = []
        for f_data in farmers_data:
            user = User(
                email=f_data["email"],
                password_hash=get_password_hash("farmer123"),
                full_name=f_data["name"],
                phone=f_data["phone"],
                role=UserRole.FARMER
            )
            db.add(user)
            db.flush()

            farmer = Farmer(
                user_id=user.id,
                farmer_id_card=f_data["card"],
                aadhaar_last4=f_data["aadhaar"],
                state="Punjab",
                district="Ludhiana",
                village=f_data["village"],
                land_area_acres=f_data["acres"],
                bank_name="State Bank of India",
                bank_account_no=f"309871234{user.id:02d}",
                ifsc_code="SBIN0001420"
            )
            db.add(farmer)
            farmers.append((user, farmer, f_data))
        db.flush()

        # 5. Create Realistic Multi-Stage Procurements & Queues
        # We will create various statuses for live testing:
        # Farmer 0 (Ramesh): WAITING (Queue #1)
        # Farmer 1 (Gurpreet): WEIGHING (In progress at Weighbridge 1)
        # Farmer 2 (Harpreet): QUALITY_CHECK (In Quality Lab 1)
        # Farmer 3 (Suresh): ACCEPTED -> PAYMENT_PENDING
        # Farmer 4 (Manoj): COMPLETED
        # Farmer 5 (Jaswinder): REJECTED (High moisture)
        # Farmer 6 (Baldev): WAITING (Queue #2)
        # Farmer 7 (Satnam): WAITING (Queue #3)

        today_str = datetime.date.today().strftime("%y%m%d")
        now = datetime.datetime.utcnow()

        stages_config = [
            {"index": 0, "status": ProcurementStatus.WAITING, "q_num": 1, "q_status": QueueStatus.WAITING, "counter": None},
            {"index": 6, "status": ProcurementStatus.WAITING, "q_num": 2, "q_status": QueueStatus.WAITING, "counter": None},
            {"index": 7, "status": ProcurementStatus.WAITING, "q_num": 3, "q_status": QueueStatus.WAITING, "counter": None},
            {"index": 1, "status": ProcurementStatus.WEIGHING, "q_num": 4, "q_status": QueueStatus.IN_PROGRESS, "counter": "Weighbridge 1"},
            {"index": 2, "status": ProcurementStatus.QUALITY_CHECK, "q_num": 5, "q_status": QueueStatus.IN_PROGRESS, "counter": "Quality Lab 1"},
            {"index": 3, "status": ProcurementStatus.PAYMENT_PENDING, "q_num": 6, "q_status": QueueStatus.COMPLETED, "counter": "Counter 3"},
            {"index": 4, "status": ProcurementStatus.COMPLETED, "q_num": 7, "q_status": QueueStatus.COMPLETED, "counter": "Counter 1"},
            {"index": 5, "status": ProcurementStatus.REJECTED, "q_num": 8, "q_status": QueueStatus.CANCELLED, "counter": "Quality Lab 2"},
        ]

        for sc in stages_config:
            u, f, data = farmers[sc["index"]]
            st = sc["status"]
            token = f"KQ-PB-{today_str}-{sc['q_num']:03d}"
            rate = get_msp_rate(data["crop"], data["variety"])
            amount = round(rate * data["qty"], 2)

            proc = Procurement(
                token_number=token,
                farmer_id=f.id,
                centre_id=main_centre.id,
                crop_type=data["crop"],
                variety=data["variety"],
                estimated_quantity=data["qty"],
                actual_quantity=data["qty"] if st in [ProcurementStatus.QUALITY_CHECK, ProcurementStatus.ACCEPTED, ProcurementStatus.PAYMENT_PENDING, ProcurementStatus.COMPLETED] else None,
                vehicle_number=f"PB-10-AZ-{random.randint(1000, 9999)}",
                slot_date=datetime.date.today().isoformat(),
                slot_time="09:00 AM",
                status=st,
                msp_rate=rate,
                total_amount=amount,
                gross_weight=round(data["qty"] + 18.5, 2) if st != ProcurementStatus.WAITING else None,
                tare_weight=18.5 if st != ProcurementStatus.WAITING else None,
                net_weight=data["qty"] if st != ProcurementStatus.WAITING else None,
                grade="Grade A" if st in [ProcurementStatus.ACCEPTED, ProcurementStatus.PAYMENT_PENDING, ProcurementStatus.COMPLETED] else ("FAQ" if st == ProcurementStatus.QUALITY_CHECK else None),
                moisture_percentage=12.5 if st in [ProcurementStatus.ACCEPTED, ProcurementStatus.PAYMENT_PENDING, ProcurementStatus.COMPLETED] else (18.6 if st == ProcurementStatus.REJECTED else None),
                foreign_matter_percentage=0.6 if st != ProcurementStatus.WAITING else None,
                rejection_reason="Moisture content measured at 18.6%, which exceeds FAQ limit of 17.0%." if st == ProcurementStatus.REJECTED else None,
                created_at=now - datetime.timedelta(minutes=random.randint(30, 240))
            )
            db.add(proc)
            db.flush()

            # Queue entry
            q_entry = QueueEntry(
                procurement_id=proc.id,
                centre_id=main_centre.id,
                queue_number=sc["q_num"],
                status=sc["q_status"],
                assigned_counter=sc["counter"],
                called_at=now - datetime.timedelta(minutes=15) if sc["q_status"] == QueueStatus.IN_PROGRESS else None,
                completed_at=now - datetime.timedelta(minutes=5) if sc["q_status"] == QueueStatus.COMPLETED else None
            )
            db.add(q_entry)

            # Status History logs
            db.add(StatusHistory(
                procurement_id=proc.id,
                from_status=None,
                to_status=ProcurementStatus.REGISTERED,
                remarks="Procurement slot generated online",
                changed_by_user_id=u.id,
                stage_duration_seconds=0,
                created_at=proc.created_at
            ))

            db.add(StatusHistory(
                procurement_id=proc.id,
                from_status=ProcurementStatus.REGISTERED,
                to_status=ProcurementStatus.WAITING,
                remarks=f"Checked in at {main_centre.name}. Token active.",
                changed_by_user_id=officer_users[0].id,
                stage_duration_seconds=180,
                created_at=proc.created_at + datetime.timedelta(minutes=3)
            ))

            if st in [ProcurementStatus.WEIGHING, ProcurementStatus.QUALITY_CHECK, ProcurementStatus.ACCEPTED, ProcurementStatus.PAYMENT_PENDING, ProcurementStatus.COMPLETED, ProcurementStatus.REJECTED]:
                db.add(StatusHistory(
                    procurement_id=proc.id,
                    from_status=ProcurementStatus.WAITING,
                    to_status=ProcurementStatus.WEIGHING,
                    remarks="Gross and tare weight measured on Weighbridge 1",
                    changed_by_user_id=officer_users[0].id,
                    counter_number="Weighbridge 1",
                    stage_duration_seconds=540,
                    created_at=proc.created_at + datetime.timedelta(minutes=12)
                ))

            if st in [ProcurementStatus.QUALITY_CHECK, ProcurementStatus.ACCEPTED, ProcurementStatus.PAYMENT_PENDING, ProcurementStatus.COMPLETED, ProcurementStatus.REJECTED]:
                db.add(StatusHistory(
                    procurement_id=proc.id,
                    from_status=ProcurementStatus.WEIGHING,
                    to_status=ProcurementStatus.QUALITY_CHECK,
                    remarks="Moisture and grain purity sample analyzed in Quality Lab",
                    changed_by_user_id=officer_users[1].id,
                    counter_number="Quality Lab 1",
                    stage_duration_seconds=1260,
                    created_at=proc.created_at + datetime.timedelta(minutes=33)
                ))

            if st in [ProcurementStatus.ACCEPTED, ProcurementStatus.PAYMENT_PENDING, ProcurementStatus.COMPLETED]:
                db.add(StatusHistory(
                    procurement_id=proc.id,
                    from_status=ProcurementStatus.QUALITY_CHECK,
                    to_status=ProcurementStatus.ACCEPTED,
                    remarks="Consignment verified & accepted under FAQ standards",
                    changed_by_user_id=officer_users[0].id,
                    stage_duration_seconds=120,
                    created_at=proc.created_at + datetime.timedelta(minutes=35)
                ))

            if st in [ProcurementStatus.PAYMENT_PENDING, ProcurementStatus.COMPLETED]:
                db.add(StatusHistory(
                    procurement_id=proc.id,
                    from_status=ProcurementStatus.ACCEPTED,
                    to_status=ProcurementStatus.PAYMENT_PENDING,
                    remarks="Payment advice generated for PFMS DBT transfer",
                    changed_by_user_id=officer_users[0].id,
                    stage_duration_seconds=300,
                    created_at=proc.created_at + datetime.timedelta(minutes=40)
                ))

            if st == ProcurementStatus.COMPLETED:
                db.add(StatusHistory(
                    procurement_id=proc.id,
                    from_status=ProcurementStatus.PAYMENT_PENDING,
                    to_status=ProcurementStatus.COMPLETED,
                    remarks="DBT transaction confirmed. Receipt issued to farmer.",
                    changed_by_user_id=officer_users[0].id,
                    stage_duration_seconds=60,
                    created_at=proc.created_at + datetime.timedelta(minutes=45)
                ))

            if st == ProcurementStatus.REJECTED:
                db.add(StatusHistory(
                    procurement_id=proc.id,
                    from_status=ProcurementStatus.QUALITY_CHECK,
                    to_status=ProcurementStatus.REJECTED,
                    remarks="Rejected due to high moisture levels (18.6%). Advisory provided for sun drying.",
                    changed_by_user_id=officer_users[1].id,
                    counter_number="Quality Lab 2",
                    stage_duration_seconds=180,
                    created_at=proc.created_at + datetime.timedelta(minutes=36)
                ))

            # Payment record if accepted / pending / completed
            if st in [ProcurementStatus.PAYMENT_PENDING, ProcurementStatus.COMPLETED]:
                pay = Payment(
                    procurement_id=proc.id,
                    farmer_id=f.id,
                    amount=amount,
                    msp_rate=rate,
                    quantity_quintals=data["qty"],
                    status=PaymentStatus.CREDITED if st == ProcurementStatus.COMPLETED else PaymentStatus.PENDING,
                    payment_mode="Direct Benefit Transfer (PFMS / DBT)",
                    transaction_ref=f"PFMS-2024-DBT-{proc.id:04d}",
                    bank_ref=f"UTR{random.randint(1000000000, 9999999999)}" if st == ProcurementStatus.COMPLETED else None,
                    credited_at=now - datetime.timedelta(minutes=5) if st == ProcurementStatus.COMPLETED else None
                )
                db.add(pay)

            # Notifications
            db.add(Notification(
                user_id=u.id,
                procurement_id=proc.id,
                title="Token Confirmation",
                message=f"Digital Token {token} issued for {data['qty']} Qtl {data['crop']}.",
                type="info",
                is_read=True
            ))

            if st == ProcurementStatus.WAITING and sc["q_num"] == 1:
                db.add(Notification(
                    user_id=u.id,
                    procurement_id=proc.id,
                    title="Your Turn is Next!",
                    message="You are #1 in line! Please keep your tractor/vehicle ready for Weighbridge Counter 1.",
                    type="turn_alert",
                    is_read=False
                ))
            elif st == ProcurementStatus.COMPLETED:
                db.add(Notification(
                    user_id=u.id,
                    procurement_id=proc.id,
                    title="DBT Payment Credited",
                    message=f"₹{amount:,.2f} has been credited to your SBI A/C ending in {f.bank_account_no[-4:]}.",
                    type="payment",
                    is_read=True
                ))

        db.commit()
        print("Mandi database successfully seeded with initial test data!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
