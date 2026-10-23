import datetime
import random
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from typing import Optional, List

from database import get_db
import models, schemas

router = APIRouter(prefix="/api/verification", tags=["Verification"])

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


@router.get("/compare/{fdr_id}")
def get_verification_comparison(fdr_id: int, db: Session = Depends(get_db)):
    """Returns side-by-side comparison between institution-submitted data and bank-confirmed data"""
    fdr = db.query(models.FDR).filter(models.FDR.id == fdr_id).first()
    if not fdr:
        raise HTTPException(status_code=404, detail="FDR record not found")

    bank_verif = db.query(models.BankVerification).filter(models.BankVerification.fdr_id == fdr_id).first()
    discrepancies = db.query(models.Discrepancy).filter(models.Discrepancy.fdr_id == fdr_id).all()

    return {
        "fdr_id": fdr.id,
        "fdr_number": fdr.fdr_number,
        "status": fdr.status,
        "institution_data": {
            "institution_name": fdr.institution_name,
            "fdr_number": fdr.fdr_number,
            "bank_name": fdr.bank_name,
            "branch_name": fdr.branch_name,
            "ifsc_code": fdr.ifsc_code,
            "amount": fdr.amount,
            "amount_in_words": fdr.amount_in_words,
            "interest_rate": fdr.interest_rate,
            "issue_date": fdr.issue_date,
            "maturity_date": fdr.maturity_date,
            "tenure_months": fdr.tenure_months,
            "joint_holder": fdr.joint_holder,
            "lien_marked": fdr.lien_marked,
            "purpose": fdr.purpose,
            "document_url": fdr.document_url,
            "document_filename": fdr.document_filename,
            "submitted_at": fdr.created_at
        },
        "bank_confirmed_data": {
            "is_verified": bank_verif is not None,
            "verification_source": bank_verif.verification_source if bank_verif else "Simulated Bank API Gateway / SFMS (Awaiting Call)",
            "cbs_reference_no": bank_verif.cbs_reference_no if bank_verif else None,
            "fdr_number": bank_verif.fdr_number if bank_verif else None,
            "bank_name": bank_verif.bank_name if bank_verif else None,
            "branch_name": bank_verif.branch_name if bank_verif else None,
            "branch_manager_name": bank_verif.branch_manager_name if bank_verif else None,
            "verified_amount": bank_verif.verified_amount if bank_verif else None,
            "verified_interest_rate": bank_verif.verified_interest_rate if bank_verif else None,
            "verified_issue_date": bank_verif.verified_issue_date if bank_verif else None,
            "verified_maturity_date": bank_verif.verified_maturity_date if bank_verif else None,
            "lien_confirmed": bank_verif.lien_confirmed if bank_verif else None,
            "joint_clause_confirmed": bank_verif.joint_clause_confirmed if bank_verif else None,
            "verification_status": bank_verif.verification_status if bank_verif else "UNVERIFIED",
            "bank_remarks": bank_verif.bank_remarks if bank_verif else None,
            "verified_at": bank_verif.verified_at if bank_verif else None,
        },
        "discrepancies": [
            {
                "id": d.id,
                "type": d.discrepancy_type,
                "severity": d.severity,
                "field": d.field_name,
                "submitted_value": d.submitted_value,
                "bank_confirmed_value": d.bank_confirmed_value,
                "description": d.description,
                "resolved": d.resolved,
                "resolution_notes": d.resolution_notes,
                "resolved_by": d.resolved_by,
                "detected_at": d.detected_at,
                "resolved_at": d.resolved_at
            }
            for d in discrepancies
        ],
        "ocr_info": {
            "extracted_text": fdr.ocr_extracted_text,
            "confidence": fdr.ocr_confidence_score,
            "disclaimer": "CRITICAL AICTE NOTICE: OCR text extraction is an assistive scanning tool for data population and preliminary visual checks. In strict accordance with AICTE vigilance standards, OCR does NOT prove legal or financial authenticity. Authenticity is exclusively verified against Core Banking System / SFMS records."
        }
    }


