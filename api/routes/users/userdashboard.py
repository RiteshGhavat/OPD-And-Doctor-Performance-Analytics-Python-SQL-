from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime

from database import get_db
from models.models import OPDVisit, OPDDiagnosis, OPDPrescription, OPDBilling, Patient, Doctor, Branch
from role_checker import user_required

router = APIRouter(prefix="/user/dashboard", tags=["User Dashboard"])


# ── DASHBOARD ─────────────────────────────────────────────────────────────────
@router.get("/", status_code=status.HTTP_200_OK)
def user_dashboard(
    db:           Session = Depends(get_db),
    current_user: Patient = Depends(user_required)
):
    try:
        visits = (
            db.query(OPDVisit)
            .filter(
                OPDVisit.patient_id == current_user.patient_id,
                OPDVisit.flag == "Show",
                OPDVisit.deleted_at.is_(None)
            )
            .order_by(OPDVisit.visit_datetime.desc())
            .limit(10)
            .all()
        )

        visit_data = []
        for v in visits:
            diagnoses = (
                db.query(OPDDiagnosis.diagnosis_name)
                .filter(OPDDiagnosis.visit_id == v.visit_id, OPDDiagnosis.flag == "Show")
                .all()
            )
            prescriptions = (
                db.query(
                    OPDPrescription.medicine_name,
                    OPDPrescription.dose,
                    OPDPrescription.duration_days
                )
                .filter(OPDPrescription.visit_id == v.visit_id, OPDPrescription.flag == "Show")
                .all()
            )
            billing = (
                db.query(OPDBilling)
                .filter(OPDBilling.visit_id == v.visit_id, OPDBilling.flag == "Show")
                .first()
            )

            visit_data.append({
                "visit_id":          v.visit_id,
                "visit_datetime":    str(v.visit_datetime),
                "consultation_type": v.consultation_type,
                "visit_status":      v.visit_status,
                "doctor_name":       v.doctor.doctor_name if v.doctor else None,
                "branch_name":       v.branch.branch_name if v.branch else None,
                "diagnoses":         [d.diagnosis_name for d in diagnoses],
                "prescriptions": [
                    {"medicine": p.medicine_name, "dose": p.dose, "days": p.duration_days}
                    for p in prescriptions
                ],
                "billing": {
                    "total_amount":   float(billing.total_amount)  if billing else None,
                    "paid_amount":    float(billing.paid_amount)   if billing else None,
                    "payment_status": billing.payment_status       if billing else None,
                } if billing else None
            })

        total_visits = db.query(OPDVisit).filter(
            OPDVisit.patient_id == current_user.patient_id,
            OPDVisit.flag == "Show"
        ).count()

        return {
            "patient": {
                "name":    current_user.name,
                "email":   current_user.email,
                "phone":   current_user.phone,
                "gender":  current_user.gender,
                "address": current_user.address,
                "city":    current_user.city,
            },
            "total_visits":  total_visits,
            "recent_visits": visit_data
        }

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── GET BRANCHES (for booking form) ──────────────────────────────────────────
@router.get("/branches")
def get_branches(db: Session = Depends(get_db), current_user: Patient = Depends(user_required)):
    try:
        branches = db.query(Branch).filter(
            Branch.flag == "Show",
            Branch.deleted_at.is_(None)
        ).all()
        return [{"branch_id": b.branch_id, "branch_name": b.branch_name} for b in branches]
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── GET DOCTORS BY BRANCH (for booking form) ─────────────────────────────────
@router.get("/doctors")
def get_doctors(
    branch_id: int,
    db: Session = Depends(get_db),
    current_user: Patient = Depends(user_required)
):
    try:
        doctors = db.query(Doctor).filter(
            Doctor.branch_id == branch_id,
            Doctor.flag == "Show",
            Doctor.status == "Active",
            Doctor.deleted_at.is_(None)
        ).all()
        return [
            {
                "doctor_id":       d.doctor_id,
                "doctor_name":     d.doctor_name,
                "specialization":  d.specialization,
                "consultation_fee": float(d.consultation_fee) if d.consultation_fee else 0
            }
            for d in doctors
        ]
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── BOOK OPD ──────────────────────────────────────────────────────────────────
@router.post("/book", status_code=status.HTTP_201_CREATED)
def book_opd(
    payload:      dict,
    db:           Session = Depends(get_db),
    current_user: Patient = Depends(user_required)
):
    try:
        visit_datetime = datetime.fromisoformat(payload.get("visit_datetime"))

        new_visit = OPDVisit(
            patient_id=current_user.patient_id,
            doctor_id=payload.get("doctor_id"),
            branch_id=payload.get("branch_id"),
            visit_datetime=visit_datetime,
            consultation_type=payload.get("consultation_type", "New"),
            visit_status="Scheduled",
            flag="Show",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        db.add(new_visit)
        db.commit()
        db.refresh(new_visit)

        return {
            "status":   "success",
            "message":  "OPD appointment booked successfully!",
            "visit_id": new_visit.visit_id
        }

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))