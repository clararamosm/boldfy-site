/**
 * Dashboard · Campanhas (lista).
 *
 * Lista de campanhas ativas/encerradas/planejadas, cada uma com leads gerados,
 * conversão final, status visual. Click em uma vai pro drill-down [slug].
 *
 * Inclui também sub-bloco "Shortlinks" no final (KV).
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { kv } from '@vercel/kv';
import { db, people, companies, statuses, prArticles } from '@/db';
import { eq, and, isNull, count, sql, desc } from 'drizzle-orm';
import { listCampaigns, getCampaignStatus, type Campaign } from '@/lib/campaigns';
import { NewCampaignButton } from './new-campaign-button';
import { EditCampaignButton } from './edit-campaign-button';
import { timeAgo } from '@/lib/crm-format';
import { isGa4Configured, getTopUtms, getTrafficByDay } from '@/lib/ga4';
import { TimelineMarkers } from '@/components/dashboard/charts';
import { safeBlock } from '@/lib/safe-block';
import { Megaphone, Link2, Newspaper, FileText, Users, Lightbulb } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard · Campanhas',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type CampaignStats = {
  leads: number;
  reunioes: number;
  fechados: number;
};

async function getCampaignStats(c: Campaign): Promise<CampaignStats> {
  try {
    const [leadsRow, reuRow, fechRow] = await Promise.all([
      db.select({ n: count() }).from(people).where(and(
        eq(people.archived, false),
        isNull(people.mergedIntoId),
        eq(people.firstTouchCampaign, c.utmCampaign),
      )),
      db.select({ n: count() }).from(people)
        .leftJoin(statuses, eq(people.statusId, statuses.id))
        .where(and(
          eq(people.firstTouchCampaign, c.utmCampaign),
          sql`${statuses.label} IN ('Reunião marcada', 'Em andamento')`,
        )),
      db.select({ n: count() }).from(people)
        .innerJoin(companies, eq(people.companyId, companies.id))
        .leftJoin(statuses, eq(companies.statusId, statuses.id))
        .where(and(
          eq(people.firstTouchCampaign, c.utmCampaign),
          sql`${statuses.label} = 'Fechado'`,
        )),
    ]);
    return {
      leads: leadsRow[0]?.n ?? 0,
      reunioes: reuRow[0]?.n ?? 0,
      fechados: fechRow[0]?.n ?? 0,
    };
  } catch {
    return { leads: 0, reunioes: 0, fechados: 0 };
  }
}

type ShortlinkRow = { code: string; url: string; clicks: number; lastClickAt: number | null };

async function getShortlinks(): Promise<ShortlinkRow[]> {
  try {
    const keys: string[] = [];
    let cursor: string | number = 0;
    do {
      const result = await kv.scan(cursor, { match: 'link:*', count: 100 });
      const [next, batch] = result as [string | number, string[]];
      keys.push(...batch);
      cursor = next;
    } while (cursor !== '0' && cursor !== 0);

    if (keys.length === 0) return [];
    const rows: ShortlinkRow[] = [];
    for (const key of keys) {
      const code = key.replace('link:', '');
      const [url, clicks, lastClick] = await Promise.all([
        kv.get<string>(key),
        kv.get<number>(`link-clicks:${code}`),
        kv.get<number>(`link-last:${code}`),
      ]);
      if (!url) continue;
      rows.push({ code, url, clicks: clicks ?? 0, lastClickAt: lastClick ?? null });
    }
    return rows.sort((a, b) => b.clicks - a.clicks);
  } catch (err) {
    console.error('[campanhas] shortlinks failed:', err);
    return [];
  }
}

export default async function CampanhasPage() {
  // Cada bloco em safeBlock pra evitar que uma query quebre a page inteira
  const campaignsList = await safeBlock('campanhas', 'listCampaigns', () => listCampaigns(), []);
  const stats = await safeBlock(
    'campanhas',
    'campaignStats',
    () => Promise.all(campaignsList.map((c) => getCampaignStats(c))),
    campaignsList.map(() => ({ leads: 0, reunioes: 0, fechados: 0 })),
  );
  const shortlinks = await safeBlock('campanhas', 'shortlinks', () => getShortlinks(), []);
  const now = new Date();

  // Mídia & PR — migrado de /aquisicao
  const [articles, prLeadsRow, prUtms, dailyTraffic] = await Promise.all([
    safeBlock('campanhas', 'prArticles', () => db.select().from(prArticles).orderBy(desc(prArticles.publishedAt)).limit(20), []),
    safeBlock('campanhas', 'prLeads', () =>
      db.select({ n: count() }).from(people)
        .where(and(eq(people.archived, false), isNull(people.mergedIntoId), eq(people.sourceChannel, 'pr'))),
      [{ n: 0 }],
    ),
    isGa4Configured() ? safeBlock('campanhas', 'topUtms', () => getTopUtms(30, 50), []) : Promise.resolve([]),
    isGa4Configured() ? safeBlock('campanhas', 'trafficByDay', () => getTrafficByDay(30), []) : Promise.resolve([]),
  ]);
  const prLeadsCount = prLeadsRow[0]?.n ?? 0;
  const prSessions = (prUtms ?? []).filter((u) => (u.source ?? '').toLowerCase() === 'pr').reduce((a, u) => a + (u.sessions ?? 0), 0);
  const organicSeries = (dailyTraffic ?? []).map((d) => d.sessions ?? 0);
  const articleMarkers = (articles ?? [])
    .filter((a) => a.publishedAt && !isNaN(new Date(a.publishedAt).getTime()))
    .map((a) => ({ date: new Date(a.publishedAt).toISOString().split('T')[0], label: a.title }))
    .filter((m) => (dailyTraffic ?? []).some((d) => d.date === m.date));

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Campanhas</h1>
          <p className="dash-subtitle">Iniciativas com janela, objetivo e KPIs definidos · cada uma tem seu próprio dashboard</p>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-header">
          <div>
            <div className="dash-card-title"><Megaphone /> Todas as campanhas</div>
            <div className="dash-card-subtitle">Iniciativas com janela, objetivo, UTM e KPIs próprios</div>
          </div>
          <NewCampaignButton />
        </div>
        {campaignsList.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>Nenhuma campanha cadastrada.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {campaignsList.map((c, i) => {
              const status = getCampaignStatus(c, now);
              const s = stats[i];
              const start = new Date(`${c.startDate}T00:00:00`);
              const end = c.endDate ? new Date(`${c.endDate}T23:59:59`) : null;
              const cvr = s.leads > 0 ? ((s.fechados / s.leads) * 100).toFixed(1) : '—';
              const totalTouchpoints = (c.channels ?? []).reduce((a, ch) => a + ((ch.touchpoints ?? []).length), 0);

              return (
                <div key={c.slug} style={{ position: 'relative' }}>
                  <Link
                    href={`/internal/dashboard/campanhas/${c.slug}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto auto auto auto auto auto',
                      gap: 16,
                      alignItems: 'center',
                      padding: '16px 18px',
                      background: '#FAF7FF',
                      borderRadius: 12,
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                    }}
                    className="campanha-row"
                  >
                  <div>
                    <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 16, color: '#5E2A67' }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: '#9D85B3', marginTop: 2 }}>{c.objective}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      {(c.channels ?? []).map((ch) => (
                        <span key={ch.name} className="dash-pill">
                          {ch.name}{(ch.touchpoints ?? []).length > 0 ? ` · ${(ch.touchpoints ?? []).length}` : ''}
                        </span>
                      ))}
                      {totalTouchpoints > 0 ? (
                        <span style={{ fontSize: 10, color: '#9D85B3' }}>· {totalTouchpoints} link{totalTouchpoints > 1 ? 's' : ''}</span>
                      ) : null}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#9D85B3', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.06 }}>Status</div>
                    <span className={`dash-pill ${status === 'ativa' ? 'green' : status === 'planejada' ? 'blue' : status === 'always-on' ? 'amber' : 'gray'}`} style={{ marginTop: 4 }}>{status}</span>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 110 }}>
                    <div style={{ fontSize: 10, color: '#9D85B3', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.06 }}>Janela</div>
                    <div style={{ fontSize: 12, color: '#45336B', fontWeight: 600, marginTop: 4 }}>
                      {start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} → {end ? end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '∞'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 70 }}>
                    <div style={{ fontSize: 10, color: '#9D85B3', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.06 }}>Leads</div>
                    <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 22, color: '#5E2A67', marginTop: 2 }}>{s.leads}</div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 70 }}>
                    <div style={{ fontSize: 10, color: '#9D85B3', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.06 }}>Reuniões</div>
                    <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 22, color: '#5E2A67', marginTop: 2 }}>{s.reunioes}</div>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 70 }}>
                    <div style={{ fontSize: 10, color: '#9D85B3', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.06 }}>CVR final</div>
                    <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 22, color: '#10B981', marginTop: 2 }}>{cvr}%</div>
                  </div>
                  <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center' }}>
                    <EditCampaignButton campaign={c} />
                  </div>
                </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ====== Mídia & PR (vindo de /aquisicao) ====== */}
      <div style={{ margin: '36px 0 12px 0', paddingTop: 18, borderTop: '1px solid #E4D8ED' }}>
        <h2 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 20, color: '#5E2A67', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Newspaper size={22} /> Mídia & PR
        </h2>
        <div style={{ fontSize: 12, color: '#9D85B3', marginTop: 4 }}>Artigos publicados + correlação com spike orgânico</div>
      </div>

      <div className="dash-kpi-grid">
        <div className="dash-kpi">
          <div className="dash-kpi-icon"><Newspaper /></div>
          <div className="dash-kpi-label">Artigos publicados</div>
          <div className="dash-kpi-value">{articles.length}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon blue"><Users /></div>
          <div className="dash-kpi-label">Visitas PR (utm_source=pr)</div>
          <div className="dash-kpi-value">{prSessions.toLocaleString('pt-BR')}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon green"><FileText /></div>
          <div className="dash-kpi-label">Leads via PR</div>
          <div className="dash-kpi-value">{prLeadsCount}</div>
        </div>
      </div>

      {dailyTraffic.length > 0 && articles.length > 0 ? (
        <div className="dash-card">
          <div className="dash-card-title"><Lightbulb /> Correlação publicações × spike orgânico</div>
          <div className="dash-card-subtitle">Linha = sessões totais · marcadores = publicações</div>
          <TimelineMarkers
            dates={dailyTraffic.map((d) => d.date)}
            values={organicSeries}
            markers={articleMarkers}
            label="Sessões"
            color="#CD50F1"
            height={220}
          />
        </div>
      ) : null}

      <div className="dash-card">
        <div className="dash-card-title"><FileText /> Artigos cadastrados</div>
        {articles.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>Sem artigos cadastrados ainda.</div>
        ) : (
          <table className="dash-table">
            <thead><tr><th>Título</th><th>Publicado</th><th>UTM campaign</th></tr></thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id}>
                  <td className="strong" style={{ maxWidth: 480 }}>{a.title}</td>
                  <td className="muted">{new Date(a.publishedAt).toLocaleDateString('pt-BR')}</td>
                  <td className="muted">{a.utmCampaign ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ====== Links rastreáveis (UTM + Shortlinks) ====== */}
      <div className="dash-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <div className="dash-card-title"><Link2 /> Links rastreáveis</div>
          <Link href="/internal/utm" className="dash-card-action" style={{ fontSize: 12, color: '#CD50F1', fontWeight: 700, textDecoration: 'none' }}>
            🔗 Gerar novo link UTM →
          </Link>
        </div>
        <div className="dash-card-subtitle">
          Links UTM são criados em <Link href="/internal/utm" style={{ color: '#CD50F1' }}>/utm</Link>.
          Shortlinks (KV) servem como alias curto pros UTMs em mídias com limite de caracteres ·
          <code style={{ background: '#F7EEFC', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>boldfy.com.br/l/&lt;code&gt;</code>
        </div>
        {shortlinks.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>Sem shortlinks no KV.</div>
        ) : (
          <table className="dash-table">
            <thead><tr><th>Code</th><th>Destino</th><th className="right">Cliques</th><th className="right">Último click</th></tr></thead>
            <tbody>
              {shortlinks.map((s) => (
                <tr key={s.code}>
                  <td className="strong"><span className="dash-pill blue">/l/{s.code}</span></td>
                  <td className="muted" style={{ maxWidth: 460, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.url}</td>
                  <td className="right strong">{s.clicks.toLocaleString('pt-BR')}</td>
                  <td className="right muted">{s.lastClickAt ? timeAgo(new Date(s.lastClickAt)) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ====== Top UTMs (movido de Tráfego em mai/2026) ====== */}
      <div className="dash-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
          <div className="dash-card-title"><Link2 /> Top UTMs (30d)</div>
          <Link href="/internal/utm" style={{ fontSize: 12, color: '#CD50F1', fontWeight: 700, textDecoration: 'none' }}>
            🔗 Gerar novo link →
          </Link>
        </div>
        <div className="dash-card-subtitle">
          Sessões GA4 por (source · medium · campaign) nos últimos 30 dias. Lista de links gerados completa em <Link href="/internal/utm" style={{ color: '#CD50F1' }}>UTM</Link>.
        </div>
        {prUtms.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>Sem dados de UTM no GA4 nos últimos 30 dias.</div>
        ) : (
          <table className="dash-table">
            <thead><tr><th>Source</th><th>Medium</th><th>Campaign</th><th className="right">Sessões</th></tr></thead>
            <tbody>
              {prUtms.slice(0, 20).map((u, i) => (
                <tr key={i}>
                  <td className="strong">{u.source}</td>
                  <td>{u.medium}</td>
                  <td className="muted">{u.campaign}</td>
                  <td className="right">{u.sessions.toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
