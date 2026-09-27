const api = globalThis.browser;
const button = document.createElement('button');
button.textContent = '＋ IELTS';
button.setAttribute('aria-label', 'Save selected word to IELTS Sprint');
button.style.cssText = 'position:fixed;z-index:2147483647;display:none;background:#f6ad55;color:#102a43;border:0;border-radius:8px;padding:7px 10px;font:600 13px system-ui;box-shadow:0 3px 12px #0004;cursor:pointer';
document.documentElement.append(button);
let selected = '';
document.addEventListener('mouseup', () => { const text = window.getSelection()?.toString().trim() ?? ''; selected = text.split(/\s+/)[0] ?? ''; if (!/^[A-Za-z][A-Za-z'-]{1,30}$/.test(selected)) { button.style.display = 'none'; return; } const range = window.getSelection()?.getRangeAt(0); if (!range) return; const rect = range.getBoundingClientRect(); button.style.left = `${Math.min(rect.left, innerWidth - 100)}px`; button.style.top = `${Math.max(4, rect.top - 42)}px`; button.style.display = 'block'; });
button.addEventListener('mousedown', (event) => { event.preventDefault(); if (selected) void api.runtime.sendMessage({ type: 'save-word', word: selected, context: window.getSelection()?.toString() ?? '' }); button.textContent = '✓ Saved'; setTimeout(() => { button.style.display = 'none'; button.textContent = '＋ IELTS'; }, 800); });
