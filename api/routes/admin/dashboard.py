from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from database import get_db
from models.models import Branch, Doctor, Patient, OPDVisit
from role_checker import admin_required

router = APIRouter(prefix="/admin/dashboard", tags=["Admin Dashboard"])


@router.get("/", status_code=status.HTTP_200_OK)
def admin_dashboard(
    db:    Session = Depends(get_db),
    admin=Depends(admin_required)
):
    try:
        total_branches = db.query(Branch).filter(
            Branch.flag == "Show",
            Branch.deleted_at.is_(None)
        ).count()

        total_doctors = db.query(Doctor).filter(
            Doctor.flag == "Show",
            Doctor.deleted_at.is_(None)
        ).count()

        total_users = db.query(Patient).filter(
            Patient.flag == "Show",
            Patient.deleted_at.is_(None)
        ).count()

        total_visits = db.query(OPDVisit).filter(
            OPDVisit.flag == "Show",
            OPDVisit.deleted_at.is_(None)
        ).count()

        return {
            "branches": total_branches,
            "doctors":  total_doctors,
            "users":    total_users,
            "visits":   total_visits
        }

    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching dashboard data: {str(e)}"
        )