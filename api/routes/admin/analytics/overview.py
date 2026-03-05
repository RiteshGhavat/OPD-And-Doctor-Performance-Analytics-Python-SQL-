from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError

from database import get_db
from models.models import OPDVisit, OPDBilling, Doctor, Patient, Branch

router = APIRouter(prefix="/admin/analytics", tags=["Analytics - Overview"])


@router.get("/overview")
def get_overview(db: Session = Depends(get_db)):
    try:
        total_visits = db.query(OPDVisit).filter(
            OPDVisit.flag == "Show",
            OPDVisit.deleted_at.is_(None)
        ).count()

        revenue = db.query(
            func.coalesce(func.sum(OPDBilling.total_amount), 0).label("gross"),
            func.coalesce(func.sum(OPDBilling.paid_amount),  0).label("paid")
        ).filter(OPDBilling.flag == "Show").one()

        active_doctors = db.query(Doctor).filter(
            Doctor.flag == "Show",
            Doctor.status == "Active",
            Doctor.deleted_at.is_(None)
        ).count()

        total_patients = db.query(Patient).filter(
            Patient.flag == "Show",
            Patient.deleted_at.is_(None)
        ).count()

        total_branches = db.query(Branch).filter(
            Branch.flag == "Show",
            Branch.deleted_at.is_(None)
        ).count()

        return {
            "total_visits":   total_visits,
            "gross_revenue":  float(revenue.gross),
            "paid_revenue":   float(revenue.paid),
            "active_doctors": active_doctors,
            "total_patients": total_patients,
            "total_branches": total_branches
        }

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))