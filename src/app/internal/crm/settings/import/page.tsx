/**
 * Settings · Import do ActiveCampaign.
 *
 * Botão único que dispara a importação de TODOS os contatos do AC pro nosso
 * CRM. Idempotent.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { ImportButton } from './import-button';

export const metadata: Metadata = {
  title: 'CRM · Importar do AC',
  robots: { index: false, follow: false },
};

export default function ImportPage() {
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href="/internal/crm" className="crm-btn">← Voltar pro CRM</Link>
      </div>

      <div className="crm-header">
        <div>
          <h1 className="crm-title">Importar do ActiveCampaign</h1>
          <p className="crm-subtitle">
            Traz todos os contatos que você já tem no AC (com tags, UTMs, empresa, cargo)
          </p>
        </div>
      </div>

      <div className="crm-detail-card">
        <h2 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 16, color: '#5E2A67', marginBottom: 12 }}>
          O que vai acontecer
        </h2>
        <div style={{ padding: 12, background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 10, fontSize: 12, color: '#1E40AF', marginBottom: 16 }}>
          🎯 <strong>Gate B2B:</strong> só importa contatos com a tag <code style={{ background: 'rgba(59, 130, 246, 0.12)', padding: '1px 6px', borderRadius: 4 }}>Segmento: Líderes B2B</code>. Profissionais individuais e parceiros/agências ficam só no AC pra cadência editorial.
        </div>
        <ul style={{ fontSize: 13, color: '#45336B', lineHeight: 1.7, paddingLeft: 20, marginBottom: 18 }}>
          <li>Lê <strong>todos os contatos</strong> do AC (paginado, ~100 por vez)</li>
          <li>Verifica tags: <strong>pula quem não tem &ldquo;Segmento: Líderes B2B&rdquo;</strong></li>
          <li>Pros que passam: <strong>cria Person</strong> no nosso CRM se ainda não existe (match por email)</li>
          <li>Preenche <strong>cargo, empresa, telefone</strong> dos custom fields do AC</li>
          <li>Cria <strong>Company</strong> se o contato tem campo &ldquo;empresa&rdquo;</li>
          <li>Resolve <strong>UTMs first-touch</strong> (utm_source_first, utm_campaign_first)</li>
          <li>Determina <strong>source method</strong> pelas tags (Form: Demo → form_demo, etc)</li>
          <li>Sincroniza <strong>todas as tags do AC</strong> (denormalizadas pra busca rápida)</li>
          <li>Cria activity <code>imported_from_ac</code> pra auditoria</li>
        </ul>

        <div style={{ padding: 12, background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 10, fontSize: 12, color: '#92580E', marginBottom: 18 }}>
          ⏱ <strong>Demora:</strong> ~30s por 100 contatos (rate-limit do AC). Base grande pode levar minutos. Pode rodar mais de uma vez — não duplica.
        </div>

        <ImportButton />
      </div>
    </div>
  );
}
