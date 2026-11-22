// FormBuddy AI — Content Script
// Runs on every page. Detects form fields and executes auto-fill.

(function () {
  'use strict';

  // Avoid injecting twice
  if (window.__formbuddy_injected) return;
  window.__formbuddy_injected = true;

  // ── Field discovery ───────────────────────────────────────────────────────

  function discoverFields() {
    const inputs = document.querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]):not([type="file"]):not([type="password"]), select, textarea'
    );

    return Array.from(inputs)
      .filter(el => isVisible(el))
      .map((el, idx) => {
        const label = getLabel(el);
        return {
          index: idx,
          tag: el.tagName.toLowerCase(),
          type: el.type || el.tagName.toLowerCase(),
          id: el.id || '',
          name: el.name || '',
          placeholder: el.placeholder || '',
          label: label,
          options: el.tagName === 'SELECT'
            ? Array.from(el.options).map(o => ({ value: o.value, text: o.text }))
            : [],
          _el: el,  // internal reference — not sent to background
        };
      });
  }

  function isVisible(el) {
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function getLabel(el) {
    // 1. <label for="id">
    if (el.id) {
      const lbl = document.querySelector(`label[for="${el.id}"]`);
      if (lbl) return lbl.textContent.trim();
    }
    // 2. Wrapping <label>
    const parent = el.closest('label');
    if (parent) return parent.textContent.replace(el.value || '', '').trim();
    // 3. aria-label
    if (el.getAttribute('aria-label')) return el.getAttribute('aria-label');
    // 4. aria-labelledby
    const lblId = el.getAttribute('aria-labelledby');
    if (lblId) {
      const ref = document.getElementById(lblId);
      if (ref) return ref.textContent.trim();
    }
    // 5. Preceding sibling text
    const prev = el.previousElementSibling;
    if (prev && ['LABEL', 'SPAN', 'P', 'DIV', 'TD', 'TH'].includes(prev.tagName)) {
      const text = prev.textContent.trim();
      if (text.length < 80) return text;
    }
    // 6. Placeholder / name fallback
    return el.placeholder || el.name || el.id || '';
  }

  // ── Fill engine ───────────────────────────────────────────────────────────

  function fillField(el, value) {
    if (!value && value !== 0) return false;

    const val = String(value);
    el.focus();

    if (el.tagName === 'SELECT') {
      // Try exact value match first, then text match
      const opt = Array.from(el.options).find(
        o => o.value.toLowerCase() === val.toLowerCase() ||
             o.text.toLowerCase() === val.toLowerCase() ||
             o.text.toLowerCase().includes(val.toLowerCase())
      );
      if (opt) {
        el.value = opt.value;
        triggerEvents(el);
        return true;
      }
      return false;
    }

    if (el.type === 'checkbox') {
      const checked = val === 'true' || val === '1' || val === 'yes';
      el.checked = checked;
      triggerEvents(el);
      return true;
    }

    if (el.type === 'radio') {
      if (el.value.toLowerCase() === val.toLowerCase()) {
        el.checked = true;
        triggerEvents(el);
        return true;
      }
      return false;
    }

    // text, email, tel, number, date, textarea
    // Use native input value setter to work with React/Vue controlled inputs
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype,
      'value'
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(el, val);
    } else {
      el.value = val;
    }

    triggerEvents(el);
    highlight(el);
    return true;
  }

  function triggerEvents(el) {
    ['input', 'change', 'blur'].forEach(evt => {
      el.dispatchEvent(new Event(evt, { bubbles: true }));
    });
  }

  function highlight(el) {
    const original = el.style.outline;
    const originalBg = el.style.backgroundColor;
    el.style.outline = '2px solid #6366f1';
    el.style.backgroundColor = 'rgba(99,102,241,0.08)';
    setTimeout(() => {
      el.style.outline = original;
      el.style.backgroundColor = originalBg;
    }, 2000);
  }

  // ── Show fill result overlay ──────────────────────────────────────────────

  function showToast(message, type = 'success') {
    const existing = document.getElementById('formbuddy-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'formbuddy-toast';
    toast.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 2147483647;
      background: ${type === 'success' ? '#6366f1' : type === 'error' ? '#ef4444' : '#f59e0b'};
      color: white; padding: 14px 20px; border-radius: 12px;
      font-family: -apple-system, "Segoe UI", sans-serif; font-size: 14px; font-weight: 600;
      max-width: 320px; box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      display: flex; align-items: center; gap: 10px;
      animation: formbuddy-slide-in 0.3s ease;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes formbuddy-slide-in {
        from { transform: translateX(100%); opacity: 0; }
        to   { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    const icon = type === 'success' ? '✦' : type === 'error' ? '✕' : '⚠';
    toast.innerHTML = `<span style="font-size:18px">${icon}</span> ${message}`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // ── Main: listen for messages from popup / background ────────────────────

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'PING') {
      sendResponse({ alive: true });
      return;
    }

    if (msg.type === 'SCAN_FIELDS') {
      const fields = discoverFields();
      sendResponse({
        count: fields.length,
        fields: fields.map(({ _el, ...rest }) => rest)  // strip DOM references
      });
      return;
    }

    if (msg.type === 'DO_FILL') {
      // msg.matches = [{index, value}, ...]
      const allFields = discoverFields();
      let filled = 0;
      let skipped = 0;

      (msg.matches || []).forEach(({ index, value }) => {
        const field = allFields[index];
        if (!field) { skipped++; return; }
        const success = fillField(field._el, value);
        if (success) filled++;
        else skipped++;
      });

      showToast(
        filled > 0
          ? `FormBuddy filled ${filled} field${filled > 1 ? 's' : ''}! ${skipped > 0 ? `(${skipped} skipped)` : ''}`
          : 'No fields matched your profile.',
        filled > 0 ? 'success' : 'warning'
      );

      sendResponse({ filled, skipped });
      return;
    }

    if (msg.type === 'HIGHLIGHT_FIELDS') {
      const allFields = discoverFields();
      allFields.forEach(f => highlight(f._el));
      sendResponse({ count: allFields.length });
      return;
    }
  });

})();
