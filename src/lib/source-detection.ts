/**
 * Detecção de origem do lead — canal + página real.
 *
 * Resolve dois problemas históricos:
 *
 * 1. sourcePage era SÓ o slot do form ('header:desktop', 'popup-saida', etc.).
 *    Saber o BOTÃO clicado é útil, mas perdíamos a URL real onde a pessoa
 *    estava (home? /solucoes/saas? artigo?). combineSourcePage junta os dois.
 *
 * 2. Canal só era populado se viesse utm_source explícito. Sem UTM → 'unknown'
 *    (catch-all inútil). getChannelHint infere via document.referrer pra
 *    capturar LinkedIn orgânico, Google orgânico, tráfego direto, etc.
 *
 * Ambas as funções funcionam server-side (retornam undefined) e client-side.
 */

import type { SourceChannel } from './crm';

/* -------------------------------------------------------------------------- */
/*  Detecção de canal                                                         */
/* -------------------------------------------------------------------------- */

/**
 * utm_source quando exato bate com canal conhecido vira aquele canal.
 * Suporta lowercase do valor pra tolerar 'LinkedIn' vs 'linkedin'.
 */
const KNOWN_UTM_CHANNELS: readonly SourceChannel[] = [
  'linkedin', 'organic', 'direct', 'email', 'indicacao', 'pr', 'manual',
];

/**
 * Regras de inferência por hostname do referrer. Ordem importa — primeira
 * que casa vence. Pra adicionar uma nova fonte é só append.
 */
const REFERRER_RULES: ReadonlyArray<{ test: RegExp; channel: SourceChannel }> = [
  // LinkedIn (orgânico + shortener oficial)
  { test: /(?:^|\.)linkedin\.com$|^lnkd\.in$/i, channel: 'linkedin' },
  // Mecanismos de busca → orgânico
  { test: /(?:^|\.)google\.[a-z.]+$|(?:^|\.)bing\.com$|(?:^|\.)duckduckgo\.com$|(?:^|\.)search\.brave\.com$|(?:^|\.)yahoo\.[a-z.]+$|(?:^|\.)ecosia\.org$/i, channel: 'organic' },
  // Webmails (raro mas existe — quando alguém clica num link de email no Gmail web)
  { test: /^mail\.google\.com$|^outlook\.(?:live|office)\.com$/i, channel: 'email' },
];

export type ChannelHintInput = {
  utmSource?: string;
  referrer?: string;
  /** Domínio do próprio site, pra ignorar referrer interno. Default: boldfy.com.br */
  selfDomain?: string;
};

/**
 * Infere o canal de origem. Prioridade:
 *   1. utm_source explícito conhecido (linkedin/organic/email/etc) → usa
 *   2. document.referrer externo conhecido → usa (LinkedIn, Google, etc.)
 *   3. referrer externo desconhecido → 'indicacao' (referral genérico)
 *   4. Sem UTM e sem referrer → 'direct' (digitou URL, bookmark, app nativo)
 *   5. Fallback → 'unknown'
 *
 * Ignora referrer interno (mesmo domínio) — navegação dentro do site não conta
 * como "origem" pra atribuição.
 */
export function getChannelHint(input: ChannelHintInput): SourceChannel {
  const utmSource = input.utmSource?.trim().toLowerCase();
  const selfDomain = input.selfDomain ?? 'boldfy.com.br';

  // 1. UTM exato bate com canal conhecido
  if (utmSource && (KNOWN_UTM_CHANNELS as readonly string[]).includes(utmSource)) {
    return utmSource as SourceChannel;
  }

  // 2. Inferência via referrer
  const referrer = input.referrer?.trim();
  if (referrer) {
    try {
      const url = new URL(referrer);
      const isInternal = url.hostname === selfDomain
        || url.hostname.endsWith(`.${selfDomain}`)
        || url.hostname === 'localhost';
      if (!isInternal) {
        for (const rule of REFERRER_RULES) {
          if (rule.test.test(url.hostname)) return rule.channel;
        }
        // Referrer externo que não casou com nenhuma regra = referral genérico
        return 'indicacao';
      }
    } catch {
      // referrer malformado — ignora
    }
  }

  // 3. Sem UTM, sem referrer = digitou URL ou veio de app sem referrer
  if (!utmSource && !referrer) return 'direct';

  // 4. UTM presente mas não-canônico (ex: utm_source=newsletter sem mapping)
  return 'unknown';
}

