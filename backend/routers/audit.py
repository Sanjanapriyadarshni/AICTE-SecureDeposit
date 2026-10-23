import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from database import get_db
import models, schemas

router = APIRouter(prefix="/api/audit", tags=["Audit History"])

@router.get("", response_model=List[schemas.AuditLogResponse])
def get_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    entity_type: Optional[str] = Query(None),
    actor_role: Optional[str] = Query(None),
    fdr_number: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(models.AuditLog)

    if entity_type and entity_type != "ALL":
        query = query.filter(models.AuditLog.entity_type == entity_type)
    if actor_role and actor_role != "ALL":
        query = query.filter(models.AuditLog.actor_role == actor_role)
    if fdr_number:
        query = query.filter(models.AuditLog.fdr_number == fdr_number)
    if search:
        search_pat = f"%{search}%"
        query = query.filter(
            (models.AuditLog.action.ilike(search_pat)) |
            (models.AuditLog.actor_name.ilike(search_pat)) |
            (models.AuditLog.details.ilike(search_pat)) |
            (models.AuditLog.fdr_number.ilike(search_pat))
        )

    return query.order_by(models.AuditLog.timestamp.desc()).limit(limit).all()
