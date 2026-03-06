from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from database import get_db

router = APIRouter(prefix="/admin/analytics", tags=["Analytics - Overview"])

# ══════════════════════════════════════════════════════════════════
#  FINANCIAL CONSTANTS  (adjust these to match your clinic setup)
# ══════════════════════════════════════════════════════════════════

# COGS breakdown (as % of Gross Revenue)
MEDICINES_RATE      = 0.18   # 18% — medicines & consumables
LAB_SUPPLIES_RATE   = 0.06   # 6%  — lab reagents, test kits
DEPRECIATION_RATE   = 0.04   # 4%  — medical equipment depreciation
GST_ON_COGS_RATE    = 0.05   # 5%  — GST on equipment/supplies (COGS only; patient services mostly exempt)
# Total COGS = MEDICINES + LAB + DEPRECIATION + GST_ON_COGS ≈ 33% of gross

# Deductions from Gross Revenue
CONTRACTUAL_ADJ_RATE = 0.08  # 8%  — insurance/TPA negotiated discounts
BAD_DEBT_RATE        = 0.02  # 2%  — uncollected dues written off

# Operating Expenses (as % of Gross Revenue)
SALARIES_RATE        = 0.22  # 22% — doctors, nurses, admin staff
RENT_UTILITIES_RATE  = 0.05  # 5%  — rent, electricity, water
ADMIN_RATE           = 0.03  # 3%  — admin, marketing, IT

# Post-operating deductions
INTEREST_RATE        = 0.02  # 2%  — loan interest (equipment finance, etc.)
TAX_RATE             = 0.25  # 25% — corporate income tax (India)

# Derived totals (for reference)
# COGS_RATE      = 0.18 + 0.06 + 0.04 + 0.05 = 0.33
# OPERATING_RATE = 0.22 + 0.05 + 0.03        = 0.30
# ══════════════════════════════════════════════════════════════════