@router.post("/trigger-bank-verification/{fdr_id}")
def trigger_simulated_bank_verification(
    fdr_id: int,
    simulate_scenario: Optional[str] = Query("EXACT_MATCH", description="EXACT_MATCH, AMOUNT_MISMATCH, DATE_MISMATCH, LIEN_MISSING"),
    actor_name: str = Query("AICTE Verification Cell"),
    db: Session = Depends(get_db)
):
    """
    Simulates calling Bank Core Banking System / SFMS API Gateway.
    Clearly labeled as simulated bank verification.
    Detects discrepancies and updates FDR status accordingly.
    """
    fdr = db.query(models.FDR).filter(models.FDR.id == fdr_id).first()
    if not fdr:
        raise HTTPException(status_code=404, detail="FDR record not found")

    # Generate or fetch bank verification record
    cbs_ref = f"CBS-SFMS-{fdr.bank_name[:3].upper()}-{datetime.date.today().year}-{random.randint(100000, 999999)}"

    # Determine simulated values based on scenario or current discrepancies
    verified_amount = fdr.amount
    verified_issue_date = fdr.issue_date
    verified_maturity_date = fdr.maturity_date
    lien_confirmed = True
    joint_clause_confirmed = True
    bank_remarks = "Confirmed as per Core Banking System ledger. AICTE lien recorded in CBS system."
    verif_status = "CONFIRMED"

    if simulate_scenario == "AMOUNT_MISMATCH":
        # Simulate discrepancy: Bank shows ₹5,00,000 less
        verified_amount = max(fdr.amount - 500000.0, 100000.0)
        bank_remarks = f"CBS record shows amount ₹{verified_amount:,.2f}, differing from claimed deposit of ₹{fdr.amount:,.2f}."
        verif_status = "MISMATCH_DETECTED"
    elif simulate_scenario == "DATE_MISMATCH":
        # Maturity date differs by 1 year earlier
        verified_maturity_date = fdr.maturity_date - datetime.timedelta(days=365)
        bank_remarks = "CBS ledger reflects 4-year tenure instead of 5 years."
        verif_status = "MISMATCH_DETECTED"
    elif simulate_scenario == "LIEN_MISSING":
        lien_confirmed = False
        bank_remarks = "AICTE Lien not marked in CBS account master; sole institution operation permitted."
        verif_status = "MISMATCH_DETECTED"

    # Upsert BankVerification
    bank_verif = db.query(models.BankVerification).filter(models.BankVerification.fdr_id == fdr_id).first()
    if not bank_verif:
        bank_verif = models.BankVerification(
            fdr_id=fdr.id,
            fdr_number=fdr.fdr_number,
            bank_name=fdr.bank_name,
            branch_name=fdr.branch_name,
            branch_manager_name=f"Chief Manager, {fdr.branch_name}",
            verified_amount=verified_amount,
            verified_issue_date=verified_issue_date,
            verified_maturity_date=verified_maturity_date,
            verified_interest_rate=fdr.interest_rate,
            lien_confirmed=lien_confirmed,
            joint_clause_confirmed=joint_clause_confirmed,
            cbs_reference_no=cbs_ref,
            verification_source="Simulated Bank API Gateway / SFMS (Secured Test Mock)",
            verification_status=verif_status,
            bank_remarks=bank_remarks,
            verified_at=datetime.datetime.utcnow()
        )
        db.add(bank_verif)
    else:
        bank_verif.verified_amount = verified_amount
        bank_verif.verified_issue_date = verified_issue_date
        bank_verif.verified_maturity_date = verified_maturity_date
        bank_verif.lien_confirmed = lien_confirmed
        bank_verif.joint_clause_confirmed = joint_clause_confirmed
        bank_verif.cbs_reference_no = cbs_ref
        bank_verif.verification_status = verif_status
        bank_verif.bank_remarks = bank_remarks
        bank_verif.verified_at = datetime.datetime.utcnow()

    db.commit()

    # Clear prior automated discrepancies for fresh evaluation (except manually locked ones)
    db.query(models.Discrepancy).filter(
        models.Discrepancy.fdr_id == fdr.id,
        models.Discrepancy.resolved == False
    ).delete()

    detected_discrepancies = []

    # 1. Check Amount Discrepancy
    if abs(fdr.amount - verified_amount) > 1.0:
        d1 = models.Discrepancy(
            fdr_id=fdr.id,
            discrepancy_type="AMOUNT_MISMATCH",
            severity="CRITICAL",
            field_name="amount",
            submitted_value=f"₹{fdr.amount:,.2f}",
            bank_confirmed_value=f"₹{verified_amount:,.2f}",
            description=f"Deposit Amount mismatch! Submitted value is ₹{fdr.amount:,.2f}, whereas Bank CBS record confirms only ₹{verified_amount:,.2f} (Variance of ₹{abs(fdr.amount - verified_amount):,.2f}).",
            resolved=False,
            detected_at=datetime.datetime.utcnow()
        )
        detected_discrepancies.append(d1)

    # 2. Check Maturity Date Discrepancy
    if fdr.maturity_date != verified_maturity_date:
        d2 = models.Discrepancy(
            fdr_id=fdr.id,
            discrepancy_type="MATURITY_DATE_MISMATCH",
            severity="HIGH",
            field_name="maturity_date",
            submitted_value=str(fdr.maturity_date),
            bank_confirmed_value=str(verified_maturity_date),
            description=f"Maturity Date mismatch! Institution submitted {fdr.maturity_date}, but Bank confirmed maturity date as {verified_maturity_date}.",
            resolved=False,
            detected_at=datetime.datetime.utcnow()
        )
        detected_discrepancies.append(d2)

    # 3. Check Lien Marking
    if not lien_confirmed:
        d3 = models.Discrepancy(
            fdr_id=fdr.id,
            discrepancy_type="MISSING_LIEN_CONFIRMATION",
            severity="CRITICAL",
            field_name="lien_marked",
            submitted_value="Lien Claimed: Yes",
            bank_confirmed_value="CBS Status: No Lien Registered",
            description="Lien not marked in favor of AICTE in bank records. AICTE norms mandate unencumbered lien marking in favor of Member Secretary, AICTE.",
            resolved=False,
            detected_at=datetime.datetime.utcnow()
        )
        detected_discrepancies.append(d3)

    # 4. Check for duplicate FDR numbers in database
    duplicate_count = db.query(models.FDR).filter(
        models.FDR.fdr_number == fdr.fdr_number,
        models.FDR.id != fdr.id
    ).count()
    if duplicate_count > 0:
        d4 = models.Discrepancy(
            fdr_id=fdr.id,
            discrepancy_type="DUPLICATE_FDR_NUMBER",
            severity="CRITICAL",
            field_name="fdr_number",
            submitted_value=fdr.fdr_number,
            bank_confirmed_value=f"Detected across {duplicate_count} other record(s)",
            description=f"Duplicate FDR Number detected! FDR #{fdr.fdr_number} is registered by another institution.",
            resolved=False,
            detected_at=datetime.datetime.utcnow()
        )
        detected_discrepancies.append(d4)

    # 5. Check Missing mandatory fields
    if not fdr.ifsc_code or len(fdr.ifsc_code) < 11:
        d5 = models.Discrepancy(
            fdr_id=fdr.id,
            discrepancy_type="MISSING_MANDATORY_FIELD",
            severity="HIGH",
            field_name="ifsc_code",
            submitted_value=fdr.ifsc_code or "EMPTY",
            bank_confirmed_value="Valid 11-character IFSC Required",
            description="Invalid or missing IFSC code. 11-digit alphanumeric bank code required.",
            resolved=False,
            detected_at=datetime.datetime.utcnow()
        )
        detected_discrepancies.append(d5)

    for d in detected_discrepancies:
        db.add(d)

    db.commit()

    # Update FDR status
    fdr.discrepancy_count = len(detected_discrepancies)
    if len(detected_discrepancies) > 0:
        fdr.status = "DISCREPANCY_FLAGGED"
    else:
        # Check maturity timeline
        today = datetime.date.today()
        days_left = (fdr.maturity_date - today).days
        if days_left < 0:
            fdr.status = "MATURED"
        elif days_left <= 90:
            fdr.status = "EXPIRING_SOON"
        else:
            fdr.status = "ACTIVE"

    fdr.updated_at = datetime.datetime.utcnow()
    db.commit()

    log_audit(
        db=db,
        entity_type="VERIFICATION",
        entity_id=fdr.id,
        fdr_number=fdr.fdr_number,
        action="BANK_VERIFICATION_SIMULATED",
        actor_role="AICTE_OFFICER",
        actor_name=actor_name,
        details=f"Simulated Bank CBS verification completed via {bank_verif.verification_source}. Discrepancies detected: {len(detected_discrepancies)}. Updated status: {fdr.status}."
    )

    return {
        "success": True,
        "fdr_id": fdr.id,
        "fdr_number": fdr.fdr_number,
        "status": fdr.status,
        "cbs_reference_no": cbs_ref,
        "discrepancies_detected": len(detected_discrepancies),
        "message": "Simulated bank verification finished successfully."
    }


