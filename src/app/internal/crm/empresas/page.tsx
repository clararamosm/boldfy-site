/**
 * CRM · Empresas — kanban 6 colunas com rolagem lateral.
 */

import type { Metadata } from 'next';
import { getCompaniesByStatus } from '@/lib/crm-queries';
import { CompanyKanban } from '@/components/crm/company-kanban';

export const metadata: Metadata = {
  title: 'CRM · Empresas',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function CrmCompaniesPage() {
  let companies;
  let dbError: string | null = null;
  try {
    companies = await getCompaniesByStatus();
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
    companies = {
      'No status': [], 'Quero prospectar': [], 'Reunião marcada': [],
      'Em andamento': [], Fechado: [], Perdido: [],
    };
  }

  return (
    <div>
      <div className="crm-header">
        <div>
          <h1 className="crm-title">Empresas</h1>
          <p className="crm-subtitle">
            Pipeline de oportunidades · 6 etapas · rolagem lateral só no kanban
          </p>
        </div>
      </div>

      {dbError ? (
        <div className="crm-empty-db">
          <strong>Postgres não conectado.</strong>
          <p>Roda <code>vercel env pull .env.local</code> e <code>npm run db:push</code>.</p>
        </div>
      ) : null}

      <CompanyKanban data={companies} />
    </div>
  );
}