def calculate_financials(gross: float, billed_discounts: float = 0.0) -> dict:
    """
    Full Healthcare P&L calculation.

    Formula:
    Gross Revenue
    − Contractual Adjustments (insurance/TPA)
    − Discounts (from billing)
    − Bad Debt
    = Net Revenue
    − COGS (medicines + lab + depreciation + GST on COGS)
    = Gross Profit
    − Operating Expenses (salaries + rent + admin)
    = Operating Profit (EBIT)
    − Interest
    = EBT (Earnings Before Tax)
    − Tax (25%)
    = Net Profit
    """

    # ── Step 1: Adjustments to arrive at Net Revenue ──────────────────────
    contractual_adj  = round(gross * CONTRACTUAL_ADJ_RATE, 2)
    bad_debt         = round(gross * BAD_DEBT_RATE, 2)
    total_deductions = round(contractual_adj + billed_discounts + bad_debt, 2)
    net_revenue      = round(gross - total_deductions, 2)

    # ── Step 2: COGS breakdown ────────────────────────────────────────────
    medicines        = round(gross * MEDICINES_RATE, 2)
    lab_supplies     = round(gross * LAB_SUPPLIES_RATE, 2)
    depreciation     = round(gross * DEPRECIATION_RATE, 2)
    gst_on_cogs      = round(gross * GST_ON_COGS_RATE, 2)
    total_cogs       = round(medicines + lab_supplies + depreciation + gst_on_cogs, 2)

    # ── Step 3: Gross Profit ──────────────────────────────────────────────
    gross_profit     = round(net_revenue - total_cogs, 2)
    gross_profit_pct = round((gross_profit / net_revenue * 100) if net_revenue else 0, 2)

    # ── Step 4: Operating Expenses ────────────────────────────────────────
    salaries         = round(gross * SALARIES_RATE, 2)
    rent_utilities   = round(gross * RENT_UTILITIES_RATE, 2)
    admin_costs      = round(gross * ADMIN_RATE, 2)
    total_opex       = round(salaries + rent_utilities + admin_costs, 2)

    # ── Step 5: Operating Profit (EBIT) ───────────────────────────────────
    operating_profit     = round(gross_profit - total_opex, 2)
    operating_profit_pct = round((operating_profit / net_revenue * 100) if net_revenue else 0, 2)

    # ── Step 6: Interest & EBT ────────────────────────────────────────────
    interest = round(gross * INTEREST_RATE, 2)
    ebt      = round(operating_profit - interest, 2)

    # ── Step 7: Tax & Net Profit ──────────────────────────────────────────
    tax            = round(max(ebt, 0) * TAX_RATE, 2)
    net_profit     = round(ebt - tax, 2)
    net_profit_pct = round((net_profit / net_revenue * 100) if net_revenue else 0, 2)

    return {
        # Revenue
        "gross_revenue":          round(gross, 2),

        # Deductions
        "contractual_adjustments": contractual_adj,
        "billed_discounts":        round(billed_discounts, 2),
        "bad_debt":                bad_debt,
        "total_deductions":        total_deductions,

        # Net Revenue
        "net_revenue":             net_revenue,

        # COGS breakdown
        "medicines_cost":          medicines,
        "lab_supplies_cost":       lab_supplies,
        "depreciation":            depreciation,
        "gst_on_cogs":             gst_on_cogs,
        "total_cogs":              total_cogs,

        # Gross Profit
        "gross_profit":            gross_profit,
        "gross_profit_pct":        gross_profit_pct,

        # Operating Expenses breakdown
        "salaries_cost":           salaries,
        "rent_utilities_cost":     rent_utilities,
        "admin_cost":              admin_costs,
        "total_opex":              total_opex,

        # Operating Profit (EBIT)
        "operating_profit":        operating_profit,
        "operating_profit_pct":    operating_profit_pct,

        # Below EBIT
        "interest":                interest,
        "ebt":                     ebt,
        "tax":                     tax,
        "tax_rate_pct":            TAX_RATE * 100,

        # Bottom Line
        "net_profit":              net_profit,
        "net_profit_pct":          net_profit_pct,
    }


