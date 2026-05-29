/**
 * Popup da extensão — vanilla DOM, três estados:
 *   - não pareado: input de token + botão Salvar
 *   - pareado: status, último capture, botão Desconectar
 *   - erro: mensagem + ação
 *
 * Spec: SPEC-extension-linkedin.md §10.3.
 */

import { getToken, setToken, clearToken, getTokenLabel, getLastCapture, getDailyCount } from '../storage';
import { verifyToken, BoldfyApiError } from '../api/client';
import { API_BASE, DAILY_CAPTURE_LIMIT } from '../config';

const root = document.getElementById('root')!;

async function render() {
  const token = await getToken();
  if (!token) {
    renderUnpaired();
    return;
  }
  try {
    const result = await verifyToken();
    renderPaired(result.label);
  } catch (err) {
    if (err instanceof BoldfyApiError && err.status === 401) {
      await clearToken();
      renderUnpaired('Token inválido ou revogado. Refaz o pareamento.');
      return;
    }
    renderError('Erro de conexão. Confere se boldfy.com.br tá no ar.');
  }
}

function renderUnpaired(msg?: string) {
  root.innerHTML = `
    <div class="header">
      <div class="logo">⚡ Boldfy CRM</div>
    </div>
    <div class="subtitle">Captura LinkedIn → CRM em 1 clique</div>
    ${msg ? `<div class="error" style="margin-top:8px">${escapeHtml(msg)}</div>` : ''}
    <div class="section" style="margin-top:14px">
      <p style="font-size:12px; margin-bottom:12px">
        Pra conectar, gera um token em
        <a href="${API_BASE}/internal/crm/extension-auth" target="_blank">/internal/crm/extension-auth</a>
        e cola abaixo.
      </p>
      <label class="label">Cola o token aqui</label>
      <input id="token-input" type="text" placeholder="ex: a1b2c3d4-..." autocomplete="off" />
      <div id="pair-error" class="error" style="display:none"></div>
      <button id="pair-btn" class="btn btn-primary" style="margin-top:10px">Salvar</button>
    </div>
  `;

  const input = document.getElementById('token-input') as HTMLInputElement;
  const btn = document.getElementById('pair-btn') as HTMLButtonElement;
  const errorEl = document.getElementById('pair-error') as HTMLDivElement;

  btn.addEventListener('click', async () => {
    const v = input.value.trim();
    if (v.length < 10) {
      errorEl.textContent = 'Token muito curto.';
      errorEl.style.display = 'block';
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Validando...';

    // Salva temporariamente pra verifyToken poder ler
    await setToken(v, 'Dispositivo Boldfy');
    try {
      const result = await verifyToken();
      await setToken(v, result.label);
      renderPaired(result.label, true);
    } catch (err) {
      await clearToken();
      btn.disabled = false;
      btn.textContent = 'Salvar';
      errorEl.textContent =
        err instanceof BoldfyApiError && err.status === 401
          ? 'Token inválido. Confere se você copiou direito.'
          : 'Falha ao validar. Tenta de novo.';
      errorEl.style.display = 'block';
    }
  });
}

async function renderPaired(label: string, justPaired = false) {
  const last = await getLastCapture();
  const daily = await getDailyCount();

  root.innerHTML = `
    <div class="header">
      <div class="logo">⚡ Boldfy CRM</div>
    </div>
    <div class="subtitle">Conectado como <strong>${escapeHtml(label)}</strong></div>

    ${justPaired ? '<div class="success" style="margin-top:8px">✓ Token válido. Bora capturar.</div>' : ''}

    <div class="status" style="margin-top:14px">
      Capturas hoje: <strong>${daily.count}/${DAILY_CAPTURE_LIMIT}</strong>
      ${daily.count >= DAILY_CAPTURE_LIMIT ? '<div class="error">Limite diário atingido. Reseta meia-noite.</div>' : ''}
    </div>

    ${
      last
        ? `<div class="last-capture">
            <div class="muted">Último capture (${last.kind === 'person' ? 'pessoa' : 'empresa'})</div>
            <div style="margin-top:4px; word-break:break-all">
              <a href="${escapeHtml(last.url)}" target="_blank">${escapeHtml(last.url)}</a>
            </div>
            <div class="muted" style="margin-top:4px">${formatRelative(last.at)}</div>
          </div>`
        : '<div class="muted" style="margin-top:8px">Sem capturas ainda. Abre um perfil no LinkedIn.</div>'
    }

    <div class="section" style="margin-top:14px">
      <a href="${API_BASE}/internal/crm" target="_blank" class="muted">→ Abrir CRM</a>
    </div>

    <button id="disconnect-btn" class="btn btn-secondary">Desconectar</button>
  `;

  const disconnectBtn = document.getElementById('disconnect-btn') as HTMLButtonElement;
  disconnectBtn.addEventListener('click', async () => {
    if (!window.confirm('Desconectar a extensão deste dispositivo?')) return;
    await clearToken();
    renderUnpaired();
  });
}

function renderError(msg: string) {
  root.innerHTML = `
    <div class="header"><div class="logo">⚡ Boldfy CRM</div></div>
    <div class="error" style="margin-top:14px">${escapeHtml(msg)}</div>
    <button class="btn btn-secondary" style="margin-top:12px" onclick="window.location.reload()">Tentar de novo</button>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return 'há instantes';
  if (min < 60) return `há ${min}min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `há ${hr}h`;
  const days = Math.floor(hr / 24);
  return `há ${days}d`;
}

void render();
