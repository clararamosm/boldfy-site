/**
 * Dashboard · LinkedIn (UTM-based).
 *
 * Sem Website Demographics (precisa ~300 únicos/90d pra desbloquear).
 * Foco: cruzamento GA4 (visitas com source=linkedin) + nosso CRM (leads
 * com source_channel=linkedin).
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { db, people, companies, statuses } from '@/db';
import { eq, and, isNull, count, desc, sql } from 'drizzle-orm';
import { isGa4Configured, getTopUtms, getTrafficByChannel } from '@/lib/ga4';
import { timeAgo } from '@/lib/crm-format';

export const metadata: Metadata = {
  title: 'Dashboard · LinkedIn',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';
export const revalidate = 900;

async function getLinkedInLeads() {
  return db
    .select({
      person: people,
      company: companies,
      status: statuses,
    })
    .from(people)
    .leftJoin(companies, eq(people.companyId, companies.id))
    .leftJoin(statuses, eq(people.statusId, statuses.id))
    .where(and(
      eq(people.archived, false),
      isNull(people.mergedIntoId),
      eq(people.sourceChannel, 'linkedin'),
    ))
    .orderBy(desc(people.createdAt))
    .limit(20);
}

async function getLinkedInCampaigns() {
  return db
    .select({
      campaign: people.firstTouchCampaign,
      n: count(),
    })
    .from(people)
    .where(and(
      eq(people.archived, false),
      isNull(people.mergedIntoId),
      eq(people.sourceChannel, 'linkedin'),
    ))
    .groupBy(people.firstTouchCampaign)
    .orderBy(desc(count()))
    .limit(10);
}

export default async function DashboardLinkedinPage() {
  const ga4Configured = isGa4Configured();

  const [leads, campaigns, channelData, utmData] = await Promise.all([
    getLinkedInLeads().catch(() => []),
    getLinkedInCampaigns().catch(() => []),
    ga4Configured ? getTrafficByChannel(30) : Promise.resolve([]),
    ga4Configured ? getTopUtms(30, 50) : Promise.resolve([]),
  ]);

  const liVisits = channelData.find((c) => c.channel.toLowerCase().includes('social') || c.channel.toLowerCase().includes('linkedin'))?.sessions
    ?? utmData.filter((u) => u.source.toLowerCase().includes('linkedin')).reduce((a, u) => a + u.sessions, 0);

  const liLeadCount = leads.length;
  const conversionRate = liVisits > 0 ? (liLeadCount / liVisits) * 100 : 0;

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">LinkedIn</h1>
          <p className="dash-subtitle">
            Tracking 100% via UTM · Website Demographics ainda bloqueado (precisa ~300 únicos/90d)
          </p>
        </div>
      </div>

      <div className="dash-kpi-grid">
        <div className="dash-kpi">
          <div className="dash-kpi-icon blue">👥</div>
          <div className="dash-kpi-label">Visitas via LinkedIn</div>
          <div className="dash-kpi-value">{ga4Configured ? liVisits.toLocaleString('pt-BR') : '—'}</div>
          <div className="dash-kpi-meta">{ga4Configured ? 'últimos 30d' : 'configure GA4 primeiro'}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon green">📋</div>
          <div className="dash-kpi-label">Leads do LinkedIn</div>
          <div className="dash-kpi-value">{liLeadCount}</div>
          <div className="dash-kpi-meta">capturados via form</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon amber">📊</div>
          <div className="dash-kpi-label">Taxa de conversão</div>
          <div className="dash-kpi-value">{ga4Configured && liVisits > 0 ? `${conversionRate.toFixed(1)}%` : '—'}</div>
          <div className="dash-kpi-meta">visita → lead</div>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-title">📣 Top campanhas (utm_campaign)</div>
        <div className="dash-card-subtitle">Qual peça/conteúdo gerou mais leads</div>
        {campaigns.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>
            Sem leads de LinkedIn ainda. Quando rolar, aparece aqui agrupado por utm_campaign_first.
          </div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Campanha</th>
                <th className="right">Leads</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c, i) => (
                <tr key={i}>
                  <td className="strong">{c.campaign ?? <span className="muted">(sem campaign)</span>}</td>
                  <td className="right">{c.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="dash-card">
        <div className="dash-card-title">👤 Leads recentes do LinkedIn</div>
        {leads.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>
            Sem leads. Quando alguém entrar no site via link com utm_source=linkedin e converter, aparece aqui.
          </div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Empresa</th>
                <th>UTM</th>
                <th>Status</th>
                <th className="right">Quando</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(({ person, company, status }) => (
                <tr key={person.id}>
                  <td>
                    <Link href={`/internal/crm/people/${person.id}`} className="strong" style={{ textDecoration: 'none', color: '#5E2A67' }}>
                      {person.name}
                    </Link>
                    <div className="muted">{person.jobTitle ?? person.email}</div>
                  </td>
                  <td>{company?.name ?? <span className="muted">—</span>}</td>
                  <td><span className="dash-pill blue">{person.firstTouchCampaign ?? '(sem campaign)'}</span></td>
                  <td><span className="dash-pill">{status?.label ?? '—'}</span></td>
                  <td className="right muted">{timeAgo(person.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="dash-card">
        <div className="dash-card-title">🔒 Website Demographics</div>
        <div className="dash-card-subtitle">LinkedIn Insight Tag — bloqueado até ~300 visitas únicas em 90 dias</div>
        <div style={{ padding: 32, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>
          Em quando passar do threshold (estimado jul-ago/2026), esse bloco mostra automaticamente top empresas, cargos, indústrias — tudo agregado e anônimo.
        </div>
      </div>
    </div>
  );
}
