/**
 * Settings · Statuses — CRUD das colunas dos kanbans Pessoas e Empresas.
 *
 * Lista por kind (Pessoas / Empresas), drag-drop pra reordenar, form pra
 * criar novo, edit inline pra renomear/cor/threshold/terminal, marcar como
 * default, deletar.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { getStatuses } from '@/lib/statuses';
import { StatusManager } from './status-manager';

export const metadata: Metadata = {
  title: 'CRM · Configurar Status',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function StatusesSettingsPage() {
  const [personStatuses, companyStatuses] = await Promise.all([
    getStatuses('person'),
    getStatuses('company'),
  ]);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href="/internal/crm" className="crm-btn">← Voltar pro CRM</Link>
      </div>

      <div className="crm-header">
        <div>
          <h1 className="crm-title">Configurar Status</h1>
          <p className="crm-subtitle">
            Cria, renomeia, reordena e deleta as colunas dos kanbans · arrasta pra reordenar
          </p>
        </div>
      </div>

      <StatusManager kind="person" statuses={personStatuses} />
      <StatusManager kind="company" statuses={companyStatuses} />
    </div>
  );
}
