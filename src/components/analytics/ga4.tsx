/**
 * Google Analytics 4 (carregado DIRETO no site — fonte de verdade dos eventos)
 *
 * Por que direto e não pelo GTM:
 * Toda a instrumentação do site dispara eventos via `gtag('event', ...)`
 * (ver src/lib/track.ts). Quando o GA4 é carregado DENTRO do GTM, essas
 * chamadas `gtag('event')` NÃO são encaminhadas pro GA4 — só os eventos
 * automáticos (page_view etc) passam, e cta_click / faq_expanded / form_*
 * somem. Carregando o GA4 direto, o gtag.js processa nativamente cada
 * `gtag('event')` e manda pro GA4 sem precisar de nenhuma tag/gatilho no
 * GTM. Qualquer evento novo instrumentado no código "só funciona".
 *
 * IMPORTANTE (evitar duplicação): o GA4 deve existir em UM lugar só. O
 * Google tag "GA4 Configuration" foi REMOVIDO do container do GTM
 * (GTM-N6HDKKMV) — lá ficou só a LinkedIn Insight Tag. Se um dia o GA4 for
 * re-adicionado no GTM, remover este componente, senão pageview/sessão
 * contam em dobro.
 *
 * Ativa quando NEXT_PUBLIC_GA4_ID estiver definido no formato G-XXXXXXXXXX.
 */

import Script from 'next/script';

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;

export function GA4Script() {
  if (!GA4_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
        strategy="afterInteractive"
      />
      <Script
        id="ga4-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA4_ID}', {
              anonymize_ip: true,
              cookie_flags: 'SameSite=None;Secure',
            });
          `,
        }}
      />
    </>
  );
}
