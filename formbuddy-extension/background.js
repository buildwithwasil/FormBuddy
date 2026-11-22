// FormBuddy AI — Background Service Worker
// Handles: profile storage, Gemini API calls, message routing

// ── Profile helpers (stored as structured data, serialised to "markdown" .md text) ──

export async function getProfile() {
  const { profile } = await chrome.storage.local.get('profile');
  return profile || null;
}

export async function saveProfile(profile) {
  await chrome.storage.local.set({ profile });
  // Also persist as a readable Markdown string for quick inspection
  const md = profileToMarkdown(profile);
  await chrome.storage.local.set({ profile_md: md });
}

export function profileToMarkdown(p) {
  return `# FormBuddy User Profile
_Last updated: ${new Date().toLocaleString()}_

## Personal Details
- **Full Name:** ${p.full_name || ''}
- **Date of Birth:** ${p.dob || ''}
- **Gender:** ${p.gender || ''}
- **Email:** ${p.email || ''}
- **Phone:** ${p.phone || ''}
- **Nationality:** ${p.nationality || ''}

## Identity Documents
- **Aadhaar Number:** ${p.aadhaar || ''}
- **PAN Number:** ${p.pan || ''}
- **Passport Number:** ${p.passport_number || ''}
- **Passport Expiry:** ${p.passport_expiry || ''}

## Address
- **Address Line 1:** ${p.address_line1 || ''}
- **Address Line 2:** ${p.address_line2 || ''}
- **City:** ${p.city || ''}
- **State:** ${p.state || ''}
- **PIN Code:** ${p.pincode || ''}
- **Country:** ${p.country || ''}

## Financial Details
- **Bank Account Number:** ${p.bank_account || ''}
- **IFSC Code:** ${p.ifsc || ''}
- **Annual Income:** ${p.annual_income || ''}

## Academic / Professional
- **Occupation:** ${p.occupation || ''}
- **Organisation:** ${p.organisation || ''}
- **Course Name:** ${p.course_name || ''}
- **Institution:** ${p.institution || ''}
- **Year of Study:** ${p.year_of_study || ''}
- **Caste Category:** ${p.caste_category || ''}

## Preferences
- **Preferred Language:** ${p.language || 'English'}
`;
}

// ── Gemini API ────────────────────────────────────────────────────────────────

async function callGemini(prompt) {
  const { gemini_api_key } = await chrome.storage.local.get('gemini_api_key');
  if (!gemini_api_key) return null;

  const model = 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${gemini_api_key}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 600, temperature: 0.2 }
      })
    });
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch (e) {
    console.warn('[FormBuddy] Gemini call failed:', e);
    return null;
  }
}

// ── Smart field matching ──────────────────────────────────────────────────────

