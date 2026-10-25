import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any

from database import get_db
import models, schemas
from auth_utils import get_current_user

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


@router.get("/institution/{institution_id}")
def get_institution_dashboard_data(
    institution_id: int, 
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Role-Specific Dashboard Data for Technical Institution"""
    if current_user.role == "INSTITUTION" and current_user.institution_id and current_user.institution_id != institution_id:
        raise HTTPException(status_code=403, detail="Access Denied: You are only authorized to access your own institution records.")

    inst = db.query(models.Institution).filter(models.Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")

    fdrs = db.query(models.FDR).filter(models.FDR.institution_id == institution_id).order_by(models.FDR.created_at.desc()).all()
    
    total_fdrs = len(fdrs)
    total_amount = sum(f.amount for f in fdrs)
    active_count = len([f for f in fdrs if f.status == "ACTIVE"])
    expiring_soon_count = len([f for f in fdrs if f.status in ["EXPIRING_SOON", "MATURED"]])
    pending_count = len([f for f in fdrs if f.status in ["PENDING_VERIFICATION", "DISCREPANCY_FLAGGED", "CORRECTION_REQUESTED"]])
    
    today = datetime.date.today()

    # Section A: My Recent FDR Submissions
    recent_submissions = [
        {
            "id": f.id,
            "fdr_number": f.fdr_number,
            "bank_name": f.bank_name,
            "branch_name": f.branch_name,
            "amount": f.amount,
            "issue_date": f.issue_date.isoformat(),
            "maturity_date": f.maturity_date.isoformat(),
            "status": f.status,
            "submitted_at": f.created_at.strftime("%Y-%m-%d"),
            "document_url": f.document_url,
            "document_filename": f.document_filename,
            "required_action": (
                "Upload Clarified Documents" if f.status == "CORRECTION_REQUESTED" else
                "Review Discrepancy Flag" if f.status == "DISCREPANCY_FLAGGED" else
                "Submit Renewal Application" if f.status in ["EXPIRING_SOON", "MATURED"] else
                "Apply for Release / NOC" if f.status == "ACTIVE" and (f.maturity_date - today).days <= 0 else
                "Awaiting AICTE Verification" if f.status == "PENDING_VERIFICATION" else
                "In Custody (Compliant)"
            )
        }
        for f in fdrs[:8]
    ]

    # Section B: Documents Requiring Attention
    attention_docs = []
    for f in fdrs:
        if f.status == "CORRECTION_REQUESTED" or not f.document_url or f.status == "DISCREPANCY_FLAGGED":
            attention_docs.append({
                "id": f.id,
                "fdr_number": f.fdr_number,
                "bank_name": f.bank_name,
                "amount": f.amount,
                "status": f.status,
                "issue_type": "CORRECTION_REQUESTED" if f.status == "CORRECTION_REQUESTED" else ("MISSING_DOCUMENT" if not f.document_url else "DISCREPANCY_ALERT"),
                "officer_note": f.verification_notes or "Document verification pending scrutiny correction.",
                "document_filename": f.document_filename or "Missing Scan",
                "document_url": f.document_url
            })

    # Section C: Upcoming Maturity Calendar (next 180 days)
    upcoming_maturities = []
    for f in fdrs:
        if f.status != "RELEASED":
            diff_days = (f.maturity_date - today).days
            if diff_days <= 180:
                has_renewal = db.query(models.RenewalRequest).filter(
                    models.RenewalRequest.fdr_id == f.id,
                    models.RenewalRequest.status.in_(["PENDING_OFFICER_REVIEW", "APPROVED"])
                ).first()
                upcoming_maturities.append({
                    "id": f.id,
                    "fdr_number": f.fdr_number,
                    "bank_name": f.bank_name,
                    "amount": f.amount,
                    "maturity_date": f.maturity_date.isoformat(),
                    "days_remaining": diff_days,
                    "is_overdue": diff_days < 0,
                    "renewal_status": "IN_REVIEW" if has_renewal and has_renewal.status == "PENDING_OFFICER_REVIEW" else ("RENEWED" if has_renewal and has_renewal.status == "APPROVED" else "NOT_STARTED")
                })
    upcoming_maturities.sort(key=lambda x: x["days_remaining"])

    # Section D: My Release/Refund Requests
    releases = db.query(models.ReleaseRequest).filter(models.ReleaseRequest.institution_id == institution_id).order_by(models.ReleaseRequest.created_at.desc()).all()
    my_releases = [
        {
            "id": r.id,
            "request_number": r.request_number,
            "fdr_number": r.fdr_number,
            "amount": r.amount,
            "reason": r.reason_for_release,
            "status": r.status,
            "created_at": r.created_at.strftime("%Y-%m-%d"),
            "latest_update": r.approver_comments or r.officer_comments or "Application submitted, queued for scrutiny.",
            "signature_token": r.approver_signature_token
        }
        for r in releases
    ]

    return {
        "institution_id": inst.id,
        "institution_name": inst.name,
        "aicte_id": inst.aicte_id,
        "summary": {
            "my_total_fdrs": total_fdrs,
            "my_total_amount": float(total_amount),
            "my_total_crores": round(float(total_amount) / 10000000.0, 2),
            "active_fdrs": active_count,
            "expiring_soon": expiring_soon_count,
            "pending_verification": pending_count
        },
        "recent_submissions": recent_submissions,
        "attention_documents": attention_docs,
        "upcoming_maturities": upcoming_maturities,
        "my_releases": my_releases
    }


@router.get("/officer")
def get_officer_dashboard_data(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Role-Specific Dashboard Data for AICTE Scrutiny & Verification Officer"""
    if current_user.role == "INSTITUTION":
        raise HTTPException(
            status_code=403, 
            detail="Access Denied: Institution accounts are not authorized to view the Officer Verification Queue."
        )

    today = datetime.date.today()
    
    pending_fdrs = db.query(models.FDR).filter(models.FDR.status == "PENDING_VERIFICATION").all()
    discrepancy_fdrs = db.query(models.FDR).filter(models.FDR.status == "DISCREPANCY_FLAGGED").all()
    awaiting_correction_fdrs = db.query(models.FDR).filter(models.FDR.status == "CORRECTION_REQUESTED").all()
    verified_fdrs = db.query(models.FDR).filter(models.FDR.status == "ACTIVE").all()

    wait_times = [(datetime.datetime.utcnow() - f.created_at).total_seconds() / 86400.0 for f in pending_fdrs]
    avg_wait_days = round(sum(wait_times) / len(wait_times), 1) if wait_times else 0.0

    queue_fdrs = db.query(models.FDR).filter(
        models.FDR.status.in_(["PENDING_VERIFICATION", "DISCREPANCY_FLAGGED", "CORRECTION_REQUESTED"])
    ).order_by(models.FDR.created_at.asc()).all()

    work_queue = []
    for f in queue_fdrs:
        case_age_days = (datetime.datetime.utcnow() - f.created_at).days
        unresolved_discs = db.query(models.Discrepancy).filter(models.Discrepancy.fdr_id == f.id, models.Discrepancy.resolved == False).count()
        work_queue.append({
            "id": f.id,
            "institution_id": f.institution_id,
            "institution_name": f.institution_name,
            "fdr_number": f.fdr_number,
            "bank_name": f.bank_name,
            "branch_name": f.branch_name,
            "amount": f.amount,
            "submission_date": f.created_at.strftime("%Y-%m-%d"),
            "status": f.status,
            "discrepancy_count": unresolved_discs,
            "case_age_days": case_age_days,
            "case_age_label": f"{case_age_days}d ago" if case_age_days > 0 else "Today",
            "document_url": f.document_url,
            "document_filename": f.document_filename,
            "verification_notes": f.verification_notes
        })

    priority_cases = []
    for f in queue_fdrs:
        is_priority = False
        priority_reasons = []
        if not f.document_url:
            is_priority = True
            priority_reasons.append("Missing Scanned Receipt")
        if f.status == "DISCREPANCY_FLAGGED":
            is_priority = True
            discs = db.query(models.Discrepancy).filter(models.Discrepancy.fdr_id == f.id, models.Discrepancy.resolved == False).all()
            for d in discs:
                priority_reasons.append(d.discrepancy_type.replace('_', ' ').title())
        case_age = (datetime.datetime.utcnow() - f.created_at).days
        if case_age >= 7:
            is_priority = True
            priority_reasons.append(f"Wait Time ({case_age}d)")

        if is_priority:
            priority_cases.append({
                "id": f.id,
                "fdr_number": f.fdr_number,
                "institution_name": f.institution_name,
                "bank_name": f.bank_name,
                "amount": f.amount,
                "status": f.status,
                "priority_reasons": priority_reasons,
                "case_age_days": case_age
            })

    recent_verifs = db.query(models.AuditLog).filter(
        models.AuditLog.actor_role.in_(["AICTE_OFFICER", "SYSTEM"]),
        models.AuditLog.action.in_([
            "OFFICER_VERIFICATION_APPROVED", 
            "DISCREPANCY_FLAGGED", 
            "DISCREPANCY_RESOLVED", 
            "BANK_VERIFICATION_CONFIRMED",
            "INSTITUTION_CORRECTION_REQUESTED",
            "RELEASE_OFFICER_RECOMMENDED",
            "RENEWAL_APPROVED"
        ])
    ).order_by(models.AuditLog.timestamp.desc()).limit(8).all()

    recent_activity = [
        {
            "id": a.id,
            "fdr_number": a.fdr_number,
            "action": a.action,
            "actor_name": a.actor_name,
            "details": a.details,
            "timestamp": a.timestamp.strftime("%Y-%m-%d %H:%M")
        }
        for a in recent_verifs
    ]

    return {
        "summary": {
            "pending_verification": len(pending_fdrs),
            "discrepancies_flagged": len(discrepancy_fdrs),
            "awaiting_correction": len(awaiting_correction_fdrs),
            "verified_this_period": len(verified_fdrs),
            "avg_wait_days": avg_wait_days
        },
        "work_queue": work_queue,
        "priority_cases": priority_cases[:6],
        "recent_activity": recent_activity
    }


@router.get("/approver")
def get_approver_dashboard_data(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Role-Specific Dashboard Data for Financial Approver / Competent Authority"""
    if current_user.role not in ["APPROVER", "ADMIN"]:
        raise HTTPException(
            status_code=403, 
            detail=f"Access Denied: Role '{current_user.role}' is not authorized to view the Release Sanction Queue. Required: APPROVER."
        )

    awaiting_releases = db.query(models.ReleaseRequest).filter(
        models.ReleaseRequest.status == "RECOMMENDED_FOR_APPROVAL"
    ).all()
    awaiting_count = len(awaiting_releases)
    total_val_awaiting = sum(r.amount for r in awaiting_releases)

    verified_ready_count = 0
    for r in awaiting_releases:
        fdr = db.query(models.FDR).filter(models.FDR.id == r.fdr_id).first()
        if fdr and fdr.status != "DISCREPANCY_FLAGGED":
            unres_disc = db.query(models.Discrepancy).filter(models.Discrepancy.fdr_id == fdr.id, models.Discrepancy.resolved == False).count()
            if unres_disc == 0:
                verified_ready_count += 1

    approved_releases = db.query(models.ReleaseRequest).filter(
        models.ReleaseRequest.status == "APPROVED_BY_APPROVER"
    ).all()
    approved_count = len(approved_releases)
    total_approved_amount = sum(r.amount for r in approved_releases)

    all_pending_releases = db.query(models.ReleaseRequest).filter(
        models.ReleaseRequest.status.in_(["RECOMMENDED_FOR_APPROVAL", "SUBMITTED", "UNDER_REVIEW"])
    ).order_by(models.ReleaseRequest.created_at.asc()).all()

    approval_queue = []
    for r in all_pending_releases:
        fdr = db.query(models.FDR).filter(models.FDR.id == r.fdr_id).first()
        inst = db.query(models.Institution).filter(models.Institution.id == r.institution_id).first()
        
        has_disc = db.query(models.Discrepancy).filter(
            models.Discrepancy.fdr_id == (fdr.id if fdr else 0),
            models.Discrepancy.resolved == False
        ).count() > 0

        officer_rec_status = "RECOMMENDED" if r.status == "RECOMMENDED_FOR_APPROVAL" else "AWAITING_OFFICER_SCRUTINY"
        academic_clearance = "CLEAR" if r.noc_document_url else "PENDING_NOC"
        vigilance_clearance = "CLEAR" if not has_disc else "DISCREPANCY_BLOCKED"

        approval_queue.append({
            "id": r.id,
            "request_number": r.request_number,
            "fdr_id": r.fdr_id,
            "fdr_number": r.fdr_number,
            "institution_name": inst.name if inst else (fdr.institution_name if fdr else "Unknown Institution"),
            "amount": r.amount,
            "reason": r.reason_for_release,
            "justification_details": r.justification_details,
            "officer_recommendation": officer_rec_status,
            "officer_comments": r.officer_comments,
            "officer_name": r.officer_name,
            "officer_reviewed_at": r.officer_reviewed_at.strftime("%Y-%m-%d %H:%M") if r.officer_reviewed_at else None,
            "verification_status": "CBS_CONFIRMED" if fdr and fdr.status in ["ACTIVE", "RELEASE_REQUESTED"] and not has_disc else "UNCONFIRMED",
            "clearance_status": {
                "officer_scrutiny": officer_rec_status,
                "university_noc": academic_clearance,
                "vigilance": vigilance_clearance,
                "is_eligible_for_approval": (officer_rec_status == "RECOMMENDED" and not has_disc)
            },
            "beneficiary_details": {
                "name": r.refund_beneficiary_name,
                "account": r.refund_bank_account,
                "ifsc": r.refund_ifsc
            },
            "status": r.status,
            "request_date": r.created_at.strftime("%Y-%m-%d"),
            "noc_document_url": r.noc_document_url
        })

    recent_decisions_raw = db.query(models.ReleaseRequest).filter(
        models.ReleaseRequest.status.in_(["APPROVED_BY_APPROVER", "APPROVER_REJECTED", "RETURNED_FOR_CLARIFICATION"])
    ).order_by(models.ReleaseRequest.approver_action_at.desc()).limit(8).all()

    recent_decisions = [
        {
            "id": r.id,
            "request_number": r.request_number,
            "fdr_number": r.fdr_number,
            "amount": r.amount,
            "decision": "APPROVED" if r.status == "APPROVED_BY_APPROVER" else ("RETURNED" if r.status == "RETURNED_FOR_CLARIFICATION" else "REJECTED"),
            "status": r.status,
            "decision_reason": r.approver_comments,
            "approver_name": r.approver_name,
            "signature_token": r.approver_signature_token,
            "decision_date": r.approver_action_at.strftime("%Y-%m-%d %H:%M") if r.approver_action_at else r.created_at.strftime("%Y-%m-%d %H:%M")
        }
        for r in recent_decisions_raw
    ]

    pending_clarifications_raw = db.query(models.ReleaseRequest).filter(
        models.ReleaseRequest.status == "RETURNED_FOR_CLARIFICATION"
    ).order_by(models.ReleaseRequest.created_at.desc()).all()

    pending_clarifications = [
        {
            "id": r.id,
            "request_number": r.request_number,
            "fdr_number": r.fdr_number,
            "amount": r.amount,
            "return_reason": r.approver_comments,
            "approver_name": r.approver_name,
            "returned_at": r.approver_action_at.strftime("%Y-%m-%d %H:%M") if r.approver_action_at else "Recently",
            "required_resolution": f"Address approver observation: {r.approver_comments}"
        }
        for r in pending_clarifications_raw
    ]

    return {
        "summary": {
            "awaiting_decision_count": awaiting_count,
            "total_value_awaiting": float(total_val_awaiting),
            "total_value_awaiting_lakhs": round(float(total_val_awaiting) / 100000.0, 2),
            "total_value_awaiting_crores": round(float(total_val_awaiting) / 10000000.0, 2),
            "verified_ready_count": verified_ready_count,
            "recently_approved_count": approved_count,
            "recently_approved_amount": float(total_approved_amount)
        },
        "approval_queue": approval_queue,
        "recent_decisions": recent_decisions,
        "pending_clarifications": pending_clarifications
    }
