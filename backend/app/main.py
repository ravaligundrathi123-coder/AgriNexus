import sys
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure app package and ml package can be imported
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
ml_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../ml"))
if ml_dir not in sys.path:
    sys.path.insert(0, ml_dir)

from app.config import settings
from app.database import Base, engine
from app.seed_data import seed_database
from app.routers import (
    auth,
    farmers,
    officers,
    procurements,
    queue,
    prediction,
    analytics,
    notifications,
    centres,
)

# Initialize tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="KisanQueue API",
    description="Intelligent Farmer Procurement Queue and Status Tracking Platform for SIH 2026 (SIH26032)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
api_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_prefix)
app.include_router(centres.router, prefix=api_prefix)
app.include_router(farmers.router, prefix=api_prefix)
app.include_router(procurements.router, prefix=api_prefix)
app.include_router(queue.router, prefix=api_prefix)
app.include_router(officers.router, prefix=api_prefix)
app.include_router(prediction.router, prefix=api_prefix)
app.include_router(analytics.router, prefix=api_prefix)
app.include_router(notifications.router, prefix=api_prefix)

@app.on_event("startup")
def on_startup():
    print("Initializing KisanQueue server...")
    try:
        seed_database()
    except Exception as e:
        print(f"Database seed notice: {e}")

@app.get("/")
def root():
    return {
        "app": "KisanQueue — Smart Farmer Procurement Waiting & Status Platform",
        "version": "1.0.0",
        "sih_problem": "SIH26032 — Farmer Procurement Waiting/Status",
        "docs": "/docs",
        "api_v1": api_prefix,
        "status": "online"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "KisanQueue Backend"}
