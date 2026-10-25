from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

class InstitutionBase(BaseModel):
    aicte_id: str
    name: str
    institution_type: str = "Engineering & Technology"
    state: str
    city: str
    address: Optional[str] = None
    email: str
    phone: str
    authorized_signatory: str
    designation: str = "Principal / Director"

class InstitutionResponse(InstitutionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class FDRBase(BaseModel):
    institution_id: int
    institution_name: Optional[str] = None
    fdr_number: str
    bank_name: str
    branch_name: str
    ifsc_code: str
    amount: float
    amount_in_words: Optional[str] = None
    interest_rate: float = 7.1
    issue_date: date
    maturity_date: date
    tenure_months: int = 60
    joint_holder: str = "Member Secretary, AICTE New Delhi"
    purpose: str = "Mandatory Security Deposit for Technical Institution Affiliation"
    lien_marked: bool = True
    document_url: Optional[str] = None
    document_filename: Optional[str] = None

class FDRCreate(FDRBase):
    pass

class FDRUpdate(BaseModel):
    fdr_number: Optional[str] = None
    bank_name: Optional[str] = None
    branch_name: Optional[str] = None
    ifsc_code: Optional[str] = None
    amount: Optional[float] = None
    interest_rate: Optional[float] = None
    issue_date: Optional[date] = None
    maturity_date: Optional[date] = None
    status: Optional[str] = None
    verification_notes: Optional[str] = None


class DiscrepancyResponse(BaseModel):
    id: int
    fdr_id: int
    discrepancy_type: str
    severity: str
    field_name: str
    submitted_value: Optional[str] = None
    bank_confirmed_value: Optional[str] = None
    description: str
    resolved: bool
    resolution_notes: Optional[str] = None
    resolved_by: Optional[str] = None
    detected_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DiscrepancyResolve(BaseModel):
    resolution_notes: str
    resolved_by: str = "AICTE Officer"


class BankVerificationBase(BaseModel):
    fdr_number: str
    bank_name: str
    branch_name: str
    branch_manager_name: str = "Authorized Official"
    verified_amount: float
    verified_issue_date: date
    verified_maturity_date: date
    verified_interest_rate: float = 7.1
    lien_confirmed: bool = True
    joint_clause_confirmed: bool = True
    cbs_reference_no: str
    verification_source: str = "Simulated Bank API Gateway / SFMS"
    verification_status: str = "CONFIRMED"
    bank_remarks: Optional[str] = None

class BankVerificationResponse(BankVerificationBase):
    id: int
    fdr_id: int
    verified_at: datetime

    class Config:
        from_attributes = True


class RenewalRequestCreate(BaseModel):
    fdr_id: int
    new_fdr_number: str
    renewed_amount: float
    renewed_issue_date: date
    renewed_maturity_date: date
    renewal_document_url: Optional[str] = None

class RenewalReview(BaseModel):
    action: str # "APPROVE" or "REJECT"
    officer_remarks: str

class RenewalResponse(BaseModel):
    id: int
    fdr_id: int
    institution_id: int
    request_number: str
    old_fdr_number: str
    new_fdr_number: str
    renewed_amount: float
    renewed_issue_date: date
    renewed_maturity_date: date
    renewal_document_url: Optional[str] = None
    status: str
    officer_remarks: Optional[str] = None
    requested_at: datetime
    processed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReleaseRequestCreate(BaseModel):
    fdr_id: int
    reason_for_release: str
    justification_details: str
    refund_beneficiary_name: str
    refund_bank_account: str
    refund_ifsc: str
    noc_document_url: Optional[str] = None

class ReleaseOfficerReview(BaseModel):
    action: str # "RECOMMEND" or "REJECT"
    comments: str
    officer_name: str = "Shri R. K. Sharma (Deputy Director, AICTE)"

class ReleaseApproverAction(BaseModel):
    action: str # "APPROVE", "REJECT", or "RETURN_FOR_CLARIFICATION"
    comments: str
    approver_name: str = "Dr. M. S. Verma (Financial Adviser & Approver, AICTE)"

class CorrectionRequest(BaseModel):
    officer_name: str = "Shri R. K. Sharma (Deputy Director, AICTE)"
    correction_note: str

class CorrectionResubmit(BaseModel):
    document_url: Optional[str] = None
    document_filename: Optional[str] = None
    institution_remarks: Optional[str] = "Corrected documents attached"

class ReleaseResponse(BaseModel):
    id: int
    fdr_id: int
    institution_id: int
    request_number: str
    fdr_number: str
    amount: float
    reason_for_release: str
    justification_details: str
    refund_beneficiary_name: str
    refund_bank_account: str
    refund_ifsc: str
    noc_document_url: Optional[str] = None
    status: str
    officer_comments: Optional[str] = None
    officer_name: Optional[str] = None
    officer_reviewed_at: Optional[datetime] = None
    approver_comments: Optional[str] = None
    approver_name: Optional[str] = None
    approver_signature_token: Optional[str] = None
    approver_action_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogResponse(BaseModel):
    id: int
    entity_type: str
    entity_id: Optional[int] = None
    fdr_number: Optional[str] = None
    action: str
    actor_role: str
    actor_name: str
    details: Optional[str] = None
    ip_address: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


class MaturityReminderResponse(BaseModel):
    id: int
    fdr_id: int
    fdr_number: str
    institution_name: str
    reminder_type: str
    scheduled_date: date
    days_to_maturity: int
    sent_date: datetime
    recipient_email: str
    status: str
    subject: str
    content: str

    class Config:
        from_attributes = True


class FDRResponse(FDRBase):
    id: int
    status: str
    discrepancy_count: int
    ocr_extracted_text: Optional[str] = None
    ocr_confidence_score: Optional[float] = None
    verification_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    discrepancies: List[DiscrepancyResponse] = []

    class Config:
        from_attributes = True

class FDRDetailResponse(FDRResponse):
    bank_verification: Optional[BankVerificationResponse] = None
    renewals: List[RenewalResponse] = []
    release_requests: List[ReleaseResponse] = []
    reminders: List[MaturityReminderResponse] = []

    class Config:
        from_attributes = True


class DashboardStatsResponse(BaseModel):
    total_fdrs: int
    total_amount: float
    active_count: int
    expiring_count: int
    matured_count: int
    pending_count: int
    discrepancy_count: int
    renewal_requested_count: int
    release_requested_count: int
    released_count: int
    bank_distribution: List[dict]
    monthly_maturities: List[dict]
    recent_activities: List[AuditLogResponse]
