/**
 * Dashboard · Tráfego — silo simples (GA4 only).
 *
 * Regra do silo: queries com .catch() direto, sem PeriodFilter inline,
 * sem SectionNav, sem safeBlock wrappers, sem error.tsx local.
 * Tudo hardcoded em 28d. Quem quiser período diferente, muda no código.
 *
 * Charts: DailyLineChart (sessões × usuários) + StackedAreaChart (canais).
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  isGa4Configured,
  getTrafficSummary,
  getTrafficByChannel,
  getTopPages,
  getTrafficByDay,
} from '@/lib/ga4';
import { getStackedTrafficByChannel } from '@/lib/dashboard-queries';
import { DailyLineChart } from '@/components/dashboard/daily-line-chart';
import { StackedAreaChart, BOLDFY_PURPLES } from '@/components/dashboard/charts';
import { Globe2, Radio, TrendingUp, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard · Tráfego',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const DAYS = 28;

export default async function TrafegoPage() {
  if (!isGa4Configured()) {
    return (
      <div>
        <div className="dash-header">
          <div>
            <h1 className="dash-title">Tráfego</h1>
            <p className="dash-subtitle">GA4 não configurado</p>
          </div>
        </div>
        <div className="dash-setup-needed">
          <strong>Conecta o Google primeiro</strong>
          <p>Vai em <Link href="/internal/dashboard/connect-google" style={{ color: '#CD50F1' }}>/connect-google</Link> e autoriza GA4.</p>
        </div>
      </div>
    );
  }

  const [summary, channels, pages, daily, stacked] = await Promise.all([
    getTrafficSummary(DAYS).catch(() => null),
    getTrafficByChannel(DAYS).catch(() => []),
    getTopPages(DAYS, 12).catch(() => []),
    getTrafficByDay(DAYS).catch(() => []),
    getStackedTrafficByChannel(DAYS).catch(() => ({ data: [], channels: [] })),
  ]);

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Tráfego</h1>
          <p className="dash-subtitle">GA4 · últimos {DAYS} dias</p>
        </div>
      </div>

      <div className="dash-kpi-grid">
        <div className="dash-kpi">
          <div className="dash-kpi-icon"><Globe2 /></div>
          <div className="dash-kpi-label">Usuários únicos</div>
          <div className="dash-kpi-value">{summary?.totalUsers.toLocaleString('pt-BR') ?? '—'}</div>
          <div className="dash-kpi-meta">{summary?.newUsers.toLocaleString('pt-BR') ?? 0} novos</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon blue"><TrendingUp /></div>
          <div className="dash-kpi-label">Sessões</div>
          <div className="dash-kpi-value">{summary?.sessions.toLocaleString('pt-BR') ?? '—'}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon amber"><FileText /></div>
          <div className="dash-kpi-label">Page views</div>
          <div className="dash-kpi-value">{summary?.screenPageViews.toLocaleString('pt-BR') ?? '—'}</div>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-title"><TrendingUp /> Sessões × Usuários por dia</div>
        <DailyLineChart
          data={daily.map((d) => ({ date: d.date, a: d.sessions, b: d.users }))}
          labels={{ a: 'Sessões', b: 'Usuários' }}
        />
      </div>

      {stacked.data.length > 0 && stacked.channels.length > 0 ? (
        <div className="dash-card">
          <div className="dash-card-title"><Radio /> Visitas por canal (stacked)</div>
          <div className="dash-card-subtitle">Como cada canal contribuiu pro tráfego ao longo do tempo</div>
          <StackedAreaChart
            dates={stacked.data.map((d) => d.date)}
            series={stacked.channels.map((c, i) => ({
              key: c,
              label: c,
              color: BOLDFY_PURPLES[i % BOLDFY_PURPLES.length],
              data: stacked.data.map((d) => Number(d[c] ?? 0)),
            }))}
            height={260}
          />
        </div>
      ) : null}

      <div className="dash-card">
        <div className="dash-card-title"><Radio /> Canais</div>
        <table className="dash-table">
          <thead><tr><th>Canal</th><th className="right">Sessões</th><th className="right">Usuários</th></tr></thead>
          <tbody>
            {channels.map((c) => (
              <tr key={c.channel}>
                <td className="strong">{c.channel}</td>
                <td className="right">{c.sessions.toLocaleString('pt-BR')}</td>
                <td className="right">{c.users.toLocaleString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dash-card">
        <div className="dash-card-title"><FileText /> Top páginas</div>
        <table className="dash-table">
          <thead><tr><th>Página</th><th className="right">Page views</th><th className="right">Sessões</th></tr></thead>
          <tbody>
            {pages.map((p, i) => (
              <tr key={i}>
                <td className="strong" style={{ maxWidth: 480, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.page}</td>
                <td className="right">{p.pageViews.toLocaleString('pt-BR')}</td>
                <td className="right">{p.sessions.toLocaleString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bloco "Top UTMs" foi movido pra /dashboard/campanhas em mai/2026
          (junto de Shortlinks, são dados complementares) */}
    </div>
  );
}
