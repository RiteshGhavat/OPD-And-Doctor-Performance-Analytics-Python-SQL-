from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from database import get_db
from models.models import OPDVisit, OPDDiagnosis, OPDPrescription, OPDBilling, Patient
from role_checker import user_required

router = APIRouter(prefix="/user/dashboard", tags=["User Dashboard"])


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
                "name":   current_user.name,
                "email":  current_user.email,
                "phone":  current_user.phone,
                "gender": current_user.gender,
            },
            "total_visits":  total_visits,
            "recent_visits": visit_data
        }

    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))