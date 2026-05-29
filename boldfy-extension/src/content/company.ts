/**
 * Content script — páginas de empresa (/company/<slug>).
 *
 * Mesmo padrão do person.ts, mas chama capture-company.
 */

import { mountCaptureButton, API_BASE } from '../ui/button';
import { showToast } from '../ui/toast';
import { getToken, incrementDailyCount, setLastCapture, getDailyCount, consumePendingPersonLink } from '../storage';
import { captureCompany, lookupUrl, BoldfyApiError } from '../api/client';
import { extractCompanyPayload } from '../selectors/company';
import { canonicalizeLinkedinUrl } from '../selectors/utils';
import { CLICK_DEBOUNCE_MS, DAILY_CAPTURE_LIMIT } from '../config';

let lastClickAt = 0;

async function init() {
  await sleep(800);

  const button = mountCaptureButton({
    initialState: 'loading',
    onClick: () => onCapture(button.setState),
  });

  const url = canonicalizeLinkedinUrl(window.location.href);
  try {
    const r = await lookupUrl(url);
    button.setState(r.exists ? 'exists' : 'idle');
  } catch (err) {
    if (err instanceof BoldfyApiError && err.status === 401) {
      button.setState('error', '🔒 Conecte no popup');
    } else {
      button.setState('idle');
    }
  }

  let lastUrl = window.location.href;
  new MutationObserver(() => {
    if (window.location.href === lastUrl) return;
    lastUrl = window.location.href;
    if (/linkedin\.com\/company\//i.test(window.location.href)) {
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
    showToast({ message: `Limite de ${DAILY_CAPTURE_LIMIT}/dia atingido.`, kind: 'error' });
    return;
  }

  setState('loading');

  const payload = await extractCompanyPayload();
  if (!payload) {
    setState('error');
    showToast({ message: 'Falhou extrair dados da empresa.', kind: 'error' });
    return;
  }

  // Lê (e consome) link pendente com pessoa capturada nos últimos 30min.
  const pendingLink = await consumePendingPersonLink();

  try {
    const result = await captureCompany({
      ...payload,
      ...(pendingLink ? { link_person_id: pendingLink.personId } : {}),
    });
    await incrementDailyCount();
    await setLastCapture({ url: payload.linkedinUrl, at: payload.capturedAt, kind: 'company' });
    setState('exists');

    let message: string;
    if (pendingLink) {
      message = result.created
        ? `✓ Empresa salva e linkada com ${pendingLink.personName}`
        : `✓ Empresa enriquecida e linkada com ${pendingLink.personName}`;
    } else {
      message = result.created
        ? '✓ Empresa salva em Quero prospectar'
        : result.promoted
          ? '✓ Empresa promovida pra Quero prospectar'
          : '✓ Empresa enriquecida';
    }

    showToast({
      message,
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
