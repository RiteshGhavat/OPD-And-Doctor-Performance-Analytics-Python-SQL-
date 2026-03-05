from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import func
from datetime import datetime

from database import get_db
from models.models import Branch

router = APIRouter(tags=["Branch"])


# ── PUBLIC DROPDOWN ──────────────────────────────────────────────────────────

@router.get("/branch")
def get_branches_dropdown(db: Session = Depends(get_db)):
    return (
        db.query(Branch)
        .filter(Branch.flag == "Show", Branch.deleted_at.is_(None))
        .order_by(Branch.branch_name)
        .all()
    )


# ── ADMIN: LIST WITH PAGINATION ──────────────────────────────────────────────

@router.get("/admin/branch")
def get_branches(
    page:  int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db:    Session = Depends(get_db)
):
    try:
        offset   = (page - 1) * limit
        base     = db.query(Branch).filter(Branch.flag == "Show", Branch.deleted_at.is_(None))
        total    = base.count()
        branches = base.order_by(Branch.branch_name).offset(offset).limit(limit).all()
        return {"total": total, "page": page, "limit": limit, "data": branches}
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── ADMIN: CREATE ────────────────────────────────────────────────────────────

@router.post("/admin/branch")
def create_branch(data: dict, db: Session = Depends(get_db)):
    try:
        exists = db.query(Branch).filter(
            func.lower(Branch.branch_name) == data["branch_name"].lower(),
            Branch.deleted_at.is_(None)
        ).first()

        if exists:
            raise HTTPException(status_code=400, detail="Branch name already exists")

        branch = Branch(
            branch_name=data["branch_name"],
            city=data.get("city"),
            address=data.get("address"),
            phone=data.get("phone"),
            flag="Show",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(branch)
        db.commit()
        db.refresh(branch)
        return {"message": "Branch created successfully", "branch_id": branch.branch_id}

    except HTTPException:
        raise
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# ── ADMIN: UPDATE ────────────────────────────────────────────────────────────

@router.put("/admin/branch/{branch_id}")
def update_branch(branch_id: int, data: dict, db: Session = Depends(get_db)):
    branch = db.query(Branch).filter(
        Branch.branch_id == branch_id,
        Branch.flag == "Show",
        Branch.deleted_at.is_(None)
    ).first()

    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    if "branch_name" in data:
        exists = db.query(Branch).filter(
            func.lower(Branch.branch_name) == data["branch_name"].lower(),
            Branch.branch_id != branch_id,
            Branch.deleted_at.is_(None)
        ).first()
        if exists:
            raise HTTPException(status_code=400, detail="Branch name already exists")

    for key, value in data.items():
        if hasattr(branch, key):
            setattr(branch, key, value)

    branch.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Branch updated successfully"}


# ── ADMIN: SOFT DELETE ───────────────────────────────────────────────────────

@router.post("/admin/branch/{branch_id}/soft-delete")
def soft_delete_branch(branch_id: int, db: Session = Depends(get_db)):
    branch = db.query(Branch).filter(
        Branch.branch_id == branch_id,
        Branch.flag == "Show",
        Branch.deleted_at.is_(None)
    ).first()

    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    branch.flag       = "Delete"
    branch.deleted_at = datetime.utcnow()
    branch.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Branch deleted successfully"}