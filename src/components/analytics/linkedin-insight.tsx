/**
 * LinkedIn Insight Tag
 *
 * Permite criar audiências de remarketing no LinkedIn Campaign Manager
 * e trackear conversões de campanhas pagas.
 *
 * ATENÇÃO: Se você estiver usando GTM, NÃO use este componente —
 * configure LinkedIn Insight Tag pelo painel do GTM.
 *
 * Use direto só se quiser sem GTM.
 * Ativa quando NEXT_PUBLIC_LINKEDIN_PARTNER_ID estiver definido
 * (Partner ID, 6-7 dígitos).
 */

import Script from 'next/script';

const LINKEDIN_PARTNER_ID = process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID;
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export function LinkedInInsightScript() {
  if (GTM_ID) return null;
  if (!LINKEDIN_PARTNER_ID) return null;

  return (
    <>
      <Script
        id="linkedin-insight-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            _linkedin_partner_id = "${LINKEDIN_PARTNER_ID}";
            window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
            window._linkedin_data_partner_ids.push(_linkedin_partner_id);
          `,
        }}
      />
      <Script
        id="linkedin-insight"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(l) {
              if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
              window.lintrk.q=[]}
              var s = document.getElementsByTagName("script")[0];
              var b = document.createElement("script");
              b.type = "text/javascript";b.async = true;
              b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
              s.parentNode.insertBefore(b, s);})(window.lintrk);
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          alt=""
          src={`https://px.ads.linkedin.com/collect/?pid=${LINKEDIN_PARTNER_ID}&fmt=gif`}
        />
      </noscript>
    </>
  );
}
