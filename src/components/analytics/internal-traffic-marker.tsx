'use client';

import * as React from 'react';

/**
 * Marca o usuario como "traffic interno" no GA4, excluindo-o de relatorios.
 *
 * Fluxo:
 * 1. Primeira visita com `?internal=1` na URL: seta cookie `boldfy_internal=1`
 *    valido por 1 ano. Remove a query param da URL (pra nao sujar historico).
 * 2. Em toda visita: se cookie `boldfy_internal=1` existe, seta user property
 *    `traffic_type=internal` no GA4 via `gtag('set', 'user_properties', ...)`.
 *
 * Vantagens sobre filtro por IP:
 * - Funciona de qualquer rede (casa, cafe, avi\u00e3o, 4G movel)
 * - Persistente por dispositivo/browser (vs IP que muda)
 * - Complementa o filtro por IP do GA4 (pode usar os dois juntos)
 *
 * Como ativar no teu dispositivo:
 *   Acessa https://www.boldfy.com.br/?internal=1 uma vez — pronto, aquele
 *   browser ficara marcado como interno por 1 ano em todas as visitas.
 *
 * Como desativar:
 *   Acessa https://www.boldfy.com.br/?internal=0 — limpa o cookie.
 *
 * Pro filtro funcionar no GA4:
 *   No painel GA4 → Admin → Data Settings → Data Filters, precisa criar
 *   um filtro "Internal Traffic" que exclui eventos onde user_property
 *   `traffic_type` = `internal`.
 */

const COOKIE_NAME = 'boldfy_internal';
const COOKIE_VALUE = '1';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 ano

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1] ?? '') : null;
}

function setCookie(name: string, value: string, maxAge: number) {
  if (typeof document === 'undefined') return;
  // SameSite=Lax pra nao quebrar em contextos cross-origin comuns.
  // Secure pq boldfy.com.br sempre serve via HTTPS.
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax; Secure`;
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax; Secure`;
}

export function InternalTrafficMarker() {
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const internalParam = params.get('internal');

    // Opt-in via ?internal=1
    if (internalParam === '1') {
      setCookie(COOKIE_NAME, COOKIE_VALUE, COOKIE_MAX_AGE_SECONDS);

      // Limpa a query da URL pra n\u00e3o sujar hist\u00f3rico / compartilhamento
      params.delete('internal');
      const newSearch = params.toString();
      const newUrl =
        window.location.pathname +
        (newSearch ? `?${newSearch}` : '') +
        window.location.hash;
      window.history.replaceState(null, '', newUrl);
    }

    // Opt-out via ?internal=0
    if (internalParam === '0') {
      deleteCookie(COOKIE_NAME);
      params.delete('internal');
      const newSearch = params.toString();
      const newUrl =
        window.location.pathname +
        (newSearch ? `?${newSearch}` : '') +
        window.location.hash;
      window.history.replaceState(null, '', newUrl);
      return; // Nao marca como interno — acabou de optar por sair
    }

    const isInternal = readCookie(COOKIE_NAME) === COOKIE_VALUE;
    if (!isInternal) return;

    // Marca esse usuario como interno no GA4 via gtag.
    // Espera o gtag estar disponivel (o GTM/GA4 carrega async).
    const markInternal = () => {
      if (typeof window.gtag !== 'function') return false;
      window.gtag('set', 'user_properties', { traffic_type: 'internal' });
      return true;
    };

    if (markInternal()) return;

    // gtag ainda nao carregou — tenta de novo por ate 10s
    const intervalId = window.setInterval(() => {
      if (markInternal()) {
        window.clearInterval(intervalId);
      }
    }, 500);
    const timeoutId = window.setTimeout(() => {
      window.clearInterval(intervalId);
    }, 10_000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, []);

  return null;
}
