"""Check router — /api/check"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.services.ai_service import analyze_application

router = APIRouter()

class CheckRequest(BaseModel):
    form_data: dict

@router.post("/check")
async def check(req: CheckRequest):
    """
    Agentic AI: analyse form completeness.
    Returns score, missing fields, warnings and AI suggestions.
    """
    return await analyze_application(req.form_data)
