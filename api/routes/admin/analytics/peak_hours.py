from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional

from database import get_db
from models.models import OPDVisit, Branch

router = APIRouter(prefix="/admin/analytics", tags=["Analytics - Peak Hours"])


# ── BRANCHES LIST ─────────────────────────────────────────────────────────────
@router.get("/peak-hours/branches")
def get_branches(db: Session = Depends(get_db)):
    try:
        results = db.query(Branch).filter(
            Branch.flag == "Show",
            Branch.deleted_at.is_(None)
        ).all()

        return {
            "data": [
                {"branch_id": b.branch_id, "branch_name": b.branch_name}
                for b in results
            ]
        }

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── PEAK HOURS ────────────────────────────────────────────────────────────────
@router.get("/peak-hours")
def peak_hours(
    branch_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    try:
        query = (
            db.query(
                extract("hour", OPDVisit.visit_datetime).label("hour"),
                func.count(OPDVisit.visit_id).label("visits")
            )
            .filter(OPDVisit.flag == "Show", OPDVisit.deleted_at.is_(None))
        )

        if branch_id:
            query = query.filter(OPDVisit.branch_id == branch_id)

        results = (
            query
            .group_by(extract("hour", OPDVisit.visit_datetime))
            .order_by(extract("hour", OPDVisit.visit_datetime))
            .all()
        )

        return {
            "data": [
                {"hour": int(r.hour), "visits": r.visits}
                for r in results
            ]
        }

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))