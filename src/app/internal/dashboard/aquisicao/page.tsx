/**
 * Dashboard · Aquisição.
 *
 * Absorve as 4 abas antigas: Tráfego (GA4) + SEO (SC) + LinkedIn (UTM) + Mídia & PR.
 *
 * Filosofia: dados clássicos + insights que vão além do que as plataformas
 * mostram. Não é relator — é interpretador.
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { db, people, companies, statuses } from '@/db';
import { eq, and, isNull, count, desc } from 'drizzle-orm';
import {
  isGa4Configured,
  getTrafficSummary,
  getTrafficByChannel,
  getTopPages,
  getTopUtms,
  getTrafficByDay,
} from '@/lib/ga4';
import {
  isSearchConsoleConfigured,
  getSeoSummary,
  getTopQueries,
  getTopPagesSeo,
  getRankingOpportunities,
  getSeoByDay,
  getBrandedQueries,
} from '@/lib/search-console';
import {
  getLowCtrForPosition,
  getTopicGaps,
  getQueriesScatter,
} from '@/lib/dashboard-queries';
import { PeriodFilter } from '@/components/dashboard/period-filter';
import { parsePeriod } from '@/components/dashboard/period-utils';
import { DailyLineChart } from '@/components/dashboard/daily-line-chart';
import { SectionNav } from '@/components/dashboard/section-nav';
import {
  MultiLineChart,
  StackedAreaChart,
  ScatterChart,
  TimelineMarkers,
  BOLDFY_PALETTE,
  BOLDFY_PURPLES,
} from '@/components/dashboard/charts';
import {
  Globe2,
  Search,
  Briefcase,
  Newspaper,
  Radio,
  TrendingUp,
  Microscope,
  Lightbulb,
  PenTool,
  Target,
  Tag,
  FileText,
  MousePointer,
  Eye,
  BarChart3,
  MapPin,
  Megaphone,
  User,
  Users,
} from 'lucide-react';
import { timeAgo } from '@/lib/crm-format';

export const metadata: Metadata = {
  title: 'Dashboard · Aquisição',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ period?: string }>;

function pct(v: number): string { return `${(v * 100).toFixed(2)}%`; }

/**
 * Wrapper de safety pra cada bloco de await Promise.all. Se um bloco quebra,
 * loga com tag identificável (vai pro Vercel runtime log) e retorna fallback.
 *
 * Sem isso, qualquer exception não tratada propaga pro Server Component render
 * e quebra a página inteira com o erro genérico "specific message omitted".
 */
