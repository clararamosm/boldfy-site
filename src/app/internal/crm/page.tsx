/**
 * CRM — view principal (Pessoas).
 *
 * Kanban de N colunas dinâmicas (configuráveis em Settings → Statuses) OU
 * tabela com search/filter/sort (toggle via ?view=table).
 *
 * Mai/2026 ciclo 3: filtros server-side via searchParams (period, statusId,
 * canal, pagina) compartilhados entre kanban e table. Suspense wrap pros
 * componentes client que usam useSearchParams (regra RSC #3).
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { getPeopleByStatus, getInactivePeople, type PeopleByStatus, type PersonWithDetails, type CrmFilters } from '@/lib/crm-queries';
import { getCrmUsers } from '@/lib/crm-users';
import type { OwnerOption } from '@/components/crm/owner-badge';
import { getStatuses } from '@/lib/statuses';
import { db, people } from '@/db';
import { PersonKanban } from '@/components/crm/person-kanban';
import { PersonTable } from '@/components/crm/person-table';
import { ViewToggle } from '@/components/crm/view-toggle';
import { AddPersonButton } from '@/components/crm/add-person-button';
import { CrmFilters as CrmFiltersBar } from '@/components/crm/crm-filters';

export const metadata: Metadata = {
  title: 'CRM · Pessoas',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{
  view?: string;
  period?: string;
  statusId?: string;
  canal?: string;
  pagina?: string;
  sort?: string;
}>;

function parseFilters(sp: { period?: string; statusId?: string; canal?: string; pagina?: string; sort?: string }): CrmFilters {
  const period = ['7d', '30d', '90d'].includes(sp.period ?? '') ? (sp.period as CrmFilters['period']) : 'all';
  return {
    period,
    statusId: sp.statusId || null,
    canal: sp.canal || null,
    pagina: sp.pagina || null,
    sort: sp.sort || null,
  };
}

async function getFilterOptions(): Promise<{ channels: string[]; pages: string[] }> {
  const [chanRows, pageRows] = await Promise.all([
    db.selectDistinct({ v: people.sourceChannel }).from(people),
    db.selectDistinct({ v: people.sourcePage }).from(people),
  ]);
  // sourceChannel é enum tipado — cast explícito pra string[] (type guard
  // `v is string` falha quando o domínio é union de literals).
  const channels = chanRows
    .map((r) => r.v)
    .filter((v): v is NonNullable<typeof v> => v !== null && v !== 'unknown')
    .map((v) => v as string)
    .sort();
  const pages = pageRows
    .map((r) => r.v)
    .filter((v): v is string => typeof v === 'string' && v.length > 0)
    .sort();
  return { channels, pages };
}

export default async function CrmPeoplePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const view = params.view === 'table' ? 'table' : 'kanban';
  const filters = parseFilters(params);

  let data: PeopleByStatus = [];
  let inactivePeople: PersonWithDetails[] = [];
  let dbError: string | null = null;
  let personStatuses: Array<{ id: string; label: string; color: string | null }> = [];
  let filterOptions: { channels: string[]; pages: string[] } = { channels: [], pages: [] };
  let crmUsers: OwnerOption[] = [];
  try {
    const [d, inactive, statusesData, opts, usersData] = await Promise.all([
      getPeopleByStatus(view === 'table' ? 1000 : 100, filters),
      getInactivePeople(view === 'table' ? 1000 : 100),
      getStatuses('person'),
      getFilterOptions(),
      getCrmUsers(),
    ]);
    data = d;
    inactivePeople = inactive;
    personStatuses = statusesData.map((s) => ({ id: s.id, label: s.label, color: s.color }));
    filterOptions = opts;
    crmUsers = usersData.map((u) => ({ id: u.id, name: u.name, photoUrl: u.photoUrl }));
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

      <Suspense fallback={<div style={{ height: 50, marginBottom: 14, background: '#FAF7FF', borderRadius: 10 }} />}>
        <CrmFiltersBar kind="person" statuses={personStatuses} channels={filterOptions.channels} pages={filterOptions.pages} />
      </Suspense>

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
        <PersonTable data={data} inactivePeople={inactivePeople} />
      ) : (
        <PersonKanban data={data} inactivePeople={inactivePeople} users={crmUsers} />
      )}
    </div>
  );
}