@router.post("/resolve-discrepancy/{discrepancy_id}")
def resolve_discrepancy(
    discrepancy_id: int,
    payload: schemas.DiscrepancyResolve,
    db: Session = Depends(get_db)
):
    disc = db.query(models.Discrepancy).filter(models.Discrepancy.id == discrepancy_id).first()
    if not disc:
        raise HTTPException(status_code=404, detail="Discrepancy record not found")

    disc.resolved = True
    disc.resolution_notes = payload.resolution_notes
    disc.resolved_by = payload.resolved_by
    disc.resolved_at = datetime.datetime.utcnow()
    db.commit()

    # Check if all discrepancies for this FDR are now resolved
    fdr = db.query(models.FDR).filter(models.FDR.id == disc.fdr_id).first()
    if fdr:
        unresolved_count = db.query(models.Discrepancy).filter(
            models.Discrepancy.fdr_id == fdr.id,
            models.Discrepancy.resolved == False
        ).count()
        fdr.discrepancy_count = unresolved_count
        if unresolved_count == 0 and fdr.status == "DISCREPANCY_FLAGGED":
            today = datetime.date.today()
            days_left = (fdr.maturity_date - today).days
            if days_left < 0:
                fdr.status = "MATURED"
            elif days_left <= 90:
                fdr.status = "EXPIRING_SOON"
            else:
                fdr.status = "ACTIVE"
        db.commit()

        log_audit(
            db=db,
            entity_type="DISCREPANCY",
            entity_id=disc.id,
            fdr_number=fdr.fdr_number,
            action="DISCREPANCY_RESOLVED",
            actor_role="AICTE_OFFICER",
            actor_name=payload.resolved_by,
            details=f"Discrepancy on '{disc.field_name}' resolved with note: {payload.resolution_notes}"
        )

    return {"success": True, "message": "Discrepancy resolved successfully"}


