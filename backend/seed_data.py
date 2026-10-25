import datetime
import random
from sqlalchemy.orm import Session
import models
from auth_utils import hash_password

def seed_sample_data(db: Session, force: bool = False):
    if force:
        # Clear existing data in reverse order of foreign keys
        db.query(models.AuditLog).delete()
        db.query(models.MaturityReminder).delete()
        db.query(models.Discrepancy).delete()
        db.query(models.BankVerification).delete()
        db.query(models.RenewalRequest).delete()
        db.query(models.ReleaseRequest).delete()
        db.query(models.FDR).delete()
        db.query(models.Institution).delete()
        db.commit()

    today = datetime.date.today()

    # 1. Seed Institutions
    institutions_data = [
        {
            "aicte_id": "AICTE-1-10294819",
            "name": "Delhi Institute of Technology & Management",
            "institution_type": "Engineering & Technology",
            "state": "Delhi",
            "city": "New Delhi",
            "address": "Plot No. 12, Institutional Area, Sector 5, Dwarka, New Delhi - 110075",
            "email": "director@ditm.ac.in",
            "phone": "+91-11-28049102",
            "authorized_signatory": "Prof. Alok Kumar Singhal",
            "designation": "Director General"
        },
        {
            "aicte_id": "AICTE-1-29481023",
            "name": "Vivekananda College of Engineering & Technology",
            "institution_type": "Engineering & Technology",
            "state": "Karnataka",
            "city": "Bengaluru",
            "address": "Nehru Nagar, Puttur, DK, Bengaluru Region, Karnataka - 574203",
            "email": "principal@vcetputtur.ac.in",
            "phone": "+91-8251-234555",
            "authorized_signatory": "Dr. Maheshwarappa G. K.",
            "designation": "Principal"
        },
        {
            "aicte_id": "AICTE-1-49281034",
            "name": "Maharashtra Institute of Technology & Research",
            "institution_type": "Engineering & Technology",
            "state": "Maharashtra",
            "city": "Pune",
            "address": "Survey No. 124, Paud Road, Kothrud, Pune, Maharashtra - 411038",
            "email": "dean.academics@mitr-pune.edu.in",
            "phone": "+91-20-30273400",
            "authorized_signatory": "Dr. Sunita Deshmukh",
            "designation": "Dean Administration"
        },
        {
            "aicte_id": "AICTE-1-58291045",
            "name": "Sardar Patel Institute of Applied Technology",
            "institution_type": "Polytechnic & Applied Studies",
            "state": "Gujarat",
            "city": "Ahmedabad",
            "address": "Near Sardar Patel Ring Road, Vastral, Ahmedabad, Gujarat - 382418",
            "email": "registrar@spiat.edu.in",
            "phone": "+91-79-29703412",
            "authorized_signatory": "Shri Bhavesh Patel",
            "designation": "Registrar"
        },
        {
            "aicte_id": "AICTE-1-71928301",
            "name": "KCG College of Technology",
            "institution_type": "Engineering & Technology",
            "state": "Tamil Nadu",
            "city": "Chennai",
            "address": "Rajiv Gandhi Salai, Karapakkam, Chennai, Tamil Nadu - 600097",
            "email": "trustee@kcgtech.ac.in",
            "phone": "+91-44-24503232",
            "authorized_signatory": "Dr. P. Deiva Sundari",
            "designation": "Principal"
        },
        {
            "aicte_id": "AICTE-1-82910392",
            "name": "Deccan School of Pharmacy & Life Sciences",
            "institution_type": "Pharmacy",
            "state": "Telangana",
            "city": "Hyderabad",
            "address": "Kanchanbagh, DMRL X Road, Hyderabad, Telangana - 500058",
            "email": "director@deccanpharmacy.ac.in",
            "phone": "+91-40-24340166",
            "authorized_signatory": "Prof. Mir Zulfiqar Ali",
            "designation": "Director"
        }
    ]

    inst_objs = {}
    for data in institutions_data:
        inst = models.Institution(**data)
        db.add(inst)
        db.flush()
        inst_objs[inst.name] = inst

    # Helper dates
    past_2yr = today - datetime.timedelta(days=730)
    past_1yr = today - datetime.timedelta(days=365)
    past_4yr = today - datetime.timedelta(days=1460)
    past_5yr = today - datetime.timedelta(days=1825)
    past_30d = today - datetime.timedelta(days=30)
    
    future_25d = today + datetime.timedelta(days=25)
    future_65d = today + datetime.timedelta(days=65)
    future_3yr = today + datetime.timedelta(days=1095)
    future_4yr = today + datetime.timedelta(days=1460)

    # 2. Seed FDR records
    fdr_records = [
        # 1. Perfectly verified Active FDR
        {
            "institution": inst_objs["Delhi Institute of Technology & Management"],
            "fdr_number": "FDR-SBIN-89410294",
            "bank_name": "State Bank of India",
            "branch_name": "Connaught Place Main Branch, New Delhi",
            "ifsc_code": "SBIN0000691",
            "amount": 3500000.0,
            "amount_in_words": "Rupees Thirty Five Lakh Only",
            "interest_rate": 7.25,
            "issue_date": past_2yr,
            "maturity_date": future_3yr,
            "tenure_months": 60,
            "joint_holder": "Member Secretary, AICTE New Delhi",
            "purpose": "Mandatory Security Deposit for UG Engineering Approval",
            "lien_marked": True,
            "document_url": "/uploads/fdr_sample_sbi.pdf",
            "document_filename": "sbi_fdr_deposit_35lakh.pdf",
            "status": "ACTIVE",
            "discrepancy_count": 0,
            "verification_notes": "Verified via CBS-SFMS gateway. Lien recorded in bank ledger.",
            "verified_data": {
                "verified_amount": 3500000.0,
                "verified_issue_date": past_2yr,
                "verified_maturity_date": future_3yr,
                "cbs_reference_no": "CBS-SFMS-SBI-2024-894102",
                "verification_status": "CONFIRMED",
                "bank_remarks": "Deposit active and lien marked in favor of Member Secretary, AICTE New Delhi as per CBS master."
            }
        },
        # 2. Another Active FDR
        {
            "institution": inst_objs["Maharashtra Institute of Technology & Research"],
            "fdr_number": "FDR-PUNB-47201938",
            "bank_name": "Punjab National Bank",
            "branch_name": "Shivaji Nagar Branch, Pune",
            "ifsc_code": "PUNB0021900",
            "amount": 5000000.0,
            "amount_in_words": "Rupees Fifty Lakh Only",
            "interest_rate": 7.10,
            "issue_date": past_1yr,
            "maturity_date": future_4yr,
            "tenure_months": 60,
            "joint_holder": "Member Secretary, AICTE New Delhi",
            "purpose": "Mandatory Security Deposit for PG & New Technology Courses",
            "lien_marked": True,
            "document_url": "/uploads/fdr_sample_pnb.pdf",
            "document_filename": "pnb_lien_deposit_50lakh.pdf",
            "status": "ACTIVE",
            "discrepancy_count": 0,
            "verification_notes": "Confirmed by PNB Head Office CBS Interface.",
            "verified_data": {
                "verified_amount": 5000000.0,
                "verified_issue_date": past_1yr,
                "verified_maturity_date": future_4yr,
                "cbs_reference_no": "CBS-SFMS-PNB-2025-472019",
                "verification_status": "CONFIRMED",
                "bank_remarks": "Lien noted in account ledger. AICTE concurrence required for pre-closure."
            }
        },
        # 3. Expiring Soon (25 days left - notice sent)
        {
            "institution": inst_objs["KCG College of Technology"],
            "fdr_number": "FDR-CNRB-63910248",
            "bank_name": "Canara Bank",
            "branch_name": "Anna Salai Main Branch, Chennai",
            "ifsc_code": "CNRB0000101",
            "amount": 3500000.0,
            "amount_in_words": "Rupees Thirty Five Lakh Only",
            "interest_rate": 6.85,
            "issue_date": past_5yr,
            "maturity_date": future_25d,
            "tenure_months": 60,
            "joint_holder": "Member Secretary, AICTE New Delhi",
            "purpose": "Security Deposit for Technical Institution Affiliation",
            "lien_marked": True,
            "document_url": "/uploads/fdr_sample_canara.pdf",
            "document_filename": "canara_fdr_35lakh.pdf",
            "status": "EXPIRING_SOON",
            "discrepancy_count": 0,
            "verification_notes": "Statutory 30-Day renewal alert issued.",
            "verified_data": {
                "verified_amount": 3500000.0,
                "verified_issue_date": past_5yr,
                "verified_maturity_date": future_25d,
                "cbs_reference_no": "CBS-SFMS-CNR-2021-639102",
                "verification_status": "CONFIRMED",
                "bank_remarks": "FDR maturing in 25 days. Bank awaiting renewal or joint discharge instructions."
            }
        },
        # 4. Expiring Soon (65 days left - notice sent)
        {
            "institution": inst_objs["Sardar Patel Institute of Applied Technology"],
            "fdr_number": "FDR-BARB-78201945",
            "bank_name": "Bank of Baroda",
            "branch_name": "Ashram Road Branch, Ahmedabad",
            "ifsc_code": "BARB0ASHRAM",
            "amount": 4000000.0,
            "amount_in_words": "Rupees Forty Lakh Only",
            "interest_rate": 7.00,
            "issue_date": past_5yr,
            "maturity_date": future_65d,
            "tenure_months": 60,
            "joint_holder": "Member Secretary, AICTE New Delhi",
            "purpose": "Polytechnic Course Approval Security Deposit",
            "lien_marked": True,
            "document_url": "/uploads/fdr_sample_bob.pdf",
            "document_filename": "bob_deposit_40lakh.pdf",
            "status": "EXPIRING_SOON",
            "discrepancy_count": 0,
            "verification_notes": "60-Day renewal window open.",
            "verified_data": {
                "verified_amount": 4000000.0,
                "verified_issue_date": past_5yr,
                "verified_maturity_date": future_65d,
                "cbs_reference_no": "CBS-SFMS-BOB-2021-782019",
                "verification_status": "CONFIRMED",
                "bank_remarks": "Active lien. Scheduled maturity in 65 days."
            }
        },
        # 5. Matured FDR (Matured 30 days ago)
        {
            "institution": inst_objs["Deccan School of Pharmacy & Life Sciences"],
            "fdr_number": "FDR-HDFC-91028341",
            "bank_name": "HDFC Bank",
            "branch_name": "Banjara Hills Branch, Hyderabad",
            "ifsc_code": "HDFC0000021",
            "amount": 2500000.0,
            "amount_in_words": "Rupees Twenty Five Lakh Only",
            "interest_rate": 6.90,
            "issue_date": past_5yr,
            "maturity_date": past_30d,
            "tenure_months": 60,
            "joint_holder": "Member Secretary, AICTE New Delhi",
            "purpose": "B.Pharm Course Establishment Guarantee",
            "lien_marked": True,
            "document_url": "/uploads/fdr_sample_hdfc.pdf",
            "document_filename": "hdfc_matured_receipt.pdf",
            "status": "MATURED",
            "discrepancy_count": 0,
            "verification_notes": "Maturity date elapsed. Renewal or formal release mandatory.",
            "verified_data": {
                "verified_amount": 2500000.0,
                "verified_issue_date": past_5yr,
                "verified_maturity_date": past_30d,
                "cbs_reference_no": "CBS-SFMS-HDF-2021-910283",
                "verification_status": "CONFIRMED",
                "bank_remarks": "Deposit matured on " + str(past_30d) + ". Earning overdue savings rate until instruction."
            }
        },
        # 6. Pending Verification (Newly submitted by institution)
        {
            "institution": inst_objs["Vivekananda College of Engineering & Technology"],
            "fdr_number": "FDR-UBIN-51928374",
            "bank_name": "Union Bank of India",
            "branch_name": "Jayanagar 4th Block, Bengaluru",
            "ifsc_code": "UBIN0533211",
            "amount": 3500000.0,
            "amount_in_words": "Rupees Thirty Five Lakh Only",
            "interest_rate": 7.20,
            "issue_date": today - datetime.timedelta(days=10),
            "maturity_date": today + datetime.timedelta(days=1815),
            "tenure_months": 60,
            "joint_holder": "Member Secretary, AICTE New Delhi",
            "purpose": "Affiliation Extension Security Deposit - AICTE Approval 2026",
            "lien_marked": True,
            "document_url": "/uploads/fdr_sample_union.pdf",
            "document_filename": "ubin_deposit_receipt_scan.pdf",
            "status": "PENDING_VERIFICATION",
            "discrepancy_count": 0,
            "verification_notes": "Uploaded by institution. Ready for automated SFMS bank verification.",
            "verified_data": None
        },
        # 7. Discrepancy Flagged - Amount Mismatch (Institution claimed ₹45L, Bank shows ₹40L!)
        {
            "institution": inst_objs["Delhi Institute of Technology & Management"],
            "fdr_number": "FDR-SBIN-30192847",
            "bank_name": "State Bank of India",
            "branch_name": "Rohini Sector 8, New Delhi",
            "ifsc_code": "SBIN0005934",
            "amount": 4500000.0,
            "amount_in_words": "Rupees Forty Five Lakh Only",
            "interest_rate": 7.15,
            "issue_date": past_1yr,
            "maturity_date": future_4yr,
            "tenure_months": 60,
            "joint_holder": "Member Secretary, AICTE New Delhi",
            "purpose": "Additional Intake Approval Security Deposit",
            "lien_marked": True,
            "document_url": "/uploads/fdr_sample_discrepancy.pdf",
            "document_filename": "sbi_amount_mismatch_scan.pdf",
            "status": "DISCREPANCY_FLAGGED",
            "discrepancy_count": 1,
            "verification_notes": "Variance detected between submitted figure and Bank CBS ledger.",
            "verified_data": {
                "verified_amount": 4000000.0,
                "verified_issue_date": past_1yr,
                "verified_maturity_date": future_4yr,
                "cbs_reference_no": "CBS-SFMS-SBI-2025-301928",
                "verification_status": "MISMATCH_DETECTED",
                "bank_remarks": "CBS Account shows principal deposit of ₹40,00,000.00. Discrepancy with submitted ₹45,00,000.00."
            },
            "discrepancy": {
                "type": "AMOUNT_MISMATCH",
                "severity": "CRITICAL",
                "field": "amount",
                "submitted": "₹45,00,000.00",
                "confirmed": "₹40,00,000.00",
                "desc": "Deposit Amount Mismatch! Institution submitted ₹45,00,000.00, but Core Banking System confirms only ₹40,00,000.00 (Shortfall variance of ₹5,00,000.00)."
            }
        },
        # 8. Discrepancy Flagged - Lien Missing
        {
            "institution": inst_objs["Sardar Patel Institute of Applied Technology"],
            "fdr_number": "FDR-CBIN-82019483",
            "bank_name": "Central Bank of India",
            "branch_name": "Lal Darwaja Branch, Ahmedabad",
            "ifsc_code": "CBIN0280562",
            "amount": 3000000.0,
            "amount_in_words": "Rupees Thirty Lakh Only",
            "interest_rate": 7.00,
            "issue_date": past_1yr,
            "maturity_date": future_4yr,
            "tenure_months": 60,
            "joint_holder": "Principal Only (No AICTE Clause Found in Bank Master)",
            "purpose": "Diploma Course Security Deposit",
            "lien_marked": False,
            "document_url": "/uploads/fdr_cbi_scan.pdf",
            "document_filename": "cbi_lien_missing_scan.pdf",
            "status": "DISCREPANCY_FLAGGED",
            "discrepancy_count": 1,
            "verification_notes": "Lien not marked in AICTE favor in CBS records.",
            "verified_data": {
                "verified_amount": 3000000.0,
                "verified_issue_date": past_1yr,
                "verified_maturity_date": future_4yr,
                "cbs_reference_no": "CBS-SFMS-CBI-2025-820194",
                "verification_status": "MISMATCH_DETECTED",
                "bank_remarks": "No lien in favor of Member Secretary, AICTE is recorded in bank system. Sole operational authority."
            },
            "discrepancy": {
                "type": "MISSING_LIEN_CONFIRMATION",
                "severity": "CRITICAL",
                "field": "lien_marked",
                "submitted": "Claimed: Yes",
                "confirmed": "Bank CBS: No Lien Recorded",
                "desc": "Lien not marked in favor of AICTE in bank records. AICTE norms mandate irrevocable lien in favor of Member Secretary, AICTE."
            }
        },
        # 9. Renewal Requested
        {
            "institution": inst_objs["Maharashtra Institute of Technology & Research"],
            "fdr_number": "FDR-ICIC-29103847",
            "bank_name": "ICICI Bank",
            "branch_name": "FC Road Branch, Pune",
            "ifsc_code": "ICIC0000005",
            "amount": 3500000.0,
            "amount_in_words": "Rupees Thirty Five Lakh Only",
            "interest_rate": 7.10,
            "issue_date": past_5yr,
            "maturity_date": past_30d,
            "tenure_months": 60,
            "joint_holder": "Member Secretary, AICTE New Delhi",
            "purpose": "Affiliation Security Deposit",
            "lien_marked": True,
            "document_url": "/uploads/fdr_icici_old.pdf",
            "document_filename": "icici_matured_deposit.pdf",
            "status": "RENEWAL_REQUESTED",
            "discrepancy_count": 0,
            "verification_notes": "Renewal application submitted by institution. Under review by Verification Officer.",
            "verified_data": {
                "verified_amount": 3500000.0,
                "verified_issue_date": past_5yr,
                "verified_maturity_date": past_30d,
                "cbs_reference_no": "CBS-SFMS-ICI-2021-291038",
                "verification_status": "CONFIRMED",
                "bank_remarks": "Renewal receipt issued under new FDR reference."
            }
        },
        # 10. Release Requested - Submitted (Under Review)
        {
            "institution": inst_objs["KCG College of Technology"],
            "fdr_number": "FDR-IOBA-18293041",
            "bank_name": "Indian Overseas Bank",
            "branch_name": "Cathedral Road, Chennai",
            "ifsc_code": "IOBA0000001",
            "amount": 3500000.0,
            "amount_in_words": "Rupees Thirty Five Lakh Only",
            "interest_rate": 7.05,
            "issue_date": past_5yr - datetime.timedelta(days=1825), # 10 years old!
            "maturity_date": past_30d,
            "tenure_months": 120,
            "joint_holder": "Member Secretary, AICTE New Delhi",
            "purpose": "Mandatory 10-Year Security Deposit - Complete Tenure",
            "lien_marked": True,
            "document_url": "/uploads/fdr_sample_iob.pdf",
            "document_filename": "iob_10yr_retention.pdf",
            "status": "RELEASE_REQUESTED",
            "discrepancy_count": 0,
            "verification_notes": "Application for release after completion of 10-year lock-in period.",
            "verified_data": {
                "verified_amount": 3500000.0,
                "verified_issue_date": past_5yr - datetime.timedelta(days=1825),
                "verified_maturity_date": past_30d,
                "cbs_reference_no": "CBS-SFMS-IOB-2016-182930",
                "verification_status": "CONFIRMED",
                "bank_remarks": "10-year term completed without encumbrances."
            }
        },
        # 11. Release Requested - Recommended by Officer (Awaiting Approver sign-off)
        {
            "institution": inst_objs["Deccan School of Pharmacy & Life Sciences"],
            "fdr_number": "FDR-SBIN-72910482",
            "bank_name": "State Bank of India",
            "branch_name": "Abids Branch, Hyderabad",
            "ifsc_code": "SBIN0000078",
            "amount": 5000000.0,
            "amount_in_words": "Rupees Fifty Lakh Only",
            "interest_rate": 7.20,
            "issue_date": past_5yr - datetime.timedelta(days=1825),
            "maturity_date": past_30d,
            "tenure_months": 120,
            "joint_holder": "Member Secretary, AICTE New Delhi",
            "purpose": "Institute Reorganization & Security Deposit Refund",
            "lien_marked": True,
            "document_url": "/uploads/fdr_sbi_abids.pdf",
            "document_filename": "sbi_release_eligible.pdf",
            "status": "RELEASE_REQUESTED",
            "discrepancy_count": 0,
            "verification_notes": "Scrutiny completed by AICTE Officer. Recommended for Financial Approver authorization.",
            "verified_data": {
                "verified_amount": 5000000.0,
                "verified_issue_date": past_5yr - datetime.timedelta(days=1825),
                "verified_maturity_date": past_30d,
                "cbs_reference_no": "CBS-SFMS-SBI-2016-729104",
                "verification_status": "CONFIRMED",
                "bank_remarks": "Eligible for release upon AICTE Approver sanction letter."
            }
        },
        # 12. Released & Refunded (Fully completed workflow)
        {
            "institution": inst_objs["Vivekananda College of Engineering & Technology"],
            "fdr_number": "FDR-CANB-50192834",
            "bank_name": "Canara Bank",
            "branch_name": "Puttur Main Branch, Karnataka",
            "ifsc_code": "CNRB0000523",
            "amount": 3500000.0,
            "amount_in_words": "Rupees Thirty Five Lakh Only",
            "interest_rate": 6.95,
            "issue_date": past_5yr - datetime.timedelta(days=1825),
            "maturity_date": past_30d - datetime.timedelta(days=90),
            "tenure_months": 120,
            "joint_holder": "Member Secretary, AICTE New Delhi",
            "purpose": "Historical Security Deposit - Released under AICTE Order #892",
            "lien_marked": True,
            "document_url": "/uploads/fdr_canara_released.pdf",
            "document_filename": "canara_sanction_refunded.pdf",
            "status": "RELEASED",
            "discrepancy_count": 0,
            "verification_notes": "Released and refunded to Institution account via RTGS.",
            "verified_data": {
                "verified_amount": 3500000.0,
                "verified_issue_date": past_5yr - datetime.timedelta(days=1825),
                "verified_maturity_date": past_30d - datetime.timedelta(days=90),
                "cbs_reference_no": "CBS-SFMS-CNR-2016-501928",
                "verification_status": "CONFIRMED",
                "bank_remarks": "Deposit refunded and account closed on AICTE discharge instruction."
            }
        }
    ]

    created_fdrs = []
    for item in fdr_records:
        inst = item["institution"]
        verified_data = item.get("verified_data")
        discrepancy_data = item.get("discrepancy")

        fdr = models.FDR(
            institution_id=inst.id,
            institution_name=inst.name,
            fdr_number=item["fdr_number"],
            bank_name=item["bank_name"],
            branch_name=item["branch_name"],
            ifsc_code=item["ifsc_code"],
            amount=item["amount"],
            amount_in_words=item["amount_in_words"],
            interest_rate=item["interest_rate"],
            issue_date=item["issue_date"],
            maturity_date=item["maturity_date"],
            tenure_months=item["tenure_months"],
            joint_holder=item["joint_holder"],
            purpose=item["purpose"],
            lien_marked=item["lien_marked"],
            document_url=item["document_url"],
            document_filename=item["document_filename"],
            status=item["status"],
            discrepancy_count=item["discrepancy_count"],
            verification_notes=item["verification_notes"],
            ocr_extracted_text="[OCR Assist] Document scanned. Preliminary data extraction populated. In accordance with AICTE regulations, OCR scanning assists entry and does NOT prove legal authenticity.",
            ocr_confidence_score=95.2,
            created_at=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(15, 90))
        )
        db.add(fdr)
        db.flush()
        created_fdrs.append(fdr)

        # Bank Verification
        if verified_data:
            bv = models.BankVerification(
                fdr_id=fdr.id,
                fdr_number=fdr.fdr_number,
                bank_name=fdr.bank_name,
                branch_name=fdr.branch_name,
                branch_manager_name=f"Chief Manager, {fdr.branch_name}",
                verified_amount=verified_data["verified_amount"],
                verified_issue_date=verified_data["verified_issue_date"],
                verified_maturity_date=verified_data["verified_maturity_date"],
                verified_interest_rate=fdr.interest_rate,
                lien_confirmed=True if item["status"] != "DISCREPANCY_FLAGGED" or discrepancy_data["type"] != "MISSING_LIEN_CONFIRMATION" else False,
                joint_clause_confirmed=True,
                cbs_reference_no=verified_data["cbs_reference_no"],
                verification_source="Simulated Bank API Gateway / SFMS",
                verification_status=verified_data["verification_status"],
                bank_remarks=verified_data["bank_remarks"],
                verified_at=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(2, 20))
            )
            db.add(bv)

        # Discrepancy
        if discrepancy_data:
            d = models.Discrepancy(
                fdr_id=fdr.id,
                discrepancy_type=discrepancy_data["type"],
                severity=discrepancy_data["severity"],
                field_name=discrepancy_data["field"],
                submitted_value=discrepancy_data["submitted"],
                bank_confirmed_value=discrepancy_data["confirmed"],
                description=discrepancy_data["desc"],
                resolved=False,
                detected_at=datetime.datetime.utcnow() - datetime.timedelta(days=3)
            )
            db.add(d)

        # Renewal Request for FDR #9
        if fdr.status == "RENEWAL_REQUESTED":
            rnw = models.RenewalRequest(
                fdr_id=fdr.id,
                institution_id=fdr.institution_id,
                request_number=f"RNW-AICTE-2026-{fdr.id:04d}",
                old_fdr_number=fdr.fdr_number,
                new_fdr_number="FDR-ICIC-99281045",
                renewed_amount=3500000.0,
                renewed_issue_date=today,
                renewed_maturity_date=today + datetime.timedelta(days=1825),
                renewal_document_url="/uploads/fdr_icici_renewed_receipt.pdf",
                status="PENDING_OFFICER_REVIEW",
                requested_at=datetime.datetime.utcnow() - datetime.timedelta(days=2)
            )
            db.add(rnw)

        # Release Requests for FDR #10, #11, #12
        if item["fdr_number"] == "FDR-IOBA-18293041": # Submitted
            rel = models.ReleaseRequest(
                fdr_id=fdr.id,
                institution_id=fdr.institution_id,
                request_number="REL-AICTE-2026-0010",
                fdr_number=fdr.fdr_number,
                amount=fdr.amount,
                reason_for_release="Completion of 10-Year Mandatory Retention Period",
                justification_details="The institution has successfully completed the stipulated 10-year security lock-in period with continuous AICTE approval and zero vigilance complaints. Releasing security deposit as per Chapter 1, Section 8 of AICTE Approval Handbook.",
                refund_beneficiary_name="KCG College of Technology Corpus Account",
                refund_bank_account="000102000049182",
                refund_ifsc="IOBA0000001",
                noc_document_url="/uploads/aicte_noc_kcg_10yr.pdf",
                status="SUBMITTED",
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=4)
            )
            db.add(rel)

        elif item["fdr_number"] == "FDR-SBIN-72910482": # Recommended for Approver
            rel = models.ReleaseRequest(
                fdr_id=fdr.id,
                institution_id=fdr.institution_id,
                request_number="REL-AICTE-2026-0011",
                fdr_number=fdr.fdr_number,
                amount=fdr.amount,
                reason_for_release="Excess Security Deposit Readjustment under Revised Norms",
                justification_details="Institution fulfilled all endowment fund prerequisites and has requested refund of excess FDR collateral. All academic obligations verified.",
                refund_beneficiary_name="Deccan School of Pharmacy Trust Fund",
                refund_bank_account="30192849102",
                refund_ifsc="SBIN0000078",
                noc_document_url="/uploads/aicte_noc_excess_refund.pdf",
                status="RECOMMENDED_FOR_APPROVAL",
                officer_comments="Verified against AICTE Approval Handbooks. Student interests protected, no pending court inquiries. Recommended for final financial sanction.",
                officer_name="Shri R. K. Sharma (Deputy Director, AICTE)",
                officer_reviewed_at=datetime.datetime.utcnow() - datetime.timedelta(days=1),
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=5)
            )
            db.add(rel)

        elif item["fdr_number"] == "FDR-CANB-50192834": # Approved & Released
            rel = models.ReleaseRequest(
                fdr_id=fdr.id,
                institution_id=fdr.institution_id,
                request_number="REL-AICTE-2026-0012",
                fdr_number=fdr.fdr_number,
                amount=fdr.amount,
                reason_for_release="Completion of 10-Year Mandatory Retention Period",
                justification_details="Tenure completed. Full NOC provided from State Directorate of Technical Education and Affiliating University.",
                refund_beneficiary_name="Vivekananda College Society A/c",
                refund_bank_account="0523101004912",
                refund_ifsc="CNRB0000523",
                noc_document_url="/uploads/canara_final_noc.pdf",
                status="APPROVED_BY_APPROVER",
                officer_comments="All compliance criteria fulfilled.",
                officer_name="Shri R. K. Sharma (Deputy Director, AICTE)",
                officer_reviewed_at=datetime.datetime.utcnow() - datetime.timedelta(days=45),
                approver_comments="Financial refund sanctioned. Member Secretary digital authorization affixed.",
                approver_name="Dr. M. S. Verma (Financial Adviser & Approver, AICTE)",
                approver_signature_token="DIGI-SIGN-AICTE-B92F81A4D0",
                approver_action_at=datetime.datetime.utcnow() - datetime.timedelta(days=43),
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=50)
            )
            db.add(rel)

    # 3. Seed Reminders
    reminders_data = [
        {
            "fdr_number": "FDR-CNRB-63910248",
            "institution_name": "KCG College of Technology",
            "reminder_type": "30_DAYS_NOTICE",
            "scheduled_date": today,
            "days_to_maturity": 25,
            "recipient_email": "trustee@kcgtech.ac.in",
            "status": "SENT",
            "subject": "Final 30-Day Reminder: AICTE FDR Renewal Due - #FDR-CNRB-63910248",
            "content": "Statutory notice: Fixed Deposit Receipt #FDR-CNRB-63910248 of amount ₹35,00,000.00 matures on " + str(future_25d) + ". Initiate renewal immediately to maintain approval status."
        },
        {
            "fdr_number": "FDR-BARB-78201945",
            "institution_name": "Sardar Patel Institute of Applied Technology",
            "reminder_type": "60_DAYS_NOTICE",
            "scheduled_date": today,
            "days_to_maturity": 65,
            "recipient_email": "registrar@spiat.edu.in",
            "status": "SENT",
            "subject": "Notice: AICTE Security Deposit Maturing in 65 Days - #FDR-BARB-78201945",
            "content": "Advisory communication: Fixed Deposit Receipt #FDR-BARB-78201945 matures in 65 days. Renewal window is open on AICTE SecureDeposit portal."
        },
        {
            "fdr_number": "FDR-HDFC-91028341",
            "institution_name": "Deccan School of Pharmacy & Life Sciences",
            "reminder_type": "OVERDUE_ALERT",
            "scheduled_date": past_30d,
            "days_to_maturity": -30,
            "recipient_email": "director@deccanpharmacy.ac.in",
            "status": "SENT",
            "subject": "URGENT: AICTE Security Deposit Matured & Expired - #FDR-HDFC-91028341",
            "content": "Deposit expired on " + str(past_30d) + ". Submit renewal proof or apply for authorized refund on portal."
        }
    ]

    for rem in reminders_data:
        matching_fdr = next((f for f in created_fdrs if f.fdr_number == rem["fdr_number"]), None)
        if matching_fdr:
            mr = models.MaturityReminder(
                fdr_id=matching_fdr.id,
                fdr_number=rem["fdr_number"],
                institution_name=rem["institution_name"],
                reminder_type=rem["reminder_type"],
                scheduled_date=rem["scheduled_date"],
                days_to_maturity=rem["days_to_maturity"],
                recipient_email=rem["recipient_email"],
                status=rem["status"],
                subject=rem["subject"],
                content=rem["content"]
            )
            db.add(mr)

    # 4. Seed Audit History
    audit_entries = [
        {
            "entity_type": "RELEASE",
            "entity_id": 12,
            "fdr_number": "FDR-CANB-50192834",
            "action": "RELEASE_SANCTIONED_BY_APPROVER",
            "actor_role": "FINANCIAL_APPROVER",
            "actor_name": "Dr. M. S. Verma (Financial Adviser & Approver, AICTE)",
            "details": "Authorized refund sanction order for ₹35,00,000.00 with digital signature token DIGI-SIGN-AICTE-B92F81A4D0.",
            "timestamp": datetime.datetime.utcnow() - datetime.timedelta(days=43)
        },
        {
            "entity_type": "RELEASE",
            "entity_id": 11,
            "fdr_number": "FDR-SBIN-72910482",
            "action": "RELEASE_OFFICER_RECOMMENDED",
            "actor_role": "AICTE_OFFICER",
            "actor_name": "Shri R. K. Sharma (Deputy Director, AICTE)",
            "details": "Verified academic compliance, university NOC, and bank details. Forwarded to Financial Approver for release authorization.",
            "timestamp": datetime.datetime.utcnow() - datetime.timedelta(days=1)
        },
        {
            "entity_type": "RENEWAL",
            "entity_id": 9,
            "fdr_number": "FDR-ICIC-29103847",
            "action": "RENEWAL_SUBMITTED",
            "actor_role": "INSTITUTION",
            "actor_name": "Maharashtra Institute of Technology & Research",
            "details": "Renewal request submitted with replacement FDR #FDR-ICIC-99281045 for amount ₹35,00,000.00.",
            "timestamp": datetime.datetime.utcnow() - datetime.timedelta(days=2)
        },
        {
            "entity_type": "DISCREPANCY",
            "entity_id": 7,
            "fdr_number": "FDR-SBIN-30192847",
            "action": "DISCREPANCY_FLAGGED",
            "actor_role": "AICTE_OFFICER",
            "actor_name": "Simulated Bank API Gateway / SFMS",
            "details": "CRITICAL Amount Mismatch detected: Submitted ₹45,00,000.00 vs CBS Bank Ledger ₹40,00,000.00.",
            "timestamp": datetime.datetime.utcnow() - datetime.timedelta(days=3)
        },
        {
            "entity_type": "VERIFICATION",
            "entity_id": 1,
            "fdr_number": "FDR-SBIN-89410294",
            "action": "OFFICER_VERIFICATION_APPROVED",
            "actor_role": "AICTE_OFFICER",
            "actor_name": "Shri R. K. Sharma (Deputy Director, AICTE)",
            "details": "FDR confirmed against SBI Core Banking System with zero discrepancies. Status marked ACTIVE.",
            "timestamp": datetime.datetime.utcnow() - datetime.timedelta(days=15)
        },
        {
            "entity_type": "FDR",
            "entity_id": 6,
            "fdr_number": "FDR-UBIN-51928374",
            "action": "FDR_REGISTERED",
            "actor_role": "INSTITUTION",
            "actor_name": "Dr. Maheshwarappa G. K. (Principal)",
            "details": "New FDR registration submitted for ₹35,00,000.00. OCR automated scanning assist completed.",
            "timestamp": datetime.datetime.utcnow() - datetime.timedelta(days=10)
        }
    ]

    for log in audit_entries:
        entry = models.AuditLog(**log)
        db.add(entry)

    db.commit()


