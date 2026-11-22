"""Extract router — /api/extract"""
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.extraction_service import (
    extract_text_from_pdf, extract_text_from_image, parse_form
)
from app.services.ai_service import explain_field

router = APIRouter()
logger = logging.getLogger(__name__)

ALLOWED_TYPES = {
    "application/pdf",
    "image/jpeg", "image/jpg", "image/png", "image/webp",
}

@router.post("/extract")
async def extract_form(file: UploadFile = File(...)):
    """
    Upload a PDF or image form.
    Returns structured field list with AI-generated plain-language explanations.
    """
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    file_bytes = await file.read()
    if len(file_bytes) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 20 MB)")

    # Extract raw text
    if file.content_type == "application/pdf":
        raw_text = extract_text_from_pdf(file_bytes)
    else:
        raw_text = extract_text_from_image(file_bytes)

    # Parse into structured form
    form_data = parse_form(raw_text, file.filename or "form")

    # Enrich fields with AI explanations (async, in parallel-ish)
    for field in form_data["fields"]:
        try:
            explanation = await explain_field(
                field["name"],
                field["original_instruction"],
                form_data["form_title"]
            )
            field["simple_explanation"] = explanation
        except Exception as e:
            logger.warning("Explanation failed for %s: %s", field["name"], e)

    return form_data
