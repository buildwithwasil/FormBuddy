"""
FormBuddy AI — Gemini 1.5 Flash service layer.

Functions:
  gemini_generate()    — raw Gemini call
  explain_field()      — plain-language field explanation
  answer_question()    — Q&A about a form
  analyze_application()— completeness check + suggestions
  chat()               — conversational assistant, reads/learns profile
  fill_form()          — match page fields to profile, return fill instructions
"""
import os
import re
import logging
import httpx

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL   = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
GEMINI_URL     = (
    f"https://generativelanguage.googleapis.com/v1beta/models"
    f"/{GEMINI_MODEL}:generateContent"
)


# ── Core Gemini call ──────────────────────────────────────────────────────────

async def gemini_generate(prompt: str, max_tokens: int = 600) -> str | None:
    if not GEMINI_API_KEY:
        logger.info("GEMINI_API_KEY not set — demo/fallback mode")
        return None
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{GEMINI_URL}?key={GEMINI_API_KEY}",
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "maxOutputTokens": max_tokens,
                        "temperature": 0.3,
                        "topP": 0.9,
                    },
                },
                headers={"Content-Type": "application/json"},
            )
            resp.raise_for_status()
            return resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
    except Exception as e:
        logger.warning("Gemini failed: %s", e)
        return None


# ── Field explanation ─────────────────────────────────────────────────────────

async def explain_field(field_name: str, original_instruction: str, form_title: str) -> str:
    prompt = f"""You are FormBuddy AI helping users understand government forms.
Form: {form_title}
Field: "{field_name}"
Official instruction: "{original_instruction}"
Write a simple 1-2 sentence explanation of what to enter. No jargon. Add a brief example.
Reply with ONLY the explanation."""
    return await gemini_generate(prompt, 150) or _fallback_explanation(field_name)


def _fallback_explanation(field_name: str) -> str:
    n = field_name.lower()
    if "aadhaar" in n: return "Your 12-digit Aadhaar card number, used for identity verification and direct money transfer."
    if "pan" in n: return "Your 10-character Permanent Account Number (e.g. ABCDE1234F) from your PAN card."
    if "ifsc" in n: return "The 11-character bank branch code (e.g. SBIN0012345) found on your passbook or cheque."
    if "income" in n: return "Total yearly earnings of all family members. Enter the amount on your income certificate."
    if "passport" in n and "number" in n: return "The unique number on your passport data page (e.g. A1234567)."
    if "caste" in n: return "Your category as on your caste certificate — SC, ST, OBC or General."
    if "mobile" in n or "phone" in n: return "Your active 10-digit mobile number."
    if "email" in n: return "Your email address for correspondence and OTPs."
    return f"Enter your {field_name.lower()} as required by the form."


# ── Form Q&A ──────────────────────────────────────────────────────────────────

async def answer_question(question: str, language: str, form_context: dict) -> str:
    fields_summary = "\n".join(
        f"- {f['name']}: {f.get('simple_explanation', '')}"
        for f in form_context.get("fields", [])[:12]
    )
    docs = "\n".join(f"- {d}" for d in form_context.get("required_documents", []))
    lang_name = {"kn-IN": "Kannada (ಕನ್ನಡ)", "hi-IN": "Hindi (हिंदी)"}.get(language, "English")

    prompt = f"""You are FormBuddy AI. Answer in {lang_name}.
Form: {form_context.get('form_title','Government Form')}
Fields: {fields_summary}
Documents: {docs}
Question: {question}
Answer clearly in 2-3 sentences. Reply ONLY in {lang_name}."""

    return await gemini_generate(prompt, 250) or "Please ask about a specific field or document."


# ── Application completeness check ───────────────────────────────────────────

