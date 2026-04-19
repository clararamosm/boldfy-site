/**
 * ActiveCampaign Site Tracking (VGO)
 *
 * Rastreia visitas às páginas e associa a contatos do ActiveCampaign
 * quando o visitante for identificado (ex: clicou num link de email).
 *
 * Usado pra segmentação comportamental + automações baseadas em
 * páginas visitadas (ex: disparar sequência de nurture quando
 * contato X visita /solucoes/content-as-a-service).
 *
 * Account ID: 69772642 (Boldfy)
 *
 * Ativa quando NEXT_PUBLIC_AC_ACCOUNT_ID estiver definido.
 * Recomendação: mesmo com GTM, este tracking pode ficar direto no
 * site já que a integração AC é específica.
 */

import Script from 'next/script';

const AC_ACCOUNT_ID = process.env.NEXT_PUBLIC_AC_ACCOUNT_ID;

export function ActiveCampaignTracking() {
  if (!AC_ACCOUNT_ID) return null;

  return (
    <Script
      id="ac-site-tracking"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(e,t,o,n,p,r,i){e.visitorGlobalObjectAlias=n;e[e.visitorGlobalObjectAlias]=e[e.visitorGlobalObjectAlias]||function(){(e[e.visitorGlobalObjectAlias].q=e[e.visitorGlobalObjectAlias].q||[]).push(arguments)};e[e.visitorGlobalObjectAlias].l=(new Date).getTime();r=t.createElement("script");r.src=o;r.async=true;i=t.getElementsByTagName("script")[0];i.parentNode.insertBefore(r,i)})(window,document,"https://diffuser-cdn.app-us1.com/diffuser/diffuser.js","vgo");
          vgo('setAccount', '${AC_ACCOUNT_ID}');
          vgo('setTrackByDefault', true);
          vgo('process');
        `,
      }}
    />
  );
}
