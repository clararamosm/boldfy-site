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
import { db, people, companies, statuses, utmLinks } from '@/db';
import { eq, and, isNull, desc, count } from 'drizzle-orm';
import { getCampaignBySlug, getCampaignStatus, listCampaigns } from '@/lib/campaigns';
import { timeAgo, channelLabel, sourceLabel } from '@/lib/crm-format';
import { EditCampaignButton } from '../edit-campaign-button';
import { safeBlock } from '@/lib/safe-block';
import { isGa4Configured } from '@/lib/ga4';
import {
  getUtmAnalyticsBatch,
  analyticsForLink,
  analyticsKey,
  type UtmAnalytics,
} from '@/lib/ga4-utm-analytics';
import { CampaignUtmList } from './utm-list';
import { QrModal } from '@/app/internal/utm/qr-modal';
import { Settings2, FileText, Calendar, Trophy, Link2, Users, StickyNote } from 'lucide-react';

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

  // Leads + UTMs dessa campanha — cada query em safeBlock (defesa em profundidade)
  const [leads, statusBreakdown, campaignUtmLinks] = await Promise.all([
    safeBlock('campaign-detail', 'leads', () =>
      db.select({ person: people, company: companies, status: statuses })
        .from(people)
        .leftJoin(companies, eq(people.companyId, companies.id))
        .leftJoin(statuses, eq(people.statusId, statuses.id))
        .where(and(eq(people.archived, false), isNull(people.mergedIntoId), eq(people.firstTouchCampaign, campaign.utmCampaign)))
        .orderBy(desc(people.createdAt)),
      [],
    ),
    safeBlock('campaign-detail', 'statusBreakdown', () =>
      db.select({ statusLabel: statuses.label, n: count() })
        .from(people)
        .leftJoin(statuses, eq(people.statusId, statuses.id))
        .where(eq(people.firstTouchCampaign, campaign.utmCampaign))
        .groupBy(statuses.label),
      [],
    ),
    safeBlock('campaign-detail', 'utmLinks', () =>
      db.select().from(utmLinks).where(eq(utmLinks.utmCampaign, campaign.utmCampaign)).orderBy(desc(utmLinks.createdAt)),
      [],
    ),
  ]);

  // Analytics batched pros UTMs dessa campanha (sessões/usuários/engaj + daily)
  const oldestUtm = campaignUtmLinks.length > 0
    ? new Date(Math.min(...campaignUtmLinks.map((l) => new Date(l.createdAt).getTime())))
    : new Date();
  const analyticsBatch = isGa4Configured()
    ? await safeBlock('campaign-detail', 'utmAnalytics', () => getUtmAnalyticsBatch(oldestUtm), new Map<string, UtmAnalytics>())
    : new Map<string, UtmAnalytics>();
  const analyticsByKey: Record<string, UtmAnalytics> = {};
  for (const link of campaignUtmLinks) {
    const a = analyticsForLink(analyticsBatch, link);
    if (a) {
      const key = analyticsKey(link.utmSource, link.utmMedium, link.utmCampaign);
      analyticsByKey[key] = a;
    }
  }
  const enrichedCampaignLinks = campaignUtmLinks.map((link) => ({
    id: link.id,
    label: link.label,
    baseUrl: link.baseUrl,
    utmSource: link.utmSource,
    utmMedium: link.utmMedium,
    utmCampaign: link.utmCampaign,
    utmContent: link.utmContent,
    utmTerm: link.utmTerm,
    fullUrl: link.fullUrl,
    shortCode: link.shortCode,
    createdAt: link.createdAt,
  }));

  // Mai/2026: Canais & touchpoints agora vêm AUTOMATICAMENTE dos utm_source
  // dos links da campanha (não mais do setup manual em campaigns.channels).
  // Agrupa preservando ordem de aparição (primeiro link criado por source
  // define a ordem do grupo). Usa Map pra dedup + insertion order.
  const linksBySource = new Map<string, typeof enrichedCampaignLinks>();
  for (const link of enrichedCampaignLinks) {
    const src = link.utmSource || 'sem-source';
    const arr = linksBySource.get(src) ?? [];
    arr.push(link);
    linksBySource.set(src, arr);
  }
  const sourceGroups = Array.from(linksBySource.entries()).map(([source, links]) => ({ source, links }));

  const statusMap = new Map((statusBreakdown ?? []).map((s) => [s.statusLabel ?? 'Sem status', s.n]));
  const fechados = statusMap.get('Fechado') ?? 0;
  const reunioes = (statusMap.get('Reunião marcada') ?? 0) + (statusMap.get('Em andamento') ?? 0);
  const totalLeads = (leads ?? []).length;
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

        {/* Canais & touchpoints — gerado automaticamente do utm_source dos
            UTMs da campanha (mai/2026 — antes era setup manual via editor). */}
        <div>
          <div style={{ fontSize: 11, color: '#9D85B3', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.06, marginBottom: 10 }}>
            Canais & touchpoints
          </div>
          {sourceGroups.length === 0 ? (
            <div style={{ padding: 12, background: '#FAF7FF', borderRadius: 8, fontSize: 12, color: '#9D85B3' }}>
              Nenhum link UTM criado ainda. Gere em <Link href="/internal/utm" style={{ color: '#CD50F1' }}>/internal/utm</Link> usando <code style={{ background: '#F0E5F8', padding: '1px 5px', borderRadius: 3 }}>utm_campaign={campaign.utmCampaign}</code> e os canais aparecem aqui automaticamente.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sourceGroups.map(({ source, links }) => (
                <div key={source} style={{ padding: 12, background: '#FAF7FF', borderRadius: 10, border: '1px solid #E4D8ED' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <strong style={{ fontSize: 13, color: '#5E2A67' }}>{sourceLabel(source)}</strong>
                    <span style={{ fontSize: 10, color: '#9D85B3' }}>· {links.length} touchpoint{links.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {links.map((link) => (
                      <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#FFFFFF', borderRadius: 6, fontSize: 12 }}>
                        <a href={link.fullUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#CD50F1', textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {link.baseUrl}
                        </a>
                        {link.label ? <span className="dash-pill">{link.label}</span> : null}
                      </div>
                    ))}
                  </div>
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

      {/* UTMs cadastrados nessa campanha — agrupados por utm_source */}
      <div className="dash-card">
        <div className="dash-card-title"><Link2 /> Links UTM dessa campanha</div>
        <div className="dash-card-subtitle">
          Todos os links rastreáveis criados pra <code>utm_campaign={campaign.utmCampaign}</code>, agrupados por canal · gere mais em{' '}
          <Link href="/internal/utm" style={{ color: '#CD50F1' }}>/internal/utm</Link>
        </div>
        {sourceGroups.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>
            Nenhum link UTM cadastrado pra essa campanha ainda.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {sourceGroups.map(({ source, links }) => (
              <div key={source}>
                <div style={{ fontSize: 12, color: '#5E2A67', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="dash-pill blue" style={{ fontSize: 11 }}>{sourceLabel(source)}</span>
                  <span style={{ color: '#9D85B3', fontWeight: 500, fontSize: 11 }}>· {links.length} link{links.length !== 1 ? 's' : ''}</span>
                </div>
                <CampaignUtmList links={links} analyticsByKey={analyticsByKey} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QrModal único pra toda a página — escuta 'utm:qr-open' de qualquer
          CampaignUtmList renderizado acima (1 por grupo de utm_source) */}
      <QrModal />

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