async def analyze_application(form_data: dict) -> dict:
    fields = form_data.get("fields", [])
    missing = [
        {"name": f["name"], "section": f.get("section",""), "hint": f.get("simple_explanation","Required.")}
        for f in fields if f.get("required") and not str(f.get("value","")).strip()
    ]
    score = max(10, int(((len(fields) - len(missing)) / max(len(fields), 1)) * 100))

    filled_ctx = "\n".join(f"{f['name']}: {f['value']}" for f in fields if str(f.get("value","")).strip()) or "None"
    prompt = f"""Form: {form_data.get('form_title','Government Form')}
Filled: {filled_ctx}
Missing: {', '.join(f['name'] for f in missing) or 'None'}
Give 3-4 numbered practical tips for successful submission."""

    tips_raw = await gemini_generate(prompt, 300)
    suggestions = _parse_tips(tips_raw) if tips_raw else _default_suggestions()

    warnings = []
    if missing:
        warnings.append(f"{len(missing)} required field(s) empty — application may be rejected.")
    if form_data.get("deadline"):
        warnings.append(f"Deadline: {form_data['deadline']} — apply early.")

    return {
        "score": score,
        "missing_fields": missing,
        "warnings": warnings,
        "suggestions": suggestions,
        "checklist": [{"item": d, "done": False} for d in form_data.get("required_documents", [])],
    }


def _parse_tips(raw: str) -> list:
    lines = [l.strip().lstrip("0123456789.-) ").strip() for l in raw.split("\n") if l.strip()]
    return [l for l in lines if len(l) > 15][:4]

def _default_suggestions() -> list:
    return [
        "Ensure your name matches exactly across Aadhaar, marksheet and caste certificate.",
        "Income certificates older than 6 months are often rejected — get a fresh one.",
        "Keep scanned PDFs of all documents ready; portals require digital uploads.",
        "Screenshot your confirmation page and save the reference number.",
    ]


# ── Chat assistant (learns from conversation, saves to profile) ───────────────

_CHAT_SYSTEM = """You are FormBuddy AI — a friendly assistant that helps users fill government, scholarship, visa and institutional forms.

You have access to the user's saved profile. Use it to answer questions.
If the user tells you something NEW (name, Aadhaar, address, income, etc.), extract it and add this block at the very end of your reply:
<LEARNED>{"key": "value", "key2": "value2"}</LEARNED>

Valid keys: full_name, dob, gender, email, phone, nationality, aadhaar, pan, passport_number, passport_expiry, caste_category, voter_id, driving_licence, address_line1, address_line2, city, state, pincode, country, bank_account, ifsc, bank_name, annual_income, upi_id, occupation, organisation, course_name, institution, year_of_study, percentage, language, hosteller

Rules:
- Short friendly replies. Ask ONE question at a time when you need missing info.
- Only include <LEARNED> when the user just gave you new data.
- Never invent or assume data."""


async def chat(message: str, history: list, profile_text: str, language: str = "en") -> dict:
    """
    Returns {"answer": str, "learned": dict}
    learned = new facts to save to the profile .md file
    """
    lang_note = {
        "kn": "Reply in Kannada (ಕನ್ನಡ).",
        "hi": "Reply in Hindi (हिंदी).",
    }.get(language, "")

    history_block = "".join(
        f"{'User' if t['role']=='user' else 'Assistant'}: {t['content']}\n"
        for t in history[-10:]
    )

    prompt = f"""{_CHAT_SYSTEM}
{lang_note}

## User Profile
{profile_text}

## Conversation
{history_block}User: {message}
Assistant:"""

    raw = await gemini_generate(prompt, 500)

    if not raw:
        raw = _fallback_chat(message, profile_text)

    # Extract <LEARNED> block
    learned = {}
    match = re.search(r"<LEARNED>(.*?)</LEARNED>", raw, re.DOTALL)
    if match:
        try:
            learned = __import__("json").loads(match.group(1).strip())
        except Exception:
            learned = {}
        raw = raw[:match.start()].strip()

    return {"answer": raw, "learned": learned}


