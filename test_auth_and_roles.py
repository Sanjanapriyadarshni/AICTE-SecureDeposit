import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def make_request(path, method="GET", data=None, token=None, role_header=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if role_header:
        headers["X-User-Role"] = role_header

    req_data = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except:
            return e.code, {"error": err_body}

def run_tests():
    print("=== AICTE SecureDeposit: Authentication & Role Security Tests ===")
    
    # 1. Test Login Failure
    status, res = make_request("/auth/login", method="POST", data={
        "email": "officer@demo.aicte.local",
        "password": "WrongPassword@123"
    })
    assert status == 401, f"Expected 401 for bad password, got {status}"
    print(" [PASS] Invalid password rejected with HTTP 401.")

    # 2. Test Login for all 3 demo accounts
    demo_accounts = [
        ("institution@demo.aicte.local", "Institution@2026", "INSTITUTION"),
        ("officer@demo.aicte.local", "Officer@2026", "AICTE_OFFICER"),
        ("approver@demo.aicte.local", "Approver@2026", "APPROVER")
    ]
    tokens = {}
    for email, pwd, expected_role in demo_accounts:
        status, res = make_request("/auth/login", method="POST", data={"email": email, "password": pwd})
        assert status == 200, f"Expected 200 for {email}, got {status}: {res}"
        assert "token" in res, f"No token returned for {email}"
        assert res["user"]["role"] == expected_role, f"Role mismatch for {email}"
        tokens[expected_role] = res["token"]
        print(f" [PASS] Login success for {expected_role} ({email}). Token issued.")

    # 3. Test /api/auth/me token decoding
    for role, tok in tokens.items():
        status, user_info = make_request("/auth/me", token=tok)
        assert status == 200, f"Failed /auth/me for {role}"
        assert user_info["role"] == role
        print(f" [PASS] /auth/me successfully decoded Bearer token for {role} ({user_info['name']}).")

    # 4. Test Role-Based Dashboard Authorization
    # A) Institution attempting officer queue -> 403
    status, res = make_request("/analytics/officer", token=tokens["INSTITUTION"])
    assert status == 403, f"Expected 403 for institution on officer queue, got {status}"
    print(" [PASS] Institution forbidden (HTTP 403) from Officer Verification Queue.")

    # B) Institution attempting approver queue -> 403
    status, res = make_request("/analytics/approver", token=tokens["INSTITUTION"])
    assert status == 403, f"Expected 403 for institution on approver queue, got {status}"
    print(" [PASS] Institution forbidden (HTTP 403) from Approver Sanction Queue.")

    # C) Officer attempting approver queue -> 403
    status, res = make_request("/analytics/approver", token=tokens["AICTE_OFFICER"])
    assert status == 403, f"Expected 403 for officer on approver queue, got {status}"
    print(" [PASS] Officer forbidden (HTTP 403) from Approver Sanction Queue.")

    # D) Officer accessing officer queue -> 200
    status, res = make_request("/analytics/officer", token=tokens["AICTE_OFFICER"])
    assert status == 200, f"Expected 200 for officer on officer queue, got {status}"
    assert "work_queue" in res, "Missing work_queue in officer analytics"
    print(f" [PASS] Officer dashboard accessible: {len(res['work_queue'])} items in queue.")

    # E) Approver accessing approver queue -> 200
    status, res = make_request("/analytics/approver", token=tokens["APPROVER"])
    assert status == 200, f"Expected 200 for approver on approver queue, got {status}"
    assert "approval_queue" in res, "Missing approval_queue in approver analytics"
    print(f" [PASS] Approver dashboard accessible: {len(res['approval_queue'])} items in queue.")

    # 5. Test Institution Record Scoping on /api/fdrs
    status, inst_fdrs = make_request("/fdrs", token=tokens["INSTITUTION"])
    assert status == 200, f"Failed to fetch institution fdrs: {status}"
    # Every single FDR returned must belong to institution_id 1
    for f in inst_fdrs:
        assert f["institution_id"] == 1, f"Found leaked FDR from other institution: {f}"
    print(f" [PASS] Institution data strictly scoped: received {len(inst_fdrs)} FDRs, all institution_id=1.")

    # Officer should see all FDRs across institutions
    status, all_fdrs = make_request("/fdrs", token=tokens["AICTE_OFFICER"])
    assert status == 200
    inst_ids = set(f["institution_id"] for f in all_fdrs)
    assert len(inst_ids) > 1, "Officer should see multi-institutional FDRs"
    print(f" [PASS] Officer sees multi-institutional registry ({len(all_fdrs)} FDRs across institutions {inst_ids}).")

    # 6. Test Institution foreign dashboard restriction
    status, res = make_request("/analytics/institution/2", token=tokens["INSTITUTION"])
    assert status == 403, f"Institution should not be able to query another institution's dashboard (id=2), got {status}"
    print(" [PASS] Institution blocked (HTTP 403) from accessing another college's dashboard.")

    print("\n=== ALL SECURITY, AUTHENTICATION & ROLE RESTRICTION TESTS PASSED! ===")

if __name__ == "__main__":
    run_tests()
