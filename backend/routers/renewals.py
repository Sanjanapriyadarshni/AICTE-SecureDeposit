import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from database import get_db
import models, schemas

router = APIRouter(prefix="/api/renewals", tags=["Renewals & Maturity"])

def log_audit(db: Session, entity_type: str, entity_id: int, fdr_number: str, action: str, actor_role: str, actor_name: str, details: str):
    audit = models.AuditLog(
        entity_type=entity_type,
        entity_id=entity_id,
        fdr_number=fdr_number,
        action=action,
        actor_role=actor_role,
        actor_name=actor_name,
        details=details,
        timestamp=datetime.datetime.utcnow()
    )
    db.add(audit)
    db.commit()


@router.get("/expiring", response_model=List[schemas.FDRResponse])
def get_expiring_fdrs(
    days: int = Query(90, description="Window in days to check for maturity"),
    db: Session = Depends(get_db)
):
    """Returns FDRs that are maturing within the given day threshold or already matured"""
    today = datetime.date.today()
    cutoff_date = today + datetime.timedelta(days=days)
    
    fdrs = db.query(models.FDR).filter(
        models.FDR.status.in_(["ACTIVE", "EXPIRING_SOON", "MATURED", "RENEWAL_REQUESTED"]),
        models.FDR.maturity_date <= cutoff_date
    ).order_by(models.FDR.maturity_date.asc()).all()

    return fdrs


@router.get("/requests", response_model=List[schemas.RenewalResponse])
def get_renewal_requests(db: Session = Depends(get_db)):
    return db.query(models.RenewalRequest).order_by(models.RenewalRequest.requested_at.desc()).all()


@router.post("/submit", response_model=schemas.RenewalResponse)
def submit_renewal_request(payload: schemas.RenewalRequestCreate, db: Session = Depends(get_db)):
    fdr = db.query(models.FDR).filter(models.FDR.id == payload.fdr_id).first()
    if not fdr:
        raise HTTPException(status_code=404, detail="FDR record not found")

    req_num = f"RNW-AICTE-{datetime.date.today().year}-{fdr.id:04d}"

    renewal = models.RenewalRequest(
        fdr_id=fdr.id,
        institution_id=fdr.institution_id,
        request_number=req_num,
        old_fdr_number=fdr.fdr_number,
        new_fdr_number=payload.new_fdr_number.strip().upper(),
        renewed_amount=payload.renewed_amount,
        renewed_issue_date=payload.renewed_issue_date,
        renewed_maturity_date=payload.renewed_maturity_date,
        renewal_document_url=payload.renewal_document_url,
        status="PENDING_OFFICER_REVIEW",
        requested_at=datetime.datetime.utcnow()
    )

    db.add(renewal)
    fdr.status = "RENEWAL_REQUESTED"
    db.commit()
    db.refresh(renewal)

    log_audit(
        db=db,
        entity_type="RENEWAL",
        entity_id=renewal.id,
        fdr_number=fdr.fdr_number,
        action="RENEWAL_SUBMITTED",
        actor_role="INSTITUTION",
        actor_name=fdr.institution_name,
        details=f"Renewal application {req_num} submitted with renewed FDR #{renewal.new_fdr_number} maturing on {renewal.renewed_maturity_date}."
    )

    return renewal


@router.post("/review/{renewal_id}")
def review_renewal_request(
    renewal_id: int,
    payload: schemas.RenewalReview,
    officer_name: str = Query("AICTE Officer"),
    db: Session = Depends(get_db)
):
    renewal = db.query(models.RenewalRequest).filter(models.RenewalRequest.id == renewal_id).first()
    if not renewal:
        raise HTTPException(status_code=404, detail="Renewal request not found")

    fdr = db.query(models.FDR).filter(models.FDR.id == renewal.fdr_id).first()

    if payload.action == "APPROVE":
        renewal.status = "APPROVED"
        renewal.officer_remarks = payload.officer_remarks
        renewal.processed_at = datetime.datetime.utcnow()

        if fdr:
            fdr.fdr_number = renewal.new_fdr_number
            fdr.amount = renewal.renewed_amount
            fdr.issue_date = renewal.renewed_issue_date
            fdr.maturity_date = renewal.renewed_maturity_date
            fdr.status = "ACTIVE"
            fdr.updated_at = datetime.datetime.utcnow()

        action_name = "RENEWAL_APPROVED"
        details_msg = f"Renewal {renewal.request_number} approved by {officer_name}. FDR number updated to {renewal.new_fdr_number}."
    else:
        renewal.status = "REJECTED"
        renewal.officer_remarks = payload.officer_remarks
        renewal.processed_at = datetime.datetime.utcnow()
        if fdr:
            fdr.status = "MATURED"
            fdr.updated_at = datetime.datetime.utcnow()

        action_name = "RENEWAL_REJECTED"
        details_msg = f"Renewal {renewal.request_number} rejected by {officer_name}. Remarks: {payload.officer_remarks}"

    db.commit()

    log_audit(
        db=db,
        entity_type="RENEWAL",
        entity_id=renewal.id,
        fdr_number=renewal.new_fdr_number,
        action=action_name,
        actor_role="AICTE_OFFICER",
        actor_name=officer_name,
        details=details_msg
    )

    return {"success": True, "status": renewal.status, "message": details_msg}


