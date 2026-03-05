from sqlalchemy import (
    Column, BigInteger, Integer, String, Date,
    Text, Numeric, ForeignKey, TIMESTAMP
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


# ── PATIENT ──────────────────────────────────────────────────────────────────

class Patient(Base):
    __tablename__ = "patient"

    patient_id        = Column(BigInteger, primary_key=True, index=True)
    name              = Column(String(150), nullable=False)
    email             = Column(String(150), unique=True, index=True, nullable=False)
    phone             = Column(String(15))
    hashed_password   = Column(String(255))
    gender            = Column(String(10))
    date_of_birth     = Column(Date)
    address           = Column(Text)
    city              = Column(String(100))
    pincode           = Column(String(10))
    emergency_contact = Column(String(15))
    role              = Column(String(20), default="user")
    flag              = Column(String(10), default="Show")
    created_at        = Column(TIMESTAMP, server_default=func.now())
    updated_at        = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    deleted_at        = Column(TIMESTAMP, nullable=True)

    visits = relationship("OPDVisit", back_populates="patient", cascade="all, delete")


# ── BRANCH ───────────────────────────────────────────────────────────────────

class Branch(Base):
    __tablename__ = "branch"

    branch_id   = Column(BigInteger, primary_key=True, index=True)
    branch_name = Column(String(150), nullable=False)
    city        = Column(String(100))
    address     = Column(Text)
    phone       = Column(String(15))
    flag        = Column(String(10), default="Show")
    created_at  = Column(TIMESTAMP, server_default=func.now())
    updated_at  = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    deleted_at  = Column(TIMESTAMP, nullable=True)

    doctors = relationship("Doctor", back_populates="branch")
    visits  = relationship("OPDVisit", back_populates="branch")


# ── DOCTOR ───────────────────────────────────────────────────────────────────

class Doctor(Base):
    __tablename__ = "doctor"

    doctor_id        = Column(BigInteger, primary_key=True, index=True)
    branch_id        = Column(BigInteger, ForeignKey("branch.branch_id"), nullable=True)
    doctor_name      = Column(String(150), nullable=False)
    specialization   = Column(String(150))
    qualification    = Column(String(150))
    experience_years = Column(Integer)
    consultation_fee = Column(Numeric(10, 2))
    joining_date     = Column(Date)
    status           = Column(String(20))
    flag             = Column(String(10), default="Show")
    created_at       = Column(TIMESTAMP, server_default=func.now())
    updated_at       = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    deleted_at       = Column(TIMESTAMP, nullable=True)

    branch = relationship("Branch", back_populates="doctors")
    visits = relationship("OPDVisit", back_populates="doctor")


# ── OPD VISIT ────────────────────────────────────────────────────────────────

class OPDVisit(Base):
    __tablename__ = "opd_visit"

    visit_id          = Column(BigInteger, primary_key=True, index=True)
    patient_id        = Column(BigInteger, ForeignKey("patient.patient_id", ondelete="CASCADE"))
    doctor_id         = Column(BigInteger, ForeignKey("doctor.doctor_id",  ondelete="SET NULL"), nullable=True)
    branch_id         = Column(BigInteger, ForeignKey("branch.branch_id",  ondelete="SET NULL"), nullable=True)
    visit_datetime    = Column(TIMESTAMP, nullable=False)
    consultation_type = Column(String(20))
    visit_status      = Column(String(20), default="Scheduled")
    token_number      = Column(Integer)
    follow_up_date    = Column(Date)
    flag              = Column(String(10), default="Show")
    created_at        = Column(TIMESTAMP, server_default=func.now())
    updated_at        = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    deleted_at        = Column(TIMESTAMP, nullable=True)

    patient       = relationship("Patient",       back_populates="visits")
    doctor        = relationship("Doctor",        back_populates="visits")
    branch        = relationship("Branch",        back_populates="visits")
    diagnoses     = relationship("OPDDiagnosis",  back_populates="visit", cascade="all, delete")
    prescriptions = relationship("OPDPrescription", back_populates="visit", cascade="all, delete")
    billing       = relationship("OPDBilling",    back_populates="visit", uselist=False, cascade="all, delete")


# ── OPD DIAGNOSIS ────────────────────────────────────────────────────────────

class OPDDiagnosis(Base):
    __tablename__ = "opd_diagnosis"

    diagnosis_id   = Column(BigInteger, primary_key=True, index=True)
    visit_id       = Column(BigInteger, ForeignKey("opd_visit.visit_id", ondelete="CASCADE"))
    diagnosis_name = Column(String(255), nullable=False)
    notes          = Column(Text)
    flag           = Column(String(10), default="Show")
    created_at     = Column(TIMESTAMP, server_default=func.now())
    updated_at     = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    deleted_at     = Column(TIMESTAMP, nullable=True)

    visit = relationship("OPDVisit", back_populates="diagnoses")


# ── OPD PRESCRIPTION ─────────────────────────────────────────────────────────

class OPDPrescription(Base):
    __tablename__ = "opd_prescription"

    prescription_id = Column(BigInteger, primary_key=True, index=True)
    visit_id        = Column(BigInteger, ForeignKey("opd_visit.visit_id", ondelete="CASCADE"))
    medicine_name   = Column(String(255), nullable=False)
    dose            = Column(String(100))
    frequency       = Column(String(100))
    duration_days   = Column(Integer)
    instructions    = Column(Text)
    flag            = Column(String(10), default="Show")
    created_at      = Column(TIMESTAMP, server_default=func.now())
    updated_at      = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    deleted_at      = Column(TIMESTAMP, nullable=True)

    visit = relationship("OPDVisit", back_populates="prescriptions")


# ── OPD BILLING ──────────────────────────────────────────────────────────────

class OPDBilling(Base):
    __tablename__ = "opd_billing"

    bill_id            = Column(BigInteger, primary_key=True, index=True)
    visit_id           = Column(BigInteger, ForeignKey("opd_visit.visit_id", ondelete="CASCADE"), unique=True)
    invoice_number     = Column(String(100), unique=True)
    consultation_fee   = Column(Numeric(10, 2))
    additional_charges = Column(Numeric(10, 2), default=0)
    discount_amount    = Column(Numeric(10, 2), default=0)
    total_amount       = Column(Numeric(10, 2))
    paid_amount        = Column(Numeric(10, 2))
    payment_mode       = Column(String(20))
    payment_status     = Column(String(20), default="Pending")
    flag               = Column(String(10), default="Show")
    created_at         = Column(TIMESTAMP, server_default=func.now())
    updated_at         = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    deleted_at         = Column(TIMESTAMP, nullable=True)

    visit = relationship("OPDVisit", back_populates="billing")