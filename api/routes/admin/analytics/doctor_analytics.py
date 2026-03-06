from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional

from database import get_db
from models.models import OPDVisit, Doctor, Branch, OPDDiagnosis, OPDBilling

router = APIRouter(prefix="/admin/analytics", tags=["Analytics - Doctor"])


# ── DOCTOR OPD LOAD (paginated) ──────────────────────────────────────────────
@router.get("/doctors/opd-load")
def doctor_opd_load(
    page: int = Query(1),
    limit: int = Query(5),
    db: Session = Depends(get_db)
):
    try:
        query = (
            db.query(
                Doctor.doctor_name,
                Branch.branch_name,
                func.to_char(OPDVisit.visit_datetime, 'YYYY-MM').label("month"),
                func.count(OPDVisit.visit_id).label("visit_count")
            )
            .join(Doctor, OPDVisit.doctor_id == Doctor.doctor_id)
            .join(Branch, OPDVisit.branch_id == Branch.branch_id)
            .filter(OPDVisit.flag == "Show", OPDVisit.deleted_at.is_(None))
            .group_by(Doctor.doctor_name, Branch.branch_name,
                      func.to_char(OPDVisit.visit_datetime, 'YYYY-MM'))
            .order_by(func.count(OPDVisit.visit_id).desc())
        )

        total = query.count()
        results = query.offset((page - 1) * limit).limit(limit).all()

        return {
            "data": [
                {
                    "doctor_name": r.doctor_name,
                    "branch_name": r.branch_name,
                    "month":       r.month,
                    "visit_count": r.visit_count
                } for r in results
            ],
            "total": total
        }

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── DOCTOR PERFORMANCE (paginated) ──────────────────────────────────────────
@router.get("/doctors/performance")
def doctor_performance(
    page: int = Query(1),
    limit: int = Query(5),
    db: Session = Depends(get_db)
):
    try:
        query = (
            db.query(
                Doctor.doctor_name,
                func.count(OPDVisit.visit_id).label("total_visits"),
                func.coalesce(func.sum(OPDBilling.total_amount), 0).label("total_revenue"),
                func.coalesce(func.avg(OPDBilling.total_amount), 0).label("avg_fee")
            )
            .join(Doctor, OPDVisit.doctor_id == Doctor.doctor_id)
            .outerjoin(OPDBilling, OPDVisit.visit_id == OPDBilling.visit_id)
            .filter(OPDVisit.flag == "Show", OPDVisit.deleted_at.is_(None))
            .group_by(Doctor.doctor_name)
            .order_by(func.count(OPDVisit.visit_id).desc())
        )

        total = query.count()
        results = query.offset((page - 1) * limit).limit(limit).all()

        return {
            "data": [
                {
                    "doctor_name":   r.doctor_name,
                    "total_visits":  r.total_visits,
                    "total_revenue": float(r.total_revenue),
                    "avg_fee":       round(float(r.avg_fee), 2)
                } for r in results
            ],
            "total": total
        }

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── TOP DIAGNOSES (paginated) ────────────────────────────────────────────────
@router.get("/doctors/top-diagnoses")
def top_diagnoses(
    page: int = Query(1),
    limit: int = Query(5),
    db: Session = Depends(get_db)
):
    try:
        query = (
            db.query(
                Doctor.specialization,
                OPDDiagnosis.diagnosis_name.label("diagnosis"),
                func.count(OPDDiagnosis.diagnosis_id).label("count")
            )
            .join(OPDVisit, OPDDiagnosis.visit_id == OPDVisit.visit_id)
            .join(Doctor, OPDVisit.doctor_id == Doctor.doctor_id)
            .filter(OPDDiagnosis.flag == "Show", OPDDiagnosis.deleted_at.is_(None))
            .group_by(Doctor.specialization, OPDDiagnosis.diagnosis_name)
            .order_by(func.count(OPDDiagnosis.diagnosis_id).desc())
        )

        total = query.count()
        results = query.offset((page - 1) * limit).limit(limit).all()

        return {
            "data": [
                {
                    "specialization": r.specialization,
                    "diagnosis":      r.diagnosis,
                    "count":          r.count
                } for r in results
            ],
            "total": total
        }

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))