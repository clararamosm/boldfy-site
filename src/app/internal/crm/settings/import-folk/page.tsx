/**
 * Settings · Import do Folk.
 *
 * Botão único pra trazer Persons (grupo Leads) e Companies (grupo Prospects)
 * do Folk pro nosso CRM. Idempotent + status do Folk vence em conflito.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { ImportFolkButton } from './import-folk-button';

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
            Traz Persons + Companies do Folk · status do Folk vence em conflito
          </p>
        </div>
      </div>

      <div className="crm-detail-card">
        <h2 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 16, color: '#5E2A67', marginBottom: 12 }}>
          O que vai acontecer
        </h2>
        <ul style={{ fontSize: 13, color: '#45336B', lineHeight: 1.7, paddingLeft: 20, marginBottom: 18 }}>
          <li>Lê <strong>todas as Companies do grupo Prospects</strong> do Folk</li>
          <li>Pra cada uma: cria Empresa no nosso CRM se nome ainda não existe; senão atualiza campos vazios</li>
          <li>Lê <strong>todas as Persons do grupo Leads</strong> do Folk</li>
          <li>Match por email — não duplica com import do AC nem com forms</li>
          <li><strong>Status do Folk sobrescreve</strong> o do nosso CRM (Clara confirmou que Folk tá mais atualizado)</li>
          <li>Vincula Person → Empresa usando a primeira company do Folk</li>
          <li>Cria activity <code>imported_from_folk</code> pra auditoria</li>
        </ul>

        <div style={{ padding: 12, background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 10, fontSize: 12, color: '#92580E', marginBottom: 18 }}>
          ⏱ <strong>Demora:</strong> ~30s por 100 contatos. Roda Companies primeiro, depois Persons. Idempotent — pode rodar de novo.
        </div>

        <ImportFolkButton />
      </div>
    </div>
  );
}
