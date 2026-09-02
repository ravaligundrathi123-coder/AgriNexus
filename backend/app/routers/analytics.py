from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import datetime

from app.database import get_db
from app.models import Procurement, StatusHistory, ProcurementCentre, Payment
from app.schemas import MandiAnalyticsResponse, BottleneckAnalysis
from app.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Mandi Analytics & Bottlenecks"])

@router.get("/dashboard", response_model=MandiAnalyticsResponse)
def get_analytics_dashboard(centre_id: Optional[int] = None, db: Session = Depends(get_db)):
    if not centre_id:
        centre = db.query(ProcurementCentre).first()
    else:
        centre = db.query(ProcurementCentre).filter(ProcurementCentre.id == centre_id).first()
        
    if not centre:
        raise HTTPException(status_code=404, detail="No procurement centres found")

    centre_id = centre.id

    # 1. Procurement Counts
    all_procurements = db.query(Procurement).filter(Procurement.centre_id == centre_id).all()
    total_today = len(all_procurements)
    waiting_count = sum(1 for p in all_procurements if p.status in ["REGISTERED", "WAITING"])
    in_processing_count = sum(1 for p in all_procurements if p.status in ["WEIGHING", "QUALITY_CHECK", "ACCEPTED", "PAYMENT_PENDING"])
    completed_count = sum(1 for p in all_procurements if p.status == "COMPLETED")
    rejected_count = sum(1 for p in all_procurements if p.status == "REJECTED")

    # 2. Volumes and Disbursements
    total_qtl = sum((p.actual_quantity or p.estimated_quantity or 0) for p in all_procurements if p.status != "REJECTED")
    total_inr = sum((p.total_amount or 0) for p in all_procurements if p.status in ["ACCEPTED", "PAYMENT_PENDING", "COMPLETED"])

    # 3. Stage Durations & Bottleneck Analysis
    # Get durations from status history
    histories = db.query(StatusHistory).join(Procurement).filter(
        Procurement.centre_id == centre_id
    ).all()

    # Stage buckets
    weighing_durations = [h.stage_duration_seconds / 60.0 for h in histories if h.to_status == "WEIGHING" and h.stage_duration_seconds > 0]
    quality_durations = [h.stage_duration_seconds / 60.0 for h in histories if h.to_status == "QUALITY_CHECK" and h.stage_duration_seconds > 0]
    payment_durations = [h.stage_duration_seconds / 60.0 for h in histories if h.to_status in ["ACCEPTED", "PAYMENT_PENDING"] and h.stage_duration_seconds > 0]

    avg_weighing = round(sum(weighing_durations) / max(1, len(weighing_durations)), 1) if weighing_durations else 8.5
    avg_quality = round(sum(quality_durations) / max(1, len(quality_durations)), 1) if quality_durations else 21.0
    avg_payment = round(sum(payment_durations) / max(1, len(payment_durations)), 1) if payment_durations else 5.0
    avg_waiting = round(avg_weighing * 1.5 + avg_quality * 0.8, 1)
    avg_processing = round(avg_weighing + avg_quality + avg_payment, 1)

    stage_times = {
        "Weighing Stage": avg_weighing,
        "Quality Inspection": avg_quality,
        "Payment & Documentation": avg_payment
    }

    # Bottleneck detection logic
    # Check which stage exceeds normal benchmark
    is_bottleneck = False
    bottleneck_stage = "Quality Inspection"
    slowdown_pct = 0.0
    alert_title = "Mandi Flow Balanced"
    alert_desc = "All procurement stages are operating within normal threshold limits."
    recommendation = "Maintain current staffing and counter distribution."
    est_reduction = 0

    if avg_quality > (avg_weighing * 1.6):
        is_bottleneck = True
        bottleneck_stage = "Quality Inspection"
        slowdown_pct = round(((avg_quality - avg_weighing) / avg_weighing) * 100, 1)
        alert_title = "Quality Inspection Delay Detected"
        alert_desc = f"Quality inspection is currently the main bottleneck (Avg {avg_quality} mins vs {avg_weighing} mins at weighbridge)."
        recommendation = "Deploy 1 additional Quality Inspection Counter / Portable Moisture Analyzer to reduce total waiting time."
        est_reduction = 28
    elif avg_weighing > (avg_quality * 1.5):
        is_bottleneck = True
        bottleneck_stage = "Weighbridge Stage"
        slowdown_pct = round(((avg_weighing - avg_quality) / avg_quality) * 100, 1)
        alert_title = "Weighbridge Congestion Detected"
        alert_desc = f"Weighbridge queue is currently the main bottleneck (Avg {avg_weighing} mins vs {avg_quality} mins at quality lab)."
        recommendation = "Open Secondary Weighbridge Counter #2 and expedite vehicle unloading."
        est_reduction = 32

    bottleneck_obj = BottleneckAnalysis(
        is_bottleneck=is_bottleneck,
        bottleneck_stage=bottleneck_stage,
        avg_stage_times=stage_times,
        slowdown_percentage=slowdown_pct,
        alert_title=alert_title,
        alert_description=alert_desc,
        recommendation=recommendation,
        estimated_reduction_percentage=est_reduction
    )

    # 4. Hourly Arrivals Chart Data (7 AM to 6 PM)
    hourly_counts = {h: 0 for h in range(7, 19)}
    for p in all_procurements:
        hour = p.created_at.hour if p.created_at else 9
        if hour in hourly_counts:
            hourly_counts[hour] += 1
        elif 7 <= hour <= 18:
            hourly_counts[hour] = 1

    hourly_arrivals = [
        {"hour": f"{h:02d}:00", "farmers": count, "wait_time": round(count * 4.5 + 8.0, 1)}
        for h, count in hourly_counts.items()
    ]

    # 5. Crop Distribution Chart Data
    crop_stats = {}
    for p in all_procurements:
        c = p.crop_type
        if c not in crop_stats:
            crop_stats[c] = {"crop": c, "count": 0, "quantity_quintals": 0.0, "total_value": 0.0}
        crop_stats[c]["count"] += 1
        qty = p.actual_quantity or p.estimated_quantity or 0.0
        crop_stats[c]["quantity_quintals"] += qty
        crop_stats[c]["total_value"] += (p.total_amount or 0.0)

    crop_distribution = [
        {
            "crop": data["crop"],
            "farmers": data["count"],
            "quantity_quintals": round(data["quantity_quintals"], 1),
            "total_value_lakhs": round(data["total_value"] / 100000.0, 2)
        }
        for data in crop_stats.values()
    ]

    # 6. Stage Durations List for Charting
    stage_durations = [
        {"stage": "Weighbridge", "avg_duration_mins": avg_weighing, "target_mins": 8.0, "status": "Good" if avg_weighing <= 10 else "Slow"},
        {"stage": "Quality Lab", "avg_duration_mins": avg_quality, "target_mins": 12.0, "status": "Bottleneck" if avg_quality > 16 else "Good"},
        {"stage": "Payment / DBT", "avg_duration_mins": avg_payment, "target_mins": 5.0, "status": "Good" if avg_payment <= 6 else "Slow"}
    ]

    return MandiAnalyticsResponse(
        centre_id=centre.id,
        centre_name=centre.name,
        total_farmers_today=total_today,
        waiting_count=waiting_count,
        in_processing_count=in_processing_count,
        completed_count=completed_count,
        rejected_count=rejected_count,
        avg_waiting_time_minutes=avg_waiting,
        avg_processing_time_minutes=avg_processing,
        total_procured_quintals=round(total_qtl, 1),
        total_disbursed_inr=round(total_inr, 2),
        hourly_arrivals=hourly_arrivals,
        crop_distribution=crop_distribution,
        stage_durations=stage_durations,
        bottleneck=bottleneck_obj
    )