async function matchFieldsWithGemini(fields, profile) {
  const profileMd = profileToMarkdown(profile);
  const fieldList = fields.map((f, i) =>
    `${i}. label="${f.label}" name="${f.name}" id="${f.id}" type="${f.type}" placeholder="${f.placeholder}"`
  ).join('\n');

  const prompt = `You are FormBuddy AI, a smart form-filling agent.

## User Profile
${profileMd}

## Form Fields Detected on Page
${fieldList}

## Task
For each field index above, decide what value from the user profile to fill in.
Return ONLY a JSON array like:
[{"index": 0, "value": "Rahul Sharma"}, {"index": 2, "value": "rahul@email.com"}, ...]

Rules:
- Only include fields you are confident about.
- Skip fields where you're unsure (don't guess passwords, OTPs, or security questions).
- For date fields use the format the placeholder suggests, or DD/MM/YYYY.
- For select/dropdown fields, return the value that best matches.
- For checkboxes, return "true" if it should be checked.
- Do NOT wrap in markdown code fences.

JSON array:`;

  const raw = await callGemini(prompt);
  if (!raw) return null;

  try {
    // Strip any accidental markdown fences
    const cleaned = raw.replace(/^```[a-z]*\n?/i, '').replace(/```$/i, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn('[FormBuddy] JSON parse failed:', raw);
    return null;
  }
}

// ── Rule-based fallback matching ─────────────────────────────────────────────

function ruleBasedMatch(fields, profile) {
  const results = [];

  const normalise = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const PROFILE_MAP = [
    { keys: ['fullname', 'name', 'applicantname', 'yourname', 'firstname', 'lastname', 'fullnameasperaadhaar'], value: () => profile.full_name },
    { keys: ['email', 'emailaddress', 'emailid'], value: () => profile.email },
    { keys: ['phone', 'mobile', 'mobileno', 'mobilenumber', 'phonenumber', 'contactno', 'contactnumber'], value: () => profile.phone },
    { keys: ['dob', 'dateofbirth', 'birthdate', 'dateofbirth'], value: () => profile.dob },
    { keys: ['gender'], value: () => profile.gender },
    { keys: ['aadhaar', 'aadhaarnumber', 'aadhaarno', 'uidai'], value: () => profile.aadhaar },
    { keys: ['pan', 'pannumber', 'panno', 'permanentaccountnumber'], value: () => profile.pan },
    { keys: ['passport', 'passportnumber', 'passportno'], value: () => profile.passport_number },
    { keys: ['passportexpiry', 'passportexpirydate', 'passportvalidity'], value: () => profile.passport_expiry },
    { keys: ['nationality', 'citizen'], value: () => profile.nationality },
    { keys: ['address', 'permanentaddress', 'currentaddress', 'addressline1', 'streetaddress'], value: () => profile.address_line1 },
    { keys: ['addressline2', 'addressline2', 'apt', 'area'], value: () => profile.address_line2 },
    { keys: ['city', 'town'], value: () => profile.city },
    { keys: ['state', 'province'], value: () => profile.state },
    { keys: ['pincode', 'pin', 'postalcode', 'zipcode', 'zip'], value: () => profile.pincode },
    { keys: ['country'], value: () => profile.country },
    { keys: ['bankaccount', 'bankaccountnumber', 'accountnumber', 'accno'], value: () => profile.bank_account },
    { keys: ['ifsc', 'ifsccode', 'bankifsc'], value: () => profile.ifsc },
    { keys: ['annualincome', 'income', 'familyincome', 'annualfamilyincome', 'totalincome'], value: () => profile.annual_income },
    { keys: ['occupation', 'profession'], value: () => profile.occupation },
    { keys: ['organisation', 'company', 'employer', 'institution', 'college', 'university'], value: () => profile.organisation || profile.institution },
    { keys: ['course', 'coursename', 'programme', 'programname'], value: () => profile.course_name },
    { keys: ['yearofstudy', 'year', 'currentyear'], value: () => profile.year_of_study },
    { keys: ['caste', 'castecategory', 'category', 'communitycat'], value: () => profile.caste_category },
  ];

  fields.forEach((field, index) => {
    const combined = normalise(field.label) + normalise(field.name) + normalise(field.id) + normalise(field.placeholder);
    for (const mapping of PROFILE_MAP) {
      if (mapping.keys.some(k => combined.includes(k))) {
        const val = mapping.value();
        if (val) {
          results.push({ index, value: val });
          break;
        }
      }
    }
  });

  return results;
}

// ── Message handler ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg.type === 'GET_PROFILE') {
      sendResponse(await getProfile());
    }

    else if (msg.type === 'SAVE_PROFILE') {
      await saveProfile(msg.profile);
      sendResponse({ ok: true });
    }

    else if (msg.type === 'GET_API_KEY') {
      const { gemini_api_key } = await chrome.storage.local.get('gemini_api_key');
      sendResponse(gemini_api_key || null);
    }

    else if (msg.type === 'SAVE_API_KEY') {
      await chrome.storage.local.set({ gemini_api_key: msg.key });
      sendResponse({ ok: true });
    }

    else if (msg.type === 'FILL_FORM') {
      // msg.fields = array of field descriptors from content script
      const profile = await getProfile();
      if (!profile) return sendResponse({ error: 'No profile saved. Please set up your profile first.' });

      let matches = null;
      const { gemini_api_key } = await chrome.storage.local.get('gemini_api_key');

      if (gemini_api_key) {
        matches = await matchFieldsWithGemini(msg.fields, profile);
      }

      // Always fall back to rule-based if Gemini fails or is not configured
      if (!matches || matches.length === 0) {
        matches = ruleBasedMatch(msg.fields, profile);
      }

      sendResponse({ matches, source: gemini_api_key ? 'gemini' : 'rules' });
    }

    else if (msg.type === 'GET_PROFILE_MD') {
      const { profile_md } = await chrome.storage.local.get('profile_md');
      sendResponse(profile_md || '');
    }
  })();
  return true; // keep message channel open for async response
});

// Open setup page on first install
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    const profile = await getProfile();
    if (!profile) {
      chrome.tabs.create({ url: chrome.runtime.getURL('pages/setup.html') });
    }
  }
});
