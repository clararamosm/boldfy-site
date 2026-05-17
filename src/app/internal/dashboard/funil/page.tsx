/**
 * Dashboard · Funil B2B — silo simples.
 * Funil cross-channel + sankey origem→status + pipeline empresas +
 * leads parados + cohort + score por canal.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { db, companies } from '@/db';
import { count } from 'drizzle-orm';
import { getStatuses } from '@/lib/statuses';
import {
  getUnifiedFunnel,
  getSourceToStatusSankey,
  getStuckLeads,
  getVelocityByChannel,
  getScoreDistributionByChannel,
  getCohortMatrix,
} from '@/lib/dashboard-queries';
import {
  FunnelStages,
  SankeyFlow,
  BoxPlotByChannel,
  CohortMatrix,
  BarCompareChart,
  BOLDFY_PALETTE,
} from '@/components/dashboard/charts';
import {
  FileText,
  Flame,
  Calendar,
  Trophy,
  Target,
  BarChart3,
  GitMerge,
  Snail,
  Zap,
  CalendarRange,
  Workflow,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard · Funil B2B',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const DAYS = 30;

const SOURCE_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn', organic: 'Orgânico', direct: 'Direto',
  email: 'Email', indicacao: 'Indicação', pr: 'PR',
  manual: 'Manual', unknown: 'Não atribuído',
};

export default async function FunilPage() {
  const [funnel, sankey, stuck, velocity, scoreDist, cohort, allStatuses, pipelineCounts] = await Promise.all([
    getUnifiedFunnel(DAYS).catch(() => ({ sources: [], stages: [] })),
    getSourceToStatusSankey().catch(() => []),
    getStuckLeads(7).catch(() => []),
    getVelocityByChannel().catch(() => []),
    getScoreDistributionByChannel().catch(() => []),
    getCohortMatrix(6).catch(() => []),
    getStatuses('company').catch(() => []),
    db.select({ statusId: companies.statusId, n: count() }).from(companies).groupBy(companies.statusId).catch(() => []),
  ]);

  const countByStatus = new Map(pipelineCounts.map((r) => [r.statusId, r.n]));
  const pipeline = allStatuses.map((s) => ({
    label: s.label,
    count: countByStatus.get(s.id) ?? 0,
    color: s.color ?? '#CD50F1',
  }));

  const leadsB2b = funnel.stages.find((f) => f.key === 'forms_b2b')?.count ?? 0;
  const mql = funnel.stages.find((f) => f.key === 'mql')?.count ?? 0;
  const reunioes = funnel.stages.find((f) => f.key === 'reunioes')?.count ?? 0;
  const fechados = funnel.stages.find((f) => f.key === 'fechados')?.count ?? 0;

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Funil B2B</h1>
          <p className="dash-subtitle">Drop-off · velocidade · cohort · {DAYS} dias</p>
        </div>
      </div>

      <div className="dash-kpi-grid">
        <div className="dash-kpi">
          <div className="dash-kpi-icon"><FileText /></div>
          <div className="dash-kpi-label">Líderes B2B</div>
          <div className="dash-kpi-value">{leadsB2b}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon amber"><Flame /></div>
          <div className="dash-kpi-label">MQL / Quente</div>
          <div className="dash-kpi-value">{mql}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon blue"><Calendar /></div>
          <div className="dash-kpi-label">Reuniões</div>
          <div className="dash-kpi-value">{reunioes}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon green"><Trophy /></div>
          <div className="dash-kpi-label">Fechados</div>
          <div className="dash-kpi-value">{fechados}</div>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-title"><Target /> Funil de qualificação (drop-off)</div>
        <FunnelStages stages={funnel.stages.map((s, i) => ({
          label: s.label, count: s.count, color: BOLDFY_PALETTE[i % BOLDFY_PALETTE.length],
        }))} />
      </div>

      {sankey.length > 0 ? (
        <div className="dash-card">
          <div className="dash-card-title"><Workflow /> Sankey: Origem → Status atual</div>
          <SankeyFlow edges={sankey} sourceLabels={SOURCE_LABELS} />
        </div>
      ) : null}

      <div className="dash-card">
        <div className="dash-card-title"><GitMerge /> Pipeline de Empresas</div>
        <div className="dash-card-subtitle">Arrasta em <Link href="/internal/crm/empresas" style={{ color: '#CD50F1' }}>/crm/empresas</Link></div>
        <FunnelStages stages={pipeline} />
      </div>

      <div className="dash-card">
        <div className="dash-card-title"><Snail /> Leads parados +7d</div>
        {stuck.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#10B981', fontSize: 13 }}>✓ Pipeline saudável.</div>
        ) : (
          <table className="dash-table">
            <thead><tr><th>Lead</th><th>Status</th><th className="right">Score</th><th className="right">Parado há</th></tr></thead>
            <tbody>
              {stuck.slice(0, 12).map((s) => (
                <tr key={s.id}>
                  <td><Link href={`/internal/crm/people/${s.id}`} className="strong" style={{ textDecoration: 'none', color: '#5E2A67' }}>{s.name}</Link></td>
                  <td><span className="dash-pill">{s.statusLabel}</span></td>
                  <td className="right strong">{s.score}</td>
                  <td className="right"><span className="dash-pill amber">{s.daysSinceUpdate}d</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {velocity.length > 0 ? (
        <div className="dash-card">
          <div className="dash-card-title"><Zap /> Velocidade por canal — lead → reunião</div>
          <BarCompareChart
            data={velocity.map((v) => ({ label: `${SOURCE_LABELS[v.channel] ?? v.channel} (${v.n})` }))}
            series={[{ key: 'avg', label: 'Média dias', color: '#CD50F1', values: velocity.map((v) => Math.round(v.avgDays * 10) / 10) }]}
          />
        </div>
      ) : null}

      {scoreDist.length > 0 ? (
        <div className="dash-card">
          <div className="dash-card-title"><BarChart3 /> Score distribution por canal</div>
          <BoxPlotByChannel rows={scoreDist} channelLabel={(c) => SOURCE_LABELS[c] ?? c} />
        </div>
      ) : null}

      {cohort.length > 0 ? (
        <div className="dash-card">
          <div className="dash-card-title"><CalendarRange /> Cohort retention — leads → reunião</div>
          <CohortMatrix rows={cohort.map((c) => ({
            month: c.month,
            total: c.total,
            values: [
              { label: '7d', value: c.reu7d },
              { label: '14d', value: c.reu14d },
              { label: '30d', value: c.reu30d },
            ],
          }))} />
        </div>
      ) : null}
    </div>
  );
}
