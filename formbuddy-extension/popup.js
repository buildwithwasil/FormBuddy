// FormBuddy AI — Popup script

let scannedFields = [];
let activeTab = 'fill';

// ── Tab switching ─────────────────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    activeTab = btn.dataset.tab;
    document.getElementById('tab-fill').style.display = activeTab === 'fill' ? 'flex' : 'none';
    document.getElementById('tab-fill').style.flexDirection = 'column';
    document.getElementById('tab-fill').style.gap = '12px';
    document.getElementById('tab-profile').style.display = activeTab === 'profile' ? 'flex' : 'none';
    document.getElementById('tab-profile').style.flexDirection = 'column';
    document.getElementById('tab-profile').style.gap = '12px';
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function setStatus(text, type = 'green') {
  document.getElementById('status-text').textContent = text;
  const dot = document.getElementById('status-dot');
  dot.className = 'dot dot-' + type;
}

function showSourceTag(source) {
  const tag = document.getElementById('source-tag');
  tag.style.display = 'inline-flex';
  tag.textContent = source === 'gemini' ? '✦ Gemini AI' : '⚡ Rule-based';
}

function msgTab(type, data = {}) {
  return new Promise(resolve => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab) return resolve(null);
      chrome.tabs.sendMessage(tab.id, { type, ...data }, resp => {
        if (chrome.runtime.lastError) return resolve(null);
        resolve(resp);
      });
    });
  });
}

function msgBg(type, data = {}) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage({ type, ...data }, resp => {
      if (chrome.runtime.lastError) return resolve(null);
      resolve(resp);
    });
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  // Check if content script is live on current tab
  const ping = await msgTab('PING');
  if (!ping?.alive) {
    setStatus('No form page active', 'yellow');
  } else {
    setStatus('Ready', 'green');
  }

  // Load API key
  const key = await msgBg('GET_API_KEY');
  if (key) document.getElementById('api-key-input').value = key;

  // Load profile
  await loadProfile();

  // Check for profile
  const profile = await msgBg('GET_PROFILE');
  if (!profile) {
    document.getElementById('no-profile-warn').style.display = 'flex';
    document.getElementById('btn-fill').disabled = true;
  }
}

async function loadProfile() {
  const profile = await msgBg('GET_PROFILE');
  const container = document.getElementById('profile-rows');
  if (!profile) {
    container.innerHTML = '<div style="color:var(--muted);font-size:12px;text-align:center;padding:12px 0;">No profile saved yet.</div>';
    return;
  }

  const fields = [
    ['Name', profile.full_name],
    ['Email', profile.email],
    ['Phone', profile.phone],
    ['Aadhaar', profile.aadhaar ? '••••' + profile.aadhaar.slice(-4) : ''],
    ['PAN', profile.pan],
    ['City', profile.city],
    ['State', profile.state],
    ['Bank A/C', profile.bank_account ? '••••' + profile.bank_account.slice(-4) : ''],
    ['IFSC', profile.ifsc],
    ['Occupation', profile.occupation],
  ].filter(([, v]) => v);

  container.innerHTML = fields.map(([k, v]) => `
    <div class="profile-row">
      <span class="profile-key">${k}</span>
      <span class="profile-val">${v}</span>
    </div>
  `).join('');
}

// ── Scan ──────────────────────────────────────────────────────────────────────
document.getElementById('btn-scan').addEventListener('click', async () => {
  setStatus('Scanning fields…', 'yellow');
  const result = await msgTab('SCAN_FIELDS');

  if (!result) {
    setStatus('Cannot access page', 'red');
    document.getElementById('no-form-msg').style.display = 'block';
    return;
  }

  scannedFields = result.fields;
  const scanDiv = document.getElementById('scan-result');
  const listDiv = document.getElementById('field-list');
  const countBadge = document.getElementById('field-count-badge');

  if (result.count === 0) {
    document.getElementById('no-form-msg').style.display = 'block';
    scanDiv.style.display = 'none';
    document.getElementById('btn-fill').disabled = true;
    setStatus('No form fields found', 'yellow');
    return;
  }

  document.getElementById('no-form-msg').style.display = 'none';
  scanDiv.style.display = 'block';
  countBadge.textContent = `(${result.count})`;

  listDiv.innerHTML = scannedFields.map(f => `
    <div class="field-item">
      <span class="field-badge">${f.type}</span>
      <span class="field-label">${f.label || f.name || f.id || 'unnamed'}</span>
    </div>
  `).join('');

  const profile = await msgBg('GET_PROFILE');
  document.getElementById('btn-fill').disabled = !profile;
  setStatus(`${result.count} fields detected`, 'green');
});

