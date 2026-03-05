from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional

from database import get_db
from models.models import OPDVisit, Doctor, Branch, OPDDiagnosis

router = APIRouter(prefix="/admin/analytics", tags=["Analytics - Doctor"])


# ── DOCTOR VISIT LOAD ────────────────────────────────────────────────────────

@router.get("/doctor-load")
def doctor_load(
    branch_id: Optional[int] = Query(None),
    db:        Session = Depends(get_db)
):
    try:
        query = (
            db.query(
                Branch.branch_name,
                Doctor.doctor_name,
                func.count(OPDVisit.visit_id).label("total_visits")
            )
            .join(Doctor, OPDVisit.doctor_id == Doctor.doctor_id)
            .join(Branch, OPDVisit.branch_id == Branch.branch_id)
            .filter(OPDVisit.flag == "Show", OPDVisit.deleted_at.is_(None))
        )

        if branch_id:
            query = query.filter(OPDVisit.branch_id == branch_id)

        results = (
            query
            .group_by(Branch.branch_name, Doctor.doctor_name)
            .order_by(func.count(OPDVisit.visit_id).desc())
            .all()
        )

        return [
            {"branch_name": r.branch_name, "doctor_name": r.doctor_name, "total_visits": r.total_visits}
            for r in results
        ]

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── DIAGNOSIS TRENDS ────────────────────────────────────────────────────────

@router.get("/diagnosis-trends")
def diagnosis_trends(
    specialization: Optional[str] = Query(None),
    db:             Session = Depends(get_db)
):
    try:
        query = (
            db.query(
                Doctor.specialization,
                OPDDiagnosis.diagnosis_name,
                func.count(OPDDiagnosis.diagnosis_id).label("total_count")
            )
            .join(OPDVisit, OPDDiagnosis.visit_id == OPDVisit.visit_id)
            .join(Doctor,   OPDVisit.doctor_id == Doctor.doctor_id)
            .filter(OPDDiagnosis.flag == "Show", OPDDiagnosis.deleted_at.is_(None))
        )

        if specialization:
            query = query.filter(Doctor.specialization == specialization)

        results = (
            query
            .group_by(Doctor.specialization, OPDDiagnosis.diagnosis_name)
            .order_by(func.count(OPDDiagnosis.diagnosis_id).desc())
            .limit(20)
            .all()
        )

        return [
            {"specialization": r.specialization, "diagnosis_name": r.diagnosis_name, "total_count": r.total_count}
            for r in results
        ]

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))