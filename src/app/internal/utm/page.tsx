/**
 * UTM Generator — top-level page (mai/2026 ciclo 3).
 *
 * Foi promovido de /internal/dashboard/utm pra rota top-level
 * /internal/utm porque o gerador é uma ferramenta operacional usada
 * frequentemente, não um relatório de dashboard.
 *
 * Cria e gerencia links UTM com analytics integrado. Substitui o HTML
 * legado em /Developer/cowork-artifacts/utm-generator-boldfy.html.
 *
 * Histórico no DB (tabela utm_links) cruzado com GA4 (sessões por
 * utm_campaign nos últimos 90d). Form do gerador é client component.
 */

import type { Metadata } from 'next';
import { db, utmLinks } from '@/db';
import { desc } from 'drizzle-orm';
import { UtmForm } from './utm-form';
import { UtmHistory } from './utm-history';
import { getTopUtms } from '@/lib/ga4';
import { safeBlock } from '@/lib/safe-block';

export const metadata: Metadata = {
  title: 'UTM Generator',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function UtmGeneratorPage() {
  // Pega histórico do DB + GA4 em paralelo
  const [links, ga4Utms] = await Promise.all([
    safeBlock('utm', 'list', () => db.select().from(utmLinks).orderBy(desc(utmLinks.createdAt)).limit(200), []),
    safeBlock('utm', 'ga4', () => getTopUtms(90, 200), []),
  ]);

  // Cria map de sessions por (source, medium, campaign) pra cruzar com nosso DB
  const ga4Map = new Map<string, number>();
  for (const u of ga4Utms ?? []) {
    const key = `${u.source}|${u.medium}|${u.campaign}`;
    ga4Map.set(key, (ga4Map.get(key) ?? 0) + u.sessions);
  }
  // Também aceita match só por campaign (caso GA4 tenha valores diferentes em source/medium)
  const ga4ByCampaign = new Map<string, number>();
  for (const u of ga4Utms ?? []) {
    ga4ByCampaign.set(u.campaign, (ga4ByCampaign.get(u.campaign) ?? 0) + u.sessions);
  }

  const enriched = (links ?? []).map((link) => {
    const exactKey = `${link.utmSource}|${link.utmMedium}|${link.utmCampaign}`;
    const exactMatch = ga4Map.get(exactKey);
    const campaignMatch = ga4ByCampaign.get(link.utmCampaign);
    // Prefere match exato; fallback pra match por campaign só
    const sessions = exactMatch ?? campaignMatch ?? null;
    return {
      id: link.id,
      label: link.label,
      baseUrl: link.baseUrl,
      utmSource: link.utmSource,
      utmMedium: link.utmMedium,
      utmCampaign: link.utmCampaign,
      utmContent: link.utmContent,
      utmTerm: link.utmTerm,
      fullUrl: link.fullUrl,
      createdAt: link.createdAt,
      sessionsGa4: sessions,
    };
  });

  return (
    <div>
      <div className="crm-header">
        <div>
          <h1 className="crm-title">UTM Generator</h1>
          <p className="crm-subtitle">
            Gera links rastreáveis pras tuas campanhas · histórico cruzado com sessions GA4 dos últimos 90 dias
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'flex-start' }}>
        <UtmForm />
        <UtmHistory links={enriched} />
      </div>
    </div>
  );
}
