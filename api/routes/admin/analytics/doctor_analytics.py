from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from database import get_db

router = APIRouter(prefix="/admin/analytics", tags=["Analytics - Doctor"])


# ── DOCTOR OPD LOAD (paginated) ───────────────────────────────────────────────
# Uses CTE + COUNT(*) OVER() to get total in one pass — avoids broken .count()
@router.get("/doctors/opd-load")
def doctor_opd_load(
    page:  int = Query(1, ge=1),
    limit: int = Query(5, ge=1, le=100),
    db:    Session = Depends(get_db)
):
    try:
        sql = text("""
            WITH agg AS (
                SELECT
                    d.doctor_name,
                    b.branch_name,
                    TO_CHAR(v.visit_datetime, 'YYYY-MM')  AS month,
                    COUNT(v.visit_id)                     AS visit_count,
                    COUNT(*) OVER()                       AS total_count
                FROM opd_visit v
                INNER JOIN doctor d ON d.doctor_id = v.doctor_id
                INNER JOIN branch b ON b.branch_id = v.branch_id
                WHERE v.flag = 'Show' AND v.deleted_at IS NULL
                GROUP BY d.doctor_name, b.branch_name,
                         TO_CHAR(v.visit_datetime, 'YYYY-MM')
                ORDER BY visit_count DESC
                LIMIT  :limit
                OFFSET :offset
            )
            SELECT * FROM agg
        """)

        rows = db.execute(sql, {"limit": limit, "offset": (page - 1) * limit}).mappings().all()
        total = int(rows[0]["total_count"]) if rows else 0

        return {
            "data": [
                {
                    "doctor_name": r["doctor_name"],
                    "branch_name": r["branch_name"],
                    "month":       r["month"],
                    "visit_count": r["visit_count"],
                } for r in rows
            ],
            "total": total,
        }

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── DOCTOR PERFORMANCE (paginated) ───────────────────────────────────────────
@router.get("/doctors/performance")
def doctor_performance(
    page:  int = Query(1, ge=1),
    limit: int = Query(5, ge=1, le=100),
    db:    Session = Depends(get_db)
):
    try:
        sql = text("""
            WITH agg AS (
                SELECT
                    d.doctor_name,
                    d.specialization,
                    COUNT(v.visit_id)                              AS total_visits,
                    COALESCE(SUM(b.total_amount), 0)               AS total_revenue,
                    COALESCE(AVG(b.total_amount), 0)               AS avg_fee,
                    COUNT(*) OVER()                                AS total_count
                FROM opd_visit v
                INNER JOIN doctor      d ON d.doctor_id = v.doctor_id
                LEFT  JOIN opd_billing b ON b.visit_id  = v.visit_id
                WHERE v.flag = 'Show' AND v.deleted_at IS NULL
                GROUP BY d.doctor_name, d.specialization
                ORDER BY total_visits DESC
                LIMIT  :limit
                OFFSET :offset
            )
            SELECT * FROM agg
        """)

        rows = db.execute(sql, {"limit": limit, "offset": (page - 1) * limit}).mappings().all()
        total = int(rows[0]["total_count"]) if rows else 0

        return {
            "data": [
                {
                    "doctor_name":    r["doctor_name"],
                    "specialization": r["specialization"],
                    "total_visits":   r["total_visits"],
                    "total_revenue":  round(float(r["total_revenue"]), 2),
                    "avg_fee":        round(float(r["avg_fee"]), 2),
                } for r in rows
            ],
            "total": total,
        }

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── TOP DIAGNOSES (paginated) ─────────────────────────────────────────────────
@router.get("/doctors/top-diagnoses")
def top_diagnoses(
    page:  int = Query(1, ge=1),
    limit: int = Query(5, ge=1, le=100),
    db:    Session = Depends(get_db)
):
    try:
        sql = text("""
            WITH agg AS (
                SELECT
                    d.specialization,
                    od.diagnosis_name                    AS diagnosis,
                    COUNT(od.diagnosis_id)               AS count,
                    COUNT(*) OVER()                      AS total_count
                FROM opd_diagnosis od
                INNER JOIN opd_visit v ON v.visit_id  = od.visit_id
                INNER JOIN doctor   d ON d.doctor_id  = v.doctor_id
                WHERE od.flag = 'Show' AND od.deleted_at IS NULL
                GROUP BY d.specialization, od.diagnosis_name
                ORDER BY count DESC
                LIMIT  :limit
                OFFSET :offset
            )
            SELECT * FROM agg
        """)

        rows = db.execute(sql, {"limit": limit, "offset": (page - 1) * limit}).mappings().all()
        total = int(rows[0]["total_count"]) if rows else 0

        return {
            "data": [
                {
                    "specialization": r["specialization"],
                    "diagnosis":      r["diagnosis"],
                    "count":          r["count"],
                } for r in rows
            ],
            "total": total,
        }

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))