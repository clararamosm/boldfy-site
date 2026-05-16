/**
 * Dashboard · Funil B2B.
 *
 * 2 funis na página:
 *
 *  1. Funil de Qualificação (top — novo, sugerido pela Clara):
 *     Visitas (GA4) → Leads totais → Líderes B2B → Reunião → Fechado
 *     Mostra também "Não-B2B" (agências, criadores) pra ela saber quanta gente
 *     tá entrando que não é ICP.
 *
 *  2. Funil de Companies (Pipeline) — etapas configuráveis dos kanbans
 *
 * + Oportunidades quentes + Origem dos fechados.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { db, people, companies, statuses } from '@/db';
import { eq, and, isNull, count, sql, desc } from 'drizzle-orm';
import { getStatuses } from '@/lib/statuses';
import { channelLabel } from '@/lib/crm-format';
import { isGa4Configured, getTrafficSummary } from '@/lib/ga4';

export const metadata: Metadata = {
  title: 'Dashboard · Funil B2B',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const B2B_TAG = 'Segmento: Líderes B2B';

/* -------------------------------------------------------------------------- */
/*  Funil de Qualificação                                                     */
/* -------------------------------------------------------------------------- */

async function getQualificationFunnel() {
  const [totalLeads, b2bLeads, reuniaoCount, fechadoCount] = await Promise.all([
    db.select({ n: count() }).from(people).where(and(eq(people.archived, false), isNull(people.mergedIntoId))),
    db.select({ n: count() }).from(people).where(and(
      eq(people.archived, false),
      isNull(people.mergedIntoId),
      sql`${B2B_TAG} = ANY(${people.acTags})`,
    )),
    db.select({ n: count() }).from(companies)
      .leftJoin(statuses, eq(companies.statusId, statuses.id))
      .where(sql`${statuses.label} IN ('Reunião marcada', 'Em andamento')`),
    db.select({ n: count() }).from(companies)
      .leftJoin(statuses, eq(companies.statusId, statuses.id))
      .where(sql`${statuses.label} = 'Fechado'`),
  ]);

  return {
    totalLeads: totalLeads[0]?.n ?? 0,
    b2bLeads: b2bLeads[0]?.n ?? 0,
    naoB2B: (totalLeads[0]?.n ?? 0) - (b2bLeads[0]?.n ?? 0),
    reuniaoCount: reuniaoCount[0]?.n ?? 0,
    fechadoCount: fechadoCount[0]?.n ?? 0,
  };
}

/* -------------------------------------------------------------------------- */
/*  Funil de Pipeline (etapas das Empresas, dinâmico)                         */
/* -------------------------------------------------------------------------- */

type FunnelStep = {
  label: string;
  color: string;
  count: number;
  isTerminal: boolean;
};

async function getCompanyFunnel(): Promise<FunnelStep[]> {
  const [allStatuses, byStatus] = await Promise.all([
    getStatuses('company'),
    db
      .select({ statusId: companies.statusId, n: count() })
      .from(companies)
      .groupBy(companies.statusId),
  ]);

  const countMap = new Map<string, number>();
  for (const r of byStatus) {
    if (r.statusId) countMap.set(r.statusId, r.n);
  }

  return allStatuses.map((s) => ({
    label: s.label,
    color: s.color ?? 'gray',
    count: countMap.get(s.id) ?? 0,
    isTerminal: s.isTerminal,
  }));
}

async function getOriginXFechado() {
  const rows = await db
    .select({
      channel: people.sourceChannel,
      n: sql<number>`COUNT(DISTINCT ${companies.id})::int`,
    })
    .from(companies)
    .leftJoin(statuses, eq(companies.statusId, statuses.id))
    .leftJoin(people, eq(people.companyId, companies.id))
    .where(eq(statuses.label, 'Fechado'))
    .groupBy(people.sourceChannel)
    .orderBy(desc(sql`COUNT(DISTINCT ${companies.id})`));

  return rows;
}

async function getHotOpportunities() {
  return db
    .select({
      company: companies,
      status: statuses,
      topScore: sql<number>`COALESCE((SELECT MAX(lead_score) FROM people WHERE company_id = ${companies.id} AND archived = FALSE AND merged_into_id IS NULL), 0)`,
      peopleCount: sql<number>`(SELECT COUNT(*)::int FROM people WHERE company_id = ${companies.id} AND archived = FALSE AND merged_into_id IS NULL)`,
    })
    .from(companies)
    .leftJoin(statuses, eq(companies.statusId, statuses.id))
    .where(sql`${statuses.label} IN ('Reunião marcada', 'Em andamento')`)
    .orderBy(desc(companies.updatedAt))
    .limit(15);
}