def _fallback_chat(message: str, profile_text: str) -> str:
    m = message.lower()
    if any(w in m for w in ["hello", "hi", "help", "start"]):
        return "Hello! I'm FormBuddy AI. I can help you fill any government or scholarship form. What form are you working on today?"
    if any(w in m for w in ["document", "papers", "need"]):
        return "The required documents depend on the form type. Tell me which form you're filling and I'll list exactly what you need."
    if any(w in m for w in ["aadhaar", "aadhar"]):
        return "Your Aadhaar is a 12-digit number on your Aadhaar card. It's mandatory for most government forms and scholarship applications."
    if any(w in m for w in ["income", "salary", "earning"]):
        return "Annual family income means the total yearly earnings of all members in your household. You'll find this on the income certificate issued by your Tahsildar."
    return "I'm here to help you fill forms. Ask me about any field, required documents, eligibility, or just tell me which form you're working on!"


# ── Form fill matching (called by extension) ─────────────────────────────────

async def fill_form(fields: list, profile: dict, profile_text: str) -> list:
    """
    Given a list of page fields and the user profile, return
    [{index, value}] fill instructions.
    Uses Gemini for smart matching, falls back to rules.
    """
    if not fields:
        return []

    field_list = "\n".join(
        f"{i}. label=\"{f.get('label','')}\" name=\"{f.get('name','')}\" "
        f"id=\"{f.get('id','')}\" type=\"{f.get('type','')}\" placeholder=\"{f.get('placeholder','')}\""
        for i, f in enumerate(fields)
    )

    prompt = f"""You are FormBuddy AI filling a web form automatically.

## User Profile
{profile_text}

## Form Fields on Page
{field_list}

For each field index above, return the value from the profile that should be filled.
Return ONLY a JSON array like: [{{"index": 0, "value": "Rahul Sharma"}}, ...]
Skip fields you are not confident about. Do NOT guess passwords or OTPs.
No markdown fences. JSON only."""

    raw = await gemini_generate(prompt, 600)
    if raw:
        try:
            cleaned = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
            result = __import__("json").loads(cleaned)
            if isinstance(result, list):
                return result
        except Exception as e:
            logger.warning("fill_form JSON parse failed: %s", e)

    # Rule-based fallback
    return _rule_fill(fields, profile)


def _rule_fill(fields: list, profile: dict) -> list:
    def norm(s): return re.sub(r"[^a-z0-9]", "", (s or "").lower())

    MAP = [
        (["fullname","applicantname","name","yourname"], "full_name"),
        (["email","emailaddress","emailid"], "email"),
        (["phone","mobile","mobileno","mobilenumber","contactno"], "phone"),
        (["dob","dateofbirth","birthdate"], "dob"),
        (["gender"], "gender"),
        (["aadhaar","aadhaarnumber","aadhaarno","uid"], "aadhaar"),
        (["pan","pannumber","permanentaccount"], "pan"),
        (["passportnumber","passportno"], "passport_number"),
        (["passportexpiry","passportexpirydate"], "passport_expiry"),
        (["nationality","citizen"], "nationality"),
        (["addressline1","address","permanentaddress","streetaddress"], "address_line1"),
        (["addressline2","area","apt"], "address_line2"),
        (["city","town"], "city"),
        (["state","province"], "state"),
        (["pincode","pin","postalcode","zipcode"], "pincode"),
        (["country"], "country"),
        (["bankaccount","accountnumber","accno"], "bank_account"),
        (["ifsc","ifsccode"], "ifsc"),
        (["bankname"], "bank_name"),
        (["annualincome","income","familyincome"], "annual_income"),
        (["occupation","profession"], "occupation"),
        (["organisation","company","employer","college","university","institution"], "organisation"),
        (["coursename","course","programme"], "course_name"),
        (["yearofstudy","currentyear","year"], "year_of_study"),
        (["caste","castecategory","category"], "caste_category"),
        (["voterId","voterid"], "voter_id"),
    ]

    results = []
    for i, field in enumerate(fields):
        combined = norm(field.get("label","")) + norm(field.get("name","")) + norm(field.get("id","")) + norm(field.get("placeholder",""))
        for keys, profile_key in MAP:
            if any(k in combined for k in keys):
                val = profile.get(profile_key, "")
                if val:
                    results.append({"index": i, "value": str(val)})
                    break
    return results
