/**
 * Dashboard · Tráfego (GA4).
 *
 * Lê do GA4 Data API via service account. Se Clara ainda não configurou,
 * mostra tutorial inline + envs faltando.
 */

import type { Metadata } from 'next';
import {
  isGa4Configured,
  getTrafficSummary,
  getTrafficByChannel,
  getTopPages,
  getTopUtms,
} from '@/lib/ga4';

export const metadata: Metadata = {
  title: 'Dashboard · Tráfego',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';
// Sem `revalidate` — `force-dynamic` + `revalidate` conflita, Next prioriza
// revalidate e serve cache mesmo com erro silencioso. Pra cache, usar fetch
// com next.revalidate inline.

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

function formatPct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export default async function DashboardTrafegoPage() {
  if (!isGa4Configured()) {
    return (
      <div>
        <div className="dash-header">
          <div>
            <h1 className="dash-title">Tráfego</h1>
            <p className="dash-subtitle">Google Analytics 4 — requer setup do Google Cloud</p>
          </div>
        </div>

        <div className="dash-setup-needed">
          <strong>Setup do Google Cloud necessário (15 min)</strong>
          <p>Pra ler GA4, preciso de uma Service Account no Google Cloud com acesso ao seu GA4 Property.</p>
          <div style={{ textAlign: 'left', maxWidth: 540, margin: '20px auto 0', fontSize: 13, color: '#45336B', lineHeight: 1.7 }}>
            <strong>Passos:</strong>
            <ol style={{ paddingLeft: 20, marginTop: 8 }}>
              <li><a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#CD50F1' }}>console.cloud.google.com</a> → use o project da Plataforma Boldfy (reusa)</li>
              <li>APIs & Services → Library → ativa <code>Google Analytics Data API</code></li>
              <li>IAM &amp; Admin → Service Accounts → criar <code>boldfy-site-dashboard</code></li>
              <li>Na service account criada → Keys → Add Key → Create new (JSON) → baixa o arquivo</li>
              <li>GA4 (analytics.google.com) → Admin → Property access → adicionar o email da service account (xxx@xxx.iam.gserviceaccount.com) com role <code>Viewer</code></li>
              <li>Vercel → Settings → Environment Variables → adicionar:
                <ul style={{ marginTop: 6 }}>
                  <li><code>GA4_PROPERTY_ID</code> = ID numérico do seu GA4 property (Admin → Property Details)</li>
                  <li><code>GOOGLE_SERVICE_ACCOUNT_JSON</code> = paste o JSON inteiro (Sensitive)</li>
                </ul>
              </li>
              <li>Redeploy</li>
            </ol>
            <p style={{ marginTop: 12, fontSize: 12 }}>
              Quando bater, recarrega essa página e o tráfego aparece.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const [summary, channels, pages, utms] = await Promise.all([
    getTrafficSummary(30),
    getTrafficByChannel(30),
    getTopPages(30, 10),
    getTopUtms(30, 15),
  ]);

  if (!summary) {
    return (
      <div>
        <div className="dash-header">
          <div>
            <h1 className="dash-title">Tráfego</h1>
            <p className="dash-subtitle">GA4 configurado mas retornou vazio</p>
          </div>
        </div>
        <div className="dash-setup-needed">
          <strong>Sem dados retornados do GA4.</strong>
          <p>Possíveis causas: GA4 Property ID errado, service account sem acesso, ou property sem dados no período.</p>
          <p style={{ fontSize: 11, marginTop: 8 }}>Confere logs do Vercel se persistir.</p>
        </div>
      </div>
    );
  }

  const totalChannels = channels.reduce((a, c) => a + c.sessions, 0);

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Tráfego</h1>
          <p className="dash-subtitle">GA4 · últimos 30 dias · cache 15 min</p>
        </div>
      </div>

      <div className="dash-kpi-grid">
        <div className="dash-kpi">
          <div className="dash-kpi-icon">👥</div>
          <div className="dash-kpi-label">Usuários únicos</div>
          <div className="dash-kpi-value">{summary.totalUsers.toLocaleString('pt-BR')}</div>
          <div className="dash-kpi-meta">{summary.newUsers.toLocaleString('pt-BR')} novos</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon blue">🖱</div>
          <div className="dash-kpi-label">Sessões</div>
          <div className="dash-kpi-value">{summary.sessions.toLocaleString('pt-BR')}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon amber">⏱</div>
          <div className="dash-kpi-label">Tempo médio</div>
          <div className="dash-kpi-value">{formatDuration(summary.averageSessionDuration)}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon orange">↩</div>
          <div className="dash-kpi-label">Bounce rate</div>
          <div className="dash-kpi-value">{formatPct(summary.bounceRate)}</div>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-title">📡 Canais de tráfego</div>
        <div className="dash-card-subtitle">Sessões por channel group · ordenado por volume</div>
        {channels.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>
            Sem dados de canal no período.
          </div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Canal</th>
                <th className="right">Sessões</th>
                <th className="right">Usuários</th>
                <th className="right">% do total</th>
              </tr>
            </thead>
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
        )}
      </div>

      <div className="dash-card">
        <div className="dash-card-title">📄 Páginas mais vistas</div>
        <table className="dash-table">
          <thead>
            <tr>
              <th>Página</th>
              <th className="right">Page views</th>
              <th className="right">Sessões</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p, i) => (
              <tr key={i}>
                <td className="strong">{p.page}</td>
                <td className="right">{p.pageViews.toLocaleString('pt-BR')}</td>
                <td className="right">{p.sessions.toLocaleString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dash-card">
        <div className="dash-card-title">🏷 Top UTMs</div>
        <div className="dash-card-subtitle">utm_source · utm_medium · utm_campaign</div>
        <table className="dash-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Medium</th>
              <th>Campaign</th>
              <th className="right">Sessões</th>
            </tr>
          </thead>
          <tbody>
            {utms.map((u, i) => (
              <tr key={i}>
                <td className="strong">{u.source}</td>
                <td>{u.medium}</td>
                <td className="muted">{u.campaign}</td>
                <td className="right">{u.sessions.toLocaleString('pt-BR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
