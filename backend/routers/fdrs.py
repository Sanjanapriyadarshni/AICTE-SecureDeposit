import os
import shutil
import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Header
from sqlalchemy.orm import Session
from typing import Optional, List

from database import get_db
import models, schemas
from auth_utils import get_current_user

router = APIRouter(prefix="/api/fdrs", tags=["FDRs"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

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

@router.get("", response_model=List[schemas.FDRResponse])
def get_fdrs(
    status: Optional[str] = Query(None, description="Filter by status"),
    bank: Optional[str] = Query(None, description="Filter by bank"),
    institution_id: Optional[int] = Query(None, description="Filter by institution"),
    search: Optional[str] = Query(None, description="Search by FDR number or institution"),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.FDR)

    # Scoping: Institution users can ONLY see their own FDRs
    if current_user.role == "INSTITUTION" and current_user.institution_id:
        query = query.filter(models.FDR.institution_id == current_user.institution_id)
    elif institution_id:
        query = query.filter(models.FDR.institution_id == institution_id)

    if status and status != "ALL":
        query = query.filter(models.FDR.status == status)
    if bank and bank != "ALL":
        query = query.filter(models.FDR.bank_name == bank)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (models.FDR.fdr_number.ilike(search_pattern)) |
            (models.FDR.institution_name.ilike(search_pattern)) |
            (models.FDR.branch_name.ilike(search_pattern))
        )

    return query.order_by(models.FDR.updated_at.desc()).all()


@router.get("/{fdr_id}", response_model=schemas.FDRDetailResponse)
def get_fdr_detail(fdr_id: int, db: Session = Depends(get_db)):
    fdr = db.query(models.FDR).filter(models.FDR.id == fdr_id).first()
    if not fdr:
        raise HTTPException(status_code=404, detail="FDR record not found")
    return fdr


@router.post("", response_model=schemas.FDRResponse)
def create_fdr(
    fdr_in: schemas.FDRCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Enforce institution ownership if logged in as institution
    if current_user.role == "INSTITUTION" and current_user.institution_id:
        fdr_in.institution_id = current_user.institution_id

    # Check if institution exists
    inst = db.query(models.Institution).filter(models.Institution.id == fdr_in.institution_id).first()
    if not inst:
        raise HTTPException(status_code=400, detail="Invalid institution ID")

    # Check for duplicate FDR number
    existing_fdr = db.query(models.FDR).filter(models.FDR.fdr_number == fdr_in.fdr_number).first()
    initial_status = "PENDING_VERIFICATION"
    has_duplicate = False

    if existing_fdr:
        has_duplicate = True
        initial_status = "DISCREPANCY_FLAGGED"

    # Convert amount to words if not provided
    amount_words = fdr_in.amount_in_words or f"Rupees {int(fdr_in.amount):,} Only"

    new_fdr = models.FDR(
        institution_id=fdr_in.institution_id,
        institution_name=fdr_in.institution_name or inst.name,
        fdr_number=fdr_in.fdr_number.strip().upper(),
        bank_name=fdr_in.bank_name,
        branch_name=fdr_in.branch_name,
        ifsc_code=fdr_in.ifsc_code.strip().upper(),
        amount=fdr_in.amount,
        amount_in_words=amount_words,
        interest_rate=fdr_in.interest_rate,
        issue_date=fdr_in.issue_date,
        maturity_date=fdr_in.maturity_date,
        tenure_months=fdr_in.tenure_months,
        joint_holder=fdr_in.joint_holder,
        purpose=fdr_in.purpose,
        lien_marked=fdr_in.lien_marked,
        document_url=fdr_in.document_url,
        document_filename=fdr_in.document_filename,
        status=initial_status,
        discrepancy_count=1 if has_duplicate else 0,
        ocr_extracted_text="[OCR Assist] Document registered. Automated preliminary text extraction completed. In compliance with AICTE guidelines, OCR does NOT prove legal authenticity.",
        ocr_confidence_score=94.5
    )

    db.add(new_fdr)
    db.commit()
    db.refresh(new_fdr)

    # If duplicate, register discrepancy record
    if has_duplicate:
        disc = models.Discrepancy(
            fdr_id=new_fdr.id,
            discrepancy_type="DUPLICATE_FDR_NUMBER",
            severity="CRITICAL",
            field_name="fdr_number",
            submitted_value=new_fdr.fdr_number,
            bank_confirmed_value=f"Already registered to FDR #{existing_fdr.id} ({existing_fdr.institution_name})",
            description=f"Duplicate FDR Number detected! FDR #{new_fdr.fdr_number} is already associated with {existing_fdr.institution_name}.",
            resolved=False,
            detected_at=datetime.datetime.utcnow()
        )
        db.add(disc)
        db.commit()

    # Log audit entry
    log_audit(
        db=db,
        entity_type="FDR",
        entity_id=new_fdr.id,
        fdr_number=new_fdr.fdr_number,
        action="FDR_REGISTERED",
        actor_role="INSTITUTION",
        actor_name=inst.authorized_signatory,
        details=f"New FDR {new_fdr.fdr_number} for ₹{new_fdr.amount:,.2f} submitted by {inst.name}. Status: {initial_status}."
    )

    return new_fdr


@router.post("/upload")
async def upload_fdr_document(file: UploadFile = File(...)):
    """Uploads an FDR scanned certificate, receipt or NOC"""
    allowed_extensions = [".pdf", ".png", ".jpg", ".jpeg", ".webp"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Allowed file types: PDF, PNG, JPG, JPEG, WEBP")

    timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"fdr_{timestamp}_{file.filename.replace(' ', '_')}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Simulated OCR extraction helper
    simulated_ocr_data = {
        "filename": safe_filename,
        "url": f"/uploads/{safe_filename}",
        "ocr_disclaimer": "OCR and automated document extraction is an assistive tool for preliminary visual cross-referencing only. Never claim or consider OCR as legal proof of authenticity. Final authenticity is established exclusively through direct Core Banking System / SFMS confirmation.",
        "extracted_snippet": f"CERTIFICATE OF FIXED DEPOSIT RECEIPT | AICTE Joint Lien Deposit | Verified format"
    }

    return simulated_ocr_data


@router.patch("/{fdr_id}/status")
def update_fdr_status(
    fdr_id: int,
    status: str = Query(...),
    notes: Optional[str] = Query(None),
    actor_role: str = Query("AICTE_OFFICER"),
    actor_name: str = Query("AICTE Verification Cell"),
    db: Session = Depends(get_db)
):
    fdr = db.query(models.FDR).filter(models.FDR.id == fdr_id).first()
    if not fdr:
        raise HTTPException(status_code=404, detail="FDR record not found")

    old_status = fdr.status
    fdr.status = status
    if notes:
        fdr.verification_notes = notes
    fdr.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(fdr)

    log_audit(
        db=db,
        entity_type="FDR",
        entity_id=fdr.id,
        fdr_number=fdr.fdr_number,
        action="STATUS_UPDATED",
        actor_role=actor_role,
        actor_name=actor_name,
        details=f"FDR status modified from {old_status} to {status}. Notes: {notes or 'No notes provided'}"
    )

    return fdr


@router.post("/{fdr_id}/resubmit-correction")
def resubmit_fdr_correction(
    fdr_id: int,
    payload: schemas.CorrectionResubmit,
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    db: Session = Depends(get_db)
):
    """Allows an Institution to upload corrected/clarified documents and return FDR to verification queue"""
    if x_user_role and x_user_role not in ["INSTITUTION"]:
        raise HTTPException(
            status_code=403, 
            detail=f"Access Denied: Role '{x_user_role}' cannot submit institution corrections. Required: INSTITUTION."
        )

    fdr = db.query(models.FDR).filter(models.FDR.id == fdr_id).first()
    if not fdr:
        raise HTTPException(status_code=404, detail="FDR record not found")

    if payload.document_url:
        fdr.document_url = payload.document_url
    if payload.document_filename:
        fdr.document_filename = payload.document_filename

    fdr.status = "PENDING_VERIFICATION"
    fdr.verification_notes = f"Correction re-submitted by institution: {payload.institution_remarks or 'Documents updated'}"
    fdr.updated_at = datetime.datetime.utcnow()
    db.commit()

    log_audit(
        db=db,
        entity_type="FDR",
        entity_id=fdr.id,
        fdr_number=fdr.fdr_number,
        action="FDR_CORRECTION_RESUBMITTED",
        actor_role="INSTITUTION",
        actor_name=fdr.institution_name,
        details=f"Institution re-submitted corrected documents for FDR {fdr.fdr_number}. Remarks: {payload.institution_remarks or 'N/A'}"
    )

    return {
        "success": True, 
        "status": "PENDING_VERIFICATION", 
        "message": f"Correction re-submitted successfully. FDR #{fdr.fdr_number} queued for officer verification."
    }
