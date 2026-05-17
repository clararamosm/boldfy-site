/**
 * Settings · Import do ActiveCampaign.
 *
 * Botão único que dispara a importação de TODOS os contatos do AC pro nosso
 * CRM. Idempotent.
 *
 * Mai/2026 ciclo 3: gate B2B removido. Importa todos os 160. Kanban filtra
 * visualmente, aba Forms mostra todos.
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
            Traz <strong>todos</strong> os contatos do AC (com tags, UTMs, empresa, cargo, custom fields, email events, page views)
          </p>
        </div>
      </div>

      <div className="crm-detail-card">
        <h2 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 16, color: '#5E2A67', marginBottom: 12 }}>
          O que vai acontecer
        </h2>

        <div style={{ padding: 12, background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 10, fontSize: 12, color: '#066B4D', marginBottom: 16 }}>
          ✅ <strong>Sem gate de segmento:</strong> importa Líderes B2B, Profissionais Individuais, Parceiros, Newsletter — todos os 160 contatos do AC entram no CRM. O kanban de Pessoas continua filtrando visualmente só os Líderes B2B; a aba Formulários mostra todos.
        </div>

        <ul style={{ fontSize: 13, color: '#45336B', lineHeight: 1.7, paddingLeft: 20, marginBottom: 18 }}>
          <li>Lê <strong>todos os contatos</strong> do AC (paginado, ~100 por vez)</li>
          <li>Cria <strong>Person</strong> no CRM se ainda não existe (match por email)</li>
          <li>Atualiza <strong>cargo, empresa, telefone</strong> dos custom fields do AC</li>
          <li>Cria <strong>Company</strong> se o contato tem campo &ldquo;empresa&rdquo; preenchido</li>
          <li>Resolve <strong>UTMs first-touch</strong> (utm_source_first, utm_campaign_first)</li>
          <li>Determina <strong>source method</strong> pelas tags (Form: Demo → form_demo, etc)</li>
          <li><strong>firstTouchAt = cdate</strong> do AC (data real da primeira interação, não data do import)</li>
          <li>Classifica coluna inicial por <strong>cadeia de promoção</strong>: Report → Ativo, Beta/Proposta → Quente, Extension/Imported → LinkedIn Lead (Demo é &ldquo;relevado&rdquo; — Cal webhook salta direto pra Reunião marcada)</li>
          <li>Sincroniza <strong>todas as tags do AC</strong> (denormalizadas em ac_tags pra busca rápida)</li>
          <li>Cria <strong>1 activity sintética por form preenchido</strong> (pessoa que preencheu Demo + Report gera 2 activities — aparece nas duas sublistas)</li>
          <li>Reconstitui <strong>email events</strong> (opens/clicks) com timestamp original</li>
          <li>Reconstitui <strong>page views</strong> via VGO (top 50 mais recentes)</li>
          <li>Cria activity <code>imported_from_ac</code> pra auditoria</li>
        </ul>

        <div style={{ padding: 12, background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 10, fontSize: 12, color: '#92580E', marginBottom: 18 }}>
          ⏱ <strong>Demora:</strong> ~10s por contato (rate-limit do AC). Pra ~160 contatos = ~25 min. <strong>Não feche a aba durante.</strong> Pode rodar mais de uma vez — não duplica pessoas/empresas (upsert por email/nome), mas atenção: activities sintéticas reaplicam (idempotência só de pessoa/empresa).
        </div>

        <ImportButton />
      </div>
    </div>
  );
}
