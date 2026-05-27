/**
 * Lista de UTMs de uma campanha — client wrapper.
 *
 * Usa o componente reutilizável <UtmLinkCard /> sem QrModal interno.
 * Mai/2026: agora a página de detalhe renderiza grupos por utm_source, com
 * múltiplas instâncias deste componente. O <QrModal /> é renderizado UMA
 * ÚNICA VEZ no escopo da page.tsx pra evitar listeners e modais duplicados.
 *
 * Sem actions de Reusar/Encurtar/Remover aqui — esses só fazem sentido em
 * /internal/utm onde o form de edição existe. Aqui o card fica em modo
 * "read with QR".
 */

'use client';

import { UtmLinkCard, type UtmLinkData } from '@/components/utm/utm-link-card';
import { analyticsKey, type UtmAnalytics } from '@/lib/ga4-utm-analytics';

export function CampaignUtmList({
  links,
  analyticsByKey,
}: {
  links: UtmLinkData[];
  analyticsByKey: Record<string, UtmAnalytics>;
}) {
  function handleQrOpen(url: string) {
    window.dispatchEvent(new CustomEvent('utm:qr-open', { detail: { url } }));
  }

  if (links.length === 0) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>
        Nenhum link UTM cadastrado pra essa campanha ainda.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {links.map((link) => {
        const key = analyticsKey(link.utmSource, link.utmMedium, link.utmCampaign);
        const analytics = analyticsByKey[key] ?? null;
        return (
          <UtmLinkCard
            key={link.id}
            link={link}
            analytics={analytics}
            actions={{ onQrOpen: handleQrOpen }}
          />
        );
      })}
    </ul>
  );
}
