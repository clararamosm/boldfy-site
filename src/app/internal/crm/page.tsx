/**
 * CRM — view principal (Pessoas).
 *
 * Kanban 3 colunas: Ativo / Lead / Quente.
 * Cards desenhados com a estrutura validada (score top-right, origin tags).
 *
 * Click no card → /internal/crm/people/[id] (lead detail).
 */

import type { Metadata } from 'next';
import { getPeopleByStatus } from '@/lib/crm-queries';
import { PersonKanban } from '@/components/crm/person-kanban';

export const metadata: Metadata = {
  title: 'CRM · Pessoas',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function CrmPeoplePage() {
  let people;
  let dbError: string | null = null;
  try {
    people = await getPeopleByStatus();
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
    people = { Ativo: [], Lead: [], Quente: [] };
  }

  return (
    <div>
      <div className="crm-header">
        <div>
          <h1 className="crm-title">Pessoas</h1>
          <p className="crm-subtitle">
            Pipeline de leads · status promove auto pelo score (Ativo &lt;21 · Lead 21-50 · Quente 51+)
          </p>
        </div>
      </div>

      {dbError ? (
        <div className="crm-empty-db">
          <strong>Postgres não conectado.</strong>
          <p>
            Configure: Vercel → Storage → Create Database → Postgres. Depois:{' '}
            <code>vercel env pull .env.local</code> e <code>npm run db:push</code>.
          </p>
        </div>
      ) : null}

      <PersonKanban data={people} />
    </div>
  );
}
