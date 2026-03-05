from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from sqlalchemy.exc import SQLAlchemyError
from database import get_db
from models.models import OPDVisit, OPDBilling, Doctor, Patient, Branch

router = APIRouter(prefix="/admin/analytics", tags=["Analytics - Overview"])


# ── EXISTING OVERVIEW ─────────────────────────────────────────────────────────
@router.get("/overview")
def get_overview(db: Session = Depends(get_db)):
    try:
        total_visits = db.query(OPDVisit).filter(
            OPDVisit.flag == "Show",
            OPDVisit.deleted_at.is_(None)
        ).count()

        revenue = db.query(
            func.coalesce(func.sum(OPDBilling.total_amount), 0).label("gross"),
            func.coalesce(func.sum(OPDBilling.paid_amount),  0).label("paid")
        ).filter(OPDBilling.flag == "Show").one()

        active_doctors = db.query(Doctor).filter(
            Doctor.flag == "Show",
            Doctor.status == "Active",
            Doctor.deleted_at.is_(None)
        ).count()

        total_patients = db.query(Patient).filter(
            Patient.flag == "Show",
            Patient.deleted_at.is_(None)
        ).count()

        total_branches = db.query(Branch).filter(
            Branch.flag == "Show",
            Branch.deleted_at.is_(None)
        ).count()

        return {
            "total_visits":   total_visits,
            "gross_revenue":  float(revenue.gross),
            "paid_revenue":   float(revenue.paid),
            "active_doctors": active_doctors,
            "total_patients": total_patients,
            "total_branches": total_branches
        }

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── NEW VS FOLLOWUP ───────────────────────────────────────────────────────────
@router.get("/overview/new-vs-followup")
def new_vs_followup(branch_id: int = None, db: Session = Depends(get_db)):
    try:
        query = db.query(
            func.to_char(OPDVisit.visit_datetime, 'YYYY-MM').label("month"),
            Branch.branch_name,
            func.count(func.nullif(OPDVisit.consultation_type != 'New', True)).label("new_visits"),
            func.count(func.nullif(OPDVisit.consultation_type != 'Follow-up', True)).label("followup_visits"),
        ).join(Branch, OPDVisit.branch_id == Branch.branch_id)\
         .filter(OPDVisit.flag == "Show", OPDVisit.deleted_at.is_(None))

        if branch_id:
            query = query.filter(OPDVisit.branch_id == branch_id)

        results = query.group_by(
            func.to_char(OPDVisit.visit_datetime, 'YYYY-MM'),
            Branch.branch_name
        ).order_by(func.to_char(OPDVisit.visit_datetime, 'YYYY-MM')).all()

        return {"data": [
            {
                "month":           r.month,
                "branch_name":     r.branch_name,
                "new_visits":      r.new_visits or 0,
                "followup_visits": r.followup_visits or 0
            } for r in results
        ]}

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── MONTHLY REVENUE ───────────────────────────────────────────────────────────
@router.get("/overview/monthly-revenue")
def monthly_revenue(branch_id: int = None, db: Session = Depends(get_db)):
    try:
        query = db.query(
            func.to_char(OPDVisit.visit_datetime, 'YYYY-MM').label("month"),
            Branch.branch_name,
            func.coalesce(func.sum(OPDBilling.total_amount), 0).label("gross_revenue"),
            func.coalesce(func.sum(OPDBilling.paid_amount),  0).label("net_revenue"),
        ).join(OPDBilling, OPDVisit.visit_id == OPDBilling.visit_id)\
         .join(Branch, OPDVisit.branch_id == Branch.branch_id)\
         .filter(OPDVisit.flag == "Show", OPDVisit.deleted_at.is_(None))

        if branch_id:
            query = query.filter(OPDVisit.branch_id == branch_id)

        results = query.group_by(
            func.to_char(OPDVisit.visit_datetime, 'YYYY-MM'),
            Branch.branch_name
        ).order_by(func.to_char(OPDVisit.visit_datetime, 'YYYY-MM')).all()

        return {"data": [
            {
                "month":         r.month,
                "branch_name":   r.branch_name,
                "gross_revenue": float(r.gross_revenue),
                "net_revenue":   float(r.net_revenue)
            } for r in results
        ]}

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── AVG TICKET SIZE ───────────────────────────────────────────────────────────
@router.get("/overview/avg-ticket-size")
def avg_ticket_size(branch_id: int = None, db: Session = Depends(get_db)):
    try:
        query = db.query(
            OPDBilling.payment_mode,
            func.avg(OPDBilling.total_amount).label("avg_ticket")
        ).filter(OPDBilling.flag == "Show")

        if branch_id:
            query = query.join(OPDVisit, OPDBilling.visit_id == OPDVisit.visit_id)\
                         .filter(OPDVisit.branch_id == branch_id)

        results = query.group_by(OPDBilling.payment_mode).all()

        return {"data": [
            {
                "payment_mode": r.payment_mode,
                "avg_ticket":   float(r.avg_ticket)
            } for r in results
        ]}

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))