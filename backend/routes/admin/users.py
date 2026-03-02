from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import func
from datetime import datetime

from database import get_db
from models.models import Patient
from models.schemas import AdminPatientCreate, AdminPatientUpdate
from auth_utils import hash_password

router = APIRouter(prefix="/admin/users", tags=["Admin Users"])

#  GET USERS (SERVER-SIDE PAGINATION)

@router.get("/")
def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    try:
        offset = (page - 1) * limit

        base_query = db.query(Patient).filter(
            Patient.flag == "Show",
            Patient.deleted_at.is_(None)
        )

        total = base_query.count()

        users = (
            base_query
            .order_by(Patient.patient_id.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

        return {
            "total": total,
            "page": page,
            "limit": limit,
            "data": users
        }

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail="Database error")


#  CREATE USER (ADMIN)

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_user(
    data: AdminPatientCreate,
    db: Session = Depends(get_db)
):
    try:
        existing_user = db.query(Patient).filter(
            func.lower(Patient.email) == data.email.lower(),
            Patient.deleted_at.is_(None)
        ).first()

        if existing_user:
            raise HTTPException(status_code=400, detail="Email already exists")

        user = Patient(
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

        db.add(user)
        db.commit()
        db.refresh(user)

        return {
            "message": "User created successfully",
            "user_id": user.patient_id
        }

    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error while creating user")



# ✅ UPDATE USER (ADMIN)

@router.put("/{user_id}")
def update_user(
    user_id: int,
    data: AdminPatientUpdate,
    db: Session = Depends(get_db)
):
    try:
        user = db.query(Patient).filter(
            Patient.patient_id == user_id,
            Patient.flag == "Show",
            Patient.deleted_at.is_(None)
        ).first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if data.email:
            email_exists = db.query(Patient).filter(
                func.lower(Patient.email) == data.email.lower(),
                Patient.patient_id != user_id,
                Patient.deleted_at.is_(None)
            ).first()

            if email_exists:
                raise HTTPException(status_code=400, detail="Email already exists")

        update_data = data.model_dump(exclude_unset=True)

        if "password" in update_data:
            user.hashed_password = hash_password(update_data.pop("password"))

        for key, value in update_data.items():
            setattr(user, key, value)

        user.updated_at = datetime.utcnow()
        db.commit()

        return {"message": "User updated successfully"}

    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error while updating user")



#  SOFT DELETE USER (ADMIN)

@router.post("/{user_id}/soft-delete")
def soft_delete_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    try:
        user = db.query(Patient).filter(
            Patient.patient_id == user_id,
            Patient.flag == "Show",
            Patient.deleted_at.is_(None)
        ).first()

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        user.flag = "Delete"
        user.deleted_at = datetime.utcnow()
        user.updated_at = datetime.utcnow()

        db.commit()

        return {"message": "User deleted successfully"}

    except HTTPException:
        raise
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error while deleting user")