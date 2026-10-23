import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Date, DateTime, Text, ForeignKey, Enum
)
from sqlalchemy.orm import relationship
from database import Base

class Institution(Base):
    __tablename__ = "institutions"

    id = Column(Integer, primary_key=True, index=True)
    aicte_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    institution_type = Column(String(100), default="Engineering & Technology")
    state = Column(String(100), nullable=False)
    city = Column(String(100), nullable=False)
    address = Column(Text, nullable=True)
    email = Column(String(150), nullable=False)
    phone = Column(String(50), nullable=False)
    authorized_signatory = Column(String(150), nullable=False)
    designation = Column(String(100), default="Principal / Director")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    fdrs = relationship("FDR", back_populates="institution", cascade="all, delete-orphan")
    release_requests = relationship("ReleaseRequest", back_populates="institution")
    renewals = relationship("RenewalRequest", back_populates="institution")


class FDR(Base):
    __tablename__ = "fdrs"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=False, index=True)
    institution_name = Column(String(255), nullable=False)
    fdr_number = Column(String(100), index=True, nullable=False)
    bank_name = Column(String(150), nullable=False, index=True)
    branch_name = Column(String(200), nullable=False)
    ifsc_code = Column(String(20), nullable=False)
    
    amount = Column(Float, nullable=False)
    amount_in_words = Column(String(255), nullable=True)
    interest_rate = Column(Float, default=7.1)
    
    issue_date = Column(Date, nullable=False)
    maturity_date = Column(Date, nullable=False, index=True)
    tenure_months = Column(Integer, default=60)
    
    joint_holder = Column(String(255), default="Member Secretary, AICTE New Delhi")
    purpose = Column(String(255), default="Mandatory Security Deposit for Technical Institution Affiliation")
    lien_marked = Column(Boolean, default=True)
    
    document_url = Column(String(500), nullable=True)
    document_filename = Column(String(255), nullable=True)
    ocr_extracted_text = Column(Text, nullable=True)
    ocr_confidence_score = Column(Float, nullable=True)

    status = Column(String(50), default="PENDING_VERIFICATION", index=True)
    # PENDING_VERIFICATION, ACTIVE, EXPIRING_SOON, MATURED, DISCREPANCY_FLAGGED, RENEWAL_REQUESTED, RELEASE_REQUESTED, RELEASED, REJECTED

    discrepancy_count = Column(Integer, default=0)
    verification_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    institution = relationship("Institution", back_populates="fdrs")
    bank_verification = relationship("BankVerification", back_populates="fdr", uselist=False, cascade="all, delete-orphan")
    discrepancies = relationship("Discrepancy", back_populates="fdr", cascade="all, delete-orphan")
    renewals = relationship("RenewalRequest", back_populates="fdr", cascade="all, delete-orphan")
    release_requests = relationship("ReleaseRequest", back_populates="fdr", cascade="all, delete-orphan")
    reminders = relationship("MaturityReminder", back_populates="fdr", cascade="all, delete-orphan")


class BankVerification(Base):
    __tablename__ = "bank_verifications"

    id = Column(Integer, primary_key=True, index=True)
    fdr_id = Column(Integer, ForeignKey("fdrs.id"), unique=True, nullable=False)
    fdr_number = Column(String(100), nullable=False)
    bank_name = Column(String(150), nullable=False)
    branch_name = Column(String(200), nullable=False)
    branch_manager_name = Column(String(150), default="Authorized Official")
    
    verified_amount = Column(Float, nullable=False)
    verified_issue_date = Column(Date, nullable=False)
    verified_maturity_date = Column(Date, nullable=False)
    verified_interest_rate = Column(Float, default=7.1)
    
    lien_confirmed = Column(Boolean, default=True)
    joint_clause_confirmed = Column(Boolean, default=True)
    cbs_reference_no = Column(String(100), nullable=False)
    verification_source = Column(String(100), default="Simulated Bank API Gateway / SFMS")
    verification_status = Column(String(50), default="CONFIRMED") # CONFIRMED, MISMATCH_DETECTED, PENDING_CONFIRMATION, UNRECOGNIZED_FDR
    bank_remarks = Column(Text, nullable=True)
    verified_at = Column(DateTime, default=datetime.datetime.utcnow)

    fdr = relationship("FDR", back_populates="bank_verification")