def seed_users_if_missing(db: Session):
    """Ensures the 3 official demo accounts exist with secure PBKDF2 hashed passwords."""
    demo_users = [
        {
            "email": "institution@demo.aicte.local",
            "password": "Institution@2026",
            "name": "Prof. Alok Kumar Singhal",
            "role": "INSTITUTION",
            "institution_id": 1,
            "designation": "Director General & Principal"
        },
        {
            "email": "officer@demo.aicte.local",
            "password": "Officer@2026",
            "name": "Shri R. K. Sharma",
            "role": "AICTE_OFFICER",
            "institution_id": None,
            "designation": "Deputy Director - Scrutiny & Verification Cell"
        },
        {
            "email": "approver@demo.aicte.local",
            "password": "Approver@2026",
            "name": "Dr. M. S. Verma",
            "role": "APPROVER",
            "institution_id": None,
            "designation": "Financial Adviser & Competent Authority"
        }
    ]

    for u in demo_users:
        existing = db.query(models.User).filter(models.User.email == u["email"]).first()
        if not existing:
            new_user = models.User(
                email=u["email"],
                password_hash=hash_password(u["password"]),
                name=u["name"],
                role=u["role"],
                institution_id=u["institution_id"],
                designation=u["designation"],
                is_active=True,
                created_at=datetime.datetime.utcnow()
            )
            db.add(new_user)
        else:
            # Ensure password hash is up to date
            existing.password_hash = hash_password(u["password"])
            existing.role = u["role"]
            existing.institution_id = u["institution_id"]
            existing.name = u["name"]
            existing.designation = u["designation"]

    db.commit()


def seed_database_if_empty(db: Session):
    count = db.query(models.Institution).count()
    if count == 0:
        seed_sample_data(db, force=False)
    # Always ensure demo users exist
    seed_users_if_missing(db)
