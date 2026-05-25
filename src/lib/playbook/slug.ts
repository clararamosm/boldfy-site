/**
 * Gerador de slug pra páginas `/playbook/[slug]` (mai/2026, spec §9).
 *
 * Formato: `[kebab-empresa]-[6char-hash]`.
 *   Acme Corp                  → 'acme-corp-x7f2k9'
 *   Cia. de Soluções Tech      → 'cia-de-solucoes-tech-m4n7p2'
 *   ''                         → 'playbook-x7f2k9m4n7p2'   (fallback)
 *
 * Hash usa Node `crypto.randomBytes` (sem dependência nova). Alfabeto
 * a-z0-9 (~2.18 bilhões de combinações em 6 chars). Colisão real é
 * altamente improvável; `unique` constraint em playbook_outputs.slug
 * + retry no caller pega o resto.
 *
 * Por que esse formato:
 *   - Compartilhável (legível, contextual)
 *   - Não enumerável (hash bloqueia browsing sequencial)
 *   - Curto o suficiente pra LinkedIn/WhatsApp (~30-50 chars)
 *
 * Privacidade: a página é noindex/nofollow, mas o slug ainda vaza o nome
 * da empresa pra quem tem o link. Decisão consciente (spec §11.1).
 */

import { randomBytes } from 'crypto';

const SLUG_HASH_LENGTH = 6;
const SLUG_FALLBACK_HASH_LENGTH = 12;
const SLUG_KEBAB_MAX = 50;

/**
 * Gera 6 chars no alfabeto [a-z0-9]. Usa base64 e filtra.
 *
 * 8 bytes de entropia geram ~11 chars base64 — filtragem pra [a-z0-9]
 * derruba ~30%, então 8 bytes sobra pra cobrir 6 chars com folga.
 */
export function slugHash(length: number = SLUG_HASH_LENGTH): string {
  // Gera mais bytes do que o necessário pra garantir que sobra o suficiente
  // após filtrar pra [a-z0-9] only.
  let hash = '';
  while (hash.length < length) {
    hash += randomBytes(8).toString('base64').toLowerCase().replace(/[^a-z0-9]/g, '');
  }
  return hash.slice(0, length);
}

/**
 * Normaliza string pra kebab-case ASCII (sem acentos, sem pontuação).
 *
 *   'Cia. de Soluções Tech'  → 'cia-de-solucoes-tech'
 *   'ACME Corp™'             → 'acme-corp'
 *   '   '                    → ''
 *   '😀'                     → ''
 */
function toKebab(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')    // remove combining diacritics (acentos)
    .replace(/[^a-z0-9]+/g, '-')        // tudo que não é alphanumeric vira hífen
    .replace(/^-+|-+$/g, '')            // trim hyphens nas pontas
    .slice(0, SLUG_KEBAB_MAX);
}

/**
 * Gera slug único pra um playbook. Retorna kebab+hash quando possível,
 * ou fallback com hash longo quando o nome da empresa não tem nada
 * utilizável (vazio, só símbolos, etc).
 */
export function generatePlaybookSlug(empresa: string): string {
  const kebab = toKebab(empresa);
  if (kebab) {
    return `${kebab}-${slugHash(SLUG_HASH_LENGTH)}`;
  }
  // Fallback com hash duplo (12 chars) — empresa sem nome utilizável é raro,
  // mas a unicidade precisa continuar garantida.
  return `playbook-${slugHash(SLUG_FALLBACK_HASH_LENGTH)}`;
}
