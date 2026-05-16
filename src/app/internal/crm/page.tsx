/**
 * CRM — view principal (Pessoas).
 *
 * Kanban de N colunas dinâmicas (configuráveis em Settings → Statuses) OU
 * tabela com search/filter/sort (toggle via ?view=table).
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { getPeopleByStatus, type PeopleByStatus } from '@/lib/crm-queries';
import { PersonKanban } from '@/components/crm/person-kanban';
import { PersonTable } from '@/components/crm/person-table';
import { ViewToggle } from '@/components/crm/view-toggle';
import { AddPersonButton } from '@/components/crm/add-person-button';

export const metadata: Metadata = {
  title: 'CRM · Pessoas',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ view?: string }>;

export default async function CrmPeoplePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const view = params.view === 'table' ? 'table' : 'kanban';

  let data: PeopleByStatus = [];
  let dbError: string | null = null;
  try {
    data = await getPeopleByStatus(view === 'table' ? 1000 : 100);
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  return (
    <div>
      <div className="crm-header">
        <div>
          <h1 className="crm-title">Pessoas</h1>
          <p className="crm-subtitle">
            {view === 'table'
              ? 'Tabela completa · busca, filtro por status, ordenação por coluna'
              : 'Arraste os cards entre colunas pra mudar status · auto-promoção por score nos thresholds definidos'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <ViewToggle />
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
      ) : view === 'table' ? (
        <PersonTable data={data} />
      ) : (
        <PersonKanban data={data} />
      )}
    </div>
  );
}
