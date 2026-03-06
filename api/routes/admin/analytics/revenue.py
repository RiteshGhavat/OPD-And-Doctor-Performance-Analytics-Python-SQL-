from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional

from database import get_db
from models.models import OPDBilling, OPDVisit, Branch, Doctor

router = APIRouter(prefix="/admin/analytics", tags=["Analytics - Revenue"])


# ── MONTHLY REVENUE BY BRANCH ─────────────────────────────────────────────────
@router.get("/revenue/monthly-branch")
def monthly_branch(db: Session = Depends(get_db)):
    try:
        results = (
            db.query(
                func.to_char(OPDVisit.visit_datetime, 'YYYY-MM').label("month"),
                func.coalesce(func.sum(OPDBilling.total_amount), 0).label("gross"),
                func.coalesce(func.sum(OPDBilling.paid_amount), 0).label("net"),
            )
            .join(OPDVisit, OPDBilling.visit_id == OPDVisit.visit_id)
            .filter(OPDBilling.flag == "Show")
            .group_by(func.to_char(OPDVisit.visit_datetime, 'YYYY-MM'))
            .order_by(func.to_char(OPDVisit.visit_datetime, 'YYYY-MM'))
            .all()
        )

        return {
            "data": [
                {
                    "month": r.month,
                    "gross": float(r.gross),
                    "net":   float(r.net)
                } for r in results
            ]
        }

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── AVG TICKET BY PAYMENT MODE ────────────────────────────────────────────────
@router.get("/revenue/avg-ticket")
def avg_ticket(db: Session = Depends(get_db)):
    try:
        results = (
            db.query(
                OPDBilling.payment_mode,
                func.coalesce(func.avg(OPDBilling.total_amount), 0).label("avg_ticket"),
                func.coalesce(func.sum(OPDBilling.total_amount), 0).label("total"),
            )
            .filter(OPDBilling.flag == "Show")
            .group_by(OPDBilling.payment_mode)
            .all()
        )

        return {
            "data": [
                {
                    "payment_mode": r.payment_mode,
                    "avg_ticket":   round(float(r.avg_ticket), 2),
                    "total":        float(r.total)
                } for r in results
            ]
        }

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── DOCTOR REVENUE CONTRIBUTION (paginated) ───────────────────────────────────
@router.get("/revenue/doctor-contribution")
def doctor_contribution(
    page: int = Query(1),
    limit: int = Query(5),
    db: Session = Depends(get_db)
):
    try:
        query = (
            db.query(
                Doctor.doctor_name,
                func.count(OPDVisit.visit_id).label("visits"),
                func.coalesce(func.sum(OPDBilling.total_amount), 0).label("revenue"),
                func.coalesce(func.avg(OPDBilling.total_amount), 0).label("revenue_per_visit"),
            )
            .join(OPDVisit, Doctor.doctor_id == OPDVisit.doctor_id)
            .outerjoin(OPDBilling, OPDVisit.visit_id == OPDBilling.visit_id)
            .filter(OPDVisit.flag == "Show", OPDVisit.deleted_at.is_(None))
            .group_by(Doctor.doctor_name)
            .order_by(func.sum(OPDBilling.total_amount).desc())
        )

        total = query.count()
        results = query.offset((page - 1) * limit).limit(limit).all()

        return {
            "data": [
                {
                    "doctor_name":       r.doctor_name,
                    "visits":            r.visits,
                    "revenue":           float(r.revenue),
                    "revenue_per_visit": round(float(r.revenue_per_visit), 2)
                } for r in results
            ],
            "total": total
        }

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))