/* -------------------------------------------------------------------------- */
/*  sourcePage: combinar slot + URL real                                      */
/* -------------------------------------------------------------------------- */

/**
 * Combina o slot do form com a URL atual em uma string única.
 *
 * Formato: 'slot em pathname' (ex: 'header:desktop em /solucoes/saas').
 * Se faltar um dos dois, retorna o que tiver. Se nenhum, undefined.
 *
 * Por que string concatenada e não coluna nova: sourcePage é text livre, dá
 * pra parsear depois (regex /^(.+?) em (.+)$/). Evita migration de schema.
 */
export function combineSourcePage(
  slot: string | undefined | null,
  pathname: string | undefined | null,
): string | undefined {
  const s = slot?.trim();
  const p = pathname?.trim();
  if (s && p) return `${s} em ${p}`;
  return s || p || undefined;
}

/* -------------------------------------------------------------------------- */
/*  Captura no client (pathname + referrer no momento do submit)              */
/* -------------------------------------------------------------------------- */

export type SubmissionMeta = {
  landing_pathname?: string;
  referrer?: string;
  /**
   * Estado do banner LGPD no momento exato do submit. Mai/2026 — começamos
   * a salvar pra mostrar no perfil do lead (aba Engajamento) se a pessoa
   * deu consentimento pra rastreamento via GA4. Compat: opcional, forms
   * antigos que não enviam continuam funcionando.
   */
  consent_status?: 'granted' | 'denied' | 'unset';
  /**
   * client_id do GA4 lido do cookie `_ga` no momento do submit. Permite
   * cruzar a pessoa do CRM com sessões/pageviews do GA4 via Analytics Data
   * API. Só presente quando consent=granted e adblocker não bloqueou o
   * cookie. Opcional — ausência não bloqueia nada.
   */
  ga4_client_id?: string;
};

/** Lê estado do banner LGPD do localStorage. SSR-safe. */
function readConsentStatus(): 'granted' | 'denied' | 'unset' {
  if (typeof window === 'undefined') return 'unset';
  try {
    const stored = localStorage.getItem('boldfy:consent');
    if (stored === 'granted' || stored === 'denied') return stored;
    return 'unset';
  } catch {
    return 'unset';
  }
}

/**
 * Lê client_id do GA4 do cookie `_ga`.
 *
 * Formato: `GA1.<domainHash>.<random>.<firstSeenTimestamp>` — o "client_id"
 * usado na Analytics Data API é `<random>.<firstSeenTimestamp>`.
 *
 * Retorna undefined se cookie não existe (consent=denied, adblocker, ou
 * antes do gtag carregar). Não é PII isolado — só identificador opaco
 * de browser.
 */
function readGa4ClientId(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('_ga='));
  if (!match) return undefined;
  const value = match.split('=')[1];
  if (!value) return undefined;
  const parts = value.split('.');
  if (parts.length < 4) return undefined;
  return `${parts[2]}.${parts[3]}`;
}

/**
 * Captura URL atual + referrer NO MOMENTO DO SUBMIT (não no mount).
 * Spread no payload do form: `{ ...fields, ...captureSubmissionMeta(), ...utms }`.
 *
 * Retorna `{}` no server (SSR-safe). No client, `referrer` pode ser string
 * vazia quando a pessoa entrou direto ou veio com `Referrer-Policy: no-referrer`
 * — nesse caso retorna `undefined` em vez de '' (mais limpo no DB).
 *
 * Mai/2026 (Clara): adicionado consent_status + ga4_client_id pra cruzar
 * lead com sessões GA4 no perfil do CRM. Campos opcionais — schemas zod
 * dos forms tratam ausência sem erro, então isso é zero-quebra pros forms
 * antigos.
 */
export function captureSubmissionMeta(): SubmissionMeta {
  if (typeof window === 'undefined') return {};
  return {
    landing_pathname: window.location.pathname,
    referrer: document.referrer || undefined,
    consent_status: readConsentStatus(),
    ga4_client_id: readGa4ClientId(),
  };
}
