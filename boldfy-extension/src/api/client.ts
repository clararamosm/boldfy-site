/**
 * Cliente HTTP da extensão. Adiciona Authorization: Bearer automaticamente,
 * trata 401 sinalizando "token inválido" pra UI limpar storage.
 */

import { API_BASE } from '../config';
import { getToken } from '../storage';

export class BoldfyApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
    this.name = 'BoldfyApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  withAuth = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has('content-type') && options.body) {
    headers.set('content-type', 'application/json');
  }
  if (withAuth) {
    const token = await getToken();
    if (!token) throw new BoldfyApiError(401, 'no_token');
    headers.set('authorization', `Bearer ${token}`);
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401) throw new BoldfyApiError(401, 'unauthorized');
  if (!res.ok) {
    let details: unknown;
    try { details = await res.json(); } catch { /* ignore */ }
    throw new BoldfyApiError(res.status, `request_failed_${res.status}`, details);
  }
  return res.json() as Promise<T>;
}

/* -------------------------------------------------------------------------- */
/*  Endpoints                                                                  */
/* -------------------------------------------------------------------------- */

export async function verifyToken(): Promise<{ ok: true; label: string; tokenId: string }> {
  return request('/api/extension/auth/verify');
}

export async function lookupUrl(
  linkedinUrl: string,
): Promise<{ exists: boolean; kind?: 'person' | 'company'; id?: string; last_captured_at?: string }> {
  const qs = new URLSearchParams({ linkedin_url: linkedinUrl });
  return request(`/api/extension/lookup?${qs.toString()}`);
}

export async function capturePerson(payload: Record<string, unknown>): Promise<{
  ok: true;
  personId: string;
  companyId?: string;
  was_existing: boolean;
  url_to_view: string;
}> {
  return request('/api/extension/capture-person', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function captureCompany(payload: Record<string, unknown>): Promise<{
  ok: true;
  companyId: string;
  promoted: boolean;
  created: boolean;
  linked_person_id?: string;
  url_to_view: string;
}> {
  return request('/api/extension/capture-company', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function reportFieldMissing(payload: Record<string, unknown>): Promise<{ ok: true }> {
  return request('/api/extension/telemetry/field-missing', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
