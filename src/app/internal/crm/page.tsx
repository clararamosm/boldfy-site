/**
 * CRM — view principal (Pessoas).
 *
 * Kanban de N colunas dinâmicas (configuráveis em Settings → Statuses).
 * Arraste cards entre colunas pra mudar status.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { getPeopleByStatus, type PeopleByStatus } from '@/lib/crm-queries';
import { PersonKanban } from '@/components/crm/person-kanban';
import { AddPersonButton } from '@/components/crm/add-person-button';

export const metadata: Metadata = {
  title: 'CRM · Pessoas',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function CrmPeoplePage() {
  let data: PeopleByStatus = [];
  let dbError: string | null = null;
  try {
    data = await getPeopleByStatus();
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  return (
    <div>
      <div className="crm-header">
        <div>
          <h1 className="crm-title">Pessoas</h1>
          <p className="crm-subtitle">
            Arraste os cards entre colunas pra mudar status · auto-promoção por score nos thresholds definidos
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/internal/crm/settings/statuses" className="crm-btn">
            ⚙ Configurar
          </Link>
          <AddPersonButton />
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
      ) : data.length === 0 ? (
        <div className="crm-empty-db">
          <strong>Sem colunas configuradas.</strong>
          <p>Recarrega a página pra criar os statuses padrão automaticamente.</p>
        </div>
      ) : (
        <PersonKanban data={data} />
      )}
    </div>
  );
}
