/**
 * Wrappers tipados pra chrome.storage.local.
 *
 * Chaves usadas:
 *   - boldfy_token: token Bearer (string)
 *   - boldfy_token_label: label legível do dispositivo (string)
 *   - boldfy_daily_count: { date: 'YYYY-MM-DD', count: number }
 *   - boldfy_last_capture: { url, at, kind } (último capture, opcional)
 */

export type DailyCount = { date: string; count: number };

export type LastCapture = {
  url: string;
  at: string; // ISO
  kind: 'person' | 'company';
};

const KEYS = {
  token: 'boldfy_token',
  tokenLabel: 'boldfy_token_label',
  dailyCount: 'boldfy_daily_count',
  lastCapture: 'boldfy_last_capture',
  /**
   * Pessoa capturada recente que ainda precisa ser linkada a uma empresa.
   * Set após captura de pessoa, consumido (e limpo) na próxima captura de
   * empresa. TTL 30 min — depois disso assume que Clara não vai mais linkar.
   */
  pendingPersonLink: 'boldfy_pending_person_link',
} as const;

/** TTL pra link automático pessoa→empresa em sequência (30 min). */
const PENDING_LINK_TTL_MS = 30 * 60 * 1000;

type PendingPersonLink = {
  personId: string;
  personName: string;
  setAt: number; // epoch ms
};

export async function getToken(): Promise<string | null> {
  const r = await chrome.storage.local.get(KEYS.token);
  return typeof r[KEYS.token] === 'string' ? r[KEYS.token] : null;
}

export async function setToken(token: string, label: string): Promise<void> {
  await chrome.storage.local.set({
    [KEYS.token]: token,
    [KEYS.tokenLabel]: label,
  });
}

export async function clearToken(): Promise<void> {
  await chrome.storage.local.remove([KEYS.token, KEYS.tokenLabel]);
}

export async function getTokenLabel(): Promise<string | null> {
  const r = await chrome.storage.local.get(KEYS.tokenLabel);
  return typeof r[KEYS.tokenLabel] === 'string' ? r[KEYS.tokenLabel] : null;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getDailyCount(): Promise<DailyCount> {
  const r = await chrome.storage.local.get(KEYS.dailyCount);
  const stored = r[KEYS.dailyCount] as DailyCount | undefined;
  const today = todayKey();
  if (!stored || stored.date !== today) {
    return { date: today, count: 0 };
  }
  return stored;
}

export async function incrementDailyCount(): Promise<DailyCount> {
  const current = await getDailyCount();
  const next: DailyCount = { date: current.date, count: current.count + 1 };
  await chrome.storage.local.set({ [KEYS.dailyCount]: next });
  return next;
}

export async function setLastCapture(c: LastCapture): Promise<void> {
  await chrome.storage.local.set({ [KEYS.lastCapture]: c });
}

export async function getLastCapture(): Promise<LastCapture | null> {
  const r = await chrome.storage.local.get(KEYS.lastCapture);
  return (r[KEYS.lastCapture] as LastCapture | undefined) ?? null;
}

/* -------------------------------------------------------------------------- */
/*  Pending person link — fluxo pessoa → empresa em sequência                 */
/* -------------------------------------------------------------------------- */

/**
 * Marca uma pessoa como pendente de link com empresa. Chamado pelo content
 * script de pessoa após captura bem-sucedida. Próxima captura de empresa lê
 * isso e envia pro backend como `link_person_id`, daí o backend faz o UPDATE.
 */
export async function setPendingPersonLink(personId: string, personName: string): Promise<void> {
  const payload: PendingPersonLink = { personId, personName, setAt: Date.now() };
  await chrome.storage.local.set({ [KEYS.pendingPersonLink]: payload });
}

/**
 * Lê e LIMPA o pending link. Retorna null se não há ou se expirou (TTL 30min).
 * Chamado pelo content script de empresa antes de enviar request.
 */
export async function consumePendingPersonLink(): Promise<PendingPersonLink | null> {
  const r = await chrome.storage.local.get(KEYS.pendingPersonLink);
  const pending = r[KEYS.pendingPersonLink] as PendingPersonLink | undefined;
  if (!pending) return null;
  // Limpa sempre (consumo único). Mesmo se expirou, evita reuso.
  await chrome.storage.local.remove(KEYS.pendingPersonLink);
  if (Date.now() - pending.setAt > PENDING_LINK_TTL_MS) return null;
  return pending;
}

/** Versão NÃO-consumidora pra UI/popup ler status sem limpar. */
export async function peekPendingPersonLink(): Promise<PendingPersonLink | null> {
  const r = await chrome.storage.local.get(KEYS.pendingPersonLink);
  const pending = r[KEYS.pendingPersonLink] as PendingPersonLink | undefined;
  if (!pending) return null;
  if (Date.now() - pending.setAt > PENDING_LINK_TTL_MS) {
    await chrome.storage.local.remove(KEYS.pendingPersonLink);
    return null;
  }
  return pending;
}
