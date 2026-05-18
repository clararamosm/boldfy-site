/**
 * CRM · Empresas — kanban de N colunas OU tabela com busca/filtro/sort.
 * Toggle via ?view=table.
 *
 * Mai/2026 ciclo 3: filtros server-side via searchParams (period, statusId).
 * Empresas não tem canal/página de origem (esses são de pessoa).
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { getCompaniesByStatus, getInactiveCompanies, type CompaniesByStatus, type CompanyWithDetails, type CrmFilters } from '@/lib/crm-queries';
import { getStatuses } from '@/lib/statuses';
import { CompanyKanban } from '@/components/crm/company-kanban';
import { CompanyTable } from '@/components/crm/company-table';
import { ViewToggle } from '@/components/crm/view-toggle';
import { AddCompanyButton } from '@/components/crm/add-company-button';
import { CrmFilters as CrmFiltersBar } from '@/components/crm/crm-filters';

export const metadata: Metadata = {
  title: 'CRM · Empresas',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{
  view?: string;
  period?: string;
  statusId?: string;
  sort?: string;
}>;

function parseFilters(sp: { period?: string; statusId?: string; sort?: string }): CrmFilters {
  const period = ['7d', '30d', '90d'].includes(sp.period ?? '') ? (sp.period as CrmFilters['period']) : 'all';
  return {
    period,
    statusId: sp.statusId || null,
    sort: sp.sort || null,
  };
}

export default async function CrmCompaniesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const view = params.view === 'table' ? 'table' : 'kanban';
  const filters = parseFilters(params);

  let data: CompaniesByStatus = [];
  let inactiveCompanies: CompanyWithDetails[] = [];
  let dbError: string | null = null;
  let companyStatuses: Array<{ id: string; label: string; color: string | null }> = [];
  try {
    const [d, inactive, statusesData] = await Promise.all([
      getCompaniesByStatus(view === 'table' ? 1000 : 100, filters),
      getInactiveCompanies(view === 'table' ? 1000 : 100),
      getStatuses('company'),
    ]);
    data = d;
    inactiveCompanies = inactive;
    companyStatuses = statusesData.map((s) => ({ id: s.id, label: s.label, color: s.color }));
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  return (
    <div>
      <div className="crm-header">
        <div>
          <h1 className="crm-title">Empresas</h1>
          <p className="crm-subtitle">
            {view === 'table'
              ? 'Tabela completa · busca, filtro por status, ordenação por coluna'
              : 'Pipeline de oportunidades · arraste pra mudar etapa · rolagem só no kanban'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <ViewToggle />
          <Link href="/internal/crm/settings/statuses" className="crm-btn">
            ⚙ Configurar
          </Link>
          <AddCompanyButton />
        </div>
      </div>

      <Suspense fallback={<div style={{ height: 50, marginBottom: 14, background: '#FAF7FF', borderRadius: 10 }} />}>
        <CrmFiltersBar kind="company" statuses={companyStatuses} />
      </Suspense>

      {dbError ? (
        <div className="crm-empty-db">
          <strong>Postgres não conectado.</strong>
          <p>Roda <code>vercel env pull .env.local</code> e <code>npm run db:push</code>.</p>
        </div>
      ) : data.length === 0 ? (
        <div className="crm-empty-db">
          <strong>Sem colunas configuradas.</strong>
          <p>Recarrega a página pra criar os statuses padrão automaticamente.</p>
        </div>
      ) : view === 'table' ? (
        <CompanyTable data={data} inactiveCompanies={inactiveCompanies} />
      ) : (
        <CompanyKanban data={data} inactiveCompanies={inactiveCompanies} />
      )}
    </div>
  );
}
