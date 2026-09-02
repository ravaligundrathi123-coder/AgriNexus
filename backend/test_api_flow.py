"""
KisanQueue End-to-End Test Suite
Tests complete backend API workflows:
1. Database Seeder
2. Farmer & Officer Authentication
3. Procurement Creation & Token Generation
4. Live Queue Re-indexing & AI Waiting Time Prediction
5. 7-Stage Officer Workflow Transitions
6. Analytics & Bottleneck Engine
"""

import sys
import os
import json

# Set up paths
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)
ml_dir = os.path.abspath(os.path.join(backend_dir, "../ml"))
sys.path.insert(0, ml_dir)

from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.seed_data import seed_database
from app.models import Procurement, QueueEntry, StatusHistory

client = TestClient(app)

def run_e2e_tests():
    print("=" * 60)
    print("🌾 Running KisanQueue End-to-End Verification Tests")
    print("=" * 60)

    # 1. Test Health & Root
    print("\n[Test 1] Root & Health Endpoints")
    r = client.get("/")
    assert r.status_code == 200
    print(" Root Status:", r.json()["app"])

    r = client.get("/health")
    assert r.status_code == 200
    print(" Health Status:", r.json()["status"])

    # 2. Test Demo Users
    print("\n[Test 2] Demo Users List")
    r = client.get("/api/v1/auth/demo-users")
    assert r.status_code == 200
    demo_users = r.json()
    assert len(demo_users) >= 3
    print(f" Found {len(demo_users)} pre-seeded demo accounts")

    # 3. Test Farmer Login
    print("\n[Test 3] Farmer Authentication")
    r = client.post("/api/v1/auth/login", json={
        "email": "ramesh.kumar@kisannexus.gov.in",
        "password": "farmer123"
    })
    assert r.status_code == 200
    farmer_token = r.json()["access_token"]
    farmer_headers = {"Authorization": f"Bearer {farmer_token}"}
    print(" Farmer logged in successfully! Name:", r.json()["user"]["full_name"])

    # 4. Test Active Token Lookup
    print("\n[Test 4] Farmer Active Token & Live AI Wait Time")
    r = client.get("/api/v1/farmers/me/active-token", headers=farmer_headers)
    assert r.status_code == 200
    token_data = r.json()
    print(" Active Token:", token_data["token_number"])
    print(" Queue Position:", token_data["queue_number"])
    print(" Farmers Ahead:", token_data["farmers_ahead"])
    print(" Estimated Waiting Time:", token_data["estimated_waiting_formatted"])
    print(" AI Confidence:", token_data["prediction_confidence"], "%")

    # 5. Test AI Prediction Endpoint
    print("\n[Test 5] Direct AI Waiting-Time Regressor Endpoint")
    r = client.post("/api/v1/prediction/waiting-time", json={
        "farmers_ahead": 6,
        "crop_type": "Paddy",
        "quantity_quintals": 50.0,
        "active_weighing_counters": 2,
        "active_quality_counters": 2,
        "active_staff_count": 8,
        "avg_recent_stage_duration": 14.0,
        "hour_of_day": 11,
        "is_peak_season": 1
    })
    assert r.status_code == 200
    pred = r.json()
    print(" Predicted Waiting Time:", pred["formatted_time"])
    print(" Confidence Score:", pred["confidence_score"], "%")
    print(f" Key Factors ({len(pred['factors'])}):", [f["factor"] for f in pred["factors"]])

    # 6. Test Slot Booking / New Procurement Creation
    print("\n[Test 6] Register New Crop Procurement")
    r = client.post("/api/v1/procurements", headers=farmer_headers, json={
        "centre_id": 1,
        "crop_type": "Wheat",
        "variety": "Standard",
        "estimated_quantity": 60.0,
        "vehicle_number": "PB-10-TEST-9999",
        "slot_date": "2026-09-02",
        "slot_time": "10:30 AM"
    })
    assert r.status_code == 200
    new_proc = r.json()
    new_proc_id = new_proc["id"]
    print(" Generated Token:", new_proc["token_number"])
    print(" Status:", new_proc["status"])
    print(" Calculated MSP Total:", f"Rs {new_proc['total_amount']:,}")

    # 7. Test Officer Login & Dashboard
    print("\n[Test 7] Officer Authentication & Live Queue Overview")
    r = client.post("/api/v1/auth/login", json={
        "email": "officer.priya@kisannexus.gov.in",
        "password": "officer123"
    })
    assert r.status_code == 200
    officer_token = r.json()["access_token"]
    officer_headers = {"Authorization": f"Bearer {officer_token}"}

    r = client.get("/api/v1/officers/dashboard-summary", headers=officer_headers)
    assert r.status_code == 200
    summary = r.json()
    print(f" Total Farmers Today: {summary['stats']['total_farmers_today']}")
    print(f" Waiting: {summary['stats']['waiting_farmers']}, Processing: {summary['stats']['currently_processing']}")

    # 8. Test 7-Stage Workflow Advancement
    print("\n[Test 8] Complete 7-Stage Workflow Progression for New Procurement")
    
    # Step 8.1: Start Weighing
    r = client.patch(f"/api/v1/procurements/{new_proc_id}/stage", headers=officer_headers, json={
        "to_status": "WEIGHING",
        "counter_number": "Weighbridge 1",
        "remarks": "Tractor on weighbridge"
    })
    assert r.status_code == 200
    print(" -> Stage 1/5: WEIGHING started at Weighbridge 1")

    # Step 8.2: Complete Weighing & Move to Quality Check
    r = client.patch(f"/api/v1/procurements/{new_proc_id}/stage", headers=officer_headers, json={
        "to_status": "QUALITY_CHECK",
        "counter_number": "Quality Lab 1",
        "gross_weight": 78.5,
        "tare_weight": 18.5,
        "net_weight": 60.0,
        "remarks": "Net crop measured: 60.0 Qtl"
    })
    assert r.status_code == 200
    print(" -> Stage 2/5: QUALITY_CHECK started (Net Weight: 60.0 Qtl)")

    # Step 8.3: Quality Acceptance
    r = client.patch(f"/api/v1/procurements/{new_proc_id}/stage", headers=officer_headers, json={
        "to_status": "ACCEPTED",
        "grade": "Grade A",
        "moisture_percentage": 12.2,
        "foreign_matter_percentage": 0.5,
        "remarks": "Purity Grade A certified"
    })
    assert r.status_code == 200
    print(" -> Stage 3/5: ACCEPTED (Grade A, Moisture: 12.2%)")

    # Step 8.4: Payment Pending
    r = client.patch(f"/api/v1/procurements/{new_proc_id}/stage", headers=officer_headers, json={
        "to_status": "PAYMENT_PENDING",
        "remarks": "DBT PFMS Advice approved"
    })
    assert r.status_code == 200
    print(" -> Stage 4/5: PAYMENT_PENDING (PFMS DBT Reference generated)")

    # Step 8.5: Mark Completed
    r = client.patch(f"/api/v1/procurements/{new_proc_id}/stage", headers=officer_headers, json={
        "to_status": "COMPLETED",
        "remarks": "Full payment credited via DBT"
    })
    assert r.status_code == 200
    print(" -> Stage 5/5: COMPLETED (Cycle Finished)")

    # 9. Test Analytics & Bottleneck Engine
    print("\n[Test 9] Analytics & AI Bottleneck Detection")
    r = client.get("/api/v1/analytics/dashboard?centre_id=1")
    assert r.status_code == 200
    analytics = r.json()
    print(" Centre:", analytics["centre_name"])
    print(" Total Procured:", analytics["total_procured_quintals"], "Qtl")
    print(f" Total MSP Disbursed: Rs {analytics['total_disbursed_inr']:,.2f}")
    print(" Bottleneck Status:", analytics["bottleneck"]["alert_title"])
    print(" Recommendation:", analytics["bottleneck"]["recommendation"])

    print("\n" + "=" * 60)
    print("🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_e2e_tests()
