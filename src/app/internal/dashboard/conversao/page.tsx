/**
 * Dashboard · Conversão & Funil.
 *
 * BISECT: adicionando blocos gradualmente após confirmar base funciona.
 *
 * ATIVOS agora (componentes já testados em outras pages):
 *  - KPIs, FunnelStages, Pipeline de Empresas, HeatmapChart, tables simples
 *
 * AINDA DESATIVADOS (suspeitos do 500 original):
 *  - SankeyFlow, BoxPlotByChannel, CohortMatrix, BarCompareChart
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { db, people, companies, statuses } from '@/db';
import { eq, and, isNull, count, desc, gte } from 'drizzle-orm';
import { getStatuses } from '@/lib/statuses';
import {
  getUnifiedFunnel,
  getStuckLeads,
  getTimePerStage,
  getFormConversionRate,
  getConversionHeatmap,
  getSourceToStatusSankey,
  getVelocityByChannel,
  getScoreDistributionByChannel,
  getCohortMatrix,
} from '@/lib/dashboard-queries';
import { PeriodFilter } from '@/components/dashboard/period-filter';
import { parsePeriod } from '@/components/dashboard/period-utils';
import {
  FunnelStages,
  HeatmapChart,
  SankeyFlow,
  BarCompareChart,
  BoxPlotByChannel,
  CohortMatrix,
  BOLDFY_PALETTE,
} from '@/components/dashboard/charts';
import { channelLabel, timeAgo, methodVia } from '@/lib/crm-format';
import {
  FileText,
  Flame,
  Calendar,
  Trophy,
  Target,
  BarChart3,
  GitMerge,
  Snail,
  Timer,
  ClipboardList,
  Lightbulb,
  Flame as FlameIcon,
  Users,
  Workflow,
  Zap,
  CalendarRange,
} from 'lucide-react';
import { Target as TargetIcon, FlaskConical, Download, Briefcase as BriefcaseIcon } from 'lucide-react';

const FORM_META: Record<string, { label: string; Icon: React.ComponentType<{ size?: number }> }> = {
  demo: { label: 'Demo', Icon: TargetIcon },
  beta: { label: 'Beta', Icon: FlaskConical },
  report: { label: 'Report B2B', Icon: Download },
  proposta: { label: 'Proposta', Icon: BriefcaseIcon },
};

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
  // eslint-disable-next-line react-hooks/purity -- Server Component force-dynamic
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const funnel = await safeBlock('funnel', () => getUnifiedFunnel(days), { sources: [], stages: [] } as Awaited<ReturnType<typeof getUnifiedFunnel>>);
  const sankey = await safeBlock('sankey', () => getSourceToStatusSankey(), [] as Awaited<ReturnType<typeof getSourceToStatusSankey>>);
  const velocity = await safeBlock('velocity', () => getVelocityByChannel(), [] as Awaited<ReturnType<typeof getVelocityByChannel>>);
  const scoreDist = await safeBlock('scoreDist', () => getScoreDistributionByChannel(), [] as Awaited<ReturnType<typeof getScoreDistributionByChannel>>);
  const cohort = await safeBlock('cohort', () => getCohortMatrix(6), [] as Awaited<ReturnType<typeof getCohortMatrix>>);
  const stuck = await safeBlock('stuck', () => getStuckLeads(7), [] as Awaited<ReturnType<typeof getStuckLeads>>);
  const stageTime = await safeBlock('stageTime', () => getTimePerStage(), [] as Awaited<ReturnType<typeof getTimePerStage>>);
  const formCvr = await safeBlock('formCvr', () => getFormConversionRate(days), [] as Awaited<ReturnType<typeof getFormConversionRate>>);
  const heatmap = await safeBlock('heatmap', () => getConversionHeatmap(90), Array.from({ length: 7 }, () => Array(24).fill(0)) as number[][]);
  const allStatuses = await safeBlock('statuses', () => getStatuses('company'), [] as Awaited<ReturnType<typeof getStatuses>>);

  const recentLeads = await safeBlock('recentLeads', () => db.select({
    person: people, company: companies, status: statuses,
  })
  .from(people)
  .leftJoin(companies, eq(people.companyId, companies.id))
  .leftJoin(statuses, eq(people.statusId, statuses.id))
  .where(and(eq(people.archived, false), isNull(people.mergedIntoId), gte(people.createdAt, since)))
  .orderBy(desc(people.createdAt))
  .limit(15), [] as Array<{ person: typeof people.$inferSelect; company: typeof companies.$inferSelect | null; status: typeof statuses.$inferSelect | null }>);

  const pipelineCounts = await safeBlock('pipelineCounts', () => db.select({ statusId: companies.statusId, n: count() }).from(companies).groupBy(companies.statusId), [] as Array<{ statusId: string | null; n: number }>);
  const countByStatus = new Map(pipelineCounts.map((r) => [r.statusId, r.n]));
  const pipeline = allStatuses.map((s) => ({
    label: s.label,
    count: countByStatus.get(s.id) ?? 0,
    color: s.color ?? '#CD50F1',
  }));

  const totalLeadsPeriod = (funnel.stages.find((f) => f.key === 'forms_b2b')?.count) ?? 0;
  const totalMql = (funnel.stages.find((f) => f.key === 'mql')?.count) ?? 0;
  const totalReunioes = (funnel.stages.find((f) => f.key === 'reunioes')?.count) ?? 0;
  const totalFechados = (funnel.stages.find((f) => f.key === 'fechados')?.count) ?? 0;

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Conversão & Funil</h1>
          <p className="dash-subtitle">Forms · Funil B2B · leads parados · cohort · {days}d</p>
        </div>
        <Suspense fallback={<div style={{ width: 220, height: 32 }} />}>
          <PeriodFilter />
        </Suspense>
      </div>

      {/* KPIs */}
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
          <div className="dash-kpi-meta">{totalLeadsPeriod > 0 ? `${((totalMql / totalLeadsPeriod) * 100).toFixed(0)}% dos leads` : '—'}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon blue"><Calendar /></div>
          <div className="dash-kpi-label">Reuniões</div>
          <div className="dash-kpi-value">{totalReunioes}</div>
          <div className="dash-kpi-meta">{totalMql > 0 ? `${((totalReunioes / totalMql) * 100).toFixed(0)}% dos MQL` : '—'}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon green"><Trophy /></div>
          <div className="dash-kpi-label">Fechados</div>
          <div className="dash-kpi-value">{totalFechados}</div>
          <div className="dash-kpi-meta">{totalReunioes > 0 ? `${((totalFechados / totalReunioes) * 100).toFixed(0)}% das reuniões` : '—'}</div>
        </div>
      </div>

      <SectionHeader icon={BarChart3} title="Funil B2B" subtitle="Drop-off por estágio · pipeline de empresas · leads parados" />

      {/* Funil clássico — TESTADO */}
      <div className="dash-card">
        <div className="dash-card-title"><Target /> Funil de qualificação (drop-off por etapa)</div>
        <div className="dash-card-subtitle">Cross-channel: SEO + LinkedIn + Direct + outros → Cliente</div>
        <FunnelStages stages={funnel.stages.map((s, i) => ({
          label: s.label,
          count: s.count,
          color: BOLDFY_PALETTE[i % BOLDFY_PALETTE.length],
        }))} />
      </div>

      {/* Sankey origem → status */}
      {sankey.length > 0 ? (
        <div className="dash-card">
          <div className="dash-card-title"><Workflow /> Sankey: Origem → Status atual</div>
          <div className="dash-card-subtitle">Quais canais alimentam quais estágios do funil</div>
          <SankeyFlow
            edges={sankey}
            sourceLabels={{
              linkedin: 'LinkedIn', organic: 'Orgânico', direct: 'Direto',
              email: 'Email', indicacao: 'Indicação', pr: 'PR',
              manual: 'Manual', unknown: 'Não atribuído',
            }}
          />
        </div>
      ) : null}

      {/* Pipeline de Empresas — TESTADO (FunnelStages) */}
      <div className="dash-card">
        <div className="dash-card-title"><GitMerge /> Pipeline de Empresas (etapas configuráveis)</div>
        <div className="dash-card-subtitle">Counts por etapa · arrasta em <Link href="/internal/crm/empresas" style={{ color: '#CD50F1' }}>/crm/empresas</Link></div>
        <FunnelStages stages={pipeline} />
      </div>

      {/* Leads parados — só table */}
      <div className="dash-card">
        <div className="dash-card-title"><Snail /> Leads parados há mais de 7 dias</div>
        <div className="dash-card-subtitle">Sem update no status — risco de esfriar</div>
        {stuck.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#10B981', fontSize: 13 }}>✓ Nenhum lead parado. Pipeline saudável.</div>
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

      {/* Velocidade por canal (BarCompare) */}
      {velocity.length > 0 ? (
        <div className="dash-card">
          <div className="dash-card-title"><Zap /> Velocidade por canal — lead → primeira reunião</div>
          <div className="dash-card-subtitle">Quanto tempo cada canal leva pra converter (média dias)</div>
          <BarCompareChart
            data={velocity.map((v) => ({ label: `${v.channel} (${v.n})` }))}
            series={[
              { key: 'avg', label: 'Média dias', color: '#CD50F1', values: velocity.map((v) => Math.round(v.avgDays * 10) / 10) },
            ]}
          />
        </div>
      ) : null}

      {/* Score distribution por canal (box plot) */}
      {scoreDist.length > 0 ? (
        <div className="dash-card">
          <div className="dash-card-title"><BarChart3 /> Score distribution por canal</div>
          <div className="dash-card-subtitle">Box plot: min · Q1 · mediana · Q3 · max · n = lead count</div>
          <BoxPlotByChannel rows={scoreDist} channelLabel={(c) => c} />
        </div>
      ) : null}

      {/* Cohort retention */}
      {cohort.length > 0 ? (
        <div className="dash-card">
          <div className="dash-card-title"><CalendarRange /> Cohort retention — leads → reunião</div>
          <div className="dash-card-subtitle">% de leads de cada mês que viraram reunião em 7/14/30 dias</div>
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

      {/* Tempo entre stages — só table */}
      {stageTime.length > 0 ? (
        <div className="dash-card">
          <div className="dash-card-title"><Timer /> Tempo médio entre status</div>
          <div className="dash-card-subtitle">Baseado em activities tipo status_change</div>
          <table className="dash-table">
            <thead><tr><th>De</th><th>→</th><th>Para</th><th className="right">Média (dias)</th><th className="right">N</th></tr></thead>
            <tbody>
              {stageTime.map((s, i) => (
                <tr key={i}>
                  <td className="strong">{s.fromStatus}</td>
                  <td className="muted">→</td>
                  <td className="strong">{s.toStatus}</td>
                  <td className="right strong">{s.avgDays.toFixed(1)}</td>
                  <td className="right muted">{s.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <SectionHeader icon={ClipboardList} title="Forms" subtitle="Taxa de conversão por form + padrão de quando convertem" />

      {/* Form CVR — só table */}
      <div className="dash-card">
        <div className="dash-card-title"><Lightbulb /> Conversion rate por form</div>
        <div className="dash-card-subtitle">CRM submissões ÷ GA4 page views</div>
        {formCvr.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>Sem submissões no período.</div>
        ) : (
          <table className="dash-table">
            <thead><tr><th>Form</th><th className="right">Submissões</th><th className="right">Page views</th><th className="right">CVR</th></tr></thead>
            <tbody>
              {formCvr.map((f) => {
                const Icon = FORM_META[f.form]?.Icon ?? FileText;
                return (
                  <tr key={f.form}>
                    <td className="strong" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon size={14} />
                      {FORM_META[f.form]?.label ?? f.form}
                    </td>
                    <td className="right">{f.submissions}</td>
                    <td className="right muted">{f.pageViews?.toLocaleString('pt-BR') ?? '—'}</td>
                    <td className="right">
                      {f.cvr !== null ? (
                        <span className={`dash-pill ${f.cvr >= 5 ? 'green' : f.cvr >= 2 ? 'amber' : 'gray'}`}>{f.cvr.toFixed(1)}%</span>
                      ) : <span className="muted">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Heatmap — TESTADO em Visão Geral */}
      <div className="dash-card">
        <div className="dash-card-title"><FlameIcon /> Heatmap dia × hora — quando convertemos</div>
        <div className="dash-card-subtitle">Forms preenchidos · 90d</div>
        <HeatmapChart matrix={heatmap} />
      </div>

      {/* Leads recentes — só table */}
      <div className="dash-card">
        <div className="dash-card-title"><Users /> Leads recentes no período</div>
        {recentLeads.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>Sem leads no período.</div>
        ) : (
          <table className="dash-table">
            <thead><tr><th>Lead</th><th>Empresa</th><th>Via</th><th>Canal</th><th>Status</th><th className="right">Quando</th></tr></thead>
            <tbody>
              {recentLeads.map(({ person, company, status }) => {
                const via = methodVia(person.sourceMethod);
                return (
                  <tr key={person.id}>
                    <td>
                      <Link href={`/internal/crm/people/${person.id}`} className="strong" style={{ textDecoration: 'none', color: '#5E2A67' }}>{person.name}</Link>
                      <div className="muted">{person.jobTitle ?? person.email}</div>
                    </td>
                    <td>{company?.name ?? <span className="muted">—</span>}</td>
                    <td>{via ? <span className="dash-pill">{via.label}</span> : <span className="muted">—</span>}</td>
                    <td><span className="dash-pill blue">{channelLabel(person.sourceChannel)}</span></td>
                    <td><span className="dash-pill">{status?.label ?? '—'}</span></td>
                    <td className="right muted">{timeAgo(person.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: { icon?: React.ComponentType<{ size?: number }>; title: string; subtitle?: string }) {
  return (
    <div style={{ margin: '36px 0 12px 0', paddingTop: 18, borderTop: '1px solid #E4D8ED' }}>
      <h2 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 20, color: '#5E2A67', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
        {Icon ? <Icon size={22} /> : null}
        {title}
      </h2>
      {subtitle ? <div style={{ fontSize: 12, color: '#9D85B3', marginTop: 4 }}>{subtitle}</div> : null}
    </div>
  );
}
