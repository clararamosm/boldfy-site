/**
 * Google Analytics 4 (direto, sem GTM)
 *
 * ATENÇÃO: Se você estiver usando GTM (NEXT_PUBLIC_GTM_ID), NÃO use este
 * componente — configure GA4 pelo painel do GTM.
 *
 * Use este componente SÓ se quiser GA4 direto no site, sem GTM.
 * Ativa quando NEXT_PUBLIC_GA4_ID estiver definido no formato G-XXXXXXXXXX.
 */

import Script from 'next/script';

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export function GA4Script() {
  // Se GTM estiver ativo, não carregar GA4 direto (evita duplicação de eventos)
  if (GTM_ID) return null;
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