@router.post("/officer-approve/{fdr_id}")
def officer_approve_verification(
    fdr_id: int,
    officer_name: str = Body(..., embed=True),
    verification_notes: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db)
):
    fdr = db.query(models.FDR).filter(models.FDR.id == fdr_id).first()
    if not fdr:
        raise HTTPException(status_code=404, detail="FDR record not found")

    # Check for active unresolved critical discrepancies
    unresolved_critical = db.query(models.Discrepancy).filter(
        models.Discrepancy.fdr_id == fdr_id,
        models.Discrepancy.resolved == False,
        models.Discrepancy.severity.in_(["CRITICAL", "HIGH"])
    ).count()

    if unresolved_critical > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot approve FDR with {unresolved_critical} active critical/high severity discrepancies. Please resolve them first."
        )

    fdr.status = "ACTIVE"
    fdr.verification_notes = verification_notes or "Verified and confirmed by AICTE Verification Officer."
    fdr.updated_at = datetime.datetime.utcnow()
    db.commit()

    log_audit(
        db=db,
        entity_type="FDR",
        entity_id=fdr.id,
        fdr_number=fdr.fdr_number,
        action="OFFICER_VERIFICATION_APPROVED",
        actor_role="AICTE_OFFICER",
        actor_name=officer_name,
        details=f"FDR {fdr.fdr_number} approved and marked ACTIVE. Notes: {fdr.verification_notes}"
    )

    return {"success": True, "message": f"FDR {fdr.fdr_number} approved as ACTIVE by {officer_name}"}