# ── OVERVIEW SUMMARY ──────────────────────────────────────────────────────────
@router.get("/overview")
def get_overview(db: Session = Depends(get_db)):
    try:
        sql = text("""
            SELECT
                (SELECT COUNT(*) FROM opd_visit  WHERE flag='Show' AND deleted_at IS NULL)                          AS total_visits,
                (SELECT COUNT(*) FROM doctor      WHERE flag='Show' AND status='Active' AND deleted_at IS NULL)     AS active_doctors,
                (SELECT COUNT(*) FROM patient     WHERE flag='Show' AND deleted_at IS NULL)                         AS total_patients,
                (SELECT COUNT(*) FROM branch      WHERE flag='Show' AND deleted_at IS NULL)                         AS total_branches,
                COALESCE((SELECT SUM(consultation_fee + additional_charges) FROM opd_billing WHERE flag='Show'), 0) AS gross,
                COALESCE((SELECT SUM(discount_amount)                       FROM opd_billing WHERE flag='Show'), 0) AS discounts,
                COALESCE((SELECT SUM(total_amount)                          FROM opd_billing WHERE flag='Show'), 0) AS total_billed,
                COALESCE((SELECT SUM(paid_amount)                           FROM opd_billing WHERE flag='Show'), 0) AS paid
        """)
        r   = db.execute(sql).mappings().one()
        fin = calculate_financials(float(r["gross"]), float(r["discounts"]))

        return {
            "total_visits":   r["total_visits"],
            "active_doctors": r["active_doctors"],
            "total_patients": r["total_patients"],
            "total_branches": r["total_branches"],
            "total_billed":   float(r["total_billed"]),
            "paid":           float(r["paid"]),
            "outstanding":    round(float(r["total_billed"]) - float(r["paid"]), 2),
            **fin,
        }
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── NEW VS FOLLOWUP ───────────────────────────────────────────────────────────
@router.get("/overview/new-vs-followup")
def new_vs_followup(branch_id: int = None, db: Session = Depends(get_db)):
    try:
        params = {}
        branch_filter = ""
        if branch_id:
            branch_filter = "AND v.branch_id = :branch_id"
            params["branch_id"] = branch_id

        sql = text(f"""
            SELECT
                TO_CHAR(v.visit_datetime, 'YYYY-MM')                             AS month,
                b.branch_name,
                COUNT(*) FILTER (WHERE v.consultation_type = 'New')              AS new_visits,
                COUNT(*) FILTER (WHERE v.consultation_type = 'Follow-up')        AS followup_visits
            FROM opd_visit v
            INNER JOIN branch b ON b.branch_id = v.branch_id
            WHERE v.flag = 'Show' AND v.deleted_at IS NULL {branch_filter}
            GROUP BY TO_CHAR(v.visit_datetime, 'YYYY-MM'), b.branch_name
            ORDER BY month
        """)

        rows = db.execute(sql, params).mappings().all()
        return {"data": [
            {
                "month":           r["month"],
                "branch_name":     r["branch_name"],
                "new_visits":      r["new_visits"]      or 0,
                "followup_visits": r["followup_visits"] or 0,
            } for r in rows
        ]}
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── MONTHLY REVENUE ───────────────────────────────────────────────────────────
@router.get("/overview/monthly-revenue")
def monthly_revenue(branch_id: int = None, db: Session = Depends(get_db)):
    try:
        params = {}
        branch_filter = ""
        if branch_id:
            branch_filter = "AND v.branch_id = :branch_id"
            params["branch_id"] = branch_id

        sql = text(f"""
            SELECT
                TO_CHAR(v.visit_datetime, 'YYYY-MM')                                  AS month,
                b.branch_name,
                COALESCE(SUM(bi.consultation_fee + bi.additional_charges), 0)         AS gross,
                COALESCE(SUM(bi.discount_amount), 0)                                  AS discounts
            FROM opd_visit v
            INNER JOIN opd_billing bi ON bi.visit_id = v.visit_id
            INNER JOIN branch      b  ON b.branch_id = v.branch_id
            WHERE v.flag = 'Show' AND v.deleted_at IS NULL {branch_filter}
            GROUP BY TO_CHAR(v.visit_datetime, 'YYYY-MM'), b.branch_name
            ORDER BY month
        """)

        rows = db.execute(sql, params).mappings().all()
        data = []
        for r in rows:
            fin = calculate_financials(float(r["gross"]), float(r["discounts"]))
            data.append({"month": r["month"], "branch_name": r["branch_name"], **fin})
        return {"data": data}
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── AVG TICKET SIZE ───────────────────────────────────────────────────────────
@router.get("/overview/avg-ticket-size")
def avg_ticket_size(branch_id: int = None, db: Session = Depends(get_db)):
    try:
        params = {}
        join_clause   = ""
        branch_filter = ""
        if branch_id:
            join_clause   = "INNER JOIN opd_visit v ON v.visit_id = bi.visit_id"
            branch_filter = "AND v.branch_id = :branch_id"
            params["branch_id"] = branch_id

        sql = text(f"""
            SELECT
                bi.payment_mode,
                ROUND(AVG(bi.total_amount)::numeric, 2)  AS avg_ticket,
                COALESCE(SUM(bi.discount_amount), 0)     AS total_discounts,
                COUNT(bi.bill_id)                        AS count
            FROM opd_billing bi
            {join_clause}
            WHERE bi.flag = 'Show' {branch_filter}
            GROUP BY bi.payment_mode
            ORDER BY avg_ticket DESC
        """)

        rows = db.execute(sql, params).mappings().all()
        return {"data": [
            {
                "payment_mode":    r["payment_mode"],
                "avg_ticket":      float(r["avg_ticket"]),
                "total_discounts": float(r["total_discounts"]),
                "count":           r["count"],
            } for r in rows
        ]}
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── ALL-IN-ONE endpoint ────────────────────────────────────────────────────────
@router.get("/overview/all")
def overview_all(branch_id: int = None, db: Session = Depends(get_db)):
    try:
        params             = {}
        branch_filter      = ""
        branch_join_bi     = ""
        branch_filter_bi   = ""

        if branch_id:
            params["branch_id"] = branch_id
            branch_filter       = "AND v.branch_id = :branch_id"
            branch_join_bi      = "INNER JOIN opd_visit v2 ON v2.visit_id = bi2.visit_id"
            branch_filter_bi    = "AND v2.branch_id = :branch_id"

        visits_sql = text(f"""
            SELECT
                TO_CHAR(v.visit_datetime, 'YYYY-MM')                      AS month,
                b.branch_name,
                COUNT(*) FILTER (WHERE v.consultation_type = 'New')       AS new_visits,
                COUNT(*) FILTER (WHERE v.consultation_type = 'Follow-up') AS followup_visits
            FROM opd_visit v
            INNER JOIN branch b ON b.branch_id = v.branch_id
            WHERE v.flag = 'Show' AND v.deleted_at IS NULL {branch_filter}
            GROUP BY TO_CHAR(v.visit_datetime, 'YYYY-MM'), b.branch_name
            ORDER BY month
        """)

        revenue_sql = text(f"""
            SELECT
                TO_CHAR(v.visit_datetime, 'YYYY-MM')                              AS month,
                b.branch_name,
                COALESCE(SUM(bi.consultation_fee + bi.additional_charges), 0)     AS gross,
                COALESCE(SUM(bi.discount_amount), 0)                              AS discounts
            FROM opd_visit v
            INNER JOIN opd_billing bi ON bi.visit_id = v.visit_id
            INNER JOIN branch      b  ON b.branch_id = v.branch_id
            WHERE v.flag = 'Show' AND v.deleted_at IS NULL {branch_filter}
            GROUP BY TO_CHAR(v.visit_datetime, 'YYYY-MM'), b.branch_name
            ORDER BY month
        """)

        ticket_sql = text(f"""
            SELECT
                bi2.payment_mode,
                ROUND(AVG(bi2.total_amount)::numeric, 2)  AS avg_ticket,
                COALESCE(SUM(bi2.discount_amount), 0)     AS total_discounts,
                COUNT(bi2.bill_id)                        AS count
            FROM opd_billing bi2
            {branch_join_bi}
            WHERE bi2.flag = 'Show' {branch_filter_bi}
            GROUP BY bi2.payment_mode
            ORDER BY avg_ticket DESC
        """)

        visit_rows   = db.execute(visits_sql,  params).mappings().all()
        revenue_rows = db.execute(revenue_sql, params).mappings().all()
        ticket_rows  = db.execute(ticket_sql,  params).mappings().all()

        revenue_data = []
        for r in revenue_rows:
            fin = calculate_financials(float(r["gross"]), float(r["discounts"]))
            revenue_data.append({"month": r["month"], "branch_name": r["branch_name"], **fin})

        return {
            "new_followup": [
                {
                    "month":           r["month"],
                    "branch_name":     r["branch_name"],
                    "new_visits":      r["new_visits"]      or 0,
                    "followup_visits": r["followup_visits"] or 0,
                } for r in visit_rows
            ],
            "revenue": revenue_data,
            "ticket_size": [
                {
                    "payment_mode":    r["payment_mode"],
                    "avg_ticket":      float(r["avg_ticket"]),
                    "total_discounts": float(r["total_discounts"]),
                    "count":           r["count"],
                } for r in ticket_rows
            ],
        }
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))