'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

/**
 * Consent banner LGPD minimalista — fica no rodapé
 *
 * Comportamento:
 * - Só aparece se o visitante ainda não aceitou/recusou
 * - Persiste escolha em localStorage (boldfy:consent)
 * - Dispara evento customizado 'boldfy:consent-updated' pra outros scripts reagirem
 *
 * Consent Mode v2 (Google):
 * - Antes de consentir: analytics_storage=denied, ad_storage=denied
 * - Após aceite: analytics_storage=granted, ad_storage=granted
 * - Isso permite que GTM carregue mas só emita eventos anonimizados
 *   até o consentimento (cumpre LGPD sem perder tracking em massa)
 *
 * Referência:
 * - https://developers.google.com/tag-platform/security/guides/consent
 * - LGPD Art. 8º (consentimento)
 */

const STORAGE_KEY = 'boldfy:consent';
type ConsentValue = 'granted' | 'denied';

function getStoredConsent(): ConsentValue | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'granted' || stored === 'denied') return stored;
    return null;
  } catch {
    return null;
  }
}

function setStoredConsent(value: ConsentValue) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // ignore (privacy mode)
  }

  // Dispara evento pra Google Consent Mode v2
  if (window.gtag) {
    window.gtag('consent', 'update', {
      analytics_storage: value,
      ad_storage: value,
      ad_user_data: value,
      ad_personalization: value,
    });
  }

  // Dispara evento customizado
  window.dispatchEvent(new CustomEvent('boldfy:consent-updated', { detail: value }));
}

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const existing = getStoredConsent();
    if (!existing) {
      // Delay pra não mostrar antes da primeira pintura
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible) return null;

  const accept = () => {
    setStoredConsent('granted');
    setVisible(false);
  };

  const reject = () => {
    setStoredConsent('denied');
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed bottom-4 left-4 right-4 z-[60] mx-auto max-w-[720px] rounded-[14px] border border-border bg-card/95 p-4 shadow-[0_12px_40px_rgba(15,10,24,0.2)] backdrop-blur-md md:bottom-6 md:left-6 md:right-auto md:p-5"
    >
      <button
        type="button"
        onClick={reject}
        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-accent-foreground"
        aria-label="Recusar cookies"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex flex-col gap-3 pr-6 md:flex-row md:items-center md:gap-5 md:pr-8">
        <div className="flex-1">
          <p className="text-[13px] leading-[1.5] text-accent-foreground">
            A gente usa cookies pra melhorar sua experiência, entender como o site é
            usado e personalizar conteúdo. Leia nossa{' '}
            <Link
              href="/legal#cookies"
              className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
            >
              Política de Cookies
            </Link>
            .
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={reject}
            className="rounded-lg border border-border bg-transparent px-3.5 py-2 text-[12px] font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-accent-foreground"
          >
            Recusar
          </button>
          <button
            type="button"
            onClick={accept}
            className="rounded-lg bg-primary px-4 py-2 text-[12px] font-bold text-white shadow-[0_4px_14px_rgba(205,80,241,0.3)] transition-all hover:-translate-y-0.5 hover:bg-[#d966f5] hover:shadow-[0_6px_18px_rgba(205,80,241,0.4)]"
          >
            Aceitar cookies
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Script inline que roda ANTES de qualquer tag pra definir defaults
 * do Consent Mode v2 como 'denied'. Os pixels carregam mas ficam
 * em modo anonimizado até o user aceitar.
 *
 * Vai no <head> antes de GTM.
 */
export function ConsentModeDefaults() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;

          // Ler escolha salva antes (se já consentiu em visita anterior)
          var stored = null;
          try {
            stored = localStorage.getItem('boldfy:consent');
          } catch (e) {}

          var defaultState = (stored === 'granted') ? 'granted' : 'denied';

          gtag('consent', 'default', {
            analytics_storage: defaultState,
            ad_storage: defaultState,
            ad_user_data: defaultState,
            ad_personalization: defaultState,
            functionality_storage: 'granted',
            security_storage: 'granted',
            wait_for_update: 500,
          });
        `,
      }}
    />
  );
}

// Types pro TS
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}
