from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime
from typing import List

from database import get_db
from models.models import Doctor, Branch
from models.schemas import DoctorCreate, DoctorUpdate, DoctorResponse

router = APIRouter(prefix="/doctor", tags=["Doctor"])


def _build_response(doc) -> DoctorResponse:
    return DoctorResponse(
        doctor_id=doc.doctor_id,
        branch_id=doc.branch_id,
        branch_name=doc.branch.branch_name if doc.branch else None,
        doctor_name=doc.doctor_name,
        specialization=doc.specialization,
        qualification=doc.qualification,
        experience_years=doc.experience_years,
        consultation_fee=doc.consultation_fee,
        joining_date=doc.joining_date,
        status=doc.status,
    )


# ── GET ALL ──────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[DoctorResponse])
def get_doctors(
    page:  int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db:    Session = Depends(get_db)
):
    try:
        offset  = (page - 1) * limit
        base    = (
            db.query(Doctor)
            .outerjoin(Branch, Doctor.branch_id == Branch.branch_id)
            .filter(Doctor.flag == "Show", Doctor.deleted_at.is_(None))
        )
        doctors = base.order_by(Doctor.doctor_id.desc()).offset(offset).limit(limit).all()
        return [_build_response(d) for d in doctors]
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── CREATE ───────────────────────────────────────────────────────────────────

@router.post("/", response_model=DoctorResponse, status_code=201)
def create_doctor(data: DoctorCreate, db: Session = Depends(get_db)):
    try:
        doctor      = Doctor(**data.model_dump())
        doctor.flag = "Show"
        db.add(doctor)
        db.commit()
        db.refresh(doctor)
        return _build_response(doctor)
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# ── UPDATE ───────────────────────────────────────────────────────────────────

@router.put("/{doctor_id}", response_model=DoctorResponse)
def update_doctor(doctor_id: int, data: DoctorUpdate, db: Session = Depends(get_db)):
    try:
        doctor = db.query(Doctor).filter(
            Doctor.doctor_id == doctor_id,
            Doctor.flag == "Show",
            Doctor.deleted_at.is_(None)
        ).first()

        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")

        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(doctor, key, value)

        doctor.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(doctor)
        return _build_response(doctor)
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# ── SOFT DELETE ──────────────────────────────────────────────────────────────

@router.post("/{doctor_id}/soft-delete")
def soft_delete_doctor(doctor_id: int, db: Session = Depends(get_db)):
    try:
        doctor = db.query(Doctor).filter(
            Doctor.doctor_id == doctor_id,
            Doctor.flag == "Show",
            Doctor.deleted_at.is_(None)
        ).first()

        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")

        doctor.flag       = "Delete"
        doctor.deleted_at = datetime.utcnow()
        doctor.updated_at = datetime.utcnow()
        db.commit()
        return {"status": "success", "message": "Doctor deleted successfully"}
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))