"""Router: /api/profile — read, write, and get markdown of user profile"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.services.profile_service import (
    load_profile, save_profile, get_profile_md, missing_fields
)

router = APIRouter()

class ProfileUpdateRequest(BaseModel):
    profile: dict

@router.get("/profile")
def get_profile():
    profile = load_profile()
    return {
        "profile": profile,
        "missing": missing_fields(profile),
        "filled_count": len([v for v in profile.values() if v]),
    }

@router.post("/profile")
def update_profile(req: ProfileUpdateRequest):
    save_profile(req.profile)
    profile = load_profile()
    return {
        "ok": True,
        "profile": profile,
        "missing": missing_fields(profile),
    }

@router.get("/profile/md")
def get_profile_markdown():
    return {"markdown": get_profile_md()}
