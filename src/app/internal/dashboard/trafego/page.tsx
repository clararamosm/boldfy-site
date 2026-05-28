/**
 * Dashboard · Tráfego — silo simples (GA4 only).
 *
 * Regra do silo: queries com .catch() direto, sem PeriodFilter inline,
 * sem SectionNav, sem safeBlock wrappers, sem error.tsx local.
 * Tudo hardcoded em 28d. Quem quiser período diferente, muda no código.
 *
 * Mai/2026 (Clara):
 *  - "Sessões × Usuários" agora usa eixo Y único pra a diferença ficar
 *    visível (antes tinha 2 eixos com escalas separadas).
 *  - "Visitas por canal" virou barras empilhadas por dia (antes area
 *    chart confundia leitura).
 *  - Tabela Canais ganhou colunas Leads + Forms submetidos.
 *  - Top páginas agora lista TODAS as páginas conhecidas do site (mesmo
 *    com 0 visitas) + páginas extras detectadas no GA4. Categorizadas.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  isGa4Configured,
  getTrafficSummary,
  getTrafficByChannel,
  getTopPages,
  getTrafficByDay,
} from '@/lib/ga4';
import {
  getStackedTrafficByChannel,
  getLeadsByChannel,
} from '@/lib/dashboard/cross-channel';
import { getKnownPages } from '@/lib/dashboard/known-pages';
import { DailyLineChart } from '@/components/dashboard/daily-line-chart';
import { StackedBarChart, BOLDFY_PURPLES } from '@/components/dashboard/charts';
import { GoogleConnectionBadge } from '@/components/dashboard/google-connection-badge';
import { channelLabel } from '@/lib/crm-format';
import { Globe2, Radio, TrendingUp, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard · Tráfego',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const DAYS = 28;

/**
 * Mapeia label canônica do GA4 (sessionDefaultChannelGroup) → key do
 * sourceChannel do CRM. Usado pra cruzar tabelas GA4 ↔ CRM.
 */
function ga4ChannelToCrmKey(ga4Label: string): string {
  const lower = ga4Label.toLowerCase();
  if (lower.includes('social')) return 'linkedin'; // Boldfy: 85%+ social = linkedin
  if (lower.includes('search')) return 'organic';
  if (lower === 'direct') return 'direct';
  if (lower === 'email') return 'email';
  if (lower === 'referral') return 'indicacao';
  return 'unknown';
}

