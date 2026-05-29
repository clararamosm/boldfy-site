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
} as const;

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
