/**
 * CRM · Activity Feed — timeline global cronológica de tudo que rola no CRM.
 *
 * Agrupa por dia. Filtros vêm no Sprint 4 (precisa client component + query
 * params).
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { getFeedActivities, type FeedActivity } from '@/lib/crm-queries';
import { describeActivity, timeAgo } from '@/lib/crm-format';

export const metadata: Metadata = {
  title: 'CRM · Feed',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

function groupByDay<T extends { createdAt: Date | string }>(
  items: T[],
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const d = item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt);
    const key = d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  return groups;
}

function formatTime(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default async function CrmFeedPage() {
  let activities: FeedActivity[] = [];
  let dbError: string | null = null;
  try {
    activities = await getFeedActivities(200);
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  const groups = groupByDay(activities);

  return (
    <div>
      <div className="crm-header">
        <div>
          <h1 className="crm-title">Activity Feed</h1>
          <p className="crm-subtitle">
            Tudo que rolou no CRM, mais recente em cima · últimas 200 activities
          </p>
        </div>
      </div>

      {dbError ? (
        <div className="crm-empty-db">
          <strong>Postgres não conectado.</strong>
          <p>Roda <code>vercel env pull .env.local</code> e <code>npm run db:push</code>.</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="crm-empty-db">
          <strong>Sem atividade ainda.</strong>
          <p>Conforme leads chegarem nos forms ou você logar interações manuais, vai aparecer aqui em ordem cronológica.</p>
        </div>
      ) : (
        <div className="crm-feed-container">
          {Array.from(groups.entries()).map(([day, items]) => (
            <div key={day} className="crm-feed-day">
              <div className="crm-feed-day-header">{day}</div>
              {items.map((act) => {
                const display = describeActivity(act.type, act.data as Record<string, unknown> | null);
                const observation = (act.data as Record<string, unknown> | null)?.observation as string | undefined;
                return (
                  <div key={act.id} className="crm-feed-item">
                    <div className="crm-feed-time">{formatTime(act.createdAt)}</div>
                    <div className="crm-feed-icon">{display.icon}</div>
                    <div className="crm-feed-content">
                      <div className="crm-feed-text">
                        {act.person ? (
                          <Link href={`/internal/crm/people/${act.person.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            <strong>{act.person.name}</strong>
                          </Link>
                        ) : (
                          <strong>—</strong>
                        )}
                        {' · '}
                        {display.text}
                        {act.weight > 0 ? (
                          <span style={{ marginLeft: 6, padding: '1px 6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                            +{act.weight}
                          </span>
                        ) : null}
                        {act.company ? (
                          <span style={{ marginLeft: 6, color: '#9D85B3', fontSize: 11 }}>
                            ({act.company.name})
                          </span>
                        ) : null}
                      </div>
                      {observation ? (
                        <div className="crm-feed-text-meta" style={{ marginTop: 4, fontStyle: 'italic' }}>&ldquo;{observation}&rdquo;</div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
