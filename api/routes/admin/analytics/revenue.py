from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional

from database import get_db
from models.models import OPDBilling, OPDVisit, Branch

router = APIRouter(prefix="/admin/analytics", tags=["Analytics - Revenue"])


# ── MONTHLY REVENUE BY BRANCH ────────────────────────────────────────────────

@router.get("/revenue")
def revenue_by_branch(
    branch_id: Optional[int] = Query(None),
    year:      Optional[int] = Query(None),
    db:        Session = Depends(get_db)
):
    try:
        query = (
            db.query(
                Branch.branch_name,
                extract("year",  OPDVisit.visit_datetime).label("year"),
                extract("month", OPDVisit.visit_datetime).label("month"),
                func.coalesce(func.sum(OPDBilling.total_amount), 0).label("gross_revenue"),
                func.coalesce(func.sum(OPDBilling.paid_amount),  0).label("net_revenue")
            )
            .join(OPDVisit, OPDBilling.visit_id == OPDVisit.visit_id)
            .join(Branch,   OPDVisit.branch_id  == Branch.branch_id)
            .filter(OPDBilling.flag == "Show")
        )

        if branch_id:
            query = query.filter(OPDVisit.branch_id == branch_id)
        if year:
            query = query.filter(extract("year", OPDVisit.visit_datetime) == year)

        results = (
            query
            .group_by(
                Branch.branch_name,
                extract("year",  OPDVisit.visit_datetime),
                extract("month", OPDVisit.visit_datetime)
            )
            .order_by(
                extract("year",  OPDVisit.visit_datetime),
                extract("month", OPDVisit.visit_datetime)
            )
            .all()
        )

        return [
            {
                "branch_name":   r.branch_name,
                "year":          int(r.year),
                "month":         int(r.month),
                "gross_revenue": float(r.gross_revenue),
                "net_revenue":   float(r.net_revenue)
            }
            for r in results
        ]

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── PAYMENT MODE ANALYTICS ───────────────────────────────────────────────────

@router.get("/payment-modes")
def payment_modes(db: Session = Depends(get_db)):
    try:
        results = (
            db.query(
                OPDBilling.payment_mode,
                func.count(OPDBilling.bill_id).label("total_bills"),
                func.coalesce(func.avg(OPDBilling.total_amount), 0).label("avg_ticket_size")
            )
            .filter(OPDBilling.flag == "Show")
            .group_by(OPDBilling.payment_mode)
            .all()
        )

        return [
            {
                "payment_mode":    r.payment_mode,
                "total_bills":     r.total_bills,
                "avg_ticket_size": round(float(r.avg_ticket_size), 2)
            }
            for r in results
        ]

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))