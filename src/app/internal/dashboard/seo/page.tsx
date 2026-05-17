/**
 * Dashboard · SEO — silo simples (Search Console).
 *
 * KPIs + linha cliques/impressões + scatter de queries (oportunidades) +
 * top queries + páginas + branded.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import {
  isSearchConsoleConfigured,
  getSeoSummary,
  getTopQueries,
  getTopPagesSeo,
  getRankingOpportunities,
  getSeoByDay,
  getBrandedQueries,
} from '@/lib/search-console';
import { getLowCtrForPosition, getTopicGaps, getQueriesScatter } from '@/lib/dashboard-queries';
import { DailyLineChart } from '@/components/dashboard/daily-line-chart';
import { ScatterChart } from '@/components/dashboard/charts';
import { Search, MousePointer, Eye, BarChart3, MapPin, Microscope, Lightbulb, PenTool, Target, Tag, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard · SEO',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const DAYS = 28;
const pct = (v: number) => `${(v * 100).toFixed(2)}%`;

export default async function SeoPage() {
  if (!isSearchConsoleConfigured()) {
    return (
      <div>
        <div className="dash-header">
          <div>
            <h1 className="dash-title">SEO</h1>
            <p className="dash-subtitle">Search Console não configurado</p>
          </div>
        </div>
        <div className="dash-setup-needed">
          <strong>Conecta o Google + define SEARCH_CONSOLE_SITE_URL</strong>
          <p>Vai em <Link href="/internal/dashboard/connect-google" style={{ color: '#CD50F1' }}>/connect-google</Link>.</p>
        </div>
      </div>
    );
  }

  const [summary, queries, pages, opps, daily, branded, lowCtr, gaps, scatter] = await Promise.all([
    getSeoSummary(DAYS).catch(() => null),
    getTopQueries(DAYS, 20).catch(() => []),
    getTopPagesSeo(DAYS, 12).catch(() => []),
    getRankingOpportunities(DAYS, 12).catch(() => []),
    getSeoByDay(DAYS).catch(() => []),
    getBrandedQueries(DAYS).catch(() => []),
    getLowCtrForPosition(DAYS, 30).catch(() => []),
    getTopicGaps(DAYS, 20).catch(() => []),
    getQueriesScatter(DAYS, 80).catch(() => []),
  ]);

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">SEO</h1>
          <p className="dash-subtitle">Search Console · últimos {DAYS} dias · delay de ~3 dias</p>
        </div>
      </div>

      <div className="dash-kpi-grid">
        <div className="dash-kpi">
          <div className="dash-kpi-icon"><MousePointer /></div>
          <div className="dash-kpi-label">Cliques</div>
          <div className="dash-kpi-value">{summary?.clicks.toLocaleString('pt-BR') ?? 0}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon blue"><Eye /></div>
          <div className="dash-kpi-label">Impressões</div>
          <div className="dash-kpi-value">{summary?.impressions.toLocaleString('pt-BR') ?? 0}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon amber"><BarChart3 /></div>
          <div className="dash-kpi-label">CTR médio</div>
          <div className="dash-kpi-value">{summary ? pct(summary.ctr) : '—'}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon green"><MapPin /></div>
          <div className="dash-kpi-label">Posição média</div>
          <div className="dash-kpi-value">{summary ? summary.position.toFixed(1) : '—'}</div>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-title"><Search /> Cliques × Impressões por dia</div>
        <DailyLineChart
          data={daily.map((d) => ({ date: d.date, a: d.clicks, b: d.impressions }))}
          labels={{ a: 'Cliques', b: 'Impressões' }}
        />
      </div>

      {scatter.length > 0 ? (
        <div className="dash-card">
          <div className="dash-card-title"><Microscope /> Scatter de queries</div>
          <div className="dash-card-subtitle">X = posição (esquerda = melhor) · Y = impressões · bolha = cliques</div>
          <ScatterChart
            points={scatter.map((p) => ({ x: p.position, y: p.impressions, size: p.clicks, label: p.query }))}
            xLabel="Posição"
            yLabel="Impressões"
            invertX
            width={760}
            height={340}
          />
        </div>
      ) : null}

      {lowCtr.length > 0 ? (
        <div className="dash-card">
          <div className="dash-card-title"><Lightbulb /> CTR abaixo do esperado pra posição</div>
          <div className="dash-card-subtitle">Otimizar title/meta tem alto ROI</div>
          <table className="dash-table">
            <thead><tr><th>Query</th><th className="right">Pos</th><th className="right">CTR atual</th><th className="right">Esperado</th><th className="right">Gap</th><th className="right">Impr</th></tr></thead>
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
        </div>
      ) : null}

      {gaps.length > 0 ? (
        <div className="dash-card">
          <div className="dash-card-title"><PenTool /> Topic gaps</div>
          <div className="dash-card-subtitle">Queries com volume mas posição &gt; 30 — possível pauta</div>
          <table className="dash-table">
            <thead><tr><th>Query</th><th className="right">Impressões</th><th className="right">Posição</th></tr></thead>
            <tbody>
              {gaps.map((q, i) => (
                <tr key={i}>
                  <td className="strong">{q.query}</td>
                  <td className="right">{q.impressions.toLocaleString('pt-BR')}</td>
                  <td className="right"><span className="dash-pill gray">pos {q.position.toFixed(1)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="dash-card">
        <div className="dash-card-title"><Target /> Quick wins (pos 11-30)</div>
        {opps.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>Sem oportunidades claras.</div>
        ) : (
          <table className="dash-table">
            <thead><tr><th>Query</th><th className="right">Impressões</th><th className="right">Posição</th></tr></thead>
            <tbody>
              {opps.map((q, i) => (
                <tr key={i}>
                  <td className="strong">{q.query}</td>
                  <td className="right">{q.impressions.toLocaleString('pt-BR')}</td>
                  <td className="right"><span className="dash-pill amber">pos {q.position.toFixed(1)}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="dash-card">
        <div className="dash-card-title"><Search /> Top queries</div>
        <table className="dash-table">
          <thead><tr><th>Query</th><th className="right">Cliques</th><th className="right">Impressões</th><th className="right">CTR</th><th className="right">Pos</th></tr></thead>
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
        <div className="dash-card-title"><FileText /> Top páginas (SEO)</div>
        <table className="dash-table">
          <thead><tr><th>Página</th><th className="right">Cliques</th><th className="right">Impressões</th></tr></thead>
          <tbody>
            {pages.map((p, i) => (
              <tr key={i}>
                <td className="strong" style={{ maxWidth: 460, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.page}</td>
                <td className="right">{p.clicks}</td>
                <td className="right muted">{p.impressions.toLocaleString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {branded.length > 0 ? (
        <div className="dash-card">
          <div className="dash-card-title"><Tag /> Queries de marca (branded)</div>
          <table className="dash-table">
            <thead><tr><th>Query</th><th className="right">Cliques</th><th className="right">Impressões</th></tr></thead>
            <tbody>
              {branded.map((q, i) => (
                <tr key={i}>
                  <td className="strong">{q.query}</td>
                  <td className="right">{q.clicks}</td>
                  <td className="right muted">{q.impressions.toLocaleString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
