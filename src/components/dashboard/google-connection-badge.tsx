/**
 * Badge de status da conexão Google (GA4 ou Search Console).
 *
 * Renderiza um indicador visual no header dos silos de Tráfego e SEO:
 *   - Conectado: pill verde discreto com link "Reconectar" sutil
 *   - Desconectado: banner amber proeminente com CTA pra reconectar
 *
 * Link de reconexão vai direto pra /api/auth/google/start (pula a tela
 * intermediária /connect-google — autoriza o consent do Google diretamente).
 *
 * Server component — checa auth no servidor a cada render. Sem revalidação,
 * pois força-dynamic já está nas pages que usam.
 */

import Link from 'next/link';
import { isGa4Authenticated } from '@/lib/ga4';
import { isSearchConsoleAuthenticated } from '@/lib/search-console';

type Kind = 'ga4' | 'search-console';

const KIND_LABELS: Record<Kind, { short: string; long: string }> = {
  'ga4': { short: 'GA4', long: 'Google Analytics' },
  'search-console': { short: 'Search Console', long: 'Search Console' },
};

export async function GoogleConnectionBadge({ kind }: { kind: Kind }) {
  const isAuthenticated =
    kind === 'ga4'
      ? await isGa4Authenticated().catch(() => false)
      : await isSearchConsoleAuthenticated().catch(() => false);

  const labels = KIND_LABELS[kind];

  if (isAuthenticated) {
    // Conectado: pill verde sutil alinhado à direita, sempre clicável pra
    // reconectar (caso a pessoa ache que algo tá estranho mesmo com status
    // verde). Block com flex justify-end pra ficar discreto mas visível.
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <a
          href="/api/auth/google/start"
          title={`Reconectar ${labels.long} se algo parecer errado`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            background: 'rgba(16, 185, 129, 0.10)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            color: '#066B4D',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} />
          {labels.short} conectado · Reconectar
        </a>
      </div>
    );
  }

  // Desconectado: banner amber proeminente, CTA pra reconectar
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 16px',
        background: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.30)',
        borderRadius: 10,
        marginBottom: 16,
      }}
    >
      <div style={{ fontSize: 13, color: '#7A4A06', lineHeight: 1.5 }}>
        <strong>⚠️ {labels.long} desconectado.</strong>{' '}
        Dashboard sem dados até reconectar. Pode ser token expirado ou revogado.
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <a
          href="/api/auth/google/start"
          className="crm-btn crm-btn-primary"
          style={{ fontSize: 12, padding: '6px 14px', whiteSpace: 'nowrap' }}
        >
          🔐 Reconectar agora
        </a>
        <Link
          href="/internal/dashboard/connect-google"
          className="crm-btn"
          style={{ fontSize: 12, padding: '6px 12px', whiteSpace: 'nowrap' }}
        >
          Ver detalhes
        </Link>
      </div>
    </div>
  );
}
