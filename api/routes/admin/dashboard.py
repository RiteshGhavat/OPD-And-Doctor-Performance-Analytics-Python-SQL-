from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from database import get_db
from role_checker import admin_required

router = APIRouter(prefix="/admin/dashboard", tags=["Admin Dashboard"])


@router.get("/", status_code=status.HTTP_200_OK)
def admin_dashboard(
    db:    Session = Depends(get_db),
    admin=Depends(admin_required)
):
    try:
        # Single round-trip instead of 4 separate COUNT queries
        sql = text("""
            SELECT
                (SELECT COUNT(*) FROM branch    WHERE flag = 'Show' AND deleted_at IS NULL) AS branches,
                (SELECT COUNT(*) FROM doctor    WHERE flag = 'Show' AND deleted_at IS NULL) AS doctors,
                (SELECT COUNT(*) FROM patient   WHERE flag = 'Show' AND deleted_at IS NULL) AS users,
                (SELECT COUNT(*) FROM opd_visit WHERE flag = 'Show' AND deleted_at IS NULL) AS visits
        """)

        r = db.execute(sql).mappings().one()

        return {
            "branches": r["branches"],
            "doctors":  r["doctors"],
            "users":    r["users"],
            "visits":   r["visits"],
        }

    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching dashboard data: {str(e)}"
        )