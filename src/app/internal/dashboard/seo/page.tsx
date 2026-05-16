/**
 * Dashboard · SEO (Search Console).
 *
 * Mostra:
 *   - KPIs: cliques, impressões, CTR médio, posição média
 *   - Top queries com cliques
 *   - Top páginas que aparecem em SERPs
 *   - "Oportunidades": queries pos 11-30 com alto volume — fáceis de subir
 */

import type { Metadata } from 'next';
import {
  isSearchConsoleConfigured,
  getSeoSummary,
  getTopQueries,
  getTopPagesSeo,
  getRankingOpportunities,
} from '@/lib/search-console';

export const metadata: Metadata = {
  title: 'Dashboard · SEO',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';
// Removido `revalidate` — conflita com `force-dynamic` e fazia cache do estado
// de erro (Sem dados) ficar até expirar. SC tem delay de 2-3 dias mesmo, mas
// se quiser cache, fazer via fetch inline.

function formatPct(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export default async function DashboardSeoPage() {
  if (!isSearchConsoleConfigured()) {
    return (
      <div>
        <div className="dash-header">
          <div>
            <h1 className="dash-title">SEO</h1>
            <p className="dash-subtitle">Google Search Console — requer setup</p>
          </div>
        </div>

        <div className="dash-setup-needed">
          <strong>Setup do Search Console necessário</strong>
          <p>Reusa a mesma Service Account do GA4. Passos:</p>
          <div style={{ textAlign: 'left', maxWidth: 540, margin: '20px auto 0', fontSize: 13, color: '#45336B', lineHeight: 1.7 }}>
            <ol style={{ paddingLeft: 20 }}>
              <li>console.cloud.google.com → mesma project do GA4 → APIs → ativa <code>Google Search Console API</code></li>
              <li>search.google.com/search-console → seu site → Settings → Users and permissions → adiciona email da service account com permissão <code>Full</code> (ou <code>Owner</code>)</li>
              <li>Vercel env vars → adiciona <code>SEARCH_CONSOLE_SITE_URL</code> com URL exata do seu site no SC (ex: <code>https://www.boldfy.com.br/</code> — com barra final, como aparece no SC)</li>
              <li>Redeploy</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  const [summary, queries, pages, opportunities] = await Promise.all([
    getSeoSummary(28),
    getTopQueries(28, 20),
    getTopPagesSeo(28, 20),
    getRankingOpportunities(28, 20),
  ]);

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">SEO</h1>
          <p className="dash-subtitle">Search Console · últimos 28 dias · dado tem delay de ~3 dias</p>
        </div>
      </div>

      <div className="dash-kpi-grid">
        <div className="dash-kpi">
          <div className="dash-kpi-icon">🖱</div>
          <div className="dash-kpi-label">Cliques</div>
          <div className="dash-kpi-value">{summary?.clicks.toLocaleString('pt-BR') ?? 0}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon blue">👁</div>
          <div className="dash-kpi-label">Impressões</div>
          <div className="dash-kpi-value">{summary?.impressions.toLocaleString('pt-BR') ?? 0}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon amber">📊</div>
          <div className="dash-kpi-label">CTR médio</div>
          <div className="dash-kpi-value">{summary ? formatPct(summary.ctr) : '—'}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon green">📍</div>
          <div className="dash-kpi-label">Posição média</div>
          <div className="dash-kpi-value">{summary ? summary.position.toFixed(1) : '—'}</div>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-title">🔍 Top queries com cliques</div>
        {queries.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>Sem queries no período.</div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Query</th>
                <th className="right">Cliques</th>
                <th className="right">Impressões</th>
                <th className="right">CTR</th>
                <th className="right">Posição</th>
              </tr>
            </thead>
            <tbody>
              {queries.map((q, i) => (
                <tr key={i}>
                  <td className="strong">{q.query}</td>
                  <td className="right">{q.clicks}</td>
                  <td className="right muted">{q.impressions.toLocaleString('pt-BR')}</td>
                  <td className="right muted">{formatPct(q.ctr)}</td>
                  <td className="right">{q.position.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="dash-card">
        <div className="dash-card-title">🎯 Oportunidades (pos 11-30)</div>
        <div className="dash-card-subtitle">Queries onde já temos volume mas precisamos subir pra primeira página</div>
        {opportunities.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>Sem oportunidades claras no momento.</div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Query</th>
                <th className="right">Impressões</th>
                <th className="right">Posição</th>
                <th className="right">CTR</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((q, i) => (
                <tr key={i}>
                  <td className="strong">{q.query}</td>
                  <td className="right">{q.impressions.toLocaleString('pt-BR')}</td>
                  <td className="right">
                    <span className="dash-pill amber">pos {q.position.toFixed(1)}</span>
                  </td>
                  <td className="right muted">{formatPct(q.ctr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="dash-card">
        <div className="dash-card-title">📄 Páginas com mais cliques</div>
        {pages.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>Sem páginas no período.</div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Página</th>
                <th className="right">Cliques</th>
                <th className="right">Impressões</th>
                <th className="right">Posição</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p, i) => (
                <tr key={i}>
                  <td className="strong" style={{ maxWidth: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.page}</td>
                  <td className="right">{p.clicks}</td>
                  <td className="right muted">{p.impressions.toLocaleString('pt-BR')}</td>
                  <td className="right">{p.position.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
