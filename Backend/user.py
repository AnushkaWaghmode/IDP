from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import AspiringRole, User, UserProfile

router = APIRouter()


class ProfileUpsert(BaseModel):
    current_role: str | None = None
    aspiring_role: AspiringRole
    academic_details: str


@router.post("/profile")
def create_or_update_profile(
    payload: ProfileUpsert,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = current_user.profile

    if profile is None:
        profile = UserProfile(
            user_id=current_user.id,
            current_role=payload.current_role,
            aspiring_role=payload.aspiring_role,
            academic_details=payload.academic_details,
        )
        db.add(profile)
    else:
        profile.current_role = payload.current_role
        profile.aspiring_role = payload.aspiring_role
        profile.academic_details = payload.academic_details

    db.commit()
    db.refresh(profile)

    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "current_role": profile.current_role,
        "aspiring_role": profile.aspiring_role.value,
        "academic_details": profile.academic_details,
    }


@router.get("/profile")
def get_profile(current_user: User = Depends(get_current_user)):
    profile = current_user.profile
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "current_role": profile.current_role,
        "aspiring_role": profile.aspiring_role.value,
        "academic_details": profile.academic_details,
    }
