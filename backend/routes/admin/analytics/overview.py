from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import date

from database import get_db
from models.models import Branch, OPDVisit, OPDBilling

router = APIRouter(
    prefix="/admin/analytics/overview",
    tags=["Analytics Overview"]
)


# 1 NEW vs FOLLOW-UP (MONTHLY)

@router.get("/new-vs-followup")
def new_vs_followup(
    branch_id: int | None = Query(None),
    month: date | None = Query(None),
    db: Session = Depends(get_db)
):
    try:
        query = (
            db.query(
                Branch.branch_name.label("branch_name"),
                func.date_trunc("month", OPDVisit.visit_datetime).label("month"),

                func.sum(
                    case(
                        (OPDVisit.consultation_type == "New", 1),
                        else_=0
                    )
                ).label("new_visits"),

                func.sum(
                    case(
                        (OPDVisit.consultation_type == "Follow-up", 1),
                        else_=0
                    )
                ).label("followup_visits"),
            )
            .join(Branch, Branch.branch_id == OPDVisit.branch_id)
            .filter(
                OPDVisit.deleted_at.is_(None),
                OPDVisit.visit_status != "Cancelled"
            )
        )

        if branch_id:
            query = query.filter(OPDVisit.branch_id == branch_id)

        if month:
            query = query.filter(
                func.date_trunc("month", OPDVisit.visit_datetime)
                == func.date_trunc("month", month)
            )

        results = (
            query.group_by(Branch.branch_name, "month")
            .order_by("month")
            .all()
        )

        return {
            "success": True,
            "data": [
                {
                    "branch_name": r.branch_name,
                    "month": r.month.strftime("%Y-%m"),
                    "new_visits": int(r.new_visits or 0),
                    "followup_visits": int(r.followup_visits or 0),
                }
                for r in results
            ],
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load new vs follow-up data: {str(e)}"
        )


# 2 MONTHLY REVENUE (GROSS, DISCOUNT, NET, MARGIN)

@router.get("/monthly-revenue")
def monthly_revenue(
    branch_id: int | None = Query(None),
    db: Session = Depends(get_db)
):
    """
    Gross Revenue  = consultation_fee + additional_charges
    Discount       = Gross - total_amount
    Net Revenue    = paid_amount (Paid bills only)
    Gross Margin   = Net Revenue (direct cost not available yet)
    """
    try:
        month_label = func.to_char(OPDBilling.created_at, "YYYY-MM")

        query = (
            db.query(
                Branch.branch_name.label("branch_name"),
                month_label.label("month"),

                
                func.coalesce(
                    func.sum(
                        OPDBilling.consultation_fee +
                        OPDBilling.additional_charges
                    ),
                    0
                ).label("gross_revenue"),

                
                func.coalesce(
                    func.sum(
                        (OPDBilling.consultation_fee +
                         OPDBilling.additional_charges)
                        - OPDBilling.total_amount
                    ),
                    0
                ).label("discount"),

                func.coalesce(
                    func.sum(
                        case(
                            (OPDBilling.payment_status == "Paid",
                             OPDBilling.paid_amount),
                            else_=0
                        )
                    ),
                    0
                ).label("net_revenue"),

                func.coalesce(
                    func.sum(
                        case(
                            (OPDBilling.payment_status == "Paid",
                             OPDBilling.paid_amount),
                            else_=0
                        )
                    ),
                    0
                ).label("gross_margin"),
            )
            .join(OPDVisit, OPDVisit.visit_id == OPDBilling.visit_id)
            .join(Branch, Branch.branch_id == OPDVisit.branch_id)
            .filter(
                OPDBilling.deleted_at.is_(None),
                OPDVisit.deleted_at.is_(None),
                OPDVisit.visit_status != "Cancelled"
            )
        )

        if branch_id:
            query = query.filter(OPDVisit.branch_id == branch_id)

        results = (
            query.group_by(Branch.branch_name, month_label)
            .order_by(month_label)
            .all()
        )

        return {
            "success": True,
            "data": [
                {
                    "branch_name": r.branch_name,
                    "month": r.month,
                    "gross_revenue": float(r.gross_revenue),
                    "discount": float(r.discount),
                    "net_revenue": float(r.net_revenue),
                    "gross_margin": float(r.gross_margin),
                }
                for r in results
            ],
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load monthly revenue: {str(e)}"
        )



# 3 AVG TICKET SIZE BY PAYMENT MODE

@router.get("/avg-ticket-size")
def avg_ticket_size(
    branch_id: int | None = Query(None),
    db: Session = Depends(get_db)
):
    try:
        query = (
            db.query(
                OPDBilling.payment_mode.label("payment_mode"),
                func.coalesce(
                    func.avg(OPDBilling.paid_amount),
                    0
                ).label("avg_ticket"),
            )
            .join(OPDVisit, OPDVisit.visit_id == OPDBilling.visit_id)
            .filter(
                OPDBilling.deleted_at.is_(None),
                OPDBilling.payment_status == "Paid"
            )
        )

        if branch_id:
            query = query.filter(OPDVisit.branch_id == branch_id)

        results = query.group_by(OPDBilling.payment_mode).all()

        return {
            "success": True,
            "data": [
                {
                    "payment_mode": r.payment_mode or "Unknown",
                    "avg_ticket": float(r.avg_ticket),
                }
                for r in results
            ],
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load avg ticket size: {str(e)}"
        )