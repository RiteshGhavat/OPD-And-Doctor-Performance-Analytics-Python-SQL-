from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models.models import (
    Doctor,
    Branch,
    OPDVisit,
    OPDBilling,
    OPDDiagnosis,
    OPDPrescription,
)

router = APIRouter(
    prefix="/admin/analytics/doctors",
    tags=["Doctor Analytics"]
)


# TASK 1 Doctor-wise OPD Load (Monthly)

@router.get("/opd-load")
def doctor_opd_load(
    page: int = Query(1, ge=1),
    limit: int = Query(5, ge=1),
    db: Session = Depends(get_db),
):
    try:
        base = (
            db.query(
                Doctor.doctor_name,
                Branch.branch_name,
                func.date_trunc("month", OPDVisit.visit_datetime).label("month"),
                func.count(OPDVisit.visit_id).label("visit_count"),
            )
            .join(OPDVisit, OPDVisit.doctor_id == Doctor.doctor_id)
            .join(Branch, Branch.branch_id == OPDVisit.branch_id)
            .filter(OPDVisit.deleted_at.is_(None))
            .group_by(Doctor.doctor_name, Branch.branch_name, "month")
        )

        total = base.count()

        results = (
            base.order_by(func.count(OPDVisit.visit_id).desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )

        return {
            "success": True,
            "total": total,
            "data": [
                {
                    "doctor_name": r.doctor_name,
                    "branch_name": r.branch_name,
                    "month": r.month.strftime("%Y-%m"),
                    "visit_count": r.visit_count,
                }
                for r in results
            ],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# TASK 7 Doctor Performance Metrics

@router.get("/performance")
def doctor_performance(
    page: int = Query(1, ge=1),
    limit: int = Query(5, ge=1),
    db: Session = Depends(get_db),
):
    try:
        base = (
            db.query(
                Doctor.doctor_name,
                func.count(OPDVisit.visit_id).label("total_visits"),
                func.sum(OPDBilling.paid_amount).label("total_revenue"),
                func.avg(OPDBilling.paid_amount).label("avg_fee"),
            )
            .join(OPDVisit, OPDVisit.doctor_id == Doctor.doctor_id)
            .join(OPDBilling, OPDBilling.visit_id == OPDVisit.visit_id)
            .filter(OPDBilling.deleted_at.is_(None))
            .group_by(Doctor.doctor_name)
        )

        total = base.count()

        results = (
            base.order_by(func.sum(OPDBilling.paid_amount).desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )

        return {
            "success": True,
            "total": total,
            "data": [
                {
                    "doctor_name": r.doctor_name,
                    "total_visits": r.total_visits,
                    "total_revenue": float(r.total_revenue or 0),
                    "avg_fee": float(r.avg_fee or 0),
                }
                for r in results
            ],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# TASK 3 Top Diagnoses

@router.get("/top-diagnoses")
def top_diagnoses(
    page: int = Query(1, ge=1),
    limit: int = Query(5, ge=1),
    db: Session = Depends(get_db),
):
    try:
        base = (
            db.query(
                Doctor.specialization,
                OPDDiagnosis.diagnosis_name,
                func.count(OPDDiagnosis.diagnosis_id).label("count"),
            )
            .join(OPDVisit, OPDVisit.doctor_id == Doctor.doctor_id)
            .join(OPDDiagnosis, OPDDiagnosis.visit_id == OPDVisit.visit_id)
            .filter(OPDDiagnosis.deleted_at.is_(None))
            .group_by(Doctor.specialization, OPDDiagnosis.diagnosis_name)
        )

        total = base.count()

        results = (
            base.order_by(func.count(OPDDiagnosis.diagnosis_id).desc())
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )

        return {
            "success": True,
            "total": total,
            "data": [
                {
                    "specialization": r.specialization,
                    "diagnosis": r.diagnosis_name,
                    "count": r.count,
                }
                for r in results
            ],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))