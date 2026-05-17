/**
 * Dashboard · Campanha (drill-down).
 *
 * Mostra:
 *  - Setup (objetivo, janela, canais, UTM, shortlinks)
 *  - KPIs da campanha (leads, reuniões, fechados, CVR)
 *  - Funil específico da campanha
 *  - Lista de leads gerados (link pro CRM)
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db, people, companies, statuses } from '@/db';
import { eq, and, isNull, desc, count, sql } from 'drizzle-orm';
import { getCampaignBySlug, getCampaignStatus, listCampaigns } from '@/lib/campaigns';
import { FunnelStages, BOLDFY_PALETTE } from '@/components/dashboard/charts';
import { timeAgo, channelLabel } from '@/lib/crm-format';
import { EditCampaignButton } from '../edit-campaign-button';
import { Settings2, FileText, Calendar, Trophy, BarChart3, Users, StickyNote } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard · Campanha',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  const all = await listCampaigns();
  return all.map((c) => ({ slug: c.slug }));
}

type Params = Promise<{ slug: string }>;

export default async function CampaignDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const campaign = await getCampaignBySlug(slug);
  if (!campaign) notFound();

  const status = getCampaignStatus(campaign);

  // Leads dessa campanha
  const [leads, statusBreakdown] = await Promise.all([
    db.select({ person: people, company: companies, status: statuses })
      .from(people)
      .leftJoin(companies, eq(people.companyId, companies.id))
      .leftJoin(statuses, eq(people.statusId, statuses.id))
      .where(and(eq(people.archived, false), isNull(people.mergedIntoId), eq(people.firstTouchCampaign, campaign.utmCampaign)))
      .orderBy(desc(people.createdAt))
      .catch(() => []),
    db.select({ statusLabel: statuses.label, n: count() })
      .from(people)
      .leftJoin(statuses, eq(people.statusId, statuses.id))
      .where(eq(people.firstTouchCampaign, campaign.utmCampaign))
      .groupBy(statuses.label)
      .catch(() => []),
  ]);

  const statusMap = new Map(statusBreakdown.map((s) => [s.statusLabel ?? 'Sem status', s.n]));
  const fechados = statusMap.get('Fechado') ?? 0;
  const reunioes = (statusMap.get('Reunião marcada') ?? 0) + (statusMap.get('Em andamento') ?? 0);
  const totalLeads = leads.length;
  const cvr = totalLeads > 0 ? ((fechados / totalLeads) * 100).toFixed(1) : '—';

  const start = new Date(`${campaign.startDate}T00:00:00`);
  const end = campaign.endDate ? new Date(`${campaign.endDate}T23:59:59`) : null;

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <Link href="/internal/dashboard/campanhas" style={{ fontSize: 12, color: '#9D85B3', textDecoration: 'none' }}>← Voltar pra Campanhas</Link>
      </div>

      <div className="dash-header" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <h1 className="dash-title">{campaign.name}</h1>
          <p className="dash-subtitle">{campaign.objective}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <span className={`dash-pill ${status === 'ativa' ? 'green' : status === 'planejada' ? 'blue' : status === 'always-on' ? 'amber' : 'gray'}`}>{status}</span>
            <span className="dash-pill">
              {start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} →{' '}
              {end ? end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '∞ always-on'}
            </span>
            <span className="dash-pill amber">UTM: {campaign.utmCampaign}</span>
          </div>
        </div>
        <EditCampaignButton campaign={campaign} />
      </div>

      {campaign.notes ? (
        <div style={{ padding: 14, background: 'rgba(157, 133, 179, 0.06)', borderRadius: 10, fontSize: 13, color: '#45336B', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <StickyNote size={16} style={{ flexShrink: 0, marginTop: 2 }} /> {campaign.notes}
        </div>
      ) : null}

      {/* Setup */}
      <div className="dash-card">
        <div className="dash-card-title"><Settings2 /> Setup</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
          <SetupItem label="Objetivo" value={campaign.objective} />
          <SetupItem label="UTM campaign" value={<code style={{ background: '#F7EEFC', padding: '2px 8px', borderRadius: 4 }}>{campaign.utmCampaign}</code>} />
          <SetupItem label="Janela" value={
            <>
              {start.toLocaleDateString('pt-BR')}
              {' → '}
              {end ? end.toLocaleDateString('pt-BR') : <span style={{ color: '#CD50F1', fontWeight: 700 }}>always-on</span>}
            </>
          } />
        </div>

        {/* Canais + touchpoints */}
        <div>
          <div style={{ fontSize: 11, color: '#9D85B3', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.06, marginBottom: 10 }}>
            Canais & touchpoints
          </div>
          {campaign.channels.length === 0 ? (
            <div style={{ padding: 12, background: '#FAF7FF', borderRadius: 8, fontSize: 12, color: '#9D85B3' }}>
              Nenhum canal configurado. Use o botão Editar pra adicionar.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {campaign.channels.map((c) => (
                <div key={c.name} style={{ padding: 12, background: '#FAF7FF', borderRadius: 10, border: '1px solid #E4D8ED' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: c.touchpoints.length ? 8 : 0 }}>
                    <strong style={{ fontSize: 13, color: '#5E2A67' }}>{c.name}</strong>
                    <span style={{ fontSize: 10, color: '#9D85B3' }}>· {c.touchpoints.length} touchpoint{c.touchpoints.length !== 1 ? 's' : ''}</span>
                  </div>
                  {c.touchpoints.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {c.touchpoints.map((tp, ti) => (
                        <div key={ti} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#FFFFFF', borderRadius: 6, fontSize: 12 }}>
                          <a href={tp.url} target="_blank" rel="noopener noreferrer" style={{ color: '#CD50F1', textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tp.url}
                          </a>
                          {tp.label ? <span className="dash-pill">{tp.label}</span> : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="dash-kpi-grid">
        <div className="dash-kpi">
          <div className="dash-kpi-icon"><FileText /></div>
          <div className="dash-kpi-label">Leads gerados</div>
          <div className="dash-kpi-value">{totalLeads}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon blue"><Calendar /></div>
          <div className="dash-kpi-label">Reuniões</div>
          <div className="dash-kpi-value">{reunioes}</div>
          <div className="dash-kpi-meta">{totalLeads > 0 ? `${((reunioes / totalLeads) * 100).toFixed(0)}% conv` : '—'}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon green"><Trophy /></div>
          <div className="dash-kpi-label">Fechados</div>
          <div className="dash-kpi-value">{fechados}</div>
          <div className="dash-kpi-meta">CVR final {cvr}%</div>
        </div>
      </div>

      {/* Breakdown por status */}
      <div className="dash-card">
        <div className="dash-card-title"><BarChart3 /> Distribuição por status</div>
        <div className="dash-card-subtitle">Onde os leads dessa campanha estão hoje</div>
        {statusBreakdown.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>Nenhum lead atribuído a essa campanha ainda.</div>
        ) : (
          <FunnelStages stages={statusBreakdown.map((s, i) => ({
            label: s.statusLabel ?? 'Sem status',
            count: s.n,
            color: BOLDFY_PALETTE[i % BOLDFY_PALETTE.length],
          }))} />
        )}
      </div>

      {/* Leads */}
      <div className="dash-card">
        <div className="dash-card-title"><Users /> Leads dessa campanha</div>
        {leads.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>
            Nenhum lead com <code>utm_campaign={campaign.utmCampaign}</code> ainda.
          </div>
        ) : (
          <table className="dash-table">
            <thead><tr><th>Lead</th><th>Empresa</th><th>Canal</th><th>Status</th><th className="right">Quando</th></tr></thead>
            <tbody>
              {leads.map(({ person, company, status }) => (
                <tr key={person.id}>
                  <td>
                    <Link href={`/internal/crm/people/${person.id}`} className="strong" style={{ textDecoration: 'none', color: '#5E2A67' }}>{person.name}</Link>
                    <div className="muted">{person.jobTitle ?? person.email}</div>
                  </td>
                  <td>{company?.name ?? <span className="muted">—</span>}</td>
                  <td><span className="dash-pill blue">{channelLabel(person.sourceChannel)}</span></td>
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

function SetupItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#9D85B3', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.06, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 13, color: '#45336B' }}>{value}</div>
    </div>
  );
}
