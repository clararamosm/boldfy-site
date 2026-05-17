/**
 * MINIMAL TEMPORÁRIO — bisect do 500.
 * Versão completa em git (commit 51eb28a). Quando essa carregar, vou adicionando
 * sections de volta uma por uma até identificar a culpada.
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PeriodFilter } from '@/components/dashboard/period-filter';
import { parsePeriod } from '@/components/dashboard/period-utils';
import { getUnifiedFunnel } from '@/lib/dashboard-queries';
import { FunnelStages, BOLDFY_PALETTE } from '@/components/dashboard/charts';
import { FileText, Flame, Calendar, Trophy, BarChart3 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard · Conversão',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

async function safeBlock<T>(name: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try { return await fn(); }
  catch (err) { console.error(`[conversao] block "${name}" failed:`, err); return fallback; }
}

type SearchParams = Promise<{ period?: string }>;

export default async function ConversaoPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const days = parsePeriod(params.period);

  const funnel = await safeBlock('funnel', () => getUnifiedFunnel(days), { sources: [], stages: [] });

  const totalLeadsPeriod = (funnel.stages.find((f) => f.key === 'forms_b2b')?.count) ?? 0;
  const totalMql = (funnel.stages.find((f) => f.key === 'mql')?.count) ?? 0;
  const totalReunioes = (funnel.stages.find((f) => f.key === 'reunioes')?.count) ?? 0;
  const totalFechados = (funnel.stages.find((f) => f.key === 'fechados')?.count) ?? 0;

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Conversão & Funil</h1>
          <p className="dash-subtitle">Bisect minimal · {days}d</p>
        </div>
        <Suspense fallback={<div style={{ width: 220, height: 32 }} />}>
          <PeriodFilter />
        </Suspense>
      </div>

      <div className="dash-kpi-grid">
        <div className="dash-kpi">
          <div className="dash-kpi-icon"><FileText /></div>
          <div className="dash-kpi-label">Leads no período</div>
          <div className="dash-kpi-value">{totalLeadsPeriod}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon amber"><Flame /></div>
          <div className="dash-kpi-label">MQL / Quente</div>
          <div className="dash-kpi-value">{totalMql}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon blue"><Calendar /></div>
          <div className="dash-kpi-label">Reuniões</div>
          <div className="dash-kpi-value">{totalReunioes}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon green"><Trophy /></div>
          <div className="dash-kpi-label">Fechados</div>
          <div className="dash-kpi-value">{totalFechados}</div>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-title"><BarChart3 /> Funil (FunnelStages — testado)</div>
        <FunnelStages stages={funnel.stages.map((s, i) => ({
          label: s.label,
          count: s.count,
          color: BOLDFY_PALETTE[i % BOLDFY_PALETTE.length],
        }))} />
      </div>

      <div style={{ padding: 14, background: 'rgba(16, 185, 129, 0.06)', borderRadius: 10, fontSize: 12, color: '#066B4D', marginTop: 18 }}>
        ✓ Se você vê esta página, a base (Suspense + PeriodFilter + safeBlock + FunnelStages) funciona. O 500 estava em algum componente das seções removidas (SankeyFlow, BoxPlotByChannel, CohortMatrix, BarCompareChart) ou em alguma query.
      </div>
    </div>
  );
}
