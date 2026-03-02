from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from database import get_db
from models.models import Doctor, Branch
from models.schemas import DoctorCreate, DoctorUpdate, DoctorResponse
from datetime import datetime
from typing import List

router = APIRouter(prefix="/doctor", tags=["Doctor"])



#  GET ALL ACTIVE DOCTORS

@router.get("/", response_model=List[DoctorResponse])
def get_doctors(db: Session = Depends(get_db)):
    try:
        doctors = (
            db.query(Doctor)
            .join(Branch, Doctor.branch_id == Branch.branch_id)
            .filter(
                Doctor.flag == "Show",
                Doctor.deleted_at.is_(None)
            )
            .order_by(Doctor.doctor_id.desc())
            .all()
        )

        result = []
        for doc in doctors:
            result.append(
                DoctorResponse(
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
            )

        return result

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))



#  CREATE DOCTOR

@router.post("/", response_model=DoctorResponse, status_code=201)
def create_doctor(data: DoctorCreate, db: Session = Depends(get_db)):
    try:
        doctor = Doctor(**data.dict())
        doctor.flag = "Show"

        db.add(doctor)
        db.commit()
        db.refresh(doctor)

        return DoctorResponse(
            doctor_id=doctor.doctor_id,
            branch_id=doctor.branch_id,
            branch_name=doctor.branch.branch_name if doctor.branch else None,
            doctor_name=doctor.doctor_name,
            specialization=doctor.specialization,
            qualification=doctor.qualification,
            experience_years=doctor.experience_years,
            consultation_fee=doctor.consultation_fee,
            joining_date=doctor.joining_date,
            status=doctor.status,
        )

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))



#  UPDATE DOCTOR

@router.put("/{doctor_id}", response_model=DoctorResponse)
def update_doctor(doctor_id: int, data: DoctorUpdate, db: Session = Depends(get_db)):
    try:
        doctor = db.query(Doctor).filter(
            Doctor.doctor_id == doctor_id,
            Doctor.flag == "Show"
        ).first()

        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")

        for key, value in data.dict(exclude_unset=True).items():
            setattr(doctor, key, value)

        doctor.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(doctor)

        return DoctorResponse(
            doctor_id=doctor.doctor_id,
            branch_id=doctor.branch_id,
            branch_name=doctor.branch.branch_name if doctor.branch else None,
            doctor_name=doctor.doctor_name,
            specialization=doctor.specialization,
            qualification=doctor.qualification,
            experience_years=doctor.experience_years,
            consultation_fee=doctor.consultation_fee,
            joining_date=doctor.joining_date,
            status=doctor.status,
        )

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))



#  SOFT DELETE DOCTOR

@router.post("/{doctor_id}/soft-delete")
def soft_delete_doctor(doctor_id: int, db: Session = Depends(get_db)):
    try:
        doctor = db.query(Doctor).filter(
            Doctor.doctor_id == doctor_id,
            Doctor.flag == "Show"
        ).first()

        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")

        doctor.flag = "Delete"
        doctor.deleted_at = datetime.utcnow()
        doctor.updated_at = datetime.utcnow()

        db.commit()

        return {
            "status": "success",
            "message": "Doctor soft deleted successfully"
        }

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))