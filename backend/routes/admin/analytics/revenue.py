from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case, desc
from database import get_db
from models.models import Branch, Doctor, OPDVisit, OPDBilling

router = APIRouter(
    prefix="/admin/analytics/revenue",
    tags=["Revenue Analytics"]
)


# TASK 5 Monthly Revenue per Branch (Gross & Net)

@router.get("/monthly-branch")
def monthly_branch_revenue(db: Session = Depends(get_db)):
    try:
        month_label = func.to_char(OPDBilling.created_at, "YYYY-MM")

        results = (
            db.query(
                Branch.branch_name.label("branch"),
                month_label.label("month"),

                func.coalesce(
                    func.sum(OPDBilling.consultation_fee + OPDBilling.additional_charges),
                    0
                ).label("gross"),

                func.coalesce(
                    func.sum(
                        (OPDBilling.consultation_fee + OPDBilling.additional_charges)
                        - OPDBilling.total_amount
                    ), 0
                ).label("discount"),

                func.coalesce(
                    func.sum(
                        case(
                            (OPDBilling.payment_status == "Paid", OPDBilling.paid_amount),
                            else_=0
                        )
                    ), 0
                ).label("net"),
            )
            .join(OPDVisit, OPDVisit.visit_id == OPDBilling.visit_id)
            .join(Branch, Branch.branch_id == OPDVisit.branch_id)
            .filter(
                OPDBilling.deleted_at.is_(None),
                OPDVisit.deleted_at.is_(None),
                OPDVisit.visit_status != "Cancelled"
            )
            .group_by(Branch.branch_name, month_label)
            .order_by(month_label)
            .all()
        )

        return {"success": True, "data": [dict(r._mapping) for r in results]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



#  TASK 8 REVENUE BREAKDOWN PIE CHART

@router.get("/revenue-pie")
def revenue_pie(
    branch_id: int | None = Query(None),
    db: Session = Depends(get_db)
):
    """
    Pie Chart:
    - Gross Revenue
    - Discounts
    - Net Revenue
    """
    try:
        query = (
            db.query(
                func.coalesce(
                    func.sum(OPDBilling.consultation_fee + OPDBilling.additional_charges),
                    0
                ).label("gross"),

                func.coalesce(
                    func.sum(
                        (OPDBilling.consultation_fee + OPDBilling.additional_charges)
                        - OPDBilling.total_amount
                    ), 0
                ).label("discount"),

                func.coalesce(
                    func.sum(
                        case(
                            (OPDBilling.payment_status == "Paid", OPDBilling.paid_amount),
                            else_=0
                        )
                    ), 0
                ).label("net"),
            )
            .join(OPDVisit, OPDVisit.visit_id == OPDBilling.visit_id)
            .filter(
                OPDBilling.deleted_at.is_(None),
                OPDVisit.deleted_at.is_(None),
                OPDVisit.visit_status != "Cancelled"
            )
        )

        if branch_id:
            query = query.filter(OPDVisit.branch_id == branch_id)

        result = query.one()

        return {
            "success": True,
            "data": [
                {"label": "Gross Revenue", "value": float(result.gross)},
                {"label": "Discounts", "value": float(result.discount)},
                {"label": "Net Revenue", "value": float(result.net)},
            ]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# TASK 6 Avg Ticket Size by Payment Mode (USED BY UI)

@router.get("/avg-ticket")
def avg_ticket_size(db: Session = Depends(get_db)):
    try:
        results = (
            db.query(
                OPDBilling.payment_mode.label("payment_mode"),
                func.coalesce(func.avg(OPDBilling.paid_amount), 0).label("avg_ticket"),
                func.coalesce(func.sum(OPDBilling.paid_amount), 0).label("total"),
            )
            .filter(
                OPDBilling.deleted_at.is_(None),
                OPDBilling.payment_status == "Paid"
            )
            .group_by(OPDBilling.payment_mode)
            .all()
        )

        return {
            "success": True,
            "data": [
                {
                    "payment_mode": r.payment_mode or "Unknown",
                    "avg_ticket": float(r.avg_ticket),
                    "total": float(r.total),
                }
                for r in results
            ],
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

#  TASK 9 PAYMENT MODE PIE CHART

@router.get("/payment-mode-pie")
def payment_mode_pie(db: Session = Depends(get_db)):
    try:
        results = (
            db.query(
                OPDBilling.payment_mode.label("label"),
                func.coalesce(func.sum(OPDBilling.paid_amount), 0).label("value")
            )
            .filter(
                OPDBilling.deleted_at.is_(None),
                OPDBilling.payment_status == "Paid"
            )
            .group_by(OPDBilling.payment_mode)
            .all()
        )

        return {
            "success": True,
            "data": [
                {"label": r.label or "Unknown", "value": float(r.value)}
                for r in results
            ]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# TASK 7 Revenue Contribution per Doctor

@router.get("/doctor-contribution")
def doctor_revenue(
    page: int = Query(1, ge=1),
    limit: int = Query(5, ge=1),
    db: Session = Depends(get_db),
):
    try:
        query = (
            db.query(
                Doctor.doctor_name.label("doctor_name"),
                func.count(OPDVisit.visit_id).label("visits"),
                func.coalesce(func.sum(OPDBilling.paid_amount), 0).label("revenue"),
                func.coalesce(func.avg(OPDBilling.paid_amount), 0).label("revenue_per_visit"),
            )
            .join(OPDVisit, OPDVisit.doctor_id == Doctor.doctor_id)
            .join(OPDBilling, OPDBilling.visit_id == OPDVisit.visit_id)
            .filter(
                OPDBilling.deleted_at.is_(None),
                OPDBilling.payment_status == "Paid",
            )
            .group_by(Doctor.doctor_name)
        )

        total = query.count()

        results = (
            query.order_by(desc("revenue"))
            .offset((page - 1) * limit)
            .limit(limit)
            .all()
        )

        return {
            "success": True,
            "total": total,
            "data": [dict(r._mapping) for r in results]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))