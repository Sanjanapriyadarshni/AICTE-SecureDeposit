import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import engine, Base, SessionLocal
import models
from routers import fdrs, verification, renewals, releases, audit, analytics, institutions
from seed_data import seed_database_if_empty, seed_sample_data

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AICTE SecureDeposit API",
    description="Backend API for AICTE Security Deposit & Fixed Deposit Receipts (FDR) Management System - Smart India Hackathon 2026",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for document uploads
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(fdrs.router)
app.include_router(verification.router)
app.include_router(renewals.router)
app.include_router(releases.router)
app.include_router(audit.router)
app.include_router(analytics.router)
app.include_router(institutions.router)

@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        seed_database_if_empty(db)
    finally:
        db.close()

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AICTE SecureDeposit API",
        "version": "1.0.0",
        "database": engine.name,
        "disclaimer": "Simulated bank integration enabled. In compliance with AICTE guidelines, OCR assistance does not prove legal authenticity."
    }

@app.post("/api/reset-demo-data")
def reset_demo_data():
    """Resets the database with complete fictional sample data for demo"""
    db = SessionLocal()
    try:
        seed_sample_data(db, force=True)
        return {"success": True, "message": "Demo database successfully reset with fresh AICTE sample data."}
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
