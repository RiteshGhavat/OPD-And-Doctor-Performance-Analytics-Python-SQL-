from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from sqlalchemy.exc import SQLAlchemyError
from typing import Optional

from database import get_db
from models.models import OPDVisit, Branch

router = APIRouter(prefix="/admin/analytics", tags=["Analytics - Peak Hours"])


@router.get("/peak-hours")
def peak_hours(
    branch_id: Optional[int] = Query(None),
    db:        Session = Depends(get_db)
):
    try:
        query = (
            db.query(
                Branch.branch_name,
                extract("hour", OPDVisit.visit_datetime).label("hour"),
                func.count(OPDVisit.visit_id).label("total_visits")
            )
            .join(Branch, OPDVisit.branch_id == Branch.branch_id)
            .filter(OPDVisit.flag == "Show", OPDVisit.deleted_at.is_(None))
        )

        if branch_id:
            query = query.filter(OPDVisit.branch_id == branch_id)

        results = (
            query
            .group_by(Branch.branch_name, extract("hour", OPDVisit.visit_datetime))
            .order_by(func.count(OPDVisit.visit_id).desc())
            .all()
        )

        return [
            {"branch_name": r.branch_name, "hour": int(r.hour), "total_visits": r.total_visits}
            for r in results
        ]

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))