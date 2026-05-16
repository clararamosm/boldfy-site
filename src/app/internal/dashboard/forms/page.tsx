/**
 * Dashboard · Forms — leads por formulário e por UTM.
 *
 * Lê do nosso DB (cross dual-write com AC). Mostra:
 *   - Cards por form (Demo / Beta / Report / Proposta) com count
 *   - Top UTMs (source/medium/campaign) por leads gerados
 *   - Lista dos últimos 20 leads recém-capturados
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { db, people, companies } from '@/db';
import { eq, and, isNull, desc, count, sql, gte } from 'drizzle-orm';
import { timeAgo, channelLabel, methodVia } from '@/lib/crm-format';

export const metadata: Metadata = {
  title: 'Dashboard · Forms',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

async function getFormCounts() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      method: people.sourceMethod,
      n: count(),
    })
    .from(people)
    .where(and(
      eq(people.archived, false),
      isNull(people.mergedIntoId),
      gte(people.createdAt, thirtyDaysAgo),
    ))
    .groupBy(people.sourceMethod);

  const map: Record<string, number> = { form_demo: 0, form_beta: 0, form_report: 0, form_proposta: 0 };
  for (const r of rows) {
    if (r.method && map[r.method] !== undefined) map[r.method] = r.n;
  }
  return map;
}

async function getTopUtmSources() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return db
    .select({
      channel: people.sourceChannel,
      campaign: people.firstTouchCampaign,
      n: count(),
    })
    .from(people)
    .where(and(
      eq(people.archived, false),
      isNull(people.mergedIntoId),
      gte(people.createdAt, thirtyDaysAgo),
    ))
    .groupBy(people.sourceChannel, people.firstTouchCampaign)
    .orderBy(desc(count()))
    .limit(10);
}

async function getRecentLeads() {
  return db
    .select({
      person: people,
      company: companies,
    })
    .from(people)
    .leftJoin(companies, eq(people.companyId, companies.id))
    .where(and(eq(people.archived, false), isNull(people.mergedIntoId)))
    .orderBy(desc(people.createdAt))
    .limit(20);
}

const FORM_META: Record<string, { label: string; emoji: string }> = {
  form_demo: { label: 'Demo', emoji: '🎯' },
  form_beta: { label: 'Beta', emoji: '🧪' },
  form_report: { label: 'Report B2B', emoji: '📥' },
  form_proposta: { label: 'Proposta', emoji: '💼' },
};

export default async function DashboardFormsPage() {
  let formCounts: Record<string, number> = { form_demo: 0, form_beta: 0, form_report: 0, form_proposta: 0 };
  let topUtms: Awaited<ReturnType<typeof getTopUtmSources>> = [];
  let recentLeads: Awaited<ReturnType<typeof getRecentLeads>> = [];
  let dbError: string | null = null;

  try {
    [formCounts, topUtms, recentLeads] = await Promise.all([
      getFormCounts(),
      getTopUtmSources(),
      getRecentLeads(),
    ]);
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  const totalThisMonth = Object.values(formCounts).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Formulários</h1>
          <p className="dash-subtitle">
            Leads capturados via forms · agrupado por origem (UTM) · últimos 30 dias
          </p>
        </div>
      </div>

      {dbError ? (
        <div className="dash-setup-needed">
          <strong>Postgres não conectado.</strong>
          <p>Roda <code>vercel env pull .env.local</code> e <code>npm run db:push</code>.</p>
        </div>
      ) : null}

      <div className="dash-kpi-grid">
        {Object.entries(FORM_META).map(([key, meta]) => (
          <div key={key} className="dash-kpi">
            <div className="dash-kpi-icon">{meta.emoji}</div>
            <div className="dash-kpi-label">{meta.label}</div>
            <div className="dash-kpi-value">{formCounts[key] ?? 0}</div>
            <div className="dash-kpi-meta">
              {totalThisMonth > 0
                ? `${Math.round(((formCounts[key] ?? 0) / totalThisMonth) * 100)}% do total`
                : 'sem leads ainda'}
            </div>
          </div>
        ))}
      </div>

      <div className="dash-card">
        <div className="dash-card-title">📊 Top origens (UTM)</div>
        <div className="dash-card-subtitle">
          Channel × campanha · leads únicos nos últimos 30 dias
        </div>
        {topUtms.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>
            Sem leads classificados por UTM ainda.
          </div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Channel</th>
                <th>Campanha (utm_campaign_first)</th>
                <th className="right">Leads</th>
              </tr>
            </thead>
            <tbody>
              {topUtms.map((u, i) => (
                <tr key={i}>
                  <td>
                    {u.channel && u.channel !== 'unknown' ? (
                      <span className={`dash-pill ${u.channel === 'linkedin' ? 'blue' : u.channel === 'organic' ? 'green' : u.channel === 'email' ? 'amber' : 'gray'}`}>
                        {channelLabel(u.channel)}
                      </span>
                    ) : (
                      <span className="dash-pill gray">desconhecido</span>
                    )}
                  </td>
                  <td className="muted">{u.campaign ?? '—'}</td>
                  <td className="right strong">{u.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="dash-card">
        <div className="dash-card-title">📋 Últimos leads</div>
        <div className="dash-card-subtitle">20 mais recentes · click pra abrir no CRM</div>
        {recentLeads.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>
            Nenhum lead capturado ainda. Submete um form no site pra ver aqui.
          </div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Empresa</th>
                <th>Form</th>
                <th>Origem</th>
                <th className="right">Quando</th>
              </tr>
            </thead>
            <tbody>
              {recentLeads.map(({ person, company }) => {
                const via = methodVia(person.sourceMethod);
                const formKey = person.sourceMethod ?? 'manual';
                const formMeta = FORM_META[formKey];
                return (
                  <tr key={person.id}>
                    <td>
                      <Link href={`/internal/crm/people/${person.id}`} className="strong" style={{ textDecoration: 'none', color: '#5E2A67' }}>
                        {person.name}
                      </Link>
                      <div className="muted">{person.email}</div>
                    </td>
                    <td>{company?.name ?? <span className="muted">—</span>}</td>
                    <td>
                      <span className="dash-pill">
                        {formMeta ? `${formMeta.emoji} ${formMeta.label}` : (via?.label ?? formKey)}
                      </span>
                    </td>
                    <td>
                      {person.sourceChannel && person.sourceChannel !== 'unknown' ? (
                        <span className={`dash-pill ${person.sourceChannel === 'linkedin' ? 'blue' : person.sourceChannel === 'organic' ? 'green' : 'gray'}`}>
                          {channelLabel(person.sourceChannel)}
                        </span>
                      ) : (
                        <span className="dash-pill gray">direto</span>
                      )}
                    </td>
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
