/**
 * Toggle Kanban ↔ Tabela.
 *
 * Estado vai pra URL (?view=table|kanban) — preserva no refresh, share, back.
 * Default é 'kanban'.
 */

'use client';

import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';

export function ViewToggle() {
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get('view') === 'table' ? 'table' : 'kanban';

  // Constrói querystring preservando outros params
  function buildHref(view: 'kanban' | 'table') {
    const sp = new URLSearchParams(params.toString());
    if (view === 'kanban') sp.delete('view');
    else sp.set('view', 'table');
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  const baseStyle: React.CSSProperties = {
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 600,
    border: '1px solid #E4D8ED',
    color: '#5E2A67',
    background: '#FFFFFF',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    transition: 'background 120ms',
  };
  const activeStyle: React.CSSProperties = {
    ...baseStyle,
    background: '#CD50F1',
    color: '#FFFFFF',
    borderColor: '#CD50F1',
  };

  return (
    <div style={{ display: 'inline-flex', borderRadius: 8, overflow: 'hidden', border: '1px solid #E4D8ED' }}>
      <Link
        href={buildHref('kanban')}
        style={{ ...(current === 'kanban' ? activeStyle : baseStyle), border: 'none', borderRight: '1px solid #E4D8ED' }}
        scroll={false}
      >
        ⊟ Kanban
      </Link>
      <Link
        href={buildHref('table')}
        style={{ ...(current === 'table' ? activeStyle : baseStyle), border: 'none' }}
        scroll={false}
      >
        ☰ Tabela
      </Link>
    </div>
  );
}
