from fastapi import APIRouter, Depends, HTTPException, status, Body
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from database import get_db
import models
from auth_utils import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    institution_id: int | None = None
    designation: str | None = None

    class Config:
        from_attributes = True

class LoginResponse(BaseModel):
    token: str
    token_type: str = "bearer"
    user: UserResponse

@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user using email and password.
    Validates credentials against PBKDF2 password hashes stored in SQLite.
    Returns signed Bearer access token.
    """
    email_clean = payload.email.strip().lower()
    user = db.query(models.User).filter(models.User.email == email_clean).first()

    if not user or not verify_password(payload.password, user.password_hash):
        # Record failed attempt in audit log
        audit = models.AuditLog(
            entity_type="SYSTEM",
            entity_id=None,
            fdr_number=None,
            action="LOGIN_FAILED",
            actor_role="ANONYMOUS",
            actor_name=email_clean,
            details=f"Failed login attempt for {email_clean} (Invalid credentials)"
        )
        db.add(audit)
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please verify your credentials and try again."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is currently inactive. Contact AICTE administrator."
        )

    token = create_access_token(user)

    # Record successful login in audit log
    audit = models.AuditLog(
        entity_type="SYSTEM",
        entity_id=user.id,
        fdr_number=None,
        action="LOGIN_SUCCESS",
        actor_role=user.role,
        actor_name=user.name,
        details=f"User {user.email} ({user.role}) logged in successfully."
    )
    db.add(audit)
    db.commit()

    return {
        "token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    """Returns currently authenticated user profile based on Bearer token."""
    return current_user

@router.post("/logout")
def logout(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Logs user logout action in audit log."""
    audit = models.AuditLog(
        entity_type="SYSTEM",
        entity_id=current_user.id,
        fdr_number=None,
        action="LOGOUT",
        actor_role=current_user.role,
        actor_name=current_user.name,
        details=f"User {current_user.email} signed out."
    )
    db.add(audit)
    db.commit()
    return {"message": "Signed out successfully"}