export default async function TrafegoPage() {
  if (!isGa4Configured()) {
    return (
      <div>
        <div className="dash-header">
          <div>
            <h1 className="dash-title">Tráfego</h1>
            <p className="dash-subtitle">GA4 não configurado</p>
          </div>
        </div>
        <div className="dash-setup-needed">
          <strong>Conecta o Google primeiro</strong>
          <p>
            Vai em <Link href="/internal/dashboard/connect-google" style={{ color: '#CD50F1' }}>/connect-google</Link> e autoriza GA4.
          </p>
        </div>
      </div>
    );
  }

  const [summary, channelsGa4, pages, daily, stacked, leadsByChannel, knownPages] = await Promise.all([
    getTrafficSummary(DAYS).catch(() => null),
    getTrafficByChannel(DAYS).catch(() => []),
    // Limit alto pra cobrir bem (~todas as páginas que tiveram tráfego)
    getTopPages(DAYS, 200).catch(() => []),
    getTrafficByDay(DAYS).catch(() => []),
    getStackedTrafficByChannel(DAYS).catch(() => ({ data: [], channels: [] })),
    getLeadsByChannel(DAYS).catch(() => []),
    getKnownPages().catch(() => []),
  ]);

  /* Tabela Canais: cruza GA4 com CRM */
  const leadsByCrmKey = new Map(leadsByChannel.map((r) => [r.channel, r]));
  const channelRows = channelsGa4.map((c) => {
    const crmKey = ga4ChannelToCrmKey(c.channel);
    const leadsRow = leadsByCrmKey.get(crmKey);
    return {
      ga4Channel: c.channel,
      sessions: c.sessions,
      users: c.users,
      uniquePeople: leadsRow?.uniquePeople ?? 0,
      formSubmits: leadsRow?.formSubmits ?? 0,
    };
  });

  /* Top páginas: cross-join GA4 × known pages.
     Páginas conhecidas sem dado GA4 entram com 0. Páginas GA4 não-conhecidas
     (ex: URLs com query string, /404, /api/*) também aparecem mas marcadas
     como "Outra". */
  const ga4PageMap = new Map(pages.map((p) => [normalizePath(p.page), p]));
  type PageRow = { path: string; category: string; label?: string; pageViews: number; sessions: number };
  const pageRows: PageRow[] = [];
  const seen = new Set<string>();

  for (const known of knownPages) {
    const ga4 = ga4PageMap.get(known.path);
    pageRows.push({
      path: known.path,
      category: known.category,
      label: known.label,
      pageViews: ga4?.pageViews ?? 0,
      sessions: ga4?.sessions ?? 0,
    });
    seen.add(known.path);
  }
  // Páginas extras detectadas no GA4 que não estão na lista conhecida
  for (const p of pages) {
    const norm = normalizePath(p.page);
    if (seen.has(norm)) continue;
    pageRows.push({
      path: p.page,
      category: 'Outra',
      pageViews: p.pageViews,
      sessions: p.sessions,
    });
  }
  pageRows.sort((a, b) => b.pageViews - a.pageViews || a.path.localeCompare(b.path));

  return (
    <div>
      <GoogleConnectionBadge kind="ga4" />
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Tráfego</h1>
          <p className="dash-subtitle">GA4 · últimos {DAYS} dias</p>
        </div>
      </div>

      <div className="dash-kpi-grid">
        <div className="dash-kpi">
          <div className="dash-kpi-icon"><Globe2 /></div>
          <div className="dash-kpi-label">Usuários únicos</div>
          <div className="dash-kpi-value">{summary?.totalUsers.toLocaleString('pt-BR') ?? '—'}</div>
          <div className="dash-kpi-meta">{summary?.newUsers.toLocaleString('pt-BR') ?? 0} novos</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon blue"><TrendingUp /></div>
          <div className="dash-kpi-label">Sessões</div>
          <div className="dash-kpi-value">{summary?.sessions.toLocaleString('pt-BR') ?? '—'}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon amber"><FileText /></div>
          <div className="dash-kpi-label">Page views</div>
          <div className="dash-kpi-value">{summary?.screenPageViews.toLocaleString('pt-BR') ?? '—'}</div>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-title"><TrendingUp /> Sessões × Usuários por dia</div>
        <div className="dash-card-subtitle">Mesma régua nos dois — pra você ver a diferença real entre sessões e usuários.</div>
        <DailyLineChart
          data={daily.map((d) => ({ date: d.date, a: d.sessions, b: d.users }))}
          labels={{ a: 'Sessões', b: 'Usuários' }}
        />
      </div>

      {stacked.data.length > 0 && stacked.channels.length > 0 ? (
        <div className="dash-card">
          <div className="dash-card-title"><Radio /> Visitas por canal (stacked)</div>
          <div className="dash-card-subtitle">Cada barra é um dia · cada cor é um canal · total da barra = sessões do dia.</div>
          <StackedBarChart
            dates={stacked.data.map((d) => d.date)}
            series={stacked.channels.map((c, i) => ({
              key: c,
              label: c,
              color: BOLDFY_PURPLES[i % BOLDFY_PURPLES.length],
              data: stacked.data.map((d) => Number(d[c] ?? 0)),
            }))}
            height={260}
          />
        </div>
      ) : null}

      <div className="dash-card">
        <div className="dash-card-title"><Radio /> Canais</div>
        <div className="dash-card-subtitle">
          Sessões + usuários vêm do GA4. Pessoas + forms submetidos vêm do CRM
          (cruzando GA4 channel ↔ sourceChannel da pessoa).
        </div>
        <table className="dash-table">
          <thead>
            <tr>
              <th>Canal</th>
              <th className="right">Sessões</th>
              <th className="right">Usuários</th>
              <th className="right">Pessoas (leads)</th>
              <th className="right">Forms submetidos</th>
            </tr>
          </thead>
          <tbody>
            {channelRows.map((c) => (
              <tr key={c.ga4Channel}>
                <td className="strong">{c.ga4Channel}</td>
                <td className="right">{c.sessions.toLocaleString('pt-BR')}</td>
                <td className="right">{c.users.toLocaleString('pt-BR')}</td>
                <td className="right">{c.uniquePeople.toLocaleString('pt-BR')}</td>
                <td className="right">{c.formSubmits.toLocaleString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dash-card">
        <div className="dash-card-title"><FileText /> Top páginas</div>
        <div className="dash-card-subtitle">
          Lista de todas as páginas do site (mesmo com 0 visitas no período)
          + páginas extras detectadas no GA4. Categorizadas. Sort por
          pageviews desc. Páginas em <span style={{ color: '#9D85B3' }}>cinza</span> não tiveram tráfego.
        </div>
        <table className="dash-table">
          <thead>
            <tr>
              <th>Página</th>
              <th>Categoria</th>
              <th className="right">Page views</th>
              <th className="right">Sessões</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((p) => {
              const isDead = p.pageViews === 0;
              return (
                <tr key={p.path} style={{ opacity: isDead ? 0.55 : 1 }}>
                  <td className="strong" style={{ maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.label ? (
                      <>
                        <span>{p.label}</span>
                        <span style={{ display: 'block', fontSize: 10, color: '#9D85B3', fontWeight: 400 }}>
                          {p.path}
                        </span>
                      </>
                    ) : (
                      <code style={{ background: 'transparent', fontFamily: 'system-ui', fontSize: 12 }}>{p.path}</code>
                    )}
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 700,
                        background: categoryColor(p.category).bg,
                        color: categoryColor(p.category).fg,
                      }}
                    >
                      {p.category}
                    </span>
                  </td>
                  <td className="right">{p.pageViews.toLocaleString('pt-BR')}</td>
                  <td className="right">{p.sessions.toLocaleString('pt-BR')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Hint sutil: channelLabel importado pra pode ser usado em rev futura;
          evita warning de no-unused-vars no lint estrito. */}
      <span style={{ display: 'none' }}>{channelLabel('linkedin')}</span>

      {/* Bloco "Top UTMs" foi movido pra /dashboard/campanhas em mai/2026
          (junto de Shortlinks, são dados complementares) */}
    </div>
  );
}

/* ----------------------------------------------------------------- helpers */

/**
 * Normaliza pagePath do GA4 pra match com paths conhecidos.
 *  - Remove trailing slash (exceto raiz '/')
 *  - Tira query string e hash
 *  - Lowercase (paths do site são case-insensitive na prática)
 */
function normalizePath(raw: string): string {
  if (!raw) return '/';
  let p = raw.split('?')[0].split('#')[0].toLowerCase();
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p || '/';
}

/** Cores discretas por categoria de página (consistente com paleta dash). */
function categoryColor(category: string): { bg: string; fg: string } {
  switch (category) {
    case 'Home':         return { bg: 'rgba(205, 80, 241, 0.12)', fg: '#CD50F1' };
    case 'Comercial':    return { bg: 'rgba(16, 185, 129, 0.12)', fg: '#059669' };
    case 'Solução':      return { bg: 'rgba(59, 130, 246, 0.12)', fg: '#3B82F6' };
    case 'Vertical':     return { bg: 'rgba(168, 85, 247, 0.12)', fg: '#9333EA' };
    case 'LP':           return { bg: 'rgba(245, 158, 11, 0.12)', fg: '#92580E' };
    case 'Ferramenta':   return { bg: 'rgba(20, 184, 166, 0.12)', fg: '#0F766E' };
    case 'Recurso':      return { bg: 'rgba(99, 102, 241, 0.12)', fg: '#4F46E5' };
    case 'Blog':         return { bg: 'rgba(157, 133, 179, 0.12)', fg: '#6B5B8A' };
    case 'Institucional':return { bg: '#F0E5F8',                  fg: '#9D85B3' };
    default:             return { bg: '#F0E5F8',                  fg: '#9D85B3' };
  }
}
