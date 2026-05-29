/**
 * Content script — páginas de pessoa (/in/<slug>).
 *
 * Fluxo:
 *   1. Espera DOM estabilizar (LinkedIn é SPA, render é incremental)
 *   2. Verifica token presente → se não, botão pede pareamento
 *   3. Lookup prévio pra setar estado inicial do botão (exists/idle)
 *   4. Click: extrai DOM → POST capture-person → toast + atualiza estado
 */

import { mountCaptureButton, API_BASE } from '../ui/button';
import { showToast } from '../ui/toast';
import { getToken, incrementDailyCount, setLastCapture, getDailyCount } from '../storage';
import { capturePerson, lookupUrl, BoldfyApiError } from '../api/client';
import { extractPersonPayload } from '../selectors/person';
import { canonicalizeLinkedinUrl } from '../selectors/utils';
import { CLICK_DEBOUNCE_MS, DAILY_CAPTURE_LIMIT } from '../config';

let lastClickAt = 0;

async function init() {
  // Espera mínimo pra render do LinkedIn estabilizar
  await sleep(800);

  const button = mountCaptureButton({
    initialState: 'loading',
    onClick: () => onCapture(button.setState),
  });

  // Lookup prévio pra mostrar estado correto
  const url = canonicalizeLinkedinUrl(window.location.href);
  try {
    const r = await lookupUrl(url);
    button.setState(r.exists ? 'exists' : 'idle');
  } catch (err) {
    if (err instanceof BoldfyApiError && err.status === 401) {
      button.setState('error', '🔒 Conecte no popup');
    } else {
      // Sem auth ou erro de rede — deixa idle, deixa Clara tentar
      button.setState('idle');
    }
  }

  // SPA do LinkedIn troca de página sem recarregar — re-monta quando URL muda
  let lastUrl = window.location.href;
  new MutationObserver(() => {
    if (window.location.href === lastUrl) return;
    lastUrl = window.location.href;
    if (/linkedin\.com\/in\//i.test(window.location.href)) {
      button.destroy();
      void init();
    } else {
      button.destroy();
    }
  }).observe(document.body, { childList: true, subtree: true });
}

async function onCapture(setState: (s: 'idle' | 'loading' | 'exists' | 'error', text?: string) => void) {
  const now = Date.now();
  if (now - lastClickAt < CLICK_DEBOUNCE_MS) return;
  lastClickAt = now;

  const token = await getToken();
  if (!token) {
    setState('error', '🔒 Conecte no popup');
    showToast({ message: 'Sem token. Abre o popup da extensão pra parear.', kind: 'error' });
    return;
  }

  const daily = await getDailyCount();
  if (daily.count >= DAILY_CAPTURE_LIMIT) {
    setState('error', '⚠ Limite diário (50)');
    showToast({ message: `Limite de ${DAILY_CAPTURE_LIMIT}/dia atingido. Reseta meia-noite.`, kind: 'error' });
    return;
  }

  setState('loading');

  const payload = await extractPersonPayload();
  if (!payload) {
    setState('error');
    showToast({ message: 'Falhou extrair dados da página. LinkedIn pode ter mudado o DOM.', kind: 'error' });
    return;
  }

  try {
    const result = await capturePerson(payload);
    await incrementDailyCount();
    await setLastCapture({ url: payload.linkedinUrl, at: payload.capturedAt, kind: 'person' });
    setState('exists');
    showToast({
      message: result.was_existing
        ? '✓ Enriquecido (já estava no CRM)'
        : '✓ Salvo como LinkedIn Lead',
      href: `${API_BASE}${result.url_to_view}`,
      cta: 'Ver no CRM',
      kind: 'success',
    });
  } catch (err) {
    setState('error');
    if (err instanceof BoldfyApiError && err.status === 401) {
      showToast({ message: '🔒 Token inválido. Reconecte pelo popup.', kind: 'error' });
    } else {
      showToast({ message: '⚠ Falhou. Tenta de novo.', kind: 'error' });
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

void init();