class Discrepancy(Base):
    __tablename__ = "discrepancies"

    id = Column(Integer, primary_key=True, index=True)
    fdr_id = Column(Integer, ForeignKey("fdrs.id"), nullable=False, index=True)
    discrepancy_type = Column(String(100), nullable=False) # AMOUNT_MISMATCH, MATURITY_DATE_MISMATCH, ISSUE_DATE_MISMATCH, DUPLICATE_FDR_NUMBER, MISSING_LIEN_CONFIRMATION, MISSING_MANDATORY_FIELD
    severity = Column(String(20), default="HIGH") # CRITICAL, HIGH, MEDIUM, LOW
    field_name = Column(String(100), nullable=False)
    submitted_value = Column(String(255), nullable=True)
    bank_confirmed_value = Column(String(255), nullable=True)
    description = Column(Text, nullable=False)
    resolved = Column(Boolean, default=False)
    resolution_notes = Column(Text, nullable=True)
    resolved_by = Column(String(100), nullable=True)
    detected_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    fdr = relationship("FDR", back_populates="discrepancies")


class RenewalRequest(Base):
    __tablename__ = "renewal_requests"

    id = Column(Integer, primary_key=True, index=True)
    fdr_id = Column(Integer, ForeignKey("fdrs.id"), nullable=False, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=False)
    request_number = Column(String(50), unique=True, index=True, nullable=False)
    old_fdr_number = Column(String(100), nullable=False)
    new_fdr_number = Column(String(100), nullable=False)
    renewed_amount = Column(Float, nullable=False)
    renewed_issue_date = Column(Date, nullable=False)
    renewed_maturity_date = Column(Date, nullable=False)
    renewal_document_url = Column(String(500), nullable=True)
    status = Column(String(50), default="PENDING_OFFICER_REVIEW") # PENDING_OFFICER_REVIEW, APPROVED, REJECTED
    officer_remarks = Column(Text, nullable=True)
    requested_at = Column(DateTime, default=datetime.datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)

    fdr = relationship("FDR", back_populates="renewals")
    institution = relationship("Institution", back_populates="renewals")


class ReleaseRequest(Base):
    __tablename__ = "release_requests"

    id = Column(Integer, primary_key=True, index=True)
    fdr_id = Column(Integer, ForeignKey("fdrs.id"), nullable=False, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id"), nullable=False)
    request_number = Column(String(50), unique=True, index=True, nullable=False)
    fdr_number = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    reason_for_release = Column(String(255), nullable=False)
    justification_details = Column(Text, nullable=False)
    
    refund_beneficiary_name = Column(String(200), nullable=False)
    refund_bank_account = Column(String(50), nullable=False)
    refund_ifsc = Column(String(20), nullable=False)
    noc_document_url = Column(String(500), nullable=True)

    status = Column(String(50), default="SUBMITTED")
    # SUBMITTED, UNDER_REVIEW, RECOMMENDED_FOR_APPROVAL, OFFICER_REJECTED, APPROVED_BY_APPROVER, APPROVER_REJECTED

    officer_comments = Column(Text, nullable=True)
    officer_name = Column(String(100), nullable=True)
    officer_reviewed_at = Column(DateTime, nullable=True)

    approver_comments = Column(Text, nullable=True)
    approver_name = Column(String(100), nullable=True)
    approver_signature_token = Column(String(100), nullable=True)
    approver_action_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    fdr = relationship("FDR", back_populates="release_requests")
    institution = relationship("Institution", back_populates="release_requests")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(50), nullable=False, index=True) # FDR, VERIFICATION, DISCREPANCY, RENEWAL, RELEASE, SYSTEM
    entity_id = Column(Integer, nullable=True)
    fdr_number = Column(String(100), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    actor_role = Column(String(50), nullable=False) # INSTITUTION, AICTE_OFFICER, FINANCIAL_APPROVER, SYSTEM
    actor_name = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), default="127.0.0.1")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)


class MaturityReminder(Base):
    __tablename__ = "maturity_reminders"

    id = Column(Integer, primary_key=True, index=True)
    fdr_id = Column(Integer, ForeignKey("fdrs.id"), nullable=False)
    fdr_number = Column(String(100), nullable=False)
    institution_name = Column(String(255), nullable=False)
    reminder_type = Column(String(50), nullable=False) # 90_DAYS_NOTICE, 60_DAYS_NOTICE, 30_DAYS_NOTICE, OVERDUE_ALERT
    scheduled_date = Column(Date, nullable=False)
    days_to_maturity = Column(Integer, nullable=False)
    sent_date = Column(DateTime, default=datetime.datetime.utcnow)
    recipient_email = Column(String(150), nullable=False)
    status = Column(String(50), default="SENT")
    subject = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)

    fdr = relationship("FDR", back_populates="reminders")
