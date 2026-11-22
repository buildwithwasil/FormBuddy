"""Router: /api/fill — silent extension calls this to get fill instructions"""
from fastapi import APIRouter
from pydantic import BaseModel
from app.services.ai_service import fill_form
from app.services.profile_service import load_profile, profile_as_text

router = APIRouter()

class FillRequest(BaseModel):
    fields: list  # [{label, name, id, type, placeholder, options?}]

@router.post("/fill")
async def fill_endpoint(req: FillRequest):
    profile = load_profile()
    if not profile:
        return {"matches": [], "source": "none", "error": "No profile saved yet."}

    matches = await fill_form(
        fields=req.fields,
        profile=profile,
        profile_text=profile_as_text(profile),
    )

    source = "gemini" if matches else "rules"
    return {"matches": matches, "source": source}
