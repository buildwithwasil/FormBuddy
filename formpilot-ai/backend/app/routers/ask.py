"""Ask router — /api/ask"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.services.ai_service import answer_question

router = APIRouter()

class AskRequest(BaseModel):
    question: str
    language: str = "en-IN"
    form_data: Optional[dict] = None

@router.post("/ask")
async def ask(req: AskRequest):
    """Answer a user's voice/text question about the form."""
    answer = await answer_question(req.question, req.language, req.form_data or {})
    return {"answer": answer, "language": req.language}
