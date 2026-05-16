/**
 * Dashboard · Shortlinks.
 *
 * Lê do Vercel KV os shortlinks ativos + contador de cliques + último uso.
 * Lista ordenada por mais clicados.
 */

import type { Metadata } from 'next';
import { kv } from '@vercel/kv';
import { timeAgo } from '@/lib/crm-format';

export const metadata: Metadata = {
  title: 'Dashboard · Shortlinks',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type ShortlinkRow = {
  code: string;
  url: string;
  clicks: number;
  lastClickAt: number | null;
};

async function getShortlinks(): Promise<ShortlinkRow[]> {
  try {
    // KV não tem SCAN nativo simples — assumimos que os shortlinks ficam
    // sob chave link:* e usamos scan.
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
      rows.push({
        code,
        url,
        clicks: clicks ?? 0,
        lastClickAt: lastClick ?? null,
      });
    }

    return rows.sort((a, b) => b.clicks - a.clicks);
  } catch (err) {
    console.error('[shortlinks] failed:', err);
    return [];
  }
}

export default async function ShortlinksPage() {
  const links = await getShortlinks();
  const totalClicks = links.reduce((a, l) => a + l.clicks, 0);

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Shortlinks</h1>
          <p className="dash-subtitle">
            URLs curtas <code>/l/&lt;code&gt;</code> com tracking de cliques · cria via <code>/api/shorten</code>
          </p>
        </div>
      </div>

      <div className="dash-kpi-grid">
        <div className="dash-kpi">
          <div className="dash-kpi-icon">🔗</div>
          <div className="dash-kpi-label">Links ativos</div>
          <div className="dash-kpi-value">{links.length}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon blue">🖱</div>
          <div className="dash-kpi-label">Cliques totais</div>
          <div className="dash-kpi-value">{totalClicks.toLocaleString('pt-BR')}</div>
        </div>
        <div className="dash-kpi">
          <div className="dash-kpi-icon green">📊</div>
          <div className="dash-kpi-label">Média/link</div>
          <div className="dash-kpi-value">{links.length > 0 ? Math.round(totalClicks / links.length) : 0}</div>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-title">📋 Top links por cliques</div>
        {links.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>
            Sem shortlinks cadastrados. Cria via <code>POST /api/shorten</code> com <code>{`{ url: "..." }`}</code>.
          </div>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Destino</th>
                <th className="right">Cliques</th>
                <th className="right">Último uso</th>
              </tr>
            </thead>
            <tbody>
              {links.map((l) => (
                <tr key={l.code}>
                  <td>
                    <a href={`/l/${l.code}`} target="_blank" rel="noopener noreferrer" className="strong" style={{ color: '#CD50F1', textDecoration: 'none' }}>
                      /l/{l.code}
                    </a>
                  </td>
                  <td className="muted" style={{ maxWidth: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.url}</td>
                  <td className="right strong">{l.clicks}</td>
                  <td className="right muted">{l.lastClickAt ? timeAgo(new Date(l.lastClickAt)) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
