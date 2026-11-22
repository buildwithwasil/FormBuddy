"""
FormPilot AI — Form extraction service.

Pipeline:
  1. PDF → extract text with PyMuPDF
  2. Image → extract text with Pillow + IBM Watson Visual Recognition (or OCR fallback)
  3. Heuristic field parser → structured field list
  4. Enrich each field with AI explanation via ai_service
"""
import re
import io
import logging
from typing import BinaryIO

logger = logging.getLogger(__name__)

# ── PDF text extraction ───────────────────────────────────────────────────────

def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(file_bytes))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
        return text
    except Exception as e:
        logger.warning("PDF extraction failed: %s", e)
        return ""


def extract_text_from_image(file_bytes: bytes) -> str:
    """Image OCR — requires pytesseract (optional). Falls back gracefully."""
    try:
        from PIL import Image
        import pytesseract
        img = Image.open(io.BytesIO(file_bytes))
        return pytesseract.image_to_string(img)
    except ImportError:
        logger.info("pytesseract/Pillow not installed; skipping image OCR")
        return ""
    except Exception as e:
        logger.warning("Image OCR failed: %s", e)
        return ""


# ── Heuristic field parser ────────────────────────────────────────────────────

FIELD_PATTERNS = [
    r"(?P<name>[A-Z][A-Za-z /()&'-]{3,50})\s*[:\*]",   # "Full Name :"
    r"\d+\.\s+(?P<name>[A-Z][A-Za-z /()&'-]{3,50})",   # "1. Date of Birth"
]

KNOWN_FIELDS = [
    ("Name", "text", True, "Personal Details"),
    ("Full Name", "text", True, "Personal Details"),
    ("Date of Birth", "date", True, "Personal Details"),
    ("Gender", "select", True, "Personal Details"),
    ("Aadhaar Number", "text", True, "Identity"),
    ("PAN Number", "text", False, "Identity"),
    ("Annual Family Income", "number", True, "Financial Details"),
    ("Caste Category", "select", True, "Personal Details"),
    ("Bank Account Number", "text", True, "Bank Details"),
    ("IFSC Code", "text", True, "Bank Details"),
    ("Mobile Number", "tel", True, "Contact"),
    ("Email Address", "email", False, "Contact"),
    ("Permanent Address", "textarea", True, "Address"),
    ("Course Name", "text", True, "Academic Details"),
    ("College Name", "text", True, "Academic Details"),
    ("Year of Study", "select", True, "Academic Details"),
    ("Previous Year Marks", "number", True, "Academic Details"),
    ("Passport Number", "text", True, "Travel Document"),
    ("Passport Expiry Date", "date", True, "Travel Document"),
    ("Nationality", "text", True, "Personal Details"),
    ("Purpose of Visit", "select", True, "Travel Details"),
    ("Port of Arrival", "text", True, "Travel Details"),
]

REQUIRED_DOCS_PATTERNS = [
    r"(?:attach|enclose|submit|upload|required documents?)[^\n]*\n((?:\s*[-•\d]+[.)]\s*.+\n?)+)",
    r"documents?\s+required[:\s]+((?:.+\n?){1,10})",
]

DEADLINE_PATTERN = r"(?:last\s+date|deadline|due\s+date|closing\s+date)[^\d]*(\d{1,2}[\s/-]\w+[\s/-]\d{2,4})"


def parse_form(raw_text: str, filename: str) -> dict:
    """Parse raw text into a structured form data dict."""
    text_lower = raw_text.lower()

    # Detect form type/title
    form_title = _detect_title(raw_text, filename)
    form_type = _detect_type(text_lower)

    # Extract fields
    fields = _extract_fields(raw_text, text_lower)

    # Deadline
    deadline_match = re.search(DEADLINE_PATTERN, raw_text, re.IGNORECASE)
    deadline = deadline_match.group(1) if deadline_match else None

    # Required documents
    required_docs = _extract_required_docs(raw_text)

    return {
        "form_title": form_title,
        "form_type": form_type,
        "total_fields": len(fields),
        "deadline": deadline,
        "fields": fields,
        "required_documents": required_docs,
        "warnings": [],
    }


def _detect_title(text: str, filename: str) -> str:
    first_lines = [l.strip() for l in text.split("\n") if l.strip()][:5]
    for line in first_lines:
        if len(line) > 10 and len(line) < 100:
            return line
    # Fallback: clean filename
    return filename.replace("_", " ").replace("-", " ").rsplit(".", 1)[0].title()


def _detect_type(text_lower: str) -> str:
    if any(w in text_lower for w in ["scholarship", "fellowship", "stipend"]): return "Government Scholarship"
    if any(w in text_lower for w in ["visa", "passport", "immigration"]): return "Government / Visa"
    if any(w in text_lower for w in ["admission", "enrollment", "college", "university"]): return "Educational"
    if any(w in text_lower for w in ["bank", "account", "kyc"]): return "Financial"
    if any(w in text_lower for w in ["hospital", "medical", "health"]): return "Medical"
    return "Government Form"


def _extract_fields(raw_text: str, text_lower: str) -> list:
    found = []
    seen_names = set()
    fid = 1

    for name, ftype, required, section in KNOWN_FIELDS:
        if name.lower() in text_lower or name.lower().replace(" ", "") in text_lower.replace(" ", ""):
            if name not in seen_names:
                found.append(_make_field(fid, name, ftype, required, section))
                seen_names.add(name)
                fid += 1

    # Pattern-based extraction
    for pattern in FIELD_PATTERNS:
        for m in re.finditer(pattern, raw_text):
            name = m.group("name").strip()
            if name not in seen_names and len(name) > 4:
                found.append(_make_field(fid, name, "text", False, "Other"))
                seen_names.add(name)
                fid += 1

    return found or _default_fields()


def _make_field(fid: int, name: str, ftype: str, required: bool, section: str) -> dict:
    return {
        "id": fid,
        "name": name,
        "type": ftype,
        "required": required,
        "section": section,
        "original_instruction": f"Please enter your {name.lower()}",
        "simple_explanation": f"Enter your {name.lower()} here.",
        "example": "",
        "filled": False,
        "value": "",
    }


def _extract_required_docs(text: str) -> list:
    docs = []
    for pattern in REQUIRED_DOCS_PATTERNS:
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            block = m.group(1)
            items = re.findall(r"[-•\d]+[.)]\s*(.+)", block)
            docs.extend([i.strip() for i in items if i.strip()])
    if not docs:
        # Guess from common form types
        text_l = text.lower()
        if "scholarship" in text_l:
            docs = ["Aadhaar card", "Caste certificate", "Income certificate", "Previous year marksheet", "Bank passbook", "Passport-size photograph"]
        elif "visa" in text_l:
            docs = ["Valid passport", "Passport-size photograph", "Flight tickets", "Hotel confirmation", "Bank statement"]
        else:
            docs = ["Identity proof (Aadhaar/PAN)", "Address proof", "Passport-size photograph"]
    return docs[:8]


def _default_fields() -> list:
    defaults = [
        ("Full Name", "text", True, "Personal Details"),
        ("Date of Birth", "date", True, "Personal Details"),
        ("Address", "textarea", True, "Contact"),
        ("Mobile Number", "tel", True, "Contact"),
    ]
    return [_make_field(i+1, n, t, r, s) for i, (n, t, r, s) in enumerate(defaults)]
