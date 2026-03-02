from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from datetime import date

from database import get_db
from models import Patient, OPDVisit
from role_checker import user_required

router = APIRouter(prefix="/user", tags=["User Dashboard"])


@router.get("/dashboard/")
def user_dashboard(
    db: Session = Depends(get_db),
    current_user: Patient = Depends(user_required)
):


    visits = (
        db.query(OPDVisit)
        .options(
            joinedload(OPDVisit.doctor),
            joinedload(OPDVisit.branch),
            joinedload(OPDVisit.diagnoses),
            joinedload(OPDVisit.prescriptions),
            joinedload(OPDVisit.billing)
        )
        .filter(OPDVisit.patient_id == current_user.patient_id)
        .all()
    )

    result = []

    for visit in visits:
        result.append({
            "visit_id": visit.visit_id,
            "visit_datetime": visit.visit_datetime,
            "consultation_type": visit.consultation_type,
            "visit_status": visit.visit_status,
            "token_number": visit.token_number,
            "follow_up_date": visit.follow_up_date,

            "doctor": {
                "id": visit.doctor.doctor_id if visit.doctor else None,
                "name": visit.doctor.doctor_name if visit.doctor else None,
                "specialization": visit.doctor.specialization if visit.doctor else None,
                "qualification": visit.doctor.qualification if visit.doctor else None,
                "experience": visit.doctor.experience_years if visit.doctor else None,
                "consultation_fee": float(visit.doctor.consultation_fee) if visit.doctor and visit.doctor.consultation_fee else 0
            },

            "branch": {
                "id": visit.branch.branch_id if visit.branch else None,
                "name": visit.branch.branch_name if visit.branch else None,
                "city": visit.branch.city if visit.branch else None,
                "address": visit.branch.address if visit.branch else None,
                "phone": visit.branch.phone if visit.branch else None,
            },

            "diagnosis": [
                {
                    "name": d.diagnosis_name,
                    "notes": d.notes
                }
                for d in visit.diagnoses
            ],

            "prescriptions": [
                {
                    "medicine": p.medicine_name,
                    "dose": p.dose,
                    "frequency": p.frequency,
                    "duration": p.duration_days,
                    "instructions": p.instructions
                }
                for p in visit.prescriptions
            ],

            "billing": {
                "invoice_number": visit.billing.invoice_number if visit.billing else None,
                "consultation_fee": float(visit.billing.consultation_fee) if visit.billing and visit.billing.consultation_fee else 0,
                "additional_charges": float(visit.billing.additional_charges) if visit.billing else 0,
                "discount": float(visit.billing.discount_amount) if visit.billing else 0,
                "total": float(visit.billing.total_amount) if visit.billing else 0,
                "paid": float(visit.billing.paid_amount) if visit.billing else 0,
                "payment_mode": visit.billing.payment_mode if visit.billing else None,
                "status": visit.billing.payment_status if visit.billing else None
            }
        })


    calculated_age = None

    if current_user.date_of_birth:
        today = date.today()
        calculated_age = (
            today.year - current_user.date_of_birth.year
            - (
                (today.month, today.day)
                < (current_user.date_of_birth.month, current_user.date_of_birth.day)
            )
        )


    return {
        "patient": {
            "id": current_user.patient_id,
            "name": current_user.name,
            "email": current_user.email,
            "phone": current_user.phone,
            "gender": current_user.gender,
            "date_of_birth": current_user.date_of_birth,
            "age": calculated_age,
            "address": current_user.address,
            "city": current_user.city,
            "pincode": current_user.pincode,
            "emergency_contact": current_user.emergency_contact,
            "created_at": current_user.created_at,
        },
        "visits": result
    }
    