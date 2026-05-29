/**
 * Página de pareamento da extensão Chrome.
 *
 * Fluxo:
 *   1. Clara abre essa URL (a partir do popup da extensão "Conectar Boldfy")
 *   2. Digita uma label (ex: "Macbook trabalho")
 *   3. Backend cria row em extension_tokens com bcrypt(token)
 *   4. Token cru aparece na tela UMA VEZ, com instrução pra copiar
 *   5. Clara cola no popup da extensão, fica armazenado em chrome.storage.local
 *
 * Spec: SPEC-extension-linkedin.md §4.2.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { PairForm } from './pair-form';

export const metadata: Metadata = {
  title: 'Parear extensão Chrome',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function ExtensionAuthPage() {
  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/internal/crm" className="crm-btn">← Voltar pro CRM</Link>
      </div>

      <h1 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 28, color: '#5E2A67', marginBottom: 8 }}>
        🔗 Parear extensão Chrome
      </h1>
      <p style={{ fontSize: 14, color: '#6B5B8A', marginBottom: 28, lineHeight: 1.5 }}>
        Gera um token único pro dispositivo onde a extensão está rodando. O
        token aparece na tela <strong>uma única vez</strong> — copia e cola no
        popup da extensão pra finalizar o pareamento.
      </p>

      <section style={{ padding: 20, background: '#FAF7FF', borderRadius: 14 }}>
        <PairForm />
      </section>

      <p style={{ marginTop: 20, fontSize: 12, color: '#9D85B3' }}>
        Pra revogar tokens existentes ou ver os ativos, vai em{' '}
        <Link href="/internal/crm/settings/extension-tokens" style={{ color: '#CD50F1' }}>
          /internal/crm/settings/extension-tokens
        </Link>
        .
      </p>
    </div>
  );
}
