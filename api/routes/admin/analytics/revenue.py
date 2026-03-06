from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from sqlalchemy.exc import SQLAlchemyError

from database import get_db
from models.models import OPDBilling, OPDVisit, Doctor

router = APIRouter(prefix="/admin/analytics", tags=["Analytics - Revenue"])

TAX_RATE       = 0.25
COGS_RATE      = 0.30
OPERATING_RATE = 0.20


def calculate_financials(gross: float, discounts: float = 0.0) -> dict:
    net_revenue        = gross - discounts
    cogs               = round(gross * COGS_RATE, 2)
    gross_profit       = round(net_revenue - cogs, 2)
    gross_profit_pct   = round((gross_profit / net_revenue * 100) if net_revenue else 0, 2)
    operating_expenses = round(gross * OPERATING_RATE, 2)
    operating_profit   = round(gross_profit - operating_expenses, 2)
    tax                = round(max(operating_profit, 0) * TAX_RATE, 2)
    net_profit         = round(operating_profit - tax, 2)
    net_profit_pct     = round((net_profit / net_revenue * 100) if net_revenue else 0, 2)

    return {
        "gross_revenue":      round(gross, 2),
        "discounts":          round(discounts, 2),
        "net_revenue":        round(net_revenue, 2),
        "cogs":               cogs,
        "gross_profit":       gross_profit,
        "gross_profit_pct":   gross_profit_pct,
        "operating_expenses": operating_expenses,
        "operating_profit":   operating_profit,
        "tax":                tax,
        "tax_rate_pct":       TAX_RATE * 100,
        "net_profit":         net_profit,
        "net_profit_pct":     net_profit_pct,
    }


# ── MONTHLY REVENUE BY BRANCH ─────────────────────────────────────────────────
# Uses raw SQL for speed: single join, no ORM overhead, index-friendly GROUP BY
@router.get("/revenue/monthly-branch")
def monthly_branch(db: Session = Depends(get_db)):
    try:
        sql = text("""
            SELECT
                TO_CHAR(v.visit_datetime, 'YYYY-MM')                          AS month,
                COALESCE(SUM(b.consultation_fee + b.additional_charges), 0)   AS gross,
                COALESCE(SUM(b.discount_amount), 0)                           AS discounts,
                COALESCE(SUM(b.paid_amount), 0)                               AS paid
            FROM opd_billing b
            INNER JOIN opd_visit v ON v.visit_id = b.visit_id
            WHERE b.flag = 'Show'
            GROUP BY TO_CHAR(v.visit_datetime, 'YYYY-MM')
            ORDER BY month
        """)

        rows = db.execute(sql).mappings().all()

        data = []
        for r in rows:
            fin = calculate_financials(float(r["gross"]), float(r["discounts"]))
            data.append({"month": r["month"], "paid": float(r["paid"]), **fin})

        return {"data": data}

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── AVG TICKET BY PAYMENT MODE ────────────────────────────────────────────────
@router.get("/revenue/avg-ticket")
def avg_ticket(db: Session = Depends(get_db)):
    try:
        sql = text("""
            SELECT
                payment_mode,
                ROUND(AVG(total_amount)::numeric, 2)  AS avg_ticket,
                COALESCE(SUM(total_amount), 0)         AS total,
                COALESCE(SUM(discount_amount), 0)      AS total_discounts,
                COUNT(bill_id)                         AS bill_count
            FROM opd_billing
            WHERE flag = 'Show'
            GROUP BY payment_mode
            ORDER BY total DESC
        """)

        rows = db.execute(sql).mappings().all()

        return {
            "data": [
                {
                    "payment_mode":    r["payment_mode"],
                    "avg_ticket":      float(r["avg_ticket"]),
                    "total":           float(r["total"]),
                    "total_discounts": float(r["total_discounts"]),
                    "bill_count":      r["bill_count"],
                }
                for r in rows
            ]
        }

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── DOCTOR REVENUE CONTRIBUTION (paginated) ───────────────────────────────────
# Uses a CTE + window function COUNT(*) OVER() to avoid a second COUNT query
@router.get("/revenue/doctor-contribution")
def doctor_contribution(
    page:  int = Query(1, ge=1),
    limit: int = Query(5, ge=1, le=100),
    db:    Session = Depends(get_db),
):
    try:
        offset = (page - 1) * limit

        sql = text("""
            WITH agg AS (
                SELECT
                    d.doctor_name,
                    d.specialization,
                    COUNT(v.visit_id)                                                  AS visits,
                    COALESCE(SUM(b.consultation_fee + b.additional_charges), 0)        AS gross,
                    COALESCE(SUM(b.discount_amount), 0)                                AS discounts,
                    COALESCE(AVG(b.total_amount), 0)                                   AS revenue_per_visit,
                    COUNT(*) OVER()                                                    AS total_count
                FROM doctor d
                INNER JOIN opd_visit  v ON v.doctor_id  = d.doctor_id
                LEFT  JOIN opd_billing b ON b.visit_id   = v.visit_id
                WHERE v.flag = 'Show'
                  AND v.deleted_at IS NULL
                GROUP BY d.doctor_name, d.specialization
                ORDER BY SUM(b.total_amount) DESC NULLS LAST
                LIMIT  :limit
                OFFSET :offset
            )
            SELECT * FROM agg
        """)

        rows = db.execute(sql, {"limit": limit, "offset": offset}).mappings().all()

        total = int(rows[0]["total_count"]) if rows else 0

        data = []
        for r in rows:
            fin = calculate_financials(float(r["gross"]), float(r["discounts"]))
            data.append({
                "doctor_name":       r["doctor_name"],
                "specialization":    r["specialization"],
                "visits":            r["visits"],
                "revenue_per_visit": round(float(r["revenue_per_visit"]), 2),
                **fin,
            })

        return {"data": data, "total": total}

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── FINANCIAL SUMMARY (overall) ───────────────────────────────────────────────
# Single-row aggregation — fastest possible
@router.get("/revenue/financial-summary")
def financial_summary(db: Session = Depends(get_db)):
    try:
        sql = text("""
            SELECT
                COALESCE(SUM(consultation_fee + additional_charges), 0) AS gross,
                COALESCE(SUM(discount_amount), 0)                        AS discounts,
                COALESCE(SUM(total_amount), 0)                           AS total_billed,
                COALESCE(SUM(paid_amount), 0)                            AS paid,
                COUNT(bill_id)                                           AS total_bills
            FROM opd_billing
            WHERE flag = 'Show'
        """)

        r = db.execute(sql).mappings().one()

        gross     = float(r["gross"])
        discounts = float(r["discounts"])
        fin       = calculate_financials(gross, discounts)

        return {
            **fin,
            "total_billed": float(r["total_billed"]),
            "paid":         float(r["paid"]),
            "outstanding":  round(float(r["total_billed"]) - float(r["paid"]), 2),
            "total_bills":  r["total_bills"],
        }

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))