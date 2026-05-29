/**
 * Listagem e revogação de tokens da extensão Chrome.
 *
 * Spec: SPEC-extension-linkedin.md §4.3.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { listAllTokens } from '@/lib/extension-auth';
import { RevokeButton } from './revoke-button';

export const metadata: Metadata = {
  title: 'Tokens da extensão Chrome',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

function fmtDate(d: Date | null): string {
  if (!d) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export default async function ExtensionTokensPage() {
  const tokens = await listAllTokens();
  const active = tokens.filter((t) => !t.revokedAt);
  const revoked = tokens.filter((t) => t.revokedAt);

  return (
    <div style={{ maxWidth: 880 }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/internal/crm" className="crm-btn">← Voltar pro CRM</Link>
      </div>

      <h1 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 28, color: '#5E2A67', marginBottom: 8 }}>
        🔑 Tokens da extensão Chrome
      </h1>
      <p style={{ fontSize: 14, color: '#6B5B8A', marginBottom: 28, lineHeight: 1.5 }}>
        Cada token corresponde a um dispositivo onde a extensão está
        instalada. Revogar invalida o token na próxima request — a extensão
        cai pra estado "desconectado" e pede pareamento novo.
        Pra gerar um novo, vai em{' '}
        <Link href="/internal/crm/extension-auth" style={{ color: '#CD50F1' }}>
          /internal/crm/extension-auth
        </Link>
        .
      </p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 18, color: '#5E2A67', marginBottom: 12 }}>
          Ativos ({active.length})
        </h2>
        {active.length === 0 ? (
          <div style={{ padding: 20, background: '#FAF7FF', borderRadius: 10, fontSize: 13, color: '#9D85B3' }}>
            Nenhum token ativo. Gera um em /internal/crm/extension-auth.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {active.map((t) => (
              <div
                key={t.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: 14,
                  background: '#FAF7FF',
                  borderRadius: 10,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#5E2A67' }}>
                    {t.label ?? 'Sem label'}
                  </div>
                  <div style={{ fontSize: 11, color: '#9D85B3', marginTop: 2 }}>
                    Criado: {fmtDate(t.createdAt)} · Último uso: {fmtDate(t.lastUsedAt)}
                  </div>
                </div>
                <RevokeButton tokenId={t.id} label={t.label ?? 'sem label'} />
              </div>
            ))}
          </div>
        )}
      </section>

      {revoked.length > 0 ? (
        <section>
          <h2 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 16, color: '#9D85B3', marginBottom: 12 }}>
            Revogados ({revoked.length})
          </h2>
          <div style={{ display: 'grid', gap: 6 }}>
            {revoked.map((t) => (
              <div
                key={t.id}
                style={{
                  padding: 10,
                  background: 'rgba(157, 133, 179, 0.08)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#9D85B3',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>{t.label ?? 'Sem label'}</span>
                <span>Revogado em {fmtDate(t.revokedAt)}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
