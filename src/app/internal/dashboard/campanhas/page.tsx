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
import { db, people, companies, statuses } from '@/db';
import { eq, and, isNull, count, sql } from 'drizzle-orm';
import { CAMPAIGNS, getCampaignStatus, type Campaign } from '@/data/campaigns';
import { timeAgo } from '@/lib/crm-format';
import { Megaphone, Link2 } from 'lucide-react';

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
  const stats = await Promise.all(CAMPAIGNS.map((c) => getCampaignStats(c)));
  const shortlinks = await getShortlinks();
  const now = new Date();

  return (
    <div>
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Campanhas</h1>
          <p className="dash-subtitle">Iniciativas com janela, objetivo e KPIs definidos · cada uma tem seu próprio dashboard</p>
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-title"><Megaphone /> Todas as campanhas</div>
        <div className="dash-card-subtitle">Editar em <code style={{ background: '#F7EEFC', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>src/data/campaigns.ts</code></div>
        {CAMPAIGNS.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>Nenhuma campanha cadastrada.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {CAMPAIGNS.map((c, i) => {
              const status = getCampaignStatus(c, now);
              const s = stats[i];
              const start = new Date(`${c.startDate}T00:00:00`);
              const end = new Date(`${c.endDate}T23:59:59`);
              const cvr = s.leads > 0 ? ((s.fechados / s.leads) * 100).toFixed(1) : '—';

              return (
                <Link
                  key={c.slug}
                  href={`/internal/dashboard/campanhas/${c.slug}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto auto auto auto auto',
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
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      {c.channels.map((ch) => (
                        <span key={ch} className="dash-pill">{ch}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#9D85B3', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.06 }}>Status</div>
                    <span className={`dash-pill ${status === 'ativa' ? 'green' : status === 'planejada' ? 'blue' : 'gray'}`} style={{ marginTop: 4 }}>{status}</span>
                  </div>
                  <div style={{ textAlign: 'center', minWidth: 110 }}>
                    <div style={{ fontSize: 10, color: '#9D85B3', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.06 }}>Janela</div>
                    <div style={{ fontSize: 12, color: '#45336B', fontWeight: 600, marginTop: 4 }}>
                      {start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} → {end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
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
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ====== Shortlinks ====== */}
      <div className="dash-card">
        <div className="dash-card-title"><Link2 /> Shortlinks</div>
        <div className="dash-card-subtitle">Links curtos do KV — usar em campanhas pontuais. <code style={{ background: '#F7EEFC', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>boldfy.com.br/l/&lt;code&gt;</code></div>
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
    </div>
  );
}