/* -------------------------------------------------------------------------- */
/*  Render                                                                     */
/* -------------------------------------------------------------------------- */

export default async function DashboardFunilPage() {
  const ga4Configured = isGa4Configured();

  let qualif: Awaited<ReturnType<typeof getQualificationFunnel>> = { totalLeads: 0, b2bLeads: 0, naoB2B: 0, reuniaoCount: 0, fechadoCount: 0 };
  let pipeline: FunnelStep[] = [];
  let origin: Awaited<ReturnType<typeof getOriginXFechado>> = [];
  let hotOpps: Awaited<ReturnType<typeof getHotOpportunities>> = [];
  let ga4Summary: Awaited<ReturnType<typeof getTrafficSummary>> = null;
  let dbError: string | null = null;

  try {
    [qualif, pipeline, origin, hotOpps] = await Promise.all([
      getQualificationFunnel(),
      getCompanyFunnel(),
      getOriginXFechado(),
      getHotOpportunities(),
    ]);
    if (ga4Configured) {
      ga4Summary = await getTrafficSummary(30);
    }
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  const visitas = ga4Summary?.totalUsers ?? null;

  // Funil de qualificação ordenado top-down
  const qualifSteps = [
    {
      label: 'Visitas únicas (30d)',
      count: visitas,
      help: ga4Configured ? null : 'configure GA4 pra ver',
      color: 'gray',
    },
    {
      label: 'Total de leads (todos os forms)',
      count: qualif.totalLeads,
      help: visitas !== null && visitas > 0
        ? `${((qualif.totalLeads / visitas) * 100).toFixed(2)}% das visitas`
        : null,
      color: 'purple',
    },
    {
      label: '👤 Líderes B2B (ICP)',
      count: qualif.b2bLeads,
      help: qualif.totalLeads > 0
        ? `${((qualif.b2bLeads / qualif.totalLeads) * 100).toFixed(0)}% dos leads · ${qualif.naoB2B} não-B2B (criadores/agências)`
        : null,
      color: 'blue',
    },
    {
      label: '📅 Reunião marcada / Em andamento',
      count: qualif.reuniaoCount,
      help: qualif.b2bLeads > 0
        ? `${((qualif.reuniaoCount / qualif.b2bLeads) * 100).toFixed(0)}% dos líderes B2B viraram reunião`
        : null,
      color: 'amber',
    },
    {
      label: '🏆 Fechado',
      count: qualif.fechadoCount,
      help: qualif.reuniaoCount > 0
        ? `${((qualif.fechadoCount / qualif.reuniaoCount) * 100).toFixed(0)}% das reuniões viraram cliente`
        : null,
      color: 'green',
    },
  ];

  const maxQualif = Math.max(...qualifSteps.map((s) => s.count ?? 0), 1);
  const maxPipe = Math.max(...pipeline.map((s) => s.count), 1);

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Funil B2B</h1>
          <p className="dash-subtitle">
            Funil de qualificação (visita → ICP → cliente) + pipeline de Empresas direto do CRM
          </p>
        </div>
      </div>

      {dbError ? (
        <div className="dash-setup-needed">
          <strong>Postgres não conectado.</strong>
          <p>{dbError}</p>
        </div>
      ) : null}

      {/* === Funil de Qualificação === */}
      <div className="dash-card">
        <div className="dash-card-title">🎯 Funil de qualificação</div>
        <div className="dash-card-subtitle">
          De quantos visitantes saem clientes B2B · &ldquo;Líderes B2B&rdquo; usa tag <code style={{ background: '#F7EEFC', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>{B2B_TAG}</code> do AC
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {qualifSteps.map((step, idx) => {
            const widthPct = step.count !== null ? (step.count / maxQualif) * 100 : 0;
            return (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '260px 1fr 90px', alignItems: 'center', gap: 14, padding: '14px 16px', background: '#FAF7FF', borderRadius: 10 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#5E2A67' }}>{step.label}</div>
                  {step.help ? <div style={{ fontSize: 11, color: '#9D85B3', marginTop: 2 }}>{step.help}</div> : null}
                </div>
                <div style={{ height: 30, background: '#FFFFFF', borderRadius: 8, position: 'relative', overflow: 'hidden', border: '1px solid #E4D8ED' }}>
                  {step.count !== null ? (
                    <div style={{
                      height: '100%',
                      width: `${Math.max(widthPct, step.count > 0 ? 2 : 0)}%`,
                      background: step.color === 'green'
                        ? 'linear-gradient(90deg, #10B981 0%, #34D399 100%)'
                        : step.color === 'amber'
                          ? 'linear-gradient(90deg, #F59E0B 0%, #FBBF24 100%)'
                          : step.color === 'blue'
                            ? 'linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%)'
                            : 'linear-gradient(90deg, #CD50F1 0%, #E875FF 100%)',
                      borderRadius: 8,
                    }} />
                  ) : null}
                </div>
                <div style={{ textAlign: 'right', fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 22, color: '#5E2A67' }}>
                  {step.count !== null ? step.count.toLocaleString('pt-BR') : '—'}
                </div>
              </div>
            );
          })}
        </div>

        {qualif.naoB2B > 0 ? (
          <div style={{ marginTop: 16, padding: 12, background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 10, fontSize: 12, color: '#92580E' }}>
            💡 <strong>{qualif.naoB2B} leads não-B2B</strong> (criadores individuais, agências) chegam mas não são ICP. Cadência de nutrição editorial via AC pode aproveitá-los sem desviar foco de vendas.
          </div>
        ) : null}
      </div>

      {/* === Funil de Pipeline (Empresas) === */}
      <div className="dash-card">
        <div className="dash-card-title">📊 Pipeline de Empresas (etapas configuráveis)</div>
        <div className="dash-card-subtitle">
          Counts por etapa dinâmica · arrasta em /internal/crm/empresas pra mover
        </div>

        {pipeline.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>
            Sem etapas configuradas.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pipeline.map((step, idx) => {
              const widthPct = (step.count / maxPipe) * 100;
              return (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '200px 1fr 80px', alignItems: 'center', gap: 14, padding: '10px 14px', background: '#FAF7FF', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#5E2A67' }}>
                    <span className={`crm-col-dot ${step.color}`} style={{ width: 10, height: 10 }} />
                    {step.label}
                    {step.isTerminal ? <span style={{ fontSize: 9, color: '#9D85B3', fontWeight: 600 }}>(terminal)</span> : null}
                  </div>
                  <div style={{ height: 24, background: '#FFFFFF', borderRadius: 8, position: 'relative', overflow: 'hidden', border: '1px solid #E4D8ED' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.max(widthPct, step.count > 0 ? 2 : 0)}%`,
                      background: 'linear-gradient(90deg, #CD50F1 0%, #E875FF 100%)',
                      borderRadius: 8,
                    }} />
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 18, color: '#5E2A67' }}>{step.count}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* === Oportunidades quentes === */}
      <div className="dash-card">
        <div className="dash-card-title">🔥 Oportunidades quentes</div>
        {hotOpps.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>
            Sem oportunidades no momento.
          </div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Status</th>
                <th className="right">Pessoas</th>
                <th className="right">Top score</th>
                <th className="right">Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {hotOpps.map((o) => (
                <tr key={o.company.id}>
                  <td>
                    <Link href={`/internal/crm/companies/${o.company.id}`} className="strong" style={{ textDecoration: 'none', color: '#5E2A67' }}>
                      {o.company.name}
                    </Link>
                    <div className="muted">{o.company.industry ?? '—'}</div>
                  </td>
                  <td><span className={`dash-pill ${o.status?.color === 'amber' ? 'amber' : 'blue'}`}>{o.status?.label ?? '—'}</span></td>
                  <td className="right">{o.peopleCount}</td>
                  <td className="right strong">{o.topScore}</td>
                  <td className="right muted">{new Date(o.company.updatedAt).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* === Origem dos Fechados === */}
      <div className="dash-card">
        <div className="dash-card-title">🎯 Origem dos clientes fechados</div>
        {origin.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>
            Ainda sem deals fechados pra mostrar atribuição.
          </div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Canal</th>
                <th className="right">Empresas fechadas</th>
              </tr>
            </thead>
            <tbody>
              {origin.map((o, i) => (
                <tr key={i}>
                  <td>
                    <span className={`dash-pill ${o.channel === 'linkedin' ? 'blue' : o.channel === 'organic' ? 'green' : 'gray'}`}>
                      {channelLabel(o.channel)}
                    </span>
                  </td>
                  <td className="right strong">{o.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
