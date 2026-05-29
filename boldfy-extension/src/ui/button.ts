/**
 * Botão flutuante injetado na página LinkedIn (canto superior direito).
 *
 * Estados visuais:
 *   - idle: "Salvar no Boldfy"
 *   - loading: spinner
 *   - exists: "✓ Já no CRM" (cinza, ainda clicável pra forçar recapture)
 *   - error: "⚠ Tentar de novo"
 */

import { API_BASE } from '../config';

const BUTTON_ID = 'boldfy-capture-btn';
const STYLE_ID = 'boldfy-capture-styles';

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    #${BUTTON_ID} {
      position: fixed;
      top: 80px;
      right: 24px;
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: white;
      background: linear-gradient(135deg, #CD50F1 0%, #9D3DE3 100%);
      border: none;
      border-radius: 999px;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(205, 80, 241, 0.35);
      transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
    }
    #${BUTTON_ID}:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(205, 80, 241, 0.45); }
    #${BUTTON_ID}.boldfy-state-exists { background: #9D85B3; }
    #${BUTTON_ID}.boldfy-state-loading { opacity: 0.7; cursor: wait; }
    #${BUTTON_ID}.boldfy-state-error { background: #C0392B; }
    #${BUTTON_ID} .boldfy-spinner {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid rgba(255,255,255,0.35);
      border-top-color: white;
      border-radius: 50%;
      animation: boldfy-spin 0.7s linear infinite;
    }
    @keyframes boldfy-spin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);
}

export type ButtonState = 'idle' | 'loading' | 'exists' | 'error';

export function mountCaptureButton(opts: {
  initialState?: ButtonState;
  onClick: () => void;
}): {
  setState: (s: ButtonState, text?: string) => void;
  destroy: () => void;
} {
  injectStyles();

  // Remove qualquer botão anterior (navegação SPA dentro do LinkedIn)
  document.getElementById(BUTTON_ID)?.remove();

  const btn = document.createElement('button');
  btn.id = BUTTON_ID;
  btn.type = 'button';
  document.body.appendChild(btn);

  function setState(s: ButtonState, text?: string) {
    btn.className = `boldfy-state-${s}`;
    const defaultText =
      s === 'loading' ? 'Salvando...'
      : s === 'exists' ? '✓ Já no CRM'
      : s === 'error' ? '⚠ Tentar de novo'
      : '⚡ Salvar no Boldfy';
    btn.innerHTML =
      s === 'loading'
        ? `<span class="boldfy-spinner"></span><span>${text ?? defaultText}</span>`
        : `<span>${text ?? defaultText}</span>`;
    btn.disabled = s === 'loading';
  }

  btn.addEventListener('click', () => opts.onClick());
  setState(opts.initialState ?? 'idle');

  function destroy() {
    btn.remove();
  }

  return { setState, destroy };
}

export { API_BASE };
