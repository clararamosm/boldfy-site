/**
 * Dashboard · View Web Summit Rio.
 *
 * Cross-filter: tudo filtrado por utm_campaign=web-summit-rio-2026
 * (padrão definido na SPEC, configurável via env var WEB_SUMMIT_UTM_CAMPAIGN).
 *
 * Mostra durante/pós-evento:
 *  - Leads gerados pela feira
 *  - Que material/QR gerou cada lead (utm_content)
 *  - Conversão final pra cliente
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { db, people, companies, statuses } from '@/db';
import { eq, and, isNull, count, desc } from 'drizzle-orm';
import { isGa4Configured, getTopUtms } from '@/lib/ga4';
import { timeAgo } from '@/lib/crm-format';

export const metadata: Metadata = {
  title: 'Dashboard · Web Summit Rio',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const WS_UTM = process.env.WEB_SUMMIT_UTM_CAMPAIGN || 'web-summit-rio-2026';
const WS_DATE = new Date('2026-06-08T00:00:00-03:00');

async function getWsLeads() {
  return db.select({
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
      eq(people.firstTouchCampaign, WS_UTM),
    ))
    .orderBy(desc(people.createdAt));
}

async function getWsPipelineCounts() {
  // Conta empresas no Pipeline cuja primeira pessoa veio com campaign=WS
  const rows = await db
    .select({
      statusLabel: statuses.label,
      n: count(),
    })
    .from(companies)
    .leftJoin(statuses, eq(companies.statusId, statuses.id))
    .innerJoin(people, eq(people.companyId, companies.id))
    .where(eq(people.firstTouchCampaign, WS_UTM))
    .groupBy(statuses.label);

  const map = new Map<string, number>();
  rows.forEach((r) => { if (r.statusLabel) map.set(r.statusLabel, r.n); });
  return map;
}

export default async function WebSummitPage() {
  const [leads, pipelineCounts] = await Promise.all([
    getWsLeads().catch(() => []),
    getWsPipelineCounts().catch(() => new Map<string, number>()),
  ]);

  // utm_content breakdown (quais materiais geraram mais)
  const byContent: Record<string, number> = {};
  leads.forEach((l) => {
    const utmContent = (l.person as { sourcePage: string | null }).sourcePage ?? '(não informado)';
    byContent[utmContent] = (byContent[utmContent] ?? 0) + 1;
  });

  // Tráfego GA4 da campanha
  const utms = isGa4Configured() ? await getTopUtms(60, 200).catch(() => []) : [];
  const wsVisits = utms.filter((u) => u.campaign === WS_UTM).reduce((a, u) => a + u.sessions, 0);

  // eslint-disable-next-line react-hooks/purity -- server render: timestamp determinístico ok
  const now = Date.now();
  const daysToEvent = Math.ceil((WS_DATE.getTime() - now) / (1000 * 60 * 60 * 24));
  const eventStatus = daysToEvent > 0 ? 'pre' : daysToEvent > -3 ? 'during' : 'post';

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Web Summit Rio</h1>
          <p className="dash-subtitle">
            Cross-filter por <code style={{ background: '#F7EEFC', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>utm_campaign={WS_UTM}</code>
          </p>
        </div>
        <div className="dash-pill amber" style={{ padding: '6px 14px', fontSize: 12 }}>
          {eventStatus === 'pre' ? `🕐 Em ${daysToEvent} dias` : eventStatus === 'during' ? '🔴 Acontecendo agora' : '✅ Pós-evento'}
        </div>
      </div>

      {eventStatus === 'pre' && leads.length === 0 ? (
        <div className="dash-alert info" style={{ marginBottom: 24 }}>
          <div>
            <strong>Padrão de UTM pra distribuir:</strong><br />
            <code style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '2px 8px', borderRadius: 4, fontSize: 12, display: 'inline-block', marginTop: 4 }}>
              ?utm_source=web-summit&amp;utm_medium=event&amp;utm_campaign={WS_UTM}&amp;utm_content=&lt;qr-banner|qr-camiseta|qr-flyer|qr-pitch|qr-cartao&gt;
            </code><br />
            <span style={{ fontSize: 11, marginTop: 6, display: 'inline-block' }}>
              Variando utm_content por material, você consegue ver no fim quais QR codes geraram mais leads.
            </span>
          </div>
        </div>
      ) : null}

      <div className="dash-kpi-grid">
        <div className="dash-kpi">
          <div className="dash-kpi-icon blue">👥</div>
          <div className="dash-kpi-label">Visitas (GA4)</div>
          <div className="dash-kpi-value">{isGa4Configured() ? wsVisits.toLocaleString('pt-BR') : '—'}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon green">📋</div>
          <div className="dash-kpi-label">Leads capturados</div>
          <div className="dash-kpi-value">{leads.length}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon amber">📅</div>
          <div className="dash-kpi-label">Reunião marcada</div>
          <div className="dash-kpi-value">{pipelineCounts.get('Reunião marcada') ?? 0}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon orange">🏆</div>
          <div className="dash-kpi-label">Fechados</div>
          <div className="dash-kpi-value">{pipelineCounts.get('Fechado') ?? 0}</div>
        </div>
      </div>

      {Object.keys(byContent).length > 0 ? (
        <div className="dash-card">
          <div className="dash-card-title">🏷 Top materiais (utm_content)</div>
          <div className="dash-card-subtitle">Quais QR codes ou materiais distribuídos geraram mais leads</div>
          <table className="dash-table">
            <thead>
              <tr>
                <th>Material (utm_content / source_page)</th>
                <th className="right">Leads</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(byContent)
                .sort((a, b) => b[1] - a[1])
                .map(([content, n]) => (
                  <tr key={content}>
                    <td className="strong">{content}</td>
                    <td className="right">{n}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="dash-card">
        <div className="dash-card-title">👤 Leads do Web Summit</div>
        {leads.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>
            Sem leads ainda. Quando alguém preencher form no site vindo de link com a UTM da feira, aparece aqui em tempo real.
          </div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Empresa</th>
                <th>Material</th>
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
                  <td className="muted">{person.sourcePage ?? '—'}</td>
                  <td><span className="dash-pill">{status?.label ?? '—'}</span></td>
                  <td className="right muted">{timeAgo(person.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
