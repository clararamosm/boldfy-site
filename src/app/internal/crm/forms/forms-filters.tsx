/**
 * Barra de filtros da aba Formulários — atualiza URL searchParams.
 *
 * Mai/2026 ciclo 3.1: adicionado chips de form (Todos/Demo/Beta/Report/Proposta)
 * acima dos selects. Chips contam quantas PESSOAS preencheram cada form (não
 * total de submissões).
 *
 * useSearchParams precisa de Suspense parent (regra RSC #3).
 */

'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import type { FormType } from './shared';

type Props = {
  statuses: Array<{ id: string; label: string; color: string | null }>;
  channels: string[];
  pages: string[];
  countsByForm: Record<FormType, number>;
};

const PERIODS = [
  { value: 'all', label: 'Todo período' },
  { value: '90d', label: 'Últimos 90d' },
  { value: '30d', label: 'Últimos 30d' },
  { value: '7d', label: 'Últimos 7d' },
] as const;

const SEGMENTS = [
  { value: 'all', label: 'Todos os segmentos' },
  { value: 'lider_b2b', label: 'Líder B2B' },
  { value: 'parceiro', label: 'Parceiro' },
  { value: 'profissional_individual', label: 'Profissional Individual' },
  { value: 'newsletter', label: 'Newsletter' },
] as const;

const PAGE_SIZES = [20, 50, 100] as const;

const FORM_CHIPS: Array<{ value: 'all' | FormType; emoji: string; label: string }> = [
  { value: 'all', emoji: '👥', label: 'Todos' },
  { value: 'form_submit_demo', emoji: '🎯', label: 'Demo' },
  { value: 'form_submit_beta', emoji: '🧪', label: 'Beta' },
  { value: 'form_submit_report', emoji: '📥', label: 'Report' },
  { value: 'form_submit_proposta', emoji: '💼', label: 'Proposta' },
];

export function FormsFilters({ statuses, channels, pages, countsByForm }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const updateParam = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === '' || value === 'all') params.delete(key);
    else params.set(key, value);
    if (key !== 'page' && key !== 'pageSize') params.delete('page');
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }, [searchParams, pathname, router]);

  const clearAll = useCallback(() => {
    startTransition(() => router.push(pathname));
  }, [pathname, router]);

  const currentPeriod = searchParams.get('period') ?? 'all';
  const currentSegmento = searchParams.get('segmento') ?? 'all';
  const currentFormType = searchParams.get('formType') ?? 'all';
  const currentStatusId = searchParams.get('statusId') ?? '';
  const currentCanal = searchParams.get('canal') ?? '';
  const currentPagina = searchParams.get('pagina') ?? '';
  const currentPageSize = searchParams.get('pageSize') ?? '20';

  const hasFilters = currentPeriod !== 'all' || currentSegmento !== 'all' || currentFormType !== 'all' || currentStatusId !== '' || currentCanal !== '' || currentPagina !== '';

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
    <div style={{ marginBottom: 16, padding: 14, background: '#FFFFFF', border: '1px solid #E4D8ED', borderRadius: 12 }}>
      {/* Chips de form acima */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #F0E5F8' }}>
        {FORM_CHIPS.map((chip) => {
          const isActive = currentFormType === chip.value;
          const count = chip.value === 'all'
            ? Object.values(countsByForm).reduce((s, n) => s + n, 0) // não bate exato com totalPeople (pessoa em N forms conta N), só pra dar ordem de grandeza
            : countsByForm[chip.value as FormType];
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => updateParam('formType', chip.value)}
              disabled={pending}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 999,
                border: isActive ? '1px solid #CD50F1' : '1px solid #E4D8ED',
                background: isActive ? 'rgba(205, 80, 241, 0.12)' : '#FFFFFF',
                color: isActive ? '#CD50F1' : '#45336B',
                fontSize: 12,
                fontWeight: 700,
                cursor: pending ? 'progress' : 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s ease',
              }}
            >
              <span>{chip.emoji}</span>
              <span>{chip.label}</span>
              {chip.value !== 'all' ? (
                <span style={{ padding: '1px 6px', background: isActive ? '#CD50F1' : '#FAF7FF', color: isActive ? '#FFFFFF' : '#9D85B3', borderRadius: 999, fontSize: 10, fontWeight: 700 }}>
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Filtros (selects) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
        <div>
          <label style={labelStyle}>Período</label>
          <select value={currentPeriod} onChange={(e) => updateParam('period', e.target.value)} disabled={pending} style={selectStyle}>
            {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Segmento</label>
          <select value={currentSegmento} onChange={(e) => updateParam('segmento', e.target.value)} disabled={pending} style={selectStyle}>
            {SEGMENTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Status</label>
          <select value={currentStatusId} onChange={(e) => updateParam('statusId', e.target.value)} disabled={pending} style={selectStyle}>
            <option value="">Todos</option>
            {statuses.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Canal</label>
          <select value={currentCanal} onChange={(e) => updateParam('canal', e.target.value)} disabled={pending} style={selectStyle}>
            <option value="">Todos</option>
            {channels.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Página origem</label>
          <select value={currentPagina} onChange={(e) => updateParam('pagina', e.target.value)} disabled={pending} style={{ ...selectStyle, maxWidth: 200 }}>
            <option value="">Todas</option>
            {pages.map((p) => <option key={p} value={p}>{p.length > 30 ? `…${p.slice(-30)}` : p}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Por página</label>
          <select value={currentPageSize} onChange={(e) => updateParam('pageSize', e.target.value)} disabled={pending} style={selectStyle}>
            {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {hasFilters ? (
          <button type="button" onClick={clearAll} disabled={pending} className="crm-btn" style={{ alignSelf: 'flex-end', fontSize: 12 }}>
            ✕ Limpar filtros
          </button>
        ) : null}
      </div>
    </div>
  );
}
