/**
 * Barra de filtros reutilizável pro CRM (Pessoas e Empresas).
 *
 * Atualiza URL searchParams quando user muda algum filtro. Server lê e
 * refiltra data antes de mandar pra kanban/table — mesmo filtro vale pras
 * 2 views.
 *
 * Filtros suportados:
 *   - Período (createdAt): 7d/30d/90d/all
 *   - Status (statusId)
 *   - Canal de origem (sourceChannel) — só Pessoas
 *   - Página de origem (sourcePage) — só Pessoas
 *
 * useSearchParams precisa de Suspense parent (regra RSC #3).
 */

'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useTransition } from 'react';

type Props = {
  kind: 'person' | 'company';
  statuses: Array<{ id: string; label: string; color: string | null }>;
  channels?: string[];
  pages?: string[];
};

const PERIODS = [
  { value: 'all', label: 'Todo período' },
  { value: '90d', label: 'Últimos 90d' },
  { value: '30d', label: 'Últimos 30d' },
  { value: '7d', label: 'Últimos 7d' },
] as const;

export function CrmFilters({ kind, statuses, channels = [], pages = [] }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const updateParam = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === '' || value === 'all') params.delete(key);
    else params.set(key, value);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }, [searchParams, pathname, router]);

  const clearAll = useCallback(() => {
    // Preserva ?view= (toggle kanban/table) mas limpa filtros
    const params = new URLSearchParams(searchParams.toString());
    const view = params.get('view');
    const newParams = new URLSearchParams();
    if (view) newParams.set('view', view);
    startTransition(() => router.push(`${pathname}?${newParams.toString()}`));
  }, [pathname, router, searchParams]);

  const currentPeriod = searchParams.get('period') ?? 'all';
  const currentStatusId = searchParams.get('statusId') ?? '';
  const currentCanal = searchParams.get('canal') ?? '';
  const currentPagina = searchParams.get('pagina') ?? '';

  const hasFilters = currentPeriod !== 'all' || currentStatusId !== '' || currentCanal !== '' || currentPagina !== '';

  const selectStyle: React.CSSProperties = {
    padding: '8px 10px',
    border: '1px solid #E4D8ED',
    borderRadius: 8,
    fontFamily: 'inherit',
    fontSize: 12,
    color: '#45336B',
    background: '#FFFFFF',
    cursor: pending ? 'progress' : 'pointer',
    minWidth: 130,
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    color: '#9D85B3',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 4,
    display: 'block',
  };

  return (
    <div style={{ marginBottom: 14, padding: 12, background: '#FFFFFF', border: '1px solid #E4D8ED', borderRadius: 12, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
      <div>
        <label style={labelStyle}>Período</label>
        <select value={currentPeriod} onChange={(e) => updateParam('period', e.target.value)} disabled={pending} style={selectStyle}>
          {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Status</label>
        <select value={currentStatusId} onChange={(e) => updateParam('statusId', e.target.value)} disabled={pending} style={selectStyle}>
          <option value="">Todos</option>
          {statuses.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      {kind === 'person' && channels.length > 0 ? (
        <div>
          <label style={labelStyle}>Canal</label>
          <select value={currentCanal} onChange={(e) => updateParam('canal', e.target.value)} disabled={pending} style={selectStyle}>
            <option value="">Todos</option>
            {channels.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      ) : null}

      {kind === 'person' && pages.length > 0 ? (
        <div>
          <label style={labelStyle}>Página origem</label>
          <select value={currentPagina} onChange={(e) => updateParam('pagina', e.target.value)} disabled={pending} style={{ ...selectStyle, maxWidth: 200 }}>
            <option value="">Todas</option>
            {pages.map((p) => <option key={p} value={p}>{p.length > 30 ? `…${p.slice(-30)}` : p}</option>)}
          </select>
        </div>
      ) : null}

      {hasFilters ? (
        <button type="button" onClick={clearAll} disabled={pending} className="crm-btn" style={{ alignSelf: 'flex-end', fontSize: 12 }}>
          ✕ Limpar
        </button>
      ) : null}
    </div>
  );
}
