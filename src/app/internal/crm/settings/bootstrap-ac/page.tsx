/**
 * Settings · Bootstrap AC custom fields.
 *
 * Botão de uma vez só: cria os 4 custom fields novos no AC (Intenção, Newsletter
 * opt-in, Como conheceu, Observações). Idempotent.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { BootstrapACButton } from './bootstrap-button';

export const metadata: Metadata = {
  title: 'CRM · Bootstrap AC custom fields',
  robots: { index: false, follow: false },
};

export default function BootstrapACPage() {
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href="/internal/crm" className="crm-btn">← Voltar pro CRM</Link>
      </div>

      <div className="crm-header">
        <div>
          <h1 className="crm-title">Bootstrap dos custom fields no AC</h1>
          <p className="crm-subtitle">
            Cria de uma vez só os campos custom que os forms já capturam mas hoje só salvam em nota.
          </p>
        </div>
      </div>

      <div className="crm-detail-card">
        <h2 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 16, color: '#5E2A67', marginBottom: 12 }}>
          O que esse botão faz
        </h2>
        <p style={{ fontSize: 13, color: '#45336B', lineHeight: 1.6, marginBottom: 14 }}>
          Cria via API 4 custom fields no AC (idempotent — não duplica se já existir):
        </p>

        <ul style={{ fontSize: 13, color: '#45336B', lineHeight: 1.7, paddingLeft: 20, marginBottom: 18 }}>
          <li><code>%INTENCAO_USO%</code> — Intenção de uso (marca-empresa / desenvolver-pessoal)</li>
          <li><code>%NEWSLETTER_OPT_IN%</code> — Opt-in newsletter (SIM/NÃO)</li>
          <li><code>%COMO_CONHECEU%</code> — Como conheceu a Boldfy</li>
          <li><code>%OBSERVACOES%</code> — Observações livres</li>
        </ul>

        <div style={{ padding: 12, background: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 10, fontSize: 12, color: '#1E40AF', marginBottom: 18 }}>
          🎯 <strong>Por que precisa:</strong> os forms hoje guardam essas infos em NOTA do contato no AC, não em custom field. Por isso aparecem &ldquo;—&rdquo; na aba Formulários. Depois desse bootstrap, os próximos leads já vêm com tudo estruturado. Pros 29 leads antigos do Report, o import enriquecido extrai das notas.
        </div>

        <BootstrapACButton />
      </div>
    </div>
  );
}
