/**
 * CRM · Empresas — kanban de N colunas (rolagem lateral só no kanban).
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { getCompaniesByStatus, type CompaniesByStatus } from '@/lib/crm-queries';
import { CompanyKanban } from '@/components/crm/company-kanban';
import { AddCompanyButton } from '@/components/crm/add-company-button';

export const metadata: Metadata = {
  title: 'CRM · Empresas',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function CrmCompaniesPage() {
  let data: CompaniesByStatus = [];
  let dbError: string | null = null;
  try {
    data = await getCompaniesByStatus();
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  return (
    <div>
      <div className="crm-header">
        <div>
          <h1 className="crm-title">Empresas</h1>
          <p className="crm-subtitle">
            Pipeline de oportunidades · arraste pra mudar etapa · rolagem só no kanban
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link href="/internal/crm/settings/statuses" className="crm-btn">
            ⚙ Configurar
          </Link>
          <AddCompanyButton />
        </div>
      </div>

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
      ) : (
        <CompanyKanban data={data} />
      )}
    </div>
  );
}
