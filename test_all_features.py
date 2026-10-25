import urllib.request
import urllib.parse
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:8000/api"

def request_json(path, method="GET", data=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        raise Exception(f"HTTP {e.code} Error on {method} {path}: {err_msg}")

def run_tests():
    print("=== AICTE SecureDeposit - End-to-End Test Suite ===")

    # 1. Reset Demo Data
    print("\n[Test 1] Resetting Demo Database to Clean Baseline...")
    reset_res = request_json("/reset-demo-data", method="POST")
    assert reset_res.get("success") == True, "Reset failed"
    print(" PASS: Demo data reset successfully.")

    # 2. Test Dashboard Summary & Analytics
    print("\n[Test 2] Fetching Dashboard Summary Metrics...")
    summary = request_json("/analytics/summary")
    assert summary["total_fdrs"] >= 10, f"Expected at least 10 FDRs, got {summary['total_fdrs']}"
    assert summary["total_amount_crores"] > 0, "Total amount should be positive"
    assert len(summary["bank_distribution"]) >= 5, "Bank distribution missing"
    assert len(summary["status_distribution"]) >= 5, "Status distribution missing"
    print(f" PASS: Dashboard shows {summary['total_fdrs']} FDRs worth ₹{summary['total_amount_crores']} Cr across {len(summary['bank_distribution'])} banks.")

    # 3. Test Institutions
    print("\n[Test 3] Fetching Technical Institutions...")
    institutions = request_json("/institutions")
    assert len(institutions) >= 5, "Expected institutions to be loaded"
    inst1 = institutions[0]
    print(f" PASS: Loaded {len(institutions)} institutions. Sample: {inst1['name']} ({inst1['aicte_id']})")

    # 4. Test FDR Registration (Normal)
    print("\n[Test 4] Registering New Valid FDR...")
    new_fdr_payload = {
        "institution_id": inst1["id"],
        "fdr_number": "FDR-SBIN-TEST-2026-99999",
        "bank_name": "State Bank of India",
        "branch_name": "Parliament Street, New Delhi",
        "ifsc_code": "SBIN0000691",
        "amount": 4000000.0,
        "amount_in_words": "Rupees Forty Lakh Only",
        "interest_rate": 7.35,
        "issue_date": "2026-10-23",
        "maturity_date": "2031-10-23",
        "tenure_months": 60,
        "joint_holder": "Member Secretary, AICTE New Delhi",
        "purpose": "Mandatory Autonomous College Security Deposit",
        "lien_marked": True,
        "document_url": "/uploads/test_receipt.pdf",
        "document_filename": "test_receipt.pdf"
    }
    created_fdr = request_json("/fdrs", method="POST", data=new_fdr_payload)
    assert created_fdr["fdr_number"] == "FDR-SBIN-TEST-2026-99999"
    assert created_fdr["status"] == "PENDING_VERIFICATION"
    print(f" PASS: FDR #{created_fdr['fdr_number']} created successfully with ID {created_fdr['id']}.")

    # 5. Test Duplicate FDR Detection
    print("\n[Test 5] Submitting Duplicate FDR to Test Automated Discrepancy Detection...")
    dup_payload = {
        "institution_id": institutions[1]["id"],
        "fdr_number": "FDR-SBIN-TEST-2026-99999", # Same number!
        "bank_name": "State Bank of India",
        "branch_name": "Another Branch",
        "ifsc_code": "SBIN0000691",
        "amount": 4000000.0,
        "amount_in_words": "Rupees Forty Lakh Only",
        "interest_rate": 7.35,
        "issue_date": "2026-10-23",
        "maturity_date": "2031-10-23",
        "tenure_months": 60,
        "joint_holder": "Member Secretary, AICTE New Delhi",
        "purpose": "Duplicate Test Deposit",
        "lien_marked": True,
        "document_url": "/uploads/test_dup.pdf",
        "document_filename": "test_dup.pdf"
    }
    dup_fdr = request_json("/fdrs", method="POST", data=dup_payload)
    assert dup_fdr["status"] == "DISCREPANCY_FLAGGED", f"Expected DISCREPANCY_FLAGGED, got {dup_fdr['status']}"
    assert dup_fdr["discrepancy_count"] == 1, "Expected discrepancy_count = 1"
    print(f" PASS: Duplicate FDR flagged immediately with status {dup_fdr['status']}.")

    # 6. Test Side-by-Side Verification & Comparison
    print("\n[Test 6] Testing Side-by-Side Verification Comparison for FDR #7...")
    comp = request_json("/verification/compare/7")
    assert "institution_data" in comp
    assert "bank_confirmed_data" in comp
    assert "discrepancies" in comp
    assert len(comp["discrepancies"]) >= 1, "Expected discrepancy for FDR #7"
    disc = comp["discrepancies"][0]
    print(f" PASS: Comparison loaded. Discrepancy detected: {disc['type']} (Field: {disc['field']}, Submitted: {disc['submitted_value']}, Bank: {disc['bank_confirmed_value']})")

    # 7. Test Simulated Bank CBS Verification Call
    print("\n[Test 7] Triggering Simulated Bank CBS Verification on Pending FDR #6...")
    trigger_res = request_json(
        f"/verification/trigger-bank-verification/6?simulate_scenario=EXACT_MATCH&actor_name=AICTE%20Verification%20Officer",
        method="POST"
    )
    assert trigger_res["success"] == True
    assert trigger_res["status"] == "ACTIVE", f"Expected ACTIVE, got {trigger_res['status']}"
    print(f" PASS: CBS verification confirmed with Reference: {trigger_res['cbs_reference_no']}. Status: {trigger_res['status']}.")

    # 8. Test Discrepancy Resolution
    print("\n[Test 8] Resolving Discrepancy for FDR #7...")
    resolve_res = request_json(
        f"/verification/resolve-discrepancy/{disc['id']}",
        method="POST",
        data={"resolution_notes": "Institution submitted rectified supplementary FDR receipt. Bank CBS shortfall resolved.", "resolved_by": "Deputy Director Sharma"}
    )
    assert resolve_res["success"] == True
    print(f" PASS: Discrepancy #{disc['id']} marked as RESOLVED.")

    # 9. Test Officer Approval
    print("\n[Test 9] Officer Final Approval for FDR #7...")
    approve_res = request_json(
        "/verification/officer-approve/7",
        method="POST",
        data={"officer_name": "Shri R. K. Sharma", "verification_notes": "All documents verified and accepted."}
    )
    assert approve_res["success"] == True
    print(f" PASS: Officer approved FDR #7.")

    # 10. Test Expiring FDRs & Renewals
    print("\n[Test 10] Fetching Expiring FDRs & Generating Statutory Notices...")
    expiring = request_json("/renewals/expiring?days=90")
    assert len(expiring) > 0, "Expected at least 1 expiring FDR"
    print(f" PASS: Found {len(expiring)} expiring/matured FDR records.")

    gen_reminders = request_json("/renewals/generate-reminders", method="POST")
    assert gen_reminders["success"] == True
    count = gen_reminders.get("new_reminders_dispatched", gen_reminders.get("generated_count", 0))
    print(f" PASS: Automated notice dispatcher generated {count} statutory reminder notices.")

    # 11. Test Renewal Application & Officer Review
    print("\n[Test 11] Submitting Renewal Application...")
    target_expiring = expiring[0]
    renewal_payload = {
        "fdr_id": target_expiring["id"],
        "new_fdr_number": f"FDR-RENEWED-{target_expiring['id']}-2026",
        "renewed_amount": target_expiring["amount"],
        "renewed_issue_date": "2026-10-23",
        "renewed_maturity_date": "2031-10-23",
        "renewal_document_url": "/uploads/renewed_fdr.pdf"
    }
    submitted_renewal = request_json("/renewals/submit", method="POST", data=renewal_payload)
    assert submitted_renewal["status"] == "PENDING_OFFICER_REVIEW"
    print(f" PASS: Renewal application {submitted_renewal['request_number']} submitted.")

    review_renewal = request_json(
        f"/renewals/review/{submitted_renewal['id']}?officer_name=Shri%20R.%20K.%20Sharma",
        method="POST",
        data={"action": "APPROVE", "officer_remarks": "Renewal receipt confirmed with bank lien."}
    )
    assert review_renewal["status"] == "APPROVED"
    print(f" PASS: Officer approved renewal {submitted_renewal['request_number']}.")

    # 12. Test Release & Refund Multi-Tier Approval Workflow
    print("\n[Test 12] Testing Two-Tier Security Deposit Release Workflow...")
    # Step 1: Submit Release Application
    release_payload = {
        "fdr_id": target_expiring["id"],
        "reason_for_release": "Completion of 10-Year Mandatory Retention Period",
        "justification_details": "Completed all academic audits and statutory lock-in periods without non-compliance.",
        "refund_beneficiary_name": "Engineering College General Corpus Account",
        "refund_bank_account": "10029384710293",
        "refund_ifsc": "SBIN0000691",
        "noc_document_url": "/uploads/noc_final.pdf"
    }
    submitted_rel = request_json("/releases", method="POST", data=release_payload)
    assert submitted_rel["status"] == "SUBMITTED"
    print(f" PASS: Stage 1 - Institution submitted release request {submitted_rel['request_number']}.")

    # Step 2: Officer Scrutiny & Recommendation
    officer_rel = request_json(
        f"/releases/{submitted_rel['id']}/officer-review",
        method="POST",
        data={"action": "RECOMMEND", "comments": "Affiliating University NOC verified. Recommending for financial refund.", "officer_name": "Shri R. K. Sharma"}
    )
    assert officer_rel["status"] == "RECOMMENDED_FOR_APPROVAL"
    print(f" PASS: Stage 2 - AICTE Officer scrutinized and recommended request {submitted_rel['request_number']}.")

    # Step 3: Competent Authority Digital Sanction
    approver_rel = request_json(
        f"/releases/{submitted_rel['id']}/approver-action",
        method="POST",
        data={"action": "APPROVE", "comments": "Final refund sanctioned. Member Secretary digital signature affixed.", "approver_name": "Dr. M. S. Verma"}
    )
    assert approver_rel["status"] == "APPROVED_BY_APPROVER"
    token = approver_rel.get("signature_token") or approver_rel.get("approver_signature_token")
    assert token.startswith("DIGI-SIGN-AICTE-")
    print(f" PASS: Stage 3 - Competent Authority sanctioned release! Digital Signature Token: {token}")

    # 13. Test Immutable Audit Trail
    print("\n[Test 13] Verifying Complete Immutable Audit History...")
    audit_logs = request_json("/audit?limit=25")
    assert len(audit_logs) >= 5, "Audit logs should record recent actions"
    actions = [a["action"] for a in audit_logs]
    print(f" PASS: Recorded {len(audit_logs)} audit actions. Recent actions: {actions[:5]}")

    print("\n=======================================================")
    print(" ALL 13 TEST SUITES PASSED FLAWLESSLY WITH 100% SUCCESS!")
    print("=======================================================")

if __name__ == "__main__":
    run_tests()