// ── Fill ──────────────────────────────────────────────────────────────────────
document.getElementById('btn-fill').addEventListener('click', async () => {
  if (scannedFields.length === 0) {
    // Auto-scan first
    const result = await msgTab('SCAN_FIELDS');
    if (!result || result.count === 0) {
      setStatus('No form fields found', 'yellow');
      return;
    }
    scannedFields = result.fields;
  }

  setStatus('AI matching fields…', 'yellow');
  document.getElementById('btn-fill').disabled = true;
  document.getElementById('btn-fill').innerHTML = '<div class="spinner"></div> Filling…';

  // Ask background to match fields with profile (Gemini or rules)
  const matchResult = await msgBg('FILL_FORM', { fields: scannedFields });

  if (!matchResult || matchResult.error) {
    setStatus(matchResult?.error || 'Error', 'red');
    document.getElementById('btn-fill').disabled = false;
    document.getElementById('btn-fill').innerHTML = '✦ Fill Form with AI';
    return;
  }

  // Execute fill in page
  const fillResult = await msgTab('DO_FILL', { matches: matchResult.matches });

  document.getElementById('btn-fill').disabled = false;
  document.getElementById('btn-fill').innerHTML = '✦ Fill Form with AI';

  const filled = fillResult?.filled || 0;
  const skipped = fillResult?.skipped || 0;

  // Show source tag
  showSourceTag(matchResult.source);

  // Update field list with results
  if (matchResult.matches && scannedFields.length) {
    const matchedIndices = new Set(matchResult.matches.map(m => m.index));
    const listDiv = document.getElementById('field-list');
    listDiv.innerHTML = scannedFields.map((f, i) => `
      <div class="field-item">
        <span class="field-badge">${f.type}</span>
        <span class="field-label">${f.label || f.name || f.id || 'unnamed'}</span>
        ${matchedIndices.has(i)
          ? `<span class="field-match">✓ filled</span>`
          : `<span class="field-skip">skipped</span>`}
      </div>
    `).join('');
  }

  // Show result
  const resultDiv = document.getElementById('fill-result');
  resultDiv.style.display = 'block';
  if (filled > 0) {
    resultDiv.innerHTML = `
      <div class="result result-success">
        <span class="result-icon">✦</span>
        <div>
          <div class="result-text">${filled} field${filled > 1 ? 's' : ''} filled!</div>
          <div class="result-sub">${skipped > 0 ? `${skipped} field${skipped > 1 ? 's' : ''} skipped (no match)` : 'All matched fields filled'}</div>
        </div>
      </div>`;
    setStatus(`Filled ${filled} fields`, 'green');
  } else {
    resultDiv.innerHTML = `
      <div class="result result-warn">
        <span class="result-icon">⚠️</span>
        <div>
          <div class="result-text">No fields matched</div>
          <div class="result-sub">Try adding more details to your profile.</div>
        </div>
      </div>`;
    setStatus('No fields matched', 'yellow');
  }
});

// ── Settings / Setup ──────────────────────────────────────────────────────────
document.getElementById('btn-settings').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('pages/setup.html') });
  window.close();
});

document.getElementById('btn-open-setup').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('pages/setup.html') });
  window.close();
});

// ── API Key save ──────────────────────────────────────────────────────────────
document.getElementById('btn-save-key').addEventListener('click', async () => {
  const key = document.getElementById('api-key-input').value.trim();
  if (!key) return;
  await msgBg('SAVE_API_KEY', { key });
  document.getElementById('btn-save-key').textContent = '✓ Saved!';
  setTimeout(() => { document.getElementById('btn-save-key').textContent = '💾 Save API Key'; }, 2000);
});

// ── Boot ──────────────────────────────────────────────────────────────────────
init();
