from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
import models, schemas

router = APIRouter(prefix="/api/institutions", tags=["Institutions"])

@router.get("", response_model=List[schemas.InstitutionResponse])
def get_institutions(db: Session = Depends(get_db)):
    return db.query(models.Institution).order_by(models.Institution.name.asc()).all()

@router.get("/{institution_id}", response_model=schemas.InstitutionResponse)
def get_institution(institution_id: int, db: Session = Depends(get_db)):
    inst = db.query(models.Institution).filter(models.Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    return inst
