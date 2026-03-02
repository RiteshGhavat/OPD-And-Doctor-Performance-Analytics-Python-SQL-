from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
import re

# PATIENT SCHEMAS (PUBLIC REGISTER)

class PatientRegister(BaseModel):
    name: str = Field(..., min_length=3, max_length=150)
    email: EmailStr
    phone: str
    password: str = Field(..., min_length=6)
    gender: str
    date_of_birth: date
    address: str = Field(..., min_length=5)
    city: str = Field(..., min_length=2)
    pincode: str
    emergency_contact: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        if not re.fullmatch(r"\d{10}", v):
            raise ValueError("Phone number must be exactly 10 digits")
        return v

    @field_validator("emergency_contact")
    @classmethod
    def validate_emergency_contact(cls, v):
        if not re.fullmatch(r"\d{10}", v):
            raise ValueError("Emergency contact must be exactly 10 digits")
        return v

    @field_validator("pincode")
    @classmethod
    def validate_pincode(cls, v):
        if not re.fullmatch(r"\d{6}", v):
            raise ValueError("Pincode must be exactly 6 digits")
        return v

    @field_validator("gender")
    @classmethod
    def validate_gender(cls, v):
        if v not in {"Male", "Female", "Other"}:
            raise ValueError("Gender must be Male, Female, or Other")
        return v

    @field_validator("date_of_birth")
    @classmethod
    def validate_dob(cls, v):
        if v >= date.today():
            raise ValueError("Date of birth must be in the past")
        return v

    model_config = {"from_attributes": True}


# BRANCH SCHEMAS

class BranchBase(BaseModel):
    branch_name: str
    city: Optional[str]


class BranchCreate(BranchBase):
    pass


class BranchResponse(BranchBase):
    branch_id: int

    class Config:
        from_attributes = True



# DOCTOR SCHEMAS

class DoctorBase(BaseModel):
    branch_id: int
    doctor_name: str
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    consultation_fee: Optional[float] = None
    joining_date: Optional[date] = None
    status: Optional[str] = "Active"


class DoctorCreate(DoctorBase):
    pass


class DoctorUpdate(BaseModel):
    branch_id: Optional[int] = None
    doctor_name: Optional[str] = None
    specialization: Optional[str] = None
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    consultation_fee: Optional[float] = None
    joining_date: Optional[date] = None
    status: Optional[str] = None


class DoctorResponse(DoctorBase):
    doctor_id: int
    branch_name: Optional[str] = None

    class Config:
        orm_mode = True



# OPD VISIT SCHEMAS


class OPDVisitBase(BaseModel):
    patient_id: int
    doctor_id: int
    branch_id: int
    visit_datetime: datetime
    consultation_type: Optional[str] = "New"


class OPDVisitCreate(OPDVisitBase):
    pass


class OPDVisitResponse(OPDVisitBase):
    visit_id: int

    class Config:
        from_attributes = True



# DIAGNOSIS SCHEMAS


class DiagnosisBase(BaseModel):
    visit_id: int
    diagnosis_name: str


class DiagnosisCreate(DiagnosisBase):
    pass


class DiagnosisResponse(DiagnosisBase):
    diagnosis_id: int

    class Config:
        from_attributes = True


# PRESCRIPTION SCHEMAS


class PrescriptionBase(BaseModel):
    visit_id: int
    medicine_name: str
    dose: Optional[str]
    duration_days: Optional[int]


class PrescriptionCreate(PrescriptionBase):
    pass


class PrescriptionResponse(PrescriptionBase):
    prescription_id: int

    class Config:
        from_attributes = True



# BILLING SCHEMAS


class BillingBase(BaseModel):
    visit_id: int
    consultation_fee: Decimal
    additional_charges: Optional[Decimal] = 0
    discount_amount: Optional[Decimal] = 0
    payment_mode: str


class BillingCreate(BillingBase):
    pass


class BillingResponse(BillingBase):
    bill_id: int
    total_amount: Decimal
    paid_amount: Decimal

    class Config:
        from_attributes = True



# BULK INSERT


class BulkVisitCreate(BaseModel):
    visits: List[OPDVisitCreate]


# ANALYTICS RESPONSES


class DoctorLoadResponse(BaseModel):
    branch_name: str
    doctor_name: str
    total_visits: int


class RevenueResponse(BaseModel):
    branch_name: str
    month: str
    gross_revenue: Decimal
    net_revenue: Decimal


class DiagnosisAnalyticsResponse(BaseModel):
    specialization: str
    diagnosis_name: str
    total_count: int


class PaymentAnalyticsResponse(BaseModel):
    payment_mode: str
    avg_ticket_size: Decimal


class PeakHourResponse(BaseModel):
    branch_name: str
    hour: int
    total_visits: int



# LOGIN SCHEMA

class PatientLogin(BaseModel):
    email: EmailStr
    password: str



#  ADMIN USER SCHEMAS (ADDED)


class AdminPatientCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(..., min_length=6)
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    emergency_contact: Optional[str] = None


class AdminPatientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    address: Optional[str] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    emergency_contact: Optional[str] = None