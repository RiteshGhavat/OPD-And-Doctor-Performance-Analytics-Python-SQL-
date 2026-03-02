from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import SessionLocal
from models import schemas, models
from auth_utils import verify_password, create_access_token
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/login", tags=["Login"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/")
def login_user(user: schemas.PatientLogin, db: Session = Depends(get_db)):
    try:
        db_user = db.query(models.Patient).filter(
            models.Patient.email == user.email
        ).first()

        if not db_user:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "status": "error",
                    "message": "Invalid email"
                }
            )

        if not verify_password(user.password, db_user.hashed_password):
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "status": "error",
                    "message": "Invalid password"
                }
            )

        token = create_access_token(
            data={
                "sub": db_user.email,
                "role": db_user.role
            }
        )

        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "status": "success",
                "message": "Login successful",
                "access_token": token,
                "token_type": "bearer",
                "role": db_user.role
            }
        )

    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": "error",
                "message": "Login failed",
                "details": str(e)
            }
        )