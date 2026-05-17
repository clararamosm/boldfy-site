/**
 * Dashboard · Visão Geral (bento box cross-channel).
 *
 * Report do dia a dia da empresa. Tudo cross-channel — não silo. Cada bento
 * mostra um pedaço da história integrada (visitas + leads + reuniões + SEO).
 *
 * Layout: CSS Grid 6 colunas com bentos em spans variados.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  getActivityByDay,
  getUnifiedFunnel,
  getLeadsByOrigin,
  getConversionHeatmap,
  getStackedTrafficByChannel,
  getLast5Leads,
  getBentoSnapshot,
} from '@/lib/dashboard-queries';
import { getTopQueries } from '@/lib/search-console';
import { channelLabel, timeAgo } from '@/lib/crm-format';
import {
  Sparkline,
  MultiLineChart,
  SankeyFunnel,
  StackedAreaChart,
  DonutChart,
  HeatmapChart,
  BOLDFY_PALETTE,
} from '@/components/dashboard/charts';
import {
  GitMerge,
  TrendingUp,
  Target,
  Radio,
  Flame,
  Search,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BarChart3,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard · Visão Geral',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

function deltaPill(deltaPct: number | null): { className: string; Icon: typeof ArrowUpRight; text: string } | null {
  if (deltaPct === null) return null;
  if (Math.abs(deltaPct) < 1) return { className: '', Icon: Minus, text: 'estável' };
  if (deltaPct > 0) return { className: 'up', Icon: ArrowUpRight, text: `+${deltaPct.toFixed(0)}%` };
  return { className: 'down', Icon: ArrowDownRight, text: `${deltaPct.toFixed(0)}%` };
}

const SOURCE_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn',
  organic: 'Orgânico',
  direct: 'Direto',
  email: 'Email',
  indicacao: 'Indicação',
  pr: 'PR',
  manual: 'Manual',
  unknown: 'Não atribuído',
};

export default async function DashboardOverviewPage() {
  const [snapshot, activity28, funnel, origin, heatmap, stacked, topQueries, lastLeads] = await Promise.all([
    getBentoSnapshot().catch(() => null),
    getActivityByDay(28).catch(() => []),
    getUnifiedFunnel(30).catch(() => []),
    getLeadsByOrigin(30).catch(() => []),
    getConversionHeatmap(90).catch(() => Array.from({ length: 7 }, () => Array(24).fill(0))),
    getStackedTrafficByChannel(28).catch(() => ({ data: [], channels: [] })),
    getTopQueries(7, 3).catch(() => []),
    getLast5Leads(5).catch(() => []),
  ]);

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Visão Geral</h1>
          <p className="dash-subtitle">O pulso integrado do GTM · visitas + forms + reuniões + SEO + LinkedIn</p>
        </div>
      </div>

      <div className="bento-grid">
        {/* Linha 1: 4 KPIs (1×1 cada) */}
        {snapshot ? (
          <>
            <KpiBento label="Visitas 7d" value={snapshot.visitas.value} deltaPct={snapshot.visitas.deltaPct} sparkline={snapshot.visitas.sparkline} color="#CD50F1" />
            <KpiBento label="Forms 7d" value={snapshot.forms.value} deltaPct={snapshot.forms.deltaPct} sparkline={snapshot.forms.sparkline} color="#3B82F6" />
            <KpiBento label="Reuniões 7d" value={snapshot.reunioes.value} deltaPct={snapshot.reunioes.deltaPct} sparkline={snapshot.reunioes.sparkline} color="#10B981" />
            <div className="bento bento-span-3">
              <div className="bento-label">Top canal da semana</div>
              {snapshot.topCanal ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 4 }}>
                    <span className="bento-pill" style={{ fontSize: 16, padding: '6px 14px' }}>{snapshot.topCanal.channel}</span>
                    <span className="bento-value" style={{ fontSize: 28 }}>{snapshot.topCanal.sessions.toLocaleString('pt-BR')}</span>
                    <span style={{ color: '#9D85B3', fontSize: 12 }}>sessões</span>
                    {snapshot.topCanal.deltaPct !== null ? (
                      <span className={`bento-delta ${(snapshot.topCanal.deltaPct ?? 0) >= 0 ? 'up' : 'down'}`}>
                        {(snapshot.topCanal.deltaPct ?? 0) >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />} {Math.abs(snapshot.topCanal.deltaPct ?? 0).toFixed(0)}% vs semana anterior
                      </span>
                    ) : null}
                  </div>
                  <div style={{ marginTop: 'auto', color: '#9D85B3', fontSize: 11 }}>GA4 · últimos 7 dias</div>
                </>
              ) : (
                <div style={{ color: '#9D85B3', fontSize: 13, paddingTop: 24 }}>Configure GA4 em <Link href="/internal/dashboard/connect-google" style={{ color: '#CD50F1' }}>/connect-google</Link></div>
              )}
            </div>
          </>
        ) : null}

        {/* Funil unificado (sankey) — 6 colunas × 3 linhas */}
        <div className="bento bento-span-6 bento-row-3">
          <div className="bento-title">
            <GitMerge /> Funil unificado cross-channel
            <span style={{ fontSize: 11, color: '#9D85B3', fontWeight: 600, marginLeft: 'auto' }}>últimos 30 dias</span>
          </div>
          <div className="bento-subtitle">Impressões SEO → Visitas → Forms → MQL/Quente → Reuniões → Fechados</div>
          <div className="bento-content" style={{ display: 'flex', alignItems: 'center' }}>
            <SankeyFunnel stages={funnel.map((s) => ({ key: s.key, label: s.label, count: s.count }))} />
          </div>
        </div>

        {/* Atividade diária cruzada — 4 colunas × 3 linhas */}
        <div className="bento bento-span-4 bento-row-3">
          <div className="bento-title"><TrendingUp /> Atividade diária cruzada</div>
          <div className="bento-subtitle">Visitas (GA4) × Forms (CRM) × Reuniões — últimos 28d</div>
          <div className="bento-content">
            <MultiLineChart
              dates={activity28.map((a) => a.date)}
              series={[
                { key: 'visitas', label: 'Visitas', color: '#CD50F1', data: activity28.map((a) => a.visitas) },
                { key: 'forms', label: 'Forms', color: '#3B82F6', data: activity28.map((a) => a.forms) },
                { key: 'reunioes', label: 'Reuniões', color: '#10B981', data: activity28.map((a) => a.reunioes) },
              ]}
              height={260}
            />
          </div>
        </div>

        {/* Origem dos leads (donut) — 2 colunas × 3 linhas */}
        <div className="bento bento-span-2 bento-row-3">
          <div className="bento-title"><Target /> Origem dos leads</div>
          <div className="bento-subtitle">últimos 30d por canal</div>
          <div className="bento-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DonutChart
              data={origin.map((o) => ({ key: o.source, value: o.count }))}
              labelMap={SOURCE_LABELS}
              size={160}
              thickness={24}
            />
          </div>
        </div>

        {/* Stacked area canais — 4 colunas × 3 linhas */}
        <div className="bento bento-span-4 bento-row-3">
          <div className="bento-title"><Radio /> Visitas por canal (28d)</div>
          <div className="bento-subtitle">Como cada canal contribuiu pro tráfego total</div>
          <div className="bento-content">
            <StackedAreaChart
              dates={stacked.data.map((d) => d.date)}
              series={stacked.channels.map((c, i) => ({
                key: c,
                label: c,
                color: BOLDFY_PALETTE[i % BOLDFY_PALETTE.length],
                data: stacked.data.map((d) => Number(d[c] ?? 0)),
              }))}
              height={260}
            />
          </div>
        </div>

        {/* Heatmap dia × hora — 2 colunas × 3 linhas */}
        <div className="bento bento-span-2 bento-row-3">
          <div className="bento-title"><Flame /> Quando convertemos</div>
          <div className="bento-subtitle">Forms preenchidos · 90d · dia × hora</div>
          <div className="bento-content">
            <HeatmapChart matrix={heatmap} />
          </div>
        </div>

        {/* Top queries SEO (semana) — 2 colunas × 2 linhas */}
        <div className="bento bento-span-2 bento-row-2">
          <div className="bento-title"><Search /> Top queries (7d)</div>
          <div className="bento-subtitle">Search Console</div>
          <div className="bento-content bento-list">
            {topQueries.length === 0 ? (
              <div style={{ color: '#9D85B3', fontSize: 12, padding: 12 }}>Sem queries no período.</div>
            ) : topQueries.map((q) => (
              <div key={q.query} className="bento-list-item">
                <span className="name">{q.query}</span>
                <span className="meta">{q.clicks} clk · pos {q.position.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Last 5 leads — 2 colunas × 2 linhas */}
        <div className="bento bento-span-4 bento-row-2">
          <div className="bento-title"><Users /> Últimos leads</div>
          <div className="bento-subtitle">Live feed do CRM</div>
          <div className="bento-content bento-list">
            {lastLeads.length === 0 ? (
              <div style={{ color: '#9D85B3', fontSize: 12, padding: 12 }}>Sem leads ainda.</div>
            ) : lastLeads.map((l) => (
              <Link key={l.id} href={`/internal/crm/people/${l.id}`} className="bento-list-item" style={{ textDecoration: 'none' }}>
                <span className="name">{l.name}</span>
                <span className="meta">{l.companyName ?? '—'}</span>
                <span className="bento-pill" style={{ fontSize: 10, padding: '2px 6px' }}>{channelLabel(l.source)}</span>
                <span className="meta">{timeAgo(l.createdAt)}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, padding: 14, background: 'rgba(157, 133, 179, 0.06)', borderRadius: 10, fontSize: 12, color: '#5E2A67' }}>
        <div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><BarChart3 size={14} /> Mais detalhes:</span> <Link href="/internal/dashboard/aquisicao" style={{ color: '#CD50F1', fontWeight: 700, marginLeft: 6 }}>Aquisição</Link>
          <span style={{ margin: '0 8px' }}>·</span>
          <Link href="/internal/dashboard/conversao" style={{ color: '#CD50F1', fontWeight: 700 }}>Conversão</Link>
          <span style={{ margin: '0 8px' }}>·</span>
          <Link href="/internal/dashboard/campanhas" style={{ color: '#CD50F1', fontWeight: 700 }}>Campanhas</Link>
        </div>
        <Link href="/internal/dashboard/debug" style={{ color: '#9D85B3', fontSize: 11 }}>Debug</Link>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Bento Components inline (small, page-specific)                            */
/* -------------------------------------------------------------------------- */

function KpiBento({ label, value, deltaPct, sparkline, color }: {
  label: string;
  value: number;
  deltaPct: number | null;
  sparkline: number[];
  color: string;
}) {
  const delta = deltaPill(deltaPct);
  return (
    <div className="bento bento-span-1">
      <div className="bento-label">{label}</div>
      <div className="bento-value">{value.toLocaleString('pt-BR')}</div>
      {delta ? <div className={`bento-delta ${delta.className}`}><delta.Icon size={11} /> {delta.text}</div> : null}
      <div className="bento-sparkline-wrap">
        <Sparkline data={sparkline} color={color} height={32} />
      </div>
    </div>
  );
}
