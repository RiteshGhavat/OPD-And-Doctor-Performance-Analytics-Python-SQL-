from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from database import get_db
from models.models import Patient
from models.schemas import PatientLogin
from auth_utils import verify_password, create_access_token

router = APIRouter(prefix="/login", tags=["Login"])


@router.post("/")
def login_user(user: PatientLogin, db: Session = Depends(get_db)):
    try:
        # Only allow active (flag="Show") and non-deleted users to login
        db_user = db.query(Patient).filter(
            Patient.email == user.email,
            Patient.flag == "Show",
            Patient.deleted_at.is_(None)
        ).first()

        if not db_user:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"status": "error", "message": "Invalid email or account is inactive"}
            )

        if not verify_password(user.password, db_user.hashed_password):
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"status": "error", "message": "Invalid password"}
            )

        token = create_access_token(
            data={"sub": db_user.email, "role": db_user.role}
        )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status":       "success",
                "message":      "Login successful",
                "access_token": token,
                "token_type":   "bearer",
                "role":         db_user.role
            }
        )

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"status": "error", "message": "Login failed", "details": str(e)}
        )