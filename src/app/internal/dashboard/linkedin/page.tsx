/**
 * Dashboard · LinkedIn — silo simples (UTM tracking).
 * Visitas via utm_source=linkedin, leads, top campanhas.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { db, people, companies, statuses } from '@/db';
import { eq, and, isNull, desc, count } from 'drizzle-orm';
import { isGa4Configured, getTrafficByChannel, getTopUtms } from '@/lib/ga4';
import { timeAgo } from '@/lib/crm-format';
import { Briefcase, Users, FileText, Target, Megaphone, User } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard · LinkedIn',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const DAYS = 28;

export default async function LinkedInPage() {
  const ga4Configured = isGa4Configured();

  const [leads, campaigns, channels, utms] = await Promise.all([
    db.select({ person: people, company: companies, status: statuses })
      .from(people)
      .leftJoin(companies, eq(people.companyId, companies.id))
      .leftJoin(statuses, eq(people.statusId, statuses.id))
      .where(and(eq(people.archived, false), isNull(people.mergedIntoId), eq(people.sourceChannel, 'linkedin')))
      .orderBy(desc(people.createdAt))
      .limit(20)
      .catch(() => []),
    db.select({ campaign: people.firstTouchCampaign, n: count() })
      .from(people)
      .where(and(eq(people.archived, false), isNull(people.mergedIntoId), eq(people.sourceChannel, 'linkedin')))
      .groupBy(people.firstTouchCampaign)
      .orderBy(desc(count()))
      .limit(10)
      .catch(() => []),
    ga4Configured ? getTrafficByChannel(DAYS).catch(() => []) : Promise.resolve([]),
    ga4Configured ? getTopUtms(DAYS, 50).catch(() => []) : Promise.resolve([]),
  ]);

  const liUtmSessions = utms.filter((u) => u.source.toLowerCase().includes('linkedin')).reduce((a, u) => a + u.sessions, 0);
  const liChannelSessions = channels.find((c) => c.channel.toLowerCase().includes('social') || c.channel.toLowerCase().includes('linkedin'))?.sessions ?? 0;
  const liVisits = liChannelSessions || liUtmSessions;
  const liCvr = liVisits > 0 ? (leads.length / liVisits) * 100 : 0;

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">LinkedIn</h1>
          <p className="dash-subtitle">Tracking via UTM · Website Demographics bloqueado (precisa ~300 únicos/90d)</p>
        </div>
      </div>

      <div className="dash-kpi-grid">
        <div className="dash-kpi">
          <div className="dash-kpi-icon"><Users /></div>
          <div className="dash-kpi-label">Visitas LinkedIn</div>
          <div className="dash-kpi-value">{liVisits.toLocaleString('pt-BR')}</div>
          <div className="dash-kpi-meta">{ga4Configured ? `últimos ${DAYS}d` : 'configure GA4'}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon green"><FileText /></div>
          <div className="dash-kpi-label">Leads do LinkedIn</div>
          <div className="dash-kpi-value">{leads.length}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon amber"><Target /></div>
          <div className="dash-kpi-label">CVR</div>
          <div className="dash-kpi-value">{liVisits > 0 ? `${liCvr.toFixed(1)}%` : '—'}</div>
          <div className="dash-kpi-meta">visita → lead</div>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-title"><Megaphone /> Top campanhas (utm_campaign)</div>
        {campaigns.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>Sem leads do LinkedIn ainda.</div>
        ) : (
          <table className="dash-table">
            <thead><tr><th>Campanha</th><th className="right">Leads</th></tr></thead>
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
        <div className="dash-card-title"><User /> Leads recentes</div>
        {leads.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>Sem leads ainda.</div>
        ) : (
          <table className="dash-table">
            <thead><tr><th>Lead</th><th>Empresa</th><th>Campaign</th><th>Status</th><th className="right">Quando</th></tr></thead>
            <tbody>
              {leads.map(({ person, company, status }) => (
                <tr key={person.id}>
                  <td>
                    <Link href={`/internal/crm/people/${person.id}`} className="strong" style={{ textDecoration: 'none', color: '#5E2A67' }}>{person.name}</Link>
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
        <div className="dash-card-title"><Briefcase /> Como medir LinkedIn</div>
        <div style={{ fontSize: 13, color: '#45336B', padding: 14, lineHeight: 1.6 }}>
          <p><strong>Hoje:</strong> medimos via UTM nos shortlinks. Cada post tem <code style={{ background: '#F7EEFC', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>?utm_source=linkedin&utm_campaign=&lt;nome&gt;</code>.</p>
          <p style={{ marginTop: 8 }}><strong>Quando desbloquearmos Website Demographics</strong> (~300 visitas únicas em 90d via LinkedIn Insight Tag): teremos breakdown de empresas, cargos, indústrias visitando o site.</p>
        </div>
      </div>
    </div>
  );
}