async function safeBlock<T>(name: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[aquisicao] block "${name}" failed:`, err);
    return fallback;
  }
}

export default async function AquisicaoPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const days = parsePeriod(params.period);

  const ga4Configured = isGa4Configured();
  const scConfigured = isSearchConsoleConfigured();

  // Tráfego (GA4) — cada query isolada em safeBlock pra capturar e logar erro
  const trafficSummary = await safeBlock('ga4.summary', () => ga4Configured ? getTrafficSummary(days) : Promise.resolve(null), null);
  const channels = await safeBlock('ga4.channels', () => ga4Configured ? getTrafficByChannel(days) : Promise.resolve([]), [] as Awaited<ReturnType<typeof getTrafficByChannel>>);
  const topPages = await safeBlock('ga4.pages', () => ga4Configured ? getTopPages(days, 12) : Promise.resolve([]), [] as Awaited<ReturnType<typeof getTopPages>>);
  const topUtms = await safeBlock('ga4.utms', () => ga4Configured ? getTopUtms(days, 20) : Promise.resolve([]), [] as Awaited<ReturnType<typeof getTopUtms>>);
  const dailyTraffic = await safeBlock('ga4.daily', () => ga4Configured ? getTrafficByDay(days) : Promise.resolve([]), [] as Awaited<ReturnType<typeof getTrafficByDay>>);

  // SEO (SC)
  const seoSummary = await safeBlock('sc.summary', () => scConfigured ? getSeoSummary(days) : Promise.resolve(null), null);
  const queries = await safeBlock('sc.queries', () => scConfigured ? getTopQueries(days, 20) : Promise.resolve([]), [] as Awaited<ReturnType<typeof getTopQueries>>);
  const seoPages = await safeBlock('sc.pages', () => scConfigured ? getTopPagesSeo(days, 12) : Promise.resolve([]), [] as Awaited<ReturnType<typeof getTopPagesSeo>>);
  const opportunities = await safeBlock('sc.opps', () => scConfigured ? getRankingOpportunities(days, 12) : Promise.resolve([]), [] as Awaited<ReturnType<typeof getRankingOpportunities>>);
  const seoDaily = await safeBlock('sc.daily', () => scConfigured ? getSeoByDay(days) : Promise.resolve([]), [] as Awaited<ReturnType<typeof getSeoByDay>>);
  const brandedQs = await safeBlock('sc.branded', () => scConfigured ? getBrandedQueries(days) : Promise.resolve([]), [] as Awaited<ReturnType<typeof getBrandedQueries>>);
  const lowCtr = await safeBlock('sc.lowctr', () => scConfigured ? getLowCtrForPosition(days, 30) : Promise.resolve([]), [] as Awaited<ReturnType<typeof getLowCtrForPosition>>);
  const gaps = await safeBlock('sc.gaps', () => scConfigured ? getTopicGaps(days, 20) : Promise.resolve([]), [] as Awaited<ReturnType<typeof getTopicGaps>>);
  const scatter = await safeBlock('sc.scatter', () => scConfigured ? getQueriesScatter(days, 80) : Promise.resolve([]), [] as Awaited<ReturnType<typeof getQueriesScatter>>);

  // LinkedIn (UTM + CRM)
  const liUtmSessions = topUtms.filter((u) => u.source.toLowerCase().includes('linkedin')).reduce((a, u) => a + u.sessions, 0);
  const liChannelSessions = channels.find((c) => c.channel.toLowerCase().includes('social') || c.channel.toLowerCase().includes('linkedin'))?.sessions ?? 0;
  const liVisits = liChannelSessions || liUtmSessions;

  // db.select chain com `.catch()` direto pode não ser tratado por Promise.all
  // se Drizzle não expõe Promise compatível. Wrap em safeBlock.
  const liLeads = await safeBlock('li_leads', async () => {
    return db.select({ person: people, company: companies, status: statuses })
      .from(people)
      .leftJoin(companies, eq(people.companyId, companies.id))
      .leftJoin(statuses, eq(people.statusId, statuses.id))
      .where(and(eq(people.archived, false), isNull(people.mergedIntoId), eq(people.sourceChannel, 'linkedin')))
      .orderBy(desc(people.createdAt))
      .limit(10);
  }, [] as Array<{ person: typeof people.$inferSelect; company: typeof companies.$inferSelect | null; status: typeof statuses.$inferSelect | null }>);

  const liCampaigns = await safeBlock('li_campaigns', async () => {
    return db.select({ campaign: people.firstTouchCampaign, n: count() })
      .from(people)
      .where(and(eq(people.archived, false), isNull(people.mergedIntoId), eq(people.sourceChannel, 'linkedin')))
      .groupBy(people.firstTouchCampaign)
      .orderBy(desc(count()))
      .limit(8);
  }, [] as Array<{ campaign: string | null; n: number }>);

  const liCvr = liVisits > 0 ? (liLeads.length / liVisits) * 100 : 0;

  // Mídia & PR migrou pra /campanhas. As queries de pr_articles e prLeadsCount
  // foram removidas daqui — vivem agora em src/app/internal/dashboard/campanhas/page.tsx.

  const totalChannels = channels.reduce((a, c) => a + c.sessions, 0);

  const navSections = [
    { id: 'visao', label: 'Visão geral', icon: BarChart3 },
    { id: 'trafego', label: 'Tráfego', icon: Globe2 },
    { id: 'seo', label: 'SEO', icon: Search },
    { id: 'linkedin', label: 'LinkedIn', icon: Briefcase },
  ];

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Aquisição</h1>
          <p className="dash-subtitle">Tráfego · SEO · LinkedIn — cross-channel, com insights · {days}d</p>
        </div>
        <Suspense fallback={<div style={{ width: 220, height: 32 }} />}>
          <PeriodFilter />
        </Suspense>
      </div>

      <div className="dash-page-with-nav">
        <SectionNav sections={navSections} />
        <div className="dash-page-main" id="visao">

      {/* ========================================================== */}
      {/*  Header KPIs cross-channel                                 */}
      {/* ========================================================== */}
      <div className="dash-kpi-grid">
        <div className="dash-kpi">
          <div className="dash-kpi-icon"><Globe2 /></div>
          <div className="dash-kpi-label">Visitas totais</div>
          <div className="dash-kpi-value">{trafficSummary?.totalUsers.toLocaleString('pt-BR') ?? '—'}</div>
          <div className="dash-kpi-meta">{ga4Configured ? `${trafficSummary?.newUsers.toLocaleString('pt-BR') ?? 0} novos` : 'configure GA4'}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon blue"><Search /></div>
          <div className="dash-kpi-label">Cliques SEO</div>
          <div className="dash-kpi-value">{seoSummary?.clicks.toLocaleString('pt-BR') ?? '—'}</div>
          <div className="dash-kpi-meta">{scConfigured ? `${seoSummary?.impressions.toLocaleString('pt-BR') ?? 0} impr` : 'configure SC'}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon amber"><Briefcase /></div>
          <div className="dash-kpi-label">Visitas LinkedIn</div>
          <div className="dash-kpi-value">{liVisits.toLocaleString('pt-BR')}</div>
          <div className="dash-kpi-meta">{liLeads.length} leads · CVR {liCvr.toFixed(1)}%</div>
        </div>
      </div>

      {/* ========================================================== */}
      {/*  Stacked area: canais ao longo do tempo                    */}
      {/* ========================================================== */}
      {dailyTraffic.length > 0 && channels.length > 0 ? (
        <div className="dash-card">
          <div className="dash-card-title"><Radio /> Visitas por canal ao longo do tempo</div>
          <div className="dash-card-subtitle">Como cada canal contribuiu pro tráfego no período · stacked area</div>
          <StackedAreaChart
            dates={dailyTraffic.map((d) => d.date)}
            series={channels.slice(0, 5).map((c, i) => ({
              key: c.channel,
              label: c.channel,
              color: BOLDFY_PURPLES[i % BOLDFY_PURPLES.length],
              data: dailyTraffic.map((d) => Math.round((d.sessions * c.sessions) / (totalChannels || 1))),
            }))}
            height={260}
          />
        </div>
      ) : null}

      {/* ============================================================== */}
      {/*  SECTION: TRÁFEGO (GA4)                                        */}
      {/* ============================================================== */}
      <div id="trafego" />
      <SectionHeader icon={Globe2} title="Tráfego (GA4)" />

      {ga4Configured ? (
        <>
          <div className="dash-card">
            <div className="dash-card-header">
              <div>
                <div className="dash-card-title"><TrendingUp /> Sessões × Usuários por dia</div>
                <div className="dash-card-subtitle">Hover pra ver detalhe diário</div>
              </div>
            </div>
            <DailyLineChart
              data={dailyTraffic.map((d) => ({ date: d.date, a: d.sessions, b: d.users }))}
              labels={{ a: 'Sessões', b: 'Usuários' }}
            />
          </div>

          <div className="dash-card">
            <div className="dash-card-title"><Radio /> Canais de tráfego</div>
            <table className="dash-table">
              <thead><tr><th>Canal</th><th className="right">Sessões</th><th className="right">Usuários</th><th className="right">% total</th></tr></thead>
              <tbody>
                {channels.map((c) => (
                  <tr key={c.channel}>
                    <td className="strong">{c.channel}</td>
                    <td className="right">{c.sessions.toLocaleString('pt-BR')}</td>
                    <td className="right">{c.users.toLocaleString('pt-BR')}</td>
                    <td className="right muted">{totalChannels > 0 ? `${Math.round((c.sessions / totalChannels) * 100)}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="dash-card">
            <div className="dash-card-title"><FileText /> Páginas mais vistas</div>
            <table className="dash-table">
              <thead><tr><th>Página</th><th className="right">Page views</th><th className="right">Sessões</th></tr></thead>
              <tbody>
                {topPages.map((p, i) => (
                  <tr key={i}>
                    <td className="strong" style={{ maxWidth: 460, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.page}</td>
                    <td className="right">{p.pageViews.toLocaleString('pt-BR')}</td>
                    <td className="right">{p.sessions.toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="dash-card">
            <div className="dash-card-title"><Tag /> Top UTMs</div>
            <table className="dash-table">
              <thead><tr><th>Source</th><th>Medium</th><th>Campaign</th><th className="right">Sessões</th></tr></thead>
              <tbody>
                {topUtms.map((u, i) => (
                  <tr key={i}>
                    <td className="strong">{u.source}</td><td>{u.medium}</td><td className="muted">{u.campaign}</td>
                    <td className="right">{u.sessions.toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <SetupCard title="GA4 não configurado" body={<>Conecta tua conta Google em <Link href="/internal/dashboard/connect-google" style={{ color: '#CD50F1' }}>/connect-google</Link></>} />
      )}

      {/* ============================================================== */}
      {/*  SECTION: SEO (Search Console) — clássico + INSIGHTS           */}
      {/* ============================================================== */}
      <div id="seo" />
      <SectionHeader icon={Search} title="SEO (Search Console)" subtitle="Dados clássicos + insights além das plataformas" />

      {scConfigured ? (
        <>
          <div className="dash-kpi-grid">
            <div className="dash-kpi">
              <div className="dash-kpi-icon"><MousePointer /></div>
              <div className="dash-kpi-label">Cliques</div>
              <div className="dash-kpi-value">{seoSummary?.clicks.toLocaleString('pt-BR') ?? 0}</div>
            </div>
            <div className="dash-kpi">
              <div className="dash-kpi-icon blue"><Eye /></div>
              <div className="dash-kpi-label">Impressões</div>
              <div className="dash-kpi-value">{seoSummary?.impressions.toLocaleString('pt-BR') ?? 0}</div>
            </div>
            <div className="dash-kpi">
              <div className="dash-kpi-icon amber"><BarChart3 /></div>
              <div className="dash-kpi-label">CTR médio</div>
              <div className="dash-kpi-value">{seoSummary ? pct(seoSummary.ctr) : '—'}</div>
            </div>
            <div className="dash-kpi">
              <div className="dash-kpi-icon green"><MapPin /></div>
              <div className="dash-kpi-label">Posição média</div>
              <div className="dash-kpi-value">{seoSummary ? seoSummary.position.toFixed(1) : '—'}</div>
            </div>
          </div>

          <div className="dash-card">
            <div className="dash-card-title"><TrendingUp /> Cliques × Impressões por dia</div>
            <DailyLineChart
              data={seoDaily.map((d) => ({ date: d.date, a: d.clicks, b: d.impressions }))}
              labels={{ a: 'Cliques', b: 'Impressões' }}
            />
          </div>

          <div className="dash-card">
            <div className="dash-card-title"><Microscope /> Scatter de queries (oportunidades em uma única vista)</div>
            <div className="dash-card-subtitle">
              <strong>X = posição (esquerda = melhor)</strong> · <strong>Y = impressões</strong> · <strong>tamanho da bolha = cliques</strong>.
              Bolhas grandes embaixo à direita = alta exposição em posição ruim → pauta de conteúdo.
            </div>
            <ScatterChart
              points={scatter.map((p) => ({ x: p.position, y: p.impressions, size: p.clicks, label: p.query }))}
              xLabel="Posição"
              yLabel="Impressões"
              invertX
              width={760}
              height={360}
            />
          </div>

          {/* 💡 INSIGHT 1: Low CTR for position */}
          <div className="dash-card">
            <div className="dash-card-title"><Lightbulb /> CTR abaixo do esperado pra posição</div>
            <div className="dash-card-subtitle">
              Queries onde já ranqueamos bem mas o CTR está significativamente abaixo do benchmark do Google.
              Otimizar title/meta description tem alto ROI.
            </div>
            {lowCtr.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>Nenhuma oportunidade clara (CTR ok pras posições).</div>
            ) : (
              <table className="dash-table">
                <thead><tr><th>Query</th><th className="right">Pos.</th><th className="right">CTR atual</th><th className="right">CTR esperado</th><th className="right">Gap</th><th className="right">Impressões</th></tr></thead>
                <tbody>
                  {lowCtr.map((q, i) => (
                    <tr key={i}>
                      <td className="strong">{q.query}</td>
                      <td className="right">{q.position.toFixed(1)}</td>
                      <td className="right">{pct(q.ctr)}</td>
                      <td className="right muted">{pct(q.expectedCtr)}</td>
                      <td className="right"><span className="dash-pill amber">-{(q.gap * 100).toFixed(1)}pp</span></td>
                      <td className="right">{q.impressions.toLocaleString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* 💡 INSIGHT 2: Topic gaps */}
          <div className="dash-card">
            <div className="dash-card-title"><PenTool /> Topic gaps — queries com volume sem página dedicada</div>
            <div className="dash-card-subtitle">
              Aparecemos com impressões mas posição &gt; 30. Possível pauta de conteúdo dedicado.
            </div>
            {gaps.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>Sem gaps relevantes no período.</div>
            ) : (
              <table className="dash-table">
                <thead><tr><th>Query</th><th className="right">Impressões</th><th className="right">Posição</th><th className="right">CTR</th></tr></thead>
                <tbody>
                  {gaps.map((q, i) => (
                    <tr key={i}>
                      <td className="strong">{q.query}</td>
                      <td className="right">{q.impressions.toLocaleString('pt-BR')}</td>
                      <td className="right"><span className="dash-pill gray">pos {q.position.toFixed(1)}</span></td>
                      <td className="right muted">{pct(q.ctr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Clássico: oportunidades pos 11-30 */}
          <div className="dash-card">
            <div className="dash-card-title"><Target /> Quick wins (pos 11-30)</div>
            <div className="dash-card-subtitle">Já temos volume, falta subir pra primeira página</div>
            {opportunities.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>Sem oportunidades claras.</div>
            ) : (
              <table className="dash-table">
                <thead><tr><th>Query</th><th className="right">Impressões</th><th className="right">Posição</th><th className="right">CTR</th></tr></thead>
                <tbody>
                  {opportunities.map((q, i) => (
                    <tr key={i}>
                      <td className="strong">{q.query}</td>
                      <td className="right">{q.impressions.toLocaleString('pt-BR')}</td>
                      <td className="right"><span className="dash-pill amber">pos {q.position.toFixed(1)}</span></td>
                      <td className="right muted">{pct(q.ctr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="dash-card">
            <div className="dash-card-title"><Search /> Top queries com cliques</div>
            <table className="dash-table">
              <thead><tr><th>Query</th><th className="right">Cliques</th><th className="right">Impressões</th><th className="right">CTR</th><th className="right">Pos.</th></tr></thead>
              <tbody>
                {queries.map((q, i) => (
                  <tr key={i}>
                    <td className="strong">{q.query}</td>
                    <td className="right">{q.clicks}</td>
                    <td className="right muted">{q.impressions.toLocaleString('pt-BR')}</td>
                    <td className="right muted">{pct(q.ctr)}</td>
                    <td className="right">{q.position.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="dash-card">
            <div className="dash-card-title"><FileText /> Páginas com mais cliques (SEO)</div>
            <table className="dash-table">
              <thead><tr><th>Página</th><th className="right">Cliques</th><th className="right">Impressões</th><th className="right">Pos.</th></tr></thead>
              <tbody>
                {seoPages.map((p, i) => (
                  <tr key={i}>
                    <td className="strong" style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.page}</td>
                    <td className="right">{p.clicks}</td>
                    <td className="right muted">{p.impressions.toLocaleString('pt-BR')}</td>
                    <td className="right">{p.position.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="dash-card">
            <div className="dash-card-title"><Tag /> Queries de marca (branded)</div>
            <div className="dash-card-subtitle">Buscas contendo &ldquo;boldfy&rdquo; — sinal de awareness</div>
            {brandedQs.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>Sem queries de marca no período.</div>
            ) : (
              <table className="dash-table">
                <thead><tr><th>Query</th><th className="right">Cliques</th><th className="right">Impressões</th><th className="right">Pos.</th></tr></thead>
                <tbody>
                  {brandedQs.map((q, i) => (
                    <tr key={i}>
                      <td className="strong">{q.query}</td>
                      <td className="right">{q.clicks}</td>
                      <td className="right muted">{q.impressions.toLocaleString('pt-BR')}</td>
                      <td className="right">{q.position.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <SetupCard title="Search Console não configurado" body={<>Configura <code>SEARCH_CONSOLE_SITE_URL</code> no Vercel e conecta em <Link href="/internal/dashboard/connect-google" style={{ color: '#CD50F1' }}>/connect-google</Link></>} />
      )}

      {/* ============================================================== */}
      {/*  SECTION: LinkedIn (UTM)                                       */}
      {/* ============================================================== */}
      <div id="linkedin" />
      <SectionHeader icon={Briefcase} title="LinkedIn (via UTM)" subtitle="Website Demographics ainda bloqueado (~300 únicos/90d pra desbloquear)" />

      <div className="dash-kpi-grid">
        <div className="dash-kpi">
          <div className="dash-kpi-icon blue"><Users /></div>
          <div className="dash-kpi-label">Visitas LinkedIn</div>
          <div className="dash-kpi-value">{liVisits.toLocaleString('pt-BR')}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon green"><FileText /></div>
          <div className="dash-kpi-label">Leads LinkedIn</div>
          <div className="dash-kpi-value">{liLeads.length}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon amber"><Target /></div>
          <div className="dash-kpi-label">CVR LinkedIn</div>
          <div className="dash-kpi-value">{liVisits > 0 ? `${liCvr.toFixed(1)}%` : '—'}</div>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-title"><Megaphone /> Top campanhas LinkedIn (utm_campaign)</div>
        {liCampaigns.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>Sem leads do LinkedIn ainda.</div>
        ) : (
          <table className="dash-table">
            <thead><tr><th>Campanha</th><th className="right">Leads</th></tr></thead>
            <tbody>
              {liCampaigns.map((c, i) => (
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
        <div className="dash-card-title"><User /> Leads recentes do LinkedIn</div>
        {liLeads.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>Sem leads ainda.</div>
        ) : (
          <table className="dash-table">
            <thead><tr><th>Lead</th><th>Empresa</th><th>Campaign</th><th>Status</th><th className="right">Quando</th></tr></thead>
            <tbody>
              {liLeads.map(({ person, company, status }) => (
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

          {/* Mídia & PR foi movido pra /dashboard/campanhas (faz mais sentido conceitual:
              PR é campanha). Quem buscar aqui acha o link. */}
          <div style={{ marginTop: 36, padding: 14, background: 'rgba(157, 133, 179, 0.06)', borderRadius: 10, fontSize: 12, color: '#5E2A67' }}>
            📰 Mídia & PR agora vive em <Link href="/internal/dashboard/campanhas" style={{ color: '#CD50F1', fontWeight: 700 }}>Campanhas</Link> — faz mais sentido conceitual (PR é uma campanha).
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                             */
/* -------------------------------------------------------------------------- */

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

function SetupCard({ title, body }: { title: string; body: React.ReactNode }) {
  return (
    <div className="dash-setup-needed">
      <strong>{title}</strong>
      <p style={{ fontSize: 13 }}>{body}</p>
    </div>
  );
}
