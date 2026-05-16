/**
 * Dashboard · Mídia & PR.
 *
 * Tracking de artigos publicados via SaaS de PR. Foco em impacto orgânico:
 *  - Branded search ("boldfy" no SC) — cresceu desde o 1º artigo?
 *  - Tráfego via UTM utm_source=pr
 *  - Leads gerados via PR (CRM filtrado por sourceChannel=pr)
 */

import type { Metadata } from 'next';
import { db, prArticles, people } from '@/db';
import { eq, and, isNull, count, desc } from 'drizzle-orm';
import { isSearchConsoleConfigured, getBrandedQueries } from '@/lib/search-console';
import { isGa4Configured, getTopUtms } from '@/lib/ga4';
import { ArticleForm } from './article-form';
import { DeleteArticleButton } from './delete-button';

export const metadata: Metadata = {
  title: 'Dashboard · Mídia & PR',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

async function getArticles() {
  return db.select().from(prArticles).orderBy(desc(prArticles.publishedAt)).limit(50);
}

async function getPrLeads() {
  return db.select({ n: count() }).from(people).where(and(
    eq(people.archived, false),
    isNull(people.mergedIntoId),
    eq(people.sourceChannel, 'pr'),
  ));
}

export default async function MidiaPage() {
  const articles = await getArticles().catch(() => []);
  const prLeadsResult = await getPrLeads().catch(() => [{ n: 0 }]);
  const prLeadsCount = prLeadsResult[0]?.n ?? 0;

  const brandedQueries = isSearchConsoleConfigured()
    ? await getBrandedQueries(28).catch(() => [])
    : [];
  const brandedClicks = brandedQueries.reduce((a, q) => a + q.clicks, 0);
  const brandedImpressions = brandedQueries.reduce((a, q) => a + q.impressions, 0);

  // Tráfego utm_source=pr (de GA4)
  const utms = isGa4Configured() ? await getTopUtms(30, 100).catch(() => []) : [];
  const prSessions = utms.filter((u) => u.source.toLowerCase() === 'pr').reduce((a, u) => a + u.sessions, 0);

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Mídia &amp; PR</h1>
          <p className="dash-subtitle">
            Tracking de artigos publicados via SaaS de PR + impacto no orgânico
          </p>
        </div>
      </div>

      <div className="dash-kpi-grid">
        <div className="dash-kpi">
          <div className="dash-kpi-icon">📰</div>
          <div className="dash-kpi-label">Artigos publicados</div>
          <div className="dash-kpi-value">{articles.length}</div>
          <div className="dash-kpi-meta">total cadastrado</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon blue">👥</div>
          <div className="dash-kpi-label">Visitas via PR</div>
          <div className="dash-kpi-value">{isGa4Configured() ? prSessions.toLocaleString('pt-BR') : '—'}</div>
          <div className="dash-kpi-meta">{isGa4Configured() ? 'utm_source=pr · 30d' : 'configure GA4'}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon green">📋</div>
          <div className="dash-kpi-label">Leads via PR</div>
          <div className="dash-kpi-value">{prLeadsCount}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon amber">🔍</div>
          <div className="dash-kpi-label">Buscas &ldquo;boldfy&rdquo;</div>
          <div className="dash-kpi-value">{isSearchConsoleConfigured() ? brandedClicks.toLocaleString('pt-BR') : '—'}</div>
          <div className="dash-kpi-meta">{isSearchConsoleConfigured() ? `${brandedImpressions} impr · 28d` : 'configure SC'}</div>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-title">+ Cadastrar publicação</div>
        <div className="dash-card-subtitle">
          Quando o SaaS confirmar publicação, registra aqui. Padrão UTM: <code style={{ background: '#F7EEFC', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>?utm_source=pr&utm_medium=earned&utm_campaign=&lt;slug&gt;</code>
        </div>
        <ArticleForm />
      </div>

      <div className="dash-card">
        <div className="dash-card-title">📄 Artigos cadastrados</div>
        {articles.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>
            Sem artigos ainda. Cadastra o primeiro acima quando o SaaS de PR confirmar a próxima publicação.
          </div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Publicado em</th>
                <th>Shortlink</th>
                <th>UTM campaign</th>
                <th className="right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id}>
                  <td className="strong" style={{ maxWidth: 380 }}>
                    {a.title}
                    {a.notes ? <div className="muted" style={{ marginTop: 2 }}>{a.notes}</div> : null}
                  </td>
                  <td className="muted">{new Date(a.publishedAt).toLocaleDateString('pt-BR')}</td>
                  <td>{a.shortlinkCode ? <span className="dash-pill blue">/l/{a.shortlinkCode}</span> : <span className="muted">—</span>}</td>
                  <td className="muted">{a.utmCampaign ?? '—'}</td>
                  <td className="right"><DeleteArticleButton id={a.id} title={a.title} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {brandedQueries.length > 0 ? (
        <div className="dash-card">
          <div className="dash-card-title">🔍 Buscas com &ldquo;boldfy&rdquo; (Search Console)</div>
          <div className="dash-card-subtitle">Queries de marca · alta correlação com PR e direct traffic</div>
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
              {brandedQueries.map((q, i) => (
                <tr key={i}>
                  <td className="strong">{q.query}</td>
                  <td className="right">{q.clicks}</td>
                  <td className="right muted">{q.impressions.toLocaleString('pt-BR')}</td>
                  <td className="right muted">{(q.ctr * 100).toFixed(1)}%</td>
                  <td className="right">{q.position.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="dash-card">
        <div className="dash-card-title">💡 Como medir impacto orgânico</div>
        <div style={{ fontSize: 13, color: '#45336B', lineHeight: 1.6 }}>
          <strong>Dois sinais principais</strong> indicam que PR moveu o ponteiro:
          <ol style={{ marginTop: 8, paddingLeft: 20 }}>
            <li><strong>Branded search subindo:</strong> gente vê matéria, lembra do nome, busca direto no Google → conta no card &ldquo;Buscas boldfy&rdquo; acima.</li>
            <li><strong>Direct traffic subindo:</strong> gente vai direto pra <code>boldfy.com.br</code> depois da matéria → conta no Tráfego como Direct.</li>
          </ol>
          <p style={{ marginTop: 8 }}>
            <strong>Tracking específico por artigo:</strong> cria um shortlink (<code>/l/pr-slug</code>) com UTM <code>utm_source=pr&amp;utm_medium=earned&amp;utm_campaign=&lt;slug&gt;</code> e usa no body do artigo enviado pro SaaS.
          </p>
        </div>
      </div>
    </div>
  );
}
