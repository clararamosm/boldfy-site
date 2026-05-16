/**
 * Settings · Import do Folk (via upload CSV).
 *
 * Upload de 2 arquivos: people.csv + companies.csv (export do Folk).
 * Atualiza leads existentes com status, jobTitle, descrição, deal value, etc.
 * Não toca em quem está só no AC.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { ImportFolkCSVForm } from './import-folk-csv-form';

export const metadata: Metadata = {
  title: 'CRM · Importar do Folk',
  robots: { index: false, follow: false },
};

export default function ImportFolkPage() {
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href="/internal/crm" className="crm-btn">← Voltar pro CRM</Link>
      </div>

      <div className="crm-header">
        <div>
          <h1 className="crm-title">Importar do Folk</h1>
          <p className="crm-subtitle">
            Upload dos CSVs exportados do Folk · atualiza leads existentes com status + dados ricos
          </p>
        </div>
      </div>

      <div className="crm-detail-card">
        <h2 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 16, color: '#5E2A67', marginBottom: 12 }}>
          Como exportar do Folk
        </h2>
        <ol style={{ fontSize: 13, color: '#45336B', lineHeight: 1.7, paddingLeft: 20, marginBottom: 18 }}>
          <li>Folk → grupo <strong>Leads</strong> → botão de exportar → escolhe CSV → salva <code>people.csv</code></li>
          <li>Folk → grupo <strong>Prospects</strong> → exportar CSV → salva <code>companies.csv</code></li>
          <li>Faz upload abaixo</li>
        </ol>

        <div style={{ padding: 12, background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 10, fontSize: 12, color: '#1E40AF', marginBottom: 18 }}>
          🎯 <strong>O que faz:</strong> match por email (Persons) e nome (Companies). Folk vence em status. Outros campos só preenche se vazios. <strong>Leads que estão só no AC (não no Folk) ficam intocados.</strong>
        </div>

        <ImportFolkCSVForm />
      </div>
    </div>
  );
}
