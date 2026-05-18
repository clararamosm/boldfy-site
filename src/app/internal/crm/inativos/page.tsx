/**
 * Leads Inativos — view dedicada pra leads unsubscribed.
 *
 * Task 1 (mai/2026 — spec crm-source-of-truth):
 *  - Lista pessoas com people.unsubscribed=true (filtro implícito da spec §8).
 *  - Pessoa que volta a preencher form sai dessa lista automaticamente
 *    (recordLeadFromForm flipa unsubscribed=false + resubscribed_at).
 *  - Reusa PersonTable com dataset filtrado (onlyUnsubscribed=true em
 *    getPeopleByStatus).
 *
 * Sub-nav mostra contador via getCrmCounts.totalInactive.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { getPeopleByStatus, type PeopleByStatus } from '@/lib/crm-queries';
import { PersonTable } from '@/components/crm/person-table';

export const metadata: Metadata = {
  title: 'CRM · Leads Inativos',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function InativosPage() {
  let data: PeopleByStatus = [];
  let dbError: string | null = null;
  try {
    data = await getPeopleByStatus(1000, { onlyUnsubscribed: true });
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  const totalInactive = data.reduce((sum, group) => sum + group.people.length, 0);

  return (
    <div>
      <div className="crm-header">
        <div>
          <h1 className="crm-title">Leads Inativos</h1>
          <p className="crm-subtitle">
            {totalInactive} lead{totalInactive === 1 ? '' : 's'} unsubscribed do AC ·
            preencher form novo no site volta o lead pra ativo automaticamente
          </p>
        </div>
        <Link href="/internal/crm" className="crm-btn">
          ← Voltar pro kanban
        </Link>
      </div>

      {dbError ? (
        <div className="crm-empty-db">
          <strong>Postgres não conectado.</strong>
          <p>{dbError}</p>
        </div>
      ) : totalInactive === 0 ? (
        <div className="crm-empty-db" style={{ background: 'rgba(16, 185, 129, 0.04)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
          <strong style={{ color: '#10B981' }}>Nenhum lead inativo.</strong>
          <p style={{ color: '#45336B' }}>
            Quando um lead der unsubscribe no AC, o webhook flipa
            people.unsubscribed=true e ele aparece aqui.
          </p>
        </div>
      ) : (
        <PersonTable data={data} />
      )}
    </div>
  );
}