@router.get("/reminders", response_model=List[schemas.MaturityReminderResponse])
def get_reminders(db: Session = Depends(get_db)):
    return db.query(models.MaturityReminder).order_by(models.MaturityReminder.sent_date.desc()).all()


@router.post("/generate-reminders")
def generate_maturity_reminders(db: Session = Depends(get_db)):
    """Scans all FDRs and automatically generates formal AICTE statutory reminders for upcoming maturities"""
    today = datetime.date.today()
    active_fdrs = db.query(models.FDR).filter(
        models.FDR.status.in_(["ACTIVE", "EXPIRING_SOON", "MATURED"])
    ).all()

    created_reminders = []

    for fdr in active_fdrs:
        days_left = (fdr.maturity_date - today).days
        inst = db.query(models.Institution).filter(models.Institution.id == fdr.institution_id).first()
        recipient_email = inst.email if inst else "registrar@institution.edu.in"

        reminder_type = None
        if days_left <= 0:
            reminder_type = "OVERDUE_ALERT"
            subject = f"URGENT: AICTE Security Deposit Matured & Expired - FDR #{fdr.fdr_number}"
        elif days_left <= 30:
            reminder_type = "30_DAYS_NOTICE"
            subject = f"Final 30-Day Reminder: AICTE FDR Renewal Due - #{fdr.fdr_number}"
        elif days_left <= 60:
            reminder_type = "60_DAYS_NOTICE"
            subject = f"Notice: AICTE Security Deposit Maturing in 60 Days - #{fdr.fdr_number}"
        elif days_left <= 90:
            reminder_type = "90_DAYS_NOTICE"
            subject = f"Statutory Advisory: AICTE FDR Renewal Window Open - #{fdr.fdr_number}"

        if reminder_type:
            # Check if recently sent in past 7 days
            week_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)
            existing = db.query(models.MaturityReminder).filter(
                models.MaturityReminder.fdr_id == fdr.id,
                models.MaturityReminder.reminder_type == reminder_type,
                models.MaturityReminder.sent_date >= week_ago
            ).first()

            if not existing:
                content = (
                    f"To: The Principal / Director, {fdr.institution_name}\n"
                    f"AICTE Affiliation ID: {inst.aicte_id if inst else 'N/A'}\n\n"
                    f"Subject: {subject}\n\n"
                    f"This is an automated statutory communication from the All India Council for Technical Education (AICTE).\n"
                    f"Your Security Deposit FDR Number {fdr.fdr_number} issued by {fdr.bank_name} ({fdr.branch_name}) for amount ₹{fdr.amount:,.2f} "
                    f"is scheduled to mature on {fdr.maturity_date} ({days_left} days remaining).\n\n"
                    f"As per AICTE Approval Process Handbook regulations, technical institutions are obligated to maintain unencumbered "
                    f"security deposits with joint lien in favor of Member Secretary, AICTE.\n"
                    f"Kindly process timely renewal or submit the renewed FDR with lien confirmation receipt on the AICTE SecureDeposit portal.\n\n"
                    f"Verification Desk, Finance & Approval Bureau,\nAICTE New Delhi."
                )

                reminder = models.MaturityReminder(
                    fdr_id=fdr.id,
                    fdr_number=fdr.fdr_number,
                    institution_name=fdr.institution_name,
                    reminder_type=reminder_type,
                    scheduled_date=today,
                    days_to_maturity=days_left,
                    sent_date=datetime.datetime.utcnow(),
                    recipient_email=recipient_email,
                    status="SENT",
                    subject=subject,
                    content=content
                )
                db.add(reminder)
                created_reminders.append(reminder)

    db.commit()

    return {
        "success": True,
        "new_reminders_dispatched": len(created_reminders),
        "message": f"Generated and dispatched {len(created_reminders)} maturity reminders."
    }
