# FormBuddy AI 🪄
### Smart AI Agent Chrome Extension — Auto-fills any web form using your saved profile

Powered by **Google Gemini 1.5 Flash** · Works offline with rule-based fallback · Profile stored as Markdown

---

## What it does

FormBuddy AI is a Chrome extension that:

1. **Detects** every fillable field on any webpage (input, select, textarea)
2. **Matches** fields to your saved profile using Gemini AI or smart rule-based logic
3. **Fills** the form instantly — works with React, Angular, Vue and plain HTML forms
4. **Speaks 3 languages** — English, Kannada (ಕನ್ನಡ), Hindi (हिंदी)

---

## Install in Chrome (Developer Mode)

```bash
# 1. Clone or download this folder
cd formbuddy-extension/

# 2. Open Chrome → chrome://extensions/
# 3. Enable "Developer mode" (top-right toggle)
# 4. Click "Load unpacked"
# 5. Select this folder (formbuddy-extension/)
# 6. The FormBuddy icon appears in your toolbar ✓
```

---

## First-time Setup

1. The setup page opens automatically on first install
2. Fill in your personal details across 5 sections:
   - 👤 Personal (name, email, phone, DOB)
   - 🪪 Identity (Aadhaar, PAN, Passport)
   - 📍 Address (city, state, PIN)
   - 🏦 Financial (bank account, IFSC)
   - 🎓 Academic (course, institution, year)
3. Add your **Gemini API key** (optional but recommended — free at [aistudio.google.com](https://aistudio.google.com/app/apikey))
4. Click **Save Profile** ✓

---

## Using FormBuddy on a Form

1. Navigate to any webpage with a form
2. Click the **FormBuddy icon** in Chrome toolbar
3. Click **🔍 Scan Form Fields** — see all fields detected
4. Click **✦ Fill Form with AI** — fields fill instantly!
5. Review, make corrections, then submit

---

## Profile Storage (Markdown)

Your profile is stored in `chrome.storage.local` **and** as a readable Markdown file:

```markdown
# FormBuddy User Profile
_Last updated: 22/11/2024_

## Personal Details
- **Full Name:** Rahul Kumar Sharma
- **Date of Birth:** 1999-08-15
- **Email:** rahul@email.com
- **Phone:** 9876543210

## Identity Documents
- **Aadhaar Number:** 1234 5678 9012
- **PAN Number:** ABCDE1234F
...
```

You can **download** this Markdown from the Profile → Markdown tab.  
No server, no database, no login — your data stays on your device.

---

## AI Engine

| Mode | When | Speed |
|------|------|-------|
| **Gemini 1.5 Flash** | API key configured | ~1–2s, very accurate |
| **Rule-based fallback** | No API key | Instant, good accuracy |

Gemini prompt engineering:
- Sends your Markdown profile + detected fields
- Returns a JSON array `[{index, value}]` for each field to fill
- Falls back to rules if Gemini fails or rate-limited

---

## Project Structure

```
formbuddy-extension/
├── manifest.json          ← Chrome MV3 manifest
├── background.js          ← Service worker: Gemini API, storage, field matching
├── content.js             ← Injected into every page: field detection, fill engine
├── popup.html             ← Extension popup UI
├── popup.js               ← Popup logic
├── pages/
│   └── setup.html         ← Full profile setup & Markdown export page
├── profiles/              ← (optional) place your .md files here
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Supported Form Types

| Form | Fields Auto-Filled |
|------|--------------------|
| Scholarship applications | Name, DOB, Aadhaar, income, college, caste |
| Visa applications | Passport, nationality, DOB, address |
| Bank account opening | Name, Aadhaar, PAN, phone, address |
| College enrollment | Name, marks, course, institution, email |
| Government portals | Most common identity and address fields |
| Job applications | Name, email, phone, address, qualification |

---

## Tech Stack

- **Chrome Extension MV3** — service worker + content script
- **Google Gemini 1.5 Flash API** — smart field matching
- **Markdown files** — profile storage (no DB needed)
- **Web Speech API** — built into FormPilot AI companion app
- **Vanilla JS** — zero build step, load unpacked directly

---

## Part of FormPilot AI

FormBuddy is the browser extension companion to **FormPilot AI** (the main app).

| Tool | Purpose |
|------|---------|
| **FormPilot AI** (web app) | Upload PDF/image forms, get explanations, voice assistant |
| **FormBuddy** (extension) | Auto-fill live web forms on any site |

---

*FormBuddy AI · Built for the IBM watsonx Hackathon 2024*
