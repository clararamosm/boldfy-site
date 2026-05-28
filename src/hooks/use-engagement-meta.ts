'use client';

import { useEffect, useState } from 'react';

/**
 * Metadados de engajamento capturados no momento do form submit.
 *
 *  consentStatus  — escolha do banner LGPD (localStorage `boldfy:consent`)
 *  ga4ClientId    — client_id do GA4, lido do cookie `_ga` (formato
 *                   GA1.<container>.<client_id>) quando consent=granted.
 *                   Permite cruzar a pessoa do CRM com sessões/pageviews
 *                   do GA4 via Analytics Data API.
 *
 * Por que aqui e não no banner: o banner só dispara consent.update no
 * Consent Mode v2; mas pro nosso CRM a gente precisa do estado no
 * momento exato do submit (pessoa pode ter clicado Aceitar depois de
 * preencher o form). Hook lê on-demand quando o form vai submeter.
 *
 * Sem PII: ga4_client_id é um identificador opaco do browser, não
 * permite identificar a pessoa fora do GA4. Salvamos como complemento
 * analítico, não como traço identificador.
 */

export type ConsentStatus = 'granted' | 'denied' | 'unset';

export type EngagementMeta = {
  consentStatus: ConsentStatus;
  ga4ClientId: string | null;
};

const CONSENT_STORAGE_KEY = 'boldfy:consent';

function readConsent(): ConsentStatus {
  if (typeof window === 'undefined') return 'unset';
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored === 'granted' || stored === 'denied') return stored;
    return 'unset';
  } catch {
    return 'unset';
  }
}

/**
 * Lê client_id do GA4 a partir do cookie `_ga`.
 *
 * Formato do cookie: `GA1.<domainHash>.<clientId>` onde clientId é
 * `<random>.<firstSeenTimestamp>`. Retornamos só o clientId (sem o
 * prefixo GA1) pra usar como `clientId` na Analytics Data API.
 *
 * Retorna null se consent=denied (cookie não existe) ou se o adblocker
 * bloqueou o gtag.
 */
function readGa4ClientId(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('_ga='));
  if (!match) return null;
  const value = match.split('=')[1];
  if (!value) return null;
  // _ga = "GA1.<domainHash>.<random>.<firstSeenTimestamp>"
  // clientId GA4 = "<random>.<firstSeenTimestamp>"
  const parts = value.split('.');
  if (parts.length < 4) return null;
  return `${parts[2]}.${parts[3]}`;
}

/**
 * Hook que retorna consentStatus + ga4ClientId atualizados — escuta
 * o evento `boldfy:consent-updated` (disparado pelo ConsentBanner) pra
 * reagir a mudanças durante a sessão.
 */
export function useEngagementMeta(): EngagementMeta {
  const [meta, setMeta] = useState<EngagementMeta>(() => ({
    consentStatus: readConsent(),
    ga4ClientId: readGa4ClientId(),
  }));

  useEffect(() => {
    function refresh() {
      setMeta({ consentStatus: readConsent(), ga4ClientId: readGa4ClientId() });
    }
    window.addEventListener('boldfy:consent-updated', refresh);
    return () => window.removeEventListener('boldfy:consent-updated', refresh);
  }, []);

  return meta;
}
