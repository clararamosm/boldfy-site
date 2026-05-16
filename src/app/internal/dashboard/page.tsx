/**
 * Dashboard · Visão Geral.
 *
 * KPIs agregados do CRM (lê do nosso Postgres) + alertas + atividade recente.
 * Os números aqui são dados reais — não precisam de Google Cloud ou outros
 * setups externos. Só precisa do db:push aplicado.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { db, people, companies, activities, statuses } from '@/db';
import { eq, and, isNull, desc, count, gte, sql } from 'drizzle-orm';
import { describeActivity, timeAgo } from '@/lib/crm-format';

export const metadata: Metadata = {
  title: 'Dashboard · Visão Geral',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

async function getKpis() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalPeople,
    totalCompanies,
    newPeople30d,
    quentes,
    reunioesMarcadas,
    fechados,
  ] = await Promise.all([
    db.select({ n: count() }).from(people).where(and(eq(people.archived, false), isNull(people.mergedIntoId))),
    db.select({ n: count() }).from(companies),
    db.select({ n: count() }).from(people).where(and(
      eq(people.archived, false),
      isNull(people.mergedIntoId),
      gte(people.createdAt, thirtyDaysAgo),
    )),
    // Quentes: usa label "Quente" se existir, senão último por sort_order
    db.select({ n: count() }).from(people)
      .leftJoin(statuses, eq(people.statusId, statuses.id))
      .where(and(
        eq(people.archived, false),
        isNull(people.mergedIntoId),
        sql`${statuses.label} = 'Quente'`,
      )),
    db.select({ n: count() }).from(companies)
      .leftJoin(statuses, eq(companies.statusId, statuses.id))
      .where(sql`${statuses.label} = 'Reunião marcada'`),
    db.select({ n: count() }).from(companies)
      .leftJoin(statuses, eq(companies.statusId, statuses.id))
      .where(sql`${statuses.label} = 'Fechado'`),
  ]);

  return {
    totalPeople: totalPeople[0]?.n ?? 0,
    totalCompanies: totalCompanies[0]?.n ?? 0,
    newPeople30d: newPeople30d[0]?.n ?? 0,
    quentes: quentes[0]?.n ?? 0,
    reunioesMarcadas: reunioesMarcadas[0]?.n ?? 0,
    fechados: fechados[0]?.n ?? 0,
  };
}

async function getRecentActivity(limit = 8) {
  return db
    .select({
      activity: activities,
      person: { id: people.id, name: people.name },
      company: { id: companies.id, name: companies.name },
    })
    .from(activities)
    .leftJoin(people, eq(activities.personId, people.id))
    .leftJoin(companies, eq(activities.companyId, companies.id))
    .orderBy(desc(activities.createdAt))
    .limit(limit);
}

export default async function DashboardOverviewPage() {
  let kpis: Awaited<ReturnType<typeof getKpis>> = { totalPeople: 0, totalCompanies: 0, newPeople30d: 0, quentes: 0, reunioesMarcadas: 0, fechados: 0 };
  let recent: Awaited<ReturnType<typeof getRecentActivity>> = [];
  let dbError: string | null = null;
  try {
    [kpis, recent] = await Promise.all([getKpis(), getRecentActivity()]);
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Visão Geral</h1>
          <p className="dash-subtitle">O pulso do site e do pipeline · dados em tempo real</p>
        </div>
      </div>

      {dbError ? (
        <div className="dash-setup-needed">
          <strong>Postgres não conectado.</strong>
          <p>Roda <code>vercel env pull .env.local</code> e <code>npm run db:push</code>.</p>
          <p style={{ fontSize: 11, marginTop: 8 }}>{dbError}</p>
        </div>
      ) : null}

      <div className="dash-kpi-grid">
        <div className="dash-kpi">
          <div className="dash-kpi-icon">👤</div>
          <div className="dash-kpi-label">Pessoas no CRM</div>
          <div className="dash-kpi-value">{kpis.totalPeople}</div>
          <div className="dash-kpi-meta">
            {kpis.newPeople30d > 0 ? <>+{kpis.newPeople30d} nos últimos 30d</> : 'sem novas no mês'}
          </div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon blue">🏢</div>
          <div className="dash-kpi-label">Empresas</div>
          <div className="dash-kpi-value">{kpis.totalCompanies}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon amber">🔥</div>
          <div className="dash-kpi-label">Leads quentes</div>
          <div className="dash-kpi-value">{kpis.quentes}</div>
          <div className="dash-kpi-meta">aguardando outreach</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon orange">📅</div>
          <div className="dash-kpi-label">Reuniões marcadas</div>
          <div className="dash-kpi-value">{kpis.reunioesMarcadas}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon green">🏆</div>
          <div className="dash-kpi-label">Fechados</div>
          <div className="dash-kpi-value">{kpis.fechados}</div>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-title">⚡ Atividade recente</div>
        <div className="dash-card-subtitle">Últimas {recent.length} activities do CRM</div>
        {recent.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>
            Sem atividade ainda. Submete um form de teste no site pra começar.
          </div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Evento</th>
                <th>Lead</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => {
                const desc = describeActivity(r.activity.type, r.activity.data as Record<string, unknown> | null);
                return (
                  <tr key={r.activity.id}>
                    <td className="muted" style={{ width: 110 }}>{timeAgo(r.activity.createdAt)}</td>
                    <td>
                      <span style={{ marginRight: 6 }}>{desc.icon}</span>
                      {desc.text}
                      {r.activity.weight > 0 ? (
                        <span style={{ marginLeft: 6, padding: '1px 6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                          +{r.activity.weight}
                        </span>
                      ) : null}
                    </td>
                    <td>
                      {r.person?.id ? (
                        <Link href={`/internal/crm/people/${r.person.id}`} className="strong" style={{ textDecoration: 'none', color: '#5E2A67' }}>
                          {r.person.name}
                        </Link>
                      ) : '—'}
                      {r.company?.id ? (
                        <span className="muted"> · {r.company.name}</span>
                      ) : null}
                    </td>
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
