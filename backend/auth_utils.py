import os
import hmac
import hashlib
import secrets
import json
import base64
import datetime
from typing import Optional
from fastapi import Header, HTTPException, status, Depends
from sqlalchemy.orm import Session
from database import get_db
import models

# Secure server secret (fallback to a persistent dev secret)
SECRET_KEY = os.environ.get("AICTE_AUTH_SECRET", "aicte_securedeposit_secret_key_sih2026_gov_tech")
TOKEN_EXPIRY_HOURS = 24

def hash_password(password: str) -> str:
    """Hashes a password using PBKDF2-HMAC-SHA256 with 100,000 iterations and 16-byte random salt."""
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return f"{salt}${key.hex()}"

def verify_password(plain_password: str, stored_hash: str) -> bool:
    """Verifies a plain password against stored salt$hash."""
    try:
        parts = stored_hash.split('$')
        if len(parts) != 2:
            return False
        salt, expected_hash = parts
        key = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        )
        return hmac.compare_digest(key.hex(), expected_hash)
    except Exception:
        return False

def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def _b64decode(s: str) -> bytes:
    padding = 4 - (len(s) % 4)
    if padding and padding != 4:
        s += '=' * padding
    return base64.urlsafe_b64decode(s.encode('utf-8'))

def create_access_token(user: models.User) -> str:
    """Creates a cryptographically signed HMAC-SHA256 access token containing user claims."""
    now = datetime.datetime.utcnow()
    exp = now + datetime.timedelta(hours=TOKEN_EXPIRY_HOURS)
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "institution_id": user.institution_id,
        "designation": user.designation,
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp())
    }
    payload_json = json.dumps(payload, separators=(',', ':')).encode('utf-8')
    encoded_payload = _b64encode(payload_json)
    
    # Compute signature
    sig = hmac.new(SECRET_KEY.encode('utf-8'), encoded_payload.encode('utf-8'), hashlib.sha256).digest()
    encoded_sig = _b64encode(sig)

    return f"{encoded_payload}.{encoded_sig}"

def decode_access_token(token: str) -> Optional[dict]:
    """Validates token signature and expiration; returns decoded payload dict or None."""
    try:
        parts = token.split('.')
        if len(parts) != 2:
            return None
        encoded_payload, encoded_sig = parts
        
        # Verify HMAC signature
        expected_sig = hmac.new(SECRET_KEY.encode('utf-8'), encoded_payload.encode('utf-8'), hashlib.sha256).digest()
        actual_sig = _b64decode(encoded_sig)
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
        
        # Decode and check expiry
        payload_bytes = _b64decode(encoded_payload)
        payload = json.loads(payload_bytes.decode('utf-8'))
        
        now_ts = int(datetime.datetime.utcnow().timestamp())
        if payload.get("exp", 0) < now_ts:
            return None
            
        return payload
    except Exception:
        return None

def get_current_user(
    authorization: Optional[str] = Header(None),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role"),
    db: Session = Depends(get_db)
):
    """
    FastAPI dependency that extracts and validates user identity.
    Extracts Bearer token from Authorization header.
    If valid token is present, returns authenticated User model.
    Falls back to header-based dev user if authorization is absent (for existing demo tests).
    """
    token = None
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
        elif len(parts) == 1:
            token = parts[0]

    if token:
        payload = decode_access_token(token)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid, expired, or tampered authentication token. Please log in again."
            )
        user = db.query(models.User).filter(models.User.id == int(payload["sub"]), models.User.is_active == True).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User account no longer exists or has been deactivated."
            )
        return user

    # Fallback to dev header if provided (e.g. legacy test scripts)
    if x_user_role:
        dev_user = db.query(models.User).filter(models.User.role == x_user_role).first()
        if dev_user:
            return dev_user
        # Create a mock user object if not in db yet
        class MockUser:
            id = 1
            email = f"{x_user_role.lower()}@demo.aicte.local"
            name = f"Demo {x_user_role.title()}"
            role = x_user_role
            institution_id = 1 if x_user_role == "INSTITUTION" else None
            designation = "Official"
        return MockUser()

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Please provide a valid Bearer token."
    )

def require_role(allowed_roles: list[str]):
    """Returns a dependency that restricts access to users with one of the allowed roles."""
    def role_checker(current_user = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: User role '{current_user.role}' is not authorized. Required: {', '.join(allowed_roles)}."
            )
        return current_user
    return role_checker
