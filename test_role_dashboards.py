import requests
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def test_role_dashboards():
    print("==================================================")
    print("AICTE SecureDeposit - Role Dashboards Verification")
    print("==================================================")

    # 1. Test Institution Analytics Endpoint
    print("\n[1] Testing GET /api/analytics/institution/1 ...")
    r = requests.get(f"{BASE_URL}/api/analytics/institution/1", headers={"X-User-Role": "INSTITUTION"})
    assert r.status_code == 200, f"Institution analytics failed: {r.status_code} {r.text}"
    inst_data = r.json()
    print("  -> Status 200 OK")
    print(f"  -> Institution: {inst_data['institution_name']}")
    print(f"  -> Summary: {inst_data['summary']}")
    print(f"  -> Recent Submissions Count: {len(inst_data['recent_submissions'])}")
    print(f"  -> Attention Documents Count: {len(inst_data['attention_documents'])}")
    print(f"  -> Upcoming Maturities Count: {len(inst_data['upcoming_maturities'])}")
    print(f"  -> My Releases Count: {len(inst_data['my_releases'])}")
    assert "my_total_fdrs" in inst_data["summary"], "Missing my_total_fdrs in summary"

    # 2. Test AICTE Officer Analytics Endpoint
    print("\n[2] Testing GET /api/analytics/officer ...")
    r = requests.get(f"{BASE_URL}/api/analytics/officer", headers={"X-User-Role": "AICTE_OFFICER"})
    assert r.status_code == 200, f"Officer analytics failed: {r.status_code} {r.text}"
    off_data = r.json()
    print("  -> Status 200 OK")
    print(f"  -> Summary: {off_data['summary']}")
    print(f"  -> Work Queue Count: {len(off_data['work_queue'])}")
    print(f"  -> Priority Cases Count: {len(off_data['priority_cases'])}")
    print(f"  -> Recent Activity Count: {len(off_data['recent_activity'])}")
    assert "pending_verification" in off_data["summary"], "Missing pending_verification in officer summary"
    assert "avg_wait_days" in off_data["summary"], "Missing avg_wait_days in officer summary"

    # 3. Test Approver Analytics Endpoint
    print("\n[3] Testing GET /api/analytics/approver ...")
    r = requests.get(f"{BASE_URL}/api/analytics/approver", headers={"X-User-Role": "APPROVER"})
    assert r.status_code == 200, f"Approver analytics failed: {r.status_code} {r.text}"
    app_data = r.json()
    print("  -> Status 200 OK")
    print(f"  -> Summary: {app_data['summary']}")
    print(f"  -> Approval Queue Count: {len(app_data['approval_queue'])}")
    print(f"  -> Recent Decisions Count: {len(app_data['recent_decisions'])}")
    print(f"  -> Pending Clarifications Count: {len(app_data['pending_clarifications'])}")
    assert "awaiting_decision_count" in app_data["summary"], "Missing awaiting_decision_count in approver summary"

    # 4. Test Backend Role Enforcement (Access Controls)
    print("\n[4] Testing Backend Access Control Enforcement...")
    
    # 4a. Institution cannot approve officer verification
    r_bad1 = requests.post(
        f"{BASE_URL}/api/verification/officer-approve/1",
        headers={"X-User-Role": "INSTITUTION"},
        json={"officer_name": "Fake Officer", "verification_notes": "Attempt"}
    )
    print(f"  -> Institution calling officer-approve: {r_bad1.status_code} (Expected 403)")
    assert r_bad1.status_code == 403, f"Expected 403 but got {r_bad1.status_code}"

    # 4b. Approver cannot request institution correction
    r_bad2 = requests.post(
        f"{BASE_URL}/api/verification/request-correction/1",
        headers={"X-User-Role": "APPROVER"},
        json={"officer_name": "Approver", "correction_note": "Attempt"}
    )
    print(f"  -> Approver calling request-correction: {r_bad2.status_code} (Expected 403)")
    assert r_bad2.status_code == 403, f"Expected 403 but got {r_bad2.status_code}"

    # 4c. Institution cannot approve release
    r_bad3 = requests.post(
        f"{BASE_URL}/api/releases/1/approver-action",
        headers={"X-User-Role": "INSTITUTION"},
        json={"action": "APPROVE", "comments": "Self approve attempt", "approver_name": "College"}
    )
    print(f"  -> Institution calling approver-action: {r_bad3.status_code} (Expected 403)")
    assert r_bad3.status_code == 403, f"Expected 403 but got {r_bad3.status_code}"

    # 4d. Officer cannot approve release directly
    r_bad4 = requests.post(
        f"{BASE_URL}/api/releases/1/approver-action",
        headers={"X-User-Role": "AICTE_OFFICER"},
        json={"action": "APPROVE", "comments": "Officer approve attempt", "approver_name": "Officer"}
    )
    print(f"  -> Officer calling approver-action: {r_bad4.status_code} (Expected 403)")
    assert r_bad4.status_code == 403, f"Expected 403 but got {r_bad4.status_code}"

    # 4e. Approver cannot resubmit institution correction
    r_bad5 = requests.post(
        f"{BASE_URL}/api/fdrs/1/resubmit-correction",
        headers={"X-User-Role": "APPROVER"},
        json={"institution_remarks": "Not allowed"}
    )
    print(f"  -> Approver calling resubmit-correction: {r_bad5.status_code} (Expected 403)")
    assert r_bad5.status_code == 403, f"Expected 403 but got {r_bad5.status_code}"

    # 5. Test Mandatory Decision Comments for Approver
    print("\n[5] Testing Approver Mandatory Comments Validation...")
    # Find a release request with RECOMMENDED_FOR_APPROVAL status
    releases_resp = requests.get(f"{BASE_URL}/api/releases")
    releases = releases_resp.json()
    rec_release = next((r for r in releases if r["status"] == "RECOMMENDED_FOR_APPROVAL"), None)
    if rec_release:
        r_empty_comment = requests.post(
            f"{BASE_URL}/api/releases/{rec_release['id']}/approver-action",
            headers={"X-User-Role": "APPROVER"},
            json={"action": "APPROVE", "comments": "   ", "approver_name": "Approver"}
        )
        print(f"  -> Approver action with blank comments: {r_empty_comment.status_code} (Expected 400)")
        assert r_empty_comment.status_code == 400, f"Expected 400 for empty comment but got {r_empty_comment.status_code}"

    # 6. Test Officer Request Correction -> Institution Resubmit Flow
    print("\n[6] Testing Officer Correction Request -> Institution Resubmit Flow...")
    # Officer requests correction on FDR #7
    r_corr = requests.post(
        f"{BASE_URL}/api/verification/request-correction/7",
        headers={"X-User-Role": "AICTE_OFFICER"},
        json={"officer_name": "Officer Sharma", "correction_note": "Please submit higher resolution scan of joint lien endorsement."}
    )
    print(f"  -> Officer requested correction on FDR #7: {r_corr.status_code} {r_corr.json()}")
    assert r_corr.status_code == 200
    assert r_corr.json()["status"] == "CORRECTION_REQUESTED"

    # Institution resubmits correction on FDR #7
    r_resub = requests.post(
        f"{BASE_URL}/api/fdrs/7/resubmit-correction",
        headers={"X-User-Role": "INSTITUTION"},
        json={"document_filename": "fdr_7_resubmitted_scan.pdf", "institution_remarks": "Clarified scan with clear joint lien attached."}
    )
    print(f"  -> Institution resubmitted FDR #7: {r_resub.status_code} {r_resub.json()}")
    assert r_resub.status_code == 200
    assert r_resub.json()["status"] == "PENDING_VERIFICATION"

    print("\n==================================================")
    print("ALL TESTS PASSED SUCCESSFULLY! ROLES & WORKFLOWS VALIDATED.")
    print("==================================================")

if __name__ == "__main__":
    test_role_dashboards()
