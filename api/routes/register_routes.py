from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import func
from datetime import datetime

from database import get_db
from models.models import Patient
from models.schemas import PatientRegister
from auth_utils import hash_password

router = APIRouter(
    prefix="/register",
    tags=["Public Registration"]  
)


@router.post("/", status_code=status.HTTP_201_CREATED)
def register_user(data: PatientRegister, db: Session = Depends(get_db)):
    try:
        # 🔍 Check email uniqueness
        existing_user = db.query(Patient).filter(
            func.lower(Patient.email) == data.email.lower(),
            Patient.deleted_at.is_(None)
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already exists"
            )

        new_user = Patient(
            name=data.name,
            email=data.email,
            phone=data.phone,
            hashed_password=hash_password(data.password),
            gender=data.gender,
            date_of_birth=data.date_of_birth,
            address=data.address,
            city=data.city,
            pincode=data.pincode,
            emergency_contact=data.emergency_contact,
            role="user",               
            flag="Show",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {
            "status": "success",
            "message": "Registration successful. Please login.",
            "data": {
                "user_id": new_user.patient_id,
                "email": new_user.email,
                "role": new_user.role
            }
        }

    except HTTPException:
        raise
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))