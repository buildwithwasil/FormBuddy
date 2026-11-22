"""Router: /api/chat — AI assistant with profile context, learns new facts"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.services.ai_service import chat
from app.services.profile_service import load_profile, save_profile, profile_as_text

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    history: list = []
    language: str = "en"

@router.post("/chat")
async def chat_endpoint(req: ChatRequest):
    profile = load_profile()
    profile_text = profile_as_text(profile)

    result = await chat(
        message=req.message,
        history=req.history,
        profile_text=profile_text,
        language=req.language,
    )

    # Save anything new the assistant learned from this turn
    if result.get("learned"):
        save_profile(result["learned"])

    return {
        "answer": result["answer"],
        "learned": result.get("learned", {}),
        "profile_updated": bool(result.get("learned")),
    }
