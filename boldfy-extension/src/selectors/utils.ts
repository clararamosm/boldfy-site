/**
 * Helpers de seletores resilientes.
 *
 * Estratégia (SPEC §12):
 *   1. data-* attributes (mais estável quando LinkedIn expõe)
 *   2. classes semânticas não-randômicas (.pv-text-details__title)
 *   3. heurísticas estruturais (primeiro h1 em main)
 *   4. se tudo falhar → reporta extension_field_missing (sem bloquear captura)
 */

import { EXTENSION_VERSION } from '../config';
import { reportFieldMissing } from '../api/client';

/**
 * Tenta uma cadeia de seletores. Retorna o primeiro que casar (texto trim
 * não-vazio). Se nenhum casar, reporta telemetria e retorna null.
 */
export async function trySelectors(opts: {
  field: string;
  selectors: string[];
  page_type: 'person' | 'company';
  url_pattern: string;
  root?: ParentNode;
  attr?: string; // se quiser ler atributo em vez de textContent (ex: 'href', 'src')
}): Promise<string | null> {
  const root = opts.root ?? document;
  for (const sel of opts.selectors) {
    const el = root.querySelector(sel);
    if (!el) continue;
    const val = opts.attr ? el.getAttribute(opts.attr) : el.textContent;
    if (val && val.trim().length > 0) return val.trim();
  }
  // Telemetria — fire-and-forget pra não bloquear
  void reportFieldMissing({
    field: opts.field,
    page_type: opts.page_type,
    selectors_tried: opts.selectors,
    url_pattern: opts.url_pattern,
    extension_version: EXTENSION_VERSION,
    captured_at: new Date().toISOString(),
  }).catch(() => { /* ignore — telemetria não pode quebrar captura */ });
  return null;
}

/** Versão sync (sem telemetria) — usar quando você só quer testar rápido. */
export function trySelectorsSync(selectors: string[], root: ParentNode = document, attr?: string): string | null {
  for (const sel of selectors) {
    const el = root.querySelector(sel);
    if (!el) continue;
    const val = attr ? el.getAttribute(attr) : el.textContent;
    if (val && val.trim().length > 0) return val.trim();
  }
  return null;
}

/** Normaliza URL de perfil LinkedIn pra canonical (sem query string, sem trailing slash). */
export function canonicalizeLinkedinUrl(url: string): string {
  try {
    const u = new URL(url);
    u.search = '';
    u.hash = '';
    let pathname = u.pathname.replace(/\/$/, '');
    return `${u.origin}${pathname}`;
  } catch {
    return url;
  }
}

/** Parseia jobTitle do headline ("CMO at Nuvini" → "CMO"). Conservador: retorna headline inteiro se não achar separador. */
export function extractJobTitleFromHeadline(headline: string | null | undefined): string | undefined {
  if (!headline) return undefined;
  const trimmed = headline.trim();
  const splitters = [' at ', ' na ', ' @ ', ' · '];
  for (const sep of splitters) {
    const idx = trimmed.indexOf(sep);
    if (idx > 0) return trimmed.slice(0, idx).trim();
  }
  return trimmed;
}

/** Parseia companyName do headline. ("CMO at Nuvini" → "Nuvini").
 *
 * Crítico: parar no PRIMEIRO `|` ou `·` pra não pegar sufixos descritivos
 * que viraram parte do headline ("Head na @ Filum | Estrategista de Conteúdo"
 * deve virar só "Filum"). Também remove prefixo "@" comum em headlines BR.
 */
export function extractCompanyNameFromHeadline(headline: string | null | undefined): string | undefined {
  if (!headline) return undefined;
  const trimmed = headline.trim();
  const splitters = [' at ', ' na ', ' @ '];
  for (const sep of splitters) {
    const idx = trimmed.indexOf(sep);
    if (idx > 0) {
      return trimmed
        .slice(idx + sep.length)
        .split(/[|·]/)[0]
        .replace(/^@\s*/, '')
        .trim();
    }
  }
  return undefined;
}
