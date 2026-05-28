/**
 * UTM Generator — top-level page.
 *
 * Header padrão Catálogo. Form em cima, histórico embaixo.
 * Histórico mostra cada link num UtmLinkCard com 3 boxes (sessões, usuários
 * únicos, % engaj) + bar chart diário expandable, dados puxados em 1 query
 * batched do GA4 (getUtmAnalyticsBatch).
 */

import type { Metadata } from 'next';
import { db, utmLinks } from '@/db';
import { desc } from 'drizzle-orm';
import { UtmForm } from './utm-form';
import { UtmHistory } from './utm-history';
import { QrModal } from './qr-modal';
import { safeBlock } from '@/lib/safe-block';
import { isGa4Configured } from '@/lib/ga4';
import {
  getUtmAnalyticsBatch,
  analyticsForLink,
  analyticsKey,
  type UtmAnalytics,
} from '@/lib/ga4-utm-analytics';

export const metadata: Metadata = {
  title: 'UTM Generator',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function UtmGeneratorPage() {
  const links = await safeBlock(
    'utm',
    'list',
    () => db.select().from(utmLinks).orderBy(desc(utmLinks.createdAt)).limit(200),
    [],
  );

  // Pega data do link mais antigo pra usar como sinceDate do batch GA4
  const oldest = links.length > 0
    ? new Date(Math.min(...links.map((l) => new Date(l.createdAt).getTime())))
    : new Date();

  const analyticsBatch = isGa4Configured()
    ? await safeBlock('utm', 'analyticsBatch', () => getUtmAnalyticsBatch(oldest), new Map())
    : new Map<string, UtmAnalytics>();

  // Calcula analytics "desde createdAt" por link e serializa pro client
  const analyticsByKey: Record<string, UtmAnalytics> = {};
  for (const link of links) {
    const a = analyticsForLink(analyticsBatch, link);
    if (a) {
      const key = analyticsKey(
        link.utmSource,
        link.utmMedium,
        link.utmCampaign,
        link.utmContent,
        link.utmTerm,
      );
      analyticsByKey[key] = a;
    }
  }

  // Shape do link pro client (Date → string serializável)
  const enrichedLinks = links.map((link) => ({
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
    sessionsGa4: null, // legacy field, mantido por compat
  }));

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
          Métricas GA4 calculadas desde a criação de cada link — expanda pra ver acessos por dia.
        </p>
      </header>

      <UtmForm />

      <div className="mt-6">
        <UtmHistory links={enrichedLinks} analyticsByKey={analyticsByKey} />
      </div>

      <QrModal />
    </div>
  );
}
