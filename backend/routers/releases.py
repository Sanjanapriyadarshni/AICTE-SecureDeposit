import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from database import get_db
import models, schemas

router = APIRouter(prefix="/api/releases", tags=["Release & Refund Workflow"])

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


@router.get("", response_model=List[schemas.ReleaseResponse])
def get_release_requests(
    status: Optional[str] = Query(None, description="Filter by status"),
    institution_id: Optional[int] = Query(None, description="Filter by institution"),
    db: Session = Depends(get_db)
):
    query = db.query(models.ReleaseRequest)
    if status and status != "ALL":
        query = query.filter(models.ReleaseRequest.status == status)
    if institution_id:
        query = query.filter(models.ReleaseRequest.institution_id == institution_id)
    return query.order_by(models.ReleaseRequest.created_at.desc()).all()


@router.get("/{request_id}", response_model=schemas.ReleaseResponse)
def get_release_request_by_id(request_id: int, db: Session = Depends(get_db)):
    req = db.query(models.ReleaseRequest).filter(models.ReleaseRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Release request not found")
    return req


@router.post("", response_model=schemas.ReleaseResponse)
def create_release_request(payload: schemas.ReleaseRequestCreate, db: Session = Depends(get_db)):
    fdr = db.query(models.FDR).filter(models.FDR.id == payload.fdr_id).first()
    if not fdr:
        raise HTTPException(status_code=404, detail="FDR record not found")

    # Check if a pending release request already exists
    existing = db.query(models.ReleaseRequest).filter(
        models.ReleaseRequest.fdr_id == fdr.id,
        models.ReleaseRequest.status.in_(["SUBMITTED", "UNDER_REVIEW", "RECOMMENDED_FOR_APPROVAL"])
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="A release application for this FDR is already active and in review.")

    req_num = f"REL-AICTE-{datetime.date.today().year}-{fdr.id:04d}"

    release = models.ReleaseRequest(
        fdr_id=fdr.id,
        institution_id=fdr.institution_id,
        request_number=req_num,
        fdr_number=fdr.fdr_number,
        amount=fdr.amount,
        reason_for_release=payload.reason_for_release,
        justification_details=payload.justification_details,
        refund_beneficiary_name=payload.refund_beneficiary_name,
        refund_bank_account=payload.refund_bank_account,
        refund_ifsc=payload.refund_ifsc.strip().upper(),
        noc_document_url=payload.noc_document_url,
        status="SUBMITTED",
        created_at=datetime.datetime.utcnow()
    )

    fdr.status = "RELEASE_REQUESTED"
    db.add(release)
    db.commit()
    db.refresh(release)

    log_audit(
        db=db,
        entity_type="RELEASE",
        entity_id=release.id,
        fdr_number=fdr.fdr_number,
        action="RELEASE_REQUESTED",
        actor_role="INSTITUTION",
        actor_name=fdr.institution_name,
        details=f"Deposit release/refund request {req_num} created for amount ₹{fdr.amount:,.2f}. Reason: {payload.reason_for_release}."
    )

    return release


@router.post("/{request_id}/officer-review")
def officer_review_release(
    request_id: int,
    payload: schemas.ReleaseOfficerReview,
    db: Session = Depends(get_db)
):
    """Stage 1: AICTE Verification Officer scrutinizes documents and submits formal recommendation"""
    release = db.query(models.ReleaseRequest).filter(models.ReleaseRequest.id == request_id).first()
    if not release:
        raise HTTPException(status_code=404, detail="Release request not found")

    fdr = db.query(models.FDR).filter(models.FDR.id == release.fdr_id).first()

    release.officer_comments = payload.comments
    release.officer_name = payload.officer_name
    release.officer_reviewed_at = datetime.datetime.utcnow()

    if payload.action == "RECOMMEND":
        release.status = "RECOMMENDED_FOR_APPROVAL"
        action_name = "RELEASE_OFFICER_RECOMMENDED"
        msg = f"Application recommended for approval to Financial Approver by Officer {payload.officer_name}."
    else:
        release.status = "OFFICER_REJECTED"
        if fdr:
            fdr.status = "ACTIVE"
        action_name = "RELEASE_OFFICER_REJECTED"
        msg = f"Application rejected by Verification Officer {payload.officer_name}."

    db.commit()

    log_audit(
        db=db,
        entity_type="RELEASE",
        entity_id=release.id,
        fdr_number=release.fdr_number,
        action=action_name,
        actor_role="AICTE_OFFICER",
        actor_name=payload.officer_name,
        details=f"{msg} Comments: {payload.comments}"
    )

    return {"success": True, "status": release.status, "message": msg}


@router.post("/{request_id}/approver-action")
def approver_action_release(
    request_id: int,
    payload: schemas.ReleaseApproverAction,
    db: Session = Depends(get_db)
):
    """Stage 2: Competent Authority / Financial Approver gives final authorization or rejection"""
    release = db.query(models.ReleaseRequest).filter(models.ReleaseRequest.id == request_id).first()
    if not release:
        raise HTTPException(status_code=404, detail="Release request not found")

    fdr = db.query(models.FDR).filter(models.FDR.id == release.fdr_id).first()

    release.approver_comments = payload.comments
    release.approver_name = payload.approver_name
    release.approver_action_at = datetime.datetime.utcnow()

    if payload.action == "APPROVE":
        # Generate cryptographically verifiable simulated signature token
        sig_token = f"DIGI-SIGN-AICTE-{uuid.uuid4().hex[:12].upper()}"
        release.approver_signature_token = sig_token
        release.status = "APPROVED_BY_APPROVER"
        if fdr:
            fdr.status = "RELEASED"
            fdr.updated_at = datetime.datetime.utcnow()
        action_name = "RELEASE_SANCTIONED_BY_APPROVER"
        msg = f"Final release approved by {payload.approver_name}. Security deposit released and refund queued."
    else:
        release.status = "APPROVER_REJECTED"
        if fdr:
            fdr.status = "ACTIVE"
            fdr.updated_at = datetime.datetime.utcnow()
        action_name = "RELEASE_REJECTED_BY_APPROVER"
        msg = f"Final release rejected by {payload.approver_name}."

    db.commit()

    log_audit(
        db=db,
        entity_type="RELEASE",
        entity_id=release.id,
        fdr_number=release.fdr_number,
        action=action_name,
        actor_role="FINANCIAL_APPROVER",
        actor_name=payload.approver_name,
        details=f"{msg} Sign Token: {release.approver_signature_token or 'N/A'}. Comments: {payload.comments}"
    )

    return {
        "success": True,
        "status": release.status,
        "signature_token": release.approver_signature_token,
        "message": msg
    }
