/**
 * Dashboard · Conversão & Funil.
 *
 * Absorve Forms (AC) + Funil B2B (CRM).
 *
 * Filosofia: dados clássicos + insights além de painel relator —
 * sankey origem→status, leads parados, velocity por canal, cohort retention,
 * score distribution por canal.
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { db, people, companies, statuses } from '@/db';
import { eq, and, isNull, count, desc, sql, gte } from 'drizzle-orm';
import { getStatuses } from '@/lib/statuses';
import {
  getSourceToStatusSankey,
  getStuckLeads,
  getScoreDistributionByChannel,
  getVelocityByChannel,
  getCohortMatrix,
  getTimePerStage,
  getFormConversionRate,
  getConversionHeatmap,
  getUnifiedFunnel,
} from '@/lib/dashboard-queries';
import { PeriodFilter, parsePeriod } from '@/components/dashboard/period-filter';
import {
  FunnelStages,
  SankeyFlow,
  BoxPlotByChannel,
  CohortMatrix,
  HeatmapChart,
  BarCompareChart,
  BOLDFY_PALETTE,
} from '@/components/dashboard/charts';
import { channelLabel, timeAgo, methodVia } from '@/lib/crm-format';
import {
  FileText,
  Flame,
  Calendar,
  Trophy,
  Target,
  GitMerge,
  BarChart3,
  Snail,
  Zap,
  CalendarRange,
  Timer,
  ClipboardList,
  Lightbulb,
  Flame as FlameIcon,
  Users,
  Workflow,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard · Conversão',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

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

import { Target as TargetIcon, FlaskConical, Download, Briefcase as BriefcaseIcon } from 'lucide-react';

const FORM_META: Record<string, { label: string; Icon: React.ComponentType<{ size?: number }> }> = {
  demo: { label: 'Demo', Icon: TargetIcon },
  beta: { label: 'Beta', Icon: FlaskConical },
  report: { label: 'Report B2B', Icon: Download },
  proposta: { label: 'Proposta', Icon: BriefcaseIcon },
};

type SearchParams = Promise<{ period?: string }>;

export default async function ConversaoPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const days = parsePeriod(params.period);
  // eslint-disable-next-line react-hooks/purity -- Server Component force-dynamic
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [funnel, sankey, stuck, scoreDist, velocity, cohort, stageTime, formCvr, heatmap, allStatuses, recentLeads] = await Promise.all([
    getUnifiedFunnel(days).catch(() => ({ sources: [], stages: [] })),
    getSourceToStatusSankey().catch(() => []),
    getStuckLeads(7).catch(() => []),
    getScoreDistributionByChannel().catch(() => []),
    getVelocityByChannel().catch(() => []),
    getCohortMatrix(6).catch(() => []),
    getTimePerStage().catch(() => []),
    getFormConversionRate(days).catch(() => []),
    getConversionHeatmap(90).catch(() => Array.from({ length: 7 }, () => Array(24).fill(0))),
    getStatuses('company').catch(() => []),
    db.select({
      person: people,
      company: companies,
      status: statuses,
    })
    .from(people)
    .leftJoin(companies, eq(people.companyId, companies.id))
    .leftJoin(statuses, eq(people.statusId, statuses.id))
    .where(and(eq(people.archived, false), isNull(people.mergedIntoId), gte(people.createdAt, since)))
    .orderBy(desc(people.createdAt))
    .limit(15)
    .catch(() => []),
  ]);

  // Pipeline empresas
  const [pipelineCounts] = await Promise.all([
    db.select({ statusId: companies.statusId, n: count() })
      .from(companies)
      .groupBy(companies.statusId)
      .catch(() => []),
  ]);
  const countByStatus = new Map(pipelineCounts.map((r) => [r.statusId, r.n]));
  const pipeline = allStatuses.map((s) => ({
    label: s.label,
    count: countByStatus.get(s.id) ?? 0,
    color: s.color ?? '#CD50F1',
  }));

  // Estatísticas top
  const totalLeadsPeriod = (funnel.stages.find((f) => f.key === 'forms_b2b')?.count) ?? 0;
  const totalMql = (funnel.stages.find((f) => f.key === 'mql')?.count) ?? 0;
  const totalReunioes = (funnel.stages.find((f) => f.key === 'reunioes')?.count) ?? 0;
  const totalFechados = (funnel.stages.find((f) => f.key === 'fechados')?.count) ?? 0;

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Conversão & Funil</h1>
          <p className="dash-subtitle">Forms · Funil B2B · velocidade · cohort · {days}d</p>
        </div>
        <Suspense fallback={<div style={{ width: 220, height: 32 }} />}>
          <PeriodFilter />
        </Suspense>
      </div>

      {/* ========================================================== */}
      {/*  KPIs                                                      */}
      {/* ========================================================== */}
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

      {/* ========================================================== */}
      {/*  SECTION: FUNIL B2B                                        */}
      {/* ========================================================== */}
      <SectionHeader icon={BarChart3} title="Funil B2B" subtitle="Drop-off por estágio · sankey origem → status · velocidade por canal" />

      {/* Funil clássico com drop-off */}
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
      <div className="dash-card">
        <div className="dash-card-title"><Workflow /> Sankey: Origem → Status atual</div>
        <div className="dash-card-subtitle">Quais canais alimentam quais estágios do funil</div>
        <SankeyFlow
          edges={sankey}
          sourceLabels={SOURCE_LABELS}
        />
      </div>

      {/* Pipeline de Empresas */}
      <div className="dash-card">
        <div className="dash-card-title"><GitMerge /> Pipeline de Empresas (etapas configuráveis)</div>
        <div className="dash-card-subtitle">Counts por etapa · arrasta em <Link href="/internal/crm/companies" style={{ color: '#CD50F1' }}>/crm/companies</Link></div>
        <FunnelStages stages={pipeline} />
      </div>

      {/* 💡 INSIGHT: Leads parados */}
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
                  <td className="right">
                    <span className="dash-pill amber">{s.daysSinceUpdate}d</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 💡 INSIGHT: Velocidade por canal */}
      {velocity.length > 0 ? (
        <div className="dash-card">
          <div className="dash-card-title"><Zap /> Velocidade por canal — lead → primeira reunião</div>
          <div className="dash-card-subtitle">Quanto tempo cada canal leva pra converter (média dias)</div>
          <BarCompareChart
            data={velocity.map((v) => ({ label: `${SOURCE_LABELS[v.channel] ?? v.channel} (${v.n})` }))}
            series={[
              { key: 'avg', label: 'Média dias', color: '#CD50F1', values: velocity.map((v) => Math.round(v.avgDays * 10) / 10) },
            ]}
          />
        </div>
      ) : null}

      {/* 💡 INSIGHT: Score distribution por canal */}
      {scoreDist.length > 0 ? (
        <div className="dash-card">
          <div className="dash-card-title"><BarChart3 /> Score distribution por canal</div>
          <div className="dash-card-subtitle">Box plot: min · Q1 · mediana · Q3 · max · n = lead count</div>
          <BoxPlotByChannel rows={scoreDist} channelLabel={(c) => SOURCE_LABELS[c] ?? c} />
        </div>
      ) : null}

      {/* 💡 INSIGHT: Cohort retention */}
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

      {/* 💡 INSIGHT: Tempo médio entre stages */}
      {stageTime.length > 0 ? (
        <div className="dash-card">
          <div className="dash-card-title"><Timer /> Tempo médio entre status</div>
          <div className="dash-card-subtitle">Baseado em activities tipo status_change · só transições com ≥2 ocorrências</div>
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

      {/* ========================================================== */}
      {/*  SECTION: FORMS                                            */}
      {/* ========================================================== */}
      <SectionHeader icon={ClipboardList} title="Forms" subtitle="Taxa de conversão por form + padrão de quando convertem" />

      {/* 💡 Form conversion rate */}
      <div className="dash-card">
        <div className="dash-card-title"><Lightbulb /> Conversion rate por form (visitas da page → submissão)</div>
        <div className="dash-card-subtitle">Cruzamento GA4 page views × CRM submissions</div>
        {formCvr.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>Sem submissões no período (ou GA4 não configurado).</div>
        ) : (
          <table className="dash-table">
            <thead><tr><th>Form</th><th className="right">Submissões</th><th className="right">Page views</th><th className="right">CVR</th></tr></thead>
            <tbody>
              {formCvr.map((f) => (
                <tr key={f.form}>
                  <td className="strong" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {(() => {
                      const Icon = FORM_META[f.form]?.Icon ?? FileText;
                      return <Icon size={14} />;
                    })()}
                    {FORM_META[f.form]?.label ?? f.form}
                  </td>
                  <td className="right">{f.submissions}</td>
                  <td className="right muted">{f.pageViews?.toLocaleString('pt-BR') ?? '—'}</td>
                  <td className="right">
                    {f.cvr !== null ? (
                      <span className={`dash-pill ${f.cvr >= 5 ? 'green' : f.cvr >= 2 ? 'amber' : 'gray'}`}>
                        {f.cvr.toFixed(1)}%
                      </span>
                    ) : <span className="muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Heatmap conversões */}
      <div className="dash-card">
        <div className="dash-card-title"><FlameIcon /> Heatmap dia × hora — quando convertemos</div>
        <div className="dash-card-subtitle">Forms preenchidos · 90d · padrão de comportamento</div>
        <HeatmapChart matrix={heatmap} />
      </div>

      {/* Leads recentes do período */}
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
