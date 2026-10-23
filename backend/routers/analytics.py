import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any

from database import get_db
import models, schemas

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Dashboard"])

@router.get("/summary")
def get_analytics_summary(db: Session = Depends(get_db)):
    today = datetime.date.today()

    total_fdrs = db.query(models.FDR).count()
    total_amount = db.query(func.sum(models.FDR.amount)).scalar() or 0.0

    active_count = db.query(models.FDR).filter(models.FDR.status == "ACTIVE").count()
    expiring_count = db.query(models.FDR).filter(models.FDR.status == "EXPIRING_SOON").count()
    matured_count = db.query(models.FDR).filter(models.FDR.status == "MATURED").count()
    pending_count = db.query(models.FDR).filter(models.FDR.status == "PENDING_VERIFICATION").count()
    discrepancy_count = db.query(models.FDR).filter(models.FDR.status == "DISCREPANCY_FLAGGED").count()
    renewal_requested_count = db.query(models.FDR).filter(models.FDR.status == "RENEWAL_REQUESTED").count()
    release_requested_count = db.query(models.FDR).filter(models.FDR.status == "RELEASE_REQUESTED").count()
    released_count = db.query(models.FDR).filter(models.FDR.status == "RELEASED").count()

    # Bank-wise distribution
    bank_rows = db.query(
        models.FDR.bank_name,
        func.count(models.FDR.id).label("count"),
        func.sum(models.FDR.amount).label("total_amount")
    ).group_by(models.FDR.bank_name).all()

    bank_distribution = [
        {"bank": row.bank_name, "count": row.count, "amount": float(row.total_amount or 0.0)}
        for row in bank_rows
    ]

    # Status distribution
    status_distribution = [
        {"name": "Active", "value": active_count, "color": "#10b981"},
        {"name": "Expiring Soon", "value": expiring_count, "color": "#f59e0b"},
        {"name": "Matured", "value": matured_count, "color": "#ef4444"},
        {"name": "Pending Verification", "value": pending_count, "color": "#3b82f6"},
        {"name": "Discrepancy Flagged", "value": discrepancy_count, "color": "#dc2626"},
        {"name": "Renewal Requested", "value": renewal_requested_count, "color": "#8b5cf6"},
        {"name": "Release Requested", "value": release_requested_count, "color": "#0ea5e9"},
        {"name": "Released / Refunded", "value": released_count, "color": "#64748b"}
    ]

    # Upcoming maturities by month (next 6 months)
    monthly_maturities = []
    for i in range(6):
        month_offset = (today.month - 1 + i) % 12 + 1
        year_offset = today.year + ((today.month - 1 + i) // 12)
        month_label = datetime.date(year_offset, month_offset, 1).strftime("%b %Y")
        
        # Approximate matching
        count_in_month = db.query(models.FDR).filter(
            func.extract('month', models.FDR.maturity_date) == month_offset,
            func.extract('year', models.FDR.maturity_date) == year_offset
        ).count()

        amount_in_month = db.query(func.sum(models.FDR.amount)).filter(
            func.extract('month', models.FDR.maturity_date) == month_offset,
            func.extract('year', models.FDR.maturity_date) == year_offset
        ).scalar() or 0.0

        monthly_maturities.append({
            "month": month_label,
            "count": count_in_month,
            "amount": float(amount_in_month) / 10000000.0 # in ₹ Crores for chart readability
        })

    # Recent activity logs
    recent_logs = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc()).limit(8).all()
    recent_activities = [
        {
            "id": log.id,
            "entity_type": log.entity_type,
            "fdr_number": log.fdr_number,
            "action": log.action,
            "actor_role": log.actor_role,
            "actor_name": log.actor_name,
            "details": log.details,
            "timestamp": log.timestamp.isoformat()
        }
        for log in recent_logs
    ]

    return {
        "total_fdrs": total_fdrs,
        "total_amount": float(total_amount),
        "total_amount_crores": round(float(total_amount) / 10000000.0, 2),
        "active_count": active_count,
        "expiring_count": expiring_count,
        "matured_count": matured_count,
        "pending_count": pending_count,
        "discrepancy_count": discrepancy_count,
        "renewal_requested_count": renewal_requested_count,
        "release_requested_count": release_requested_count,
        "released_count": released_count,
        "bank_distribution": bank_distribution,
        "status_distribution": status_distribution,
        "monthly_maturities": monthly_maturities,
        "recent_activities": recent_activities
    }
