/**
 * UTM Generator — top-level page.
 *
 * Layout em duas seções verticais (igual o HTML legado):
 *   1. Card "Configurar link" — form com checkbox opt-in pra shortlink
 *   2. Card "Histórico" — cards com botões Copiar longo / curto / QR / Reusar / Remover
 *
 * Header em padrão Catálogo (pill "Interno · não indexado" + font-headline).
 *
 * Histórico no DB (tabela utm_links) cruzado com GA4 (sessões por
 * utm_campaign nos últimos 90d). Form e histórico são client components.
 */

import type { Metadata } from 'next';
import { db, utmLinks } from '@/db';
import { desc } from 'drizzle-orm';
import { UtmForm } from './utm-form';
import { UtmHistory } from './utm-history';
import { QrModal } from './qr-modal';
import { getTopUtms } from '@/lib/ga4';
import { safeBlock } from '@/lib/safe-block';

export const metadata: Metadata = {
  title: 'UTM Generator',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function UtmGeneratorPage() {
  const [links, ga4Utms] = await Promise.all([
    safeBlock('utm', 'list', () => db.select().from(utmLinks).orderBy(desc(utmLinks.createdAt)).limit(200), []),
    safeBlock('utm', 'ga4', () => getTopUtms(90, 200), []),
  ]);

  // Cross-reference GA4 sessions por (source, medium, campaign)
  const ga4Map = new Map<string, number>();
  for (const u of ga4Utms ?? []) {
    const key = `${u.source}|${u.medium}|${u.campaign}`;
    ga4Map.set(key, (ga4Map.get(key) ?? 0) + u.sessions);
  }
  const ga4ByCampaign = new Map<string, number>();
  for (const u of ga4Utms ?? []) {
    ga4ByCampaign.set(u.campaign, (ga4ByCampaign.get(u.campaign) ?? 0) + u.sessions);
  }

  const enriched = (links ?? []).map((link) => {
    const exactKey = `${link.utmSource}|${link.utmMedium}|${link.utmCampaign}`;
    const sessions = ga4Map.get(exactKey) ?? ga4ByCampaign.get(link.utmCampaign) ?? null;
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
      shortCode: link.shortCode,
      createdAt: link.createdAt,
      sessionsGa4: sessions,
    };
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-10">
        <span className="mb-3 inline-block rounded-full border border-primary/25 bg-primary/[0.08] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
          Interno · não indexado
        </span>
        <h1 className="font-headline text-3xl font-black text-accent-foreground md:text-4xl">
          Gerador de UTM
        </h1>
        <p className="mt-2 text-muted-foreground">
          Padronize a rastreabilidade dos seus links em segundos. Cada link pode virar UTM puro,
          shortlink <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">boldfy.com.br/l/&lt;code&gt;</code> ou QR Code.
          Histórico cruzado com sessions GA4 dos últimos 90 dias.
        </p>
      </header>

      <UtmForm />

      <div className="mt-6">
        <UtmHistory links={enriched} />
      </div>

      <QrModal />
    </div>
  );
}
