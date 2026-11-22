"""
Profile service — reads and writes user profile as a Markdown file.
This is the "database". One profile.md per user (single-user for now).
All form answers learned during chat are merged back into the profile.
"""
import os
import re
import json
import logging
from datetime import datetime
from pathlib import Path

logger = logging.getLogger(__name__)

PROFILES_DIR = Path(__file__).parent.parent.parent / "profiles"
PROFILES_DIR.mkdir(exist_ok=True)
PROFILE_PATH = PROFILES_DIR / "profile.md"

# ── Schema: all fields FormBuddy knows about ─────────────────────────────────

PROFILE_SCHEMA = {
    # section → {key: label}
    "Personal Details": {
        "full_name":    "Full Name",
        "dob":          "Date of Birth",
        "gender":       "Gender",
        "email":        "Email",
        "phone":        "Phone",
        "nationality":  "Nationality",
    },
    "Identity Documents": {
        "aadhaar":          "Aadhaar Number",
        "pan":              "PAN Number",
        "passport_number":  "Passport Number",
        "passport_expiry":  "Passport Expiry",
        "caste_category":   "Caste Category",
        "voter_id":         "Voter ID",
        "driving_licence":  "Driving Licence",
    },
    "Address": {
        "address_line1": "Address Line 1",
        "address_line2": "Address Line 2",
        "city":          "City",
        "state":         "State",
        "pincode":       "PIN Code",
        "country":       "Country",
    },
    "Financial Details": {
        "bank_account":   "Bank Account Number",
        "ifsc":           "IFSC Code",
        "bank_name":      "Bank Name",
        "annual_income":  "Annual Family Income",
        "upi_id":         "UPI ID",
    },
    "Academic / Professional": {
        "occupation":     "Occupation",
        "organisation":   "Organisation",
        "course_name":    "Course Name",
        "institution":    "Institution",
        "year_of_study":  "Year of Study",
        "percentage":     "Previous Year Percentage",
    },
    "Preferences": {
        "language":       "Preferred Language",
        "hosteller":      "Hosteller or Day Scholar",
    },
}

# Flat map: key → label (for quick lookup)
KEY_TO_LABEL = {k: v for section in PROFILE_SCHEMA.values() for k, v in section.items()}
LABEL_TO_KEY = {v.lower(): k for k, v in KEY_TO_LABEL.items()}


# ── Read ──────────────────────────────────────────────────────────────────────

def load_profile() -> dict:
    """Parse profile.md → Python dict."""
    if not PROFILE_PATH.exists():
        return {}

    text = PROFILE_PATH.read_text(encoding="utf-8")
    profile = {}

    # Parse "- **Label:** value" lines
    for m in re.finditer(r"-\s*\*\*([^*]+)\*\*:\s*(.*)", text):
        label = m.group(1).strip()
        value = m.group(2).strip()
        if value and value != "—":
            key = LABEL_TO_KEY.get(label.lower())
            if key:
                profile[key] = value

    return profile


# ── Write ─────────────────────────────────────────────────────────────────────

def save_profile(profile: dict) -> None:
    """Merge new values into profile.md. Existing values not in `profile` are preserved."""
    existing = load_profile()
    merged = {**existing, **{k: v for k, v in profile.items() if v and v.strip()}}
    PROFILE_PATH.write_text(_render_markdown(merged), encoding="utf-8")
    logger.info("Profile saved → %s", PROFILE_PATH)


def update_field(key: str, value: str) -> bool:
    """Update a single field. Returns True if key is known."""
    if key not in KEY_TO_LABEL:
        return False
    profile = load_profile()
    profile[key] = value.strip()
    save_profile(profile)
    return True


# ── Render ────────────────────────────────────────────────────────────────────

def _render_markdown(profile: dict) -> str:
    lines = [
        "# FormBuddy User Profile",
        f"_Last updated: {datetime.now().strftime('%d %b %Y, %H:%M')}_",
        "",
    ]
    for section, fields in PROFILE_SCHEMA.items():
        lines.append(f"## {section}")
        for key, label in fields.items():
            val = profile.get(key, "")
            lines.append(f"- **{label}:** {val or '—'}")
        lines.append("")
    return "\n".join(lines)


def profile_as_text(profile: dict) -> str:
    """Compact text summary for use in AI prompts."""
    parts = []
    for section, fields in PROFILE_SCHEMA.items():
        section_parts = []
        for key, label in fields.items():
            val = profile.get(key, "")
            if val:
                section_parts.append(f"{label}: {val}")
        if section_parts:
            parts.append(f"[{section}] " + " | ".join(section_parts))
    return "\n".join(parts) if parts else "No profile data saved yet."


def missing_fields(profile: dict) -> list[dict]:
    """Return list of unfilled fields: [{key, label, section}]"""
    result = []
    for section, fields in PROFILE_SCHEMA.items():
        for key, label in fields.items():
            if not profile.get(key, "").strip():
                result.append({"key": key, "label": label, "section": section})
    return result


def get_profile_md() -> str:
    """Return raw markdown string."""
    if not PROFILE_PATH.exists():
        return _render_markdown({})
    return PROFILE_PATH.read_text(encoding="utf-8")
