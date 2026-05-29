/**
 * Toast de feedback após captura. Some em 6s.
 */

const TOAST_ID = 'boldfy-toast';
const STYLE_ID = 'boldfy-toast-styles';

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${TOAST_ID} {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999999;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 18px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      color: #5E2A67;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(94, 42, 103, 0.18);
      max-width: 360px;
      animation: boldfy-toast-in 0.25s ease-out;
    }
    #${TOAST_ID}.boldfy-toast-error {
      color: #C0392B;
      box-shadow: 0 8px 24px rgba(192, 57, 43, 0.2);
    }
    #${TOAST_ID} a { color: #CD50F1; text-decoration: none; font-weight: 700; margin-left: 6px; }
    #${TOAST_ID} a:hover { text-decoration: underline; }
    @keyframes boldfy-toast-in {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

export function showToast(opts: { message: string; href?: string; cta?: string; kind?: 'success' | 'error' }) {
  injectStyles();
  document.getElementById(TOAST_ID)?.remove();

  const el = document.createElement('div');
  el.id = TOAST_ID;
  if (opts.kind === 'error') el.classList.add('boldfy-toast-error');
  el.innerHTML = `
    <span>${escapeHtml(opts.message)}</span>
    ${
      opts.href && opts.cta
        ? `<a href="${escapeHtml(opts.href)}" target="_blank">${escapeHtml(opts.cta)} ↗</a>`
        : ''
    }
  `;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 6000);
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
