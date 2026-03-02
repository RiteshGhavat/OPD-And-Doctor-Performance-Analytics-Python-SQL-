from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from database import get_db
from models.models import OPDVisit, Branch

router = APIRouter(
    prefix="/admin/analytics/peak-hours",
    tags=["Peak Hours Analytics"]
)

@router.get("/")
def peak_hours(branch_id: int = None, db: Session = Depends(get_db)):
    """
    Peak Hour Analysis per Branch
    - Hour-wise visit count
    - Optional branch filter
    """
    try:
        query = db.query(
            extract('hour', OPDVisit.visit_datetime).label("hour"),
            func.count(OPDVisit.visit_id).label("visits")
        ).join(Branch, OPDVisit.branch_id == Branch.branch_id
        ).filter(
            OPDVisit.deleted_at.is_(None),
            OPDVisit.visit_status != "Cancelled"
        )

        if branch_id:
            query = query.filter(OPDVisit.branch_id == branch_id)

        query = query.group_by("hour").order_by("hour")
        results = query.all()

        data = [{"hour": int(r.hour), "visits": r.visits} for r in results]

        return {"success": True, "data": data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/branches")
def branches(db: Session = Depends(get_db)):
    """
    List all branches for dropdown filter
    """
    try:
        branches = db.query(Branch.branch_id, Branch.branch_name
        ).filter(Branch.deleted_at.is_(None)
        ).all()

        data = [{"branch_id": b.branch_id, "branch_name": b.branch_name} for b in branches]
        return {"success": True, "data": data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))