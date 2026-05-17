/**
 * StatusChanger — pill clicável que abre dropdown pra mudar status.
 *
 * Reutilizável pra pessoa OU empresa (via prop `entity`). Chama
 * movePerson/moveCompany de actions.ts dentro de useTransition pra evitar
 * flicker e manter pending state.
 *
 * Uso típico no header da page detalhe:
 *   <StatusChanger
 *     entity="company"
 *     entityId={company.id}
 *     currentStatusId={company.statusId}
 *     currentLabel={company.status?.label}
 *     currentColor={company.status?.color}
 *     statuses={allCompanyStatuses}
 *   />
 *
 * O design imita o pill já usado no detail (cor pastel rosa) mas vira
 * interativo. Quando troca, faz revalidatePath do server e fecha o popover.
 */

'use client';

import { useTransition, useState, useRef, useEffect } from 'react';
import { movePerson, moveCompany } from '@/app/internal/crm/actions';

type StatusOption = {
  id: string;
  label: string;
  color: string | null;
};

type Props = {
  entity: 'person' | 'company';
  entityId: string;
  currentStatusId: string | null;
  currentLabel: string | null;
  statuses: StatusOption[];
};

// Map colors do schema pros tokens visuais.
// Cores do statuses.color: 'pink' | 'blue' | 'green' | 'amber' | 'orange' |
// 'gray' | 'neutral' | etc. Default rosa Boldfy.
function colorTokens(color: string | null | undefined): { bg: string; fg: string } {
  switch (color) {
    case 'blue': return { bg: 'rgba(59, 130, 246, 0.12)', fg: '#3B82F6' };
    case 'green': return { bg: 'rgba(16, 185, 129, 0.12)', fg: '#10B981' };
    case 'amber': return { bg: 'rgba(245, 158, 11, 0.12)', fg: '#92580E' };
    case 'orange': return { bg: 'rgba(249, 115, 22, 0.12)', fg: '#C2410C' };
    case 'gray':
    case 'neutral': return { bg: 'rgba(157, 133, 179, 0.12)', fg: '#6B5B8A' };
    default: return { bg: 'rgba(205, 80, 241, 0.1)', fg: '#CD50F1' };
  }
}

export function StatusChanger({ entity, entityId, currentStatusId, currentLabel, statuses }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Fecha popover ao clicar fora
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  function onPick(statusId: string) {
    if (statusId === currentStatusId) {
      setOpen(false);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = entity === 'person'
        ? await movePerson(entityId, statusId)
        : await moveCompany(entityId, statusId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  const current = colorTokens(statuses.find((s) => s.id === currentStatusId)?.color);
  const label = currentLabel ?? 'sem status';

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          background: current.bg,
          color: current.fg,
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
          border: 'none',
          cursor: pending ? 'progress' : 'pointer',
          fontFamily: 'inherit',
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {pending ? '…' : label}
        <span style={{ fontSize: 9, opacity: 0.7 }}>▾</span>
      </button>

      {open ? (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            minWidth: 200,
            background: '#FFFFFF',
            border: '1px solid #E4D8ED',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(94, 42, 103, 0.12)',
            zIndex: 50,
            padding: 6,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {statuses.map((s) => {
            const tokens = colorTokens(s.color);
            const isCurrent = s.id === currentStatusId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onPick(s.id)}
                disabled={pending}
                role="option"
                aria-selected={isCurrent}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  background: isCurrent ? '#FAF7FF' : 'transparent',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  color: '#45336B',
                  textAlign: 'left',
                  cursor: pending ? 'progress' : 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: isCurrent ? 700 : 500,
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: 999, background: tokens.fg, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{s.label}</span>
                {isCurrent ? <span style={{ fontSize: 11, color: '#9D85B3' }}>atual</span> : null}
              </button>
            );
          })}
          {error ? (
            <p role="alert" style={{ margin: '6px 8px 4px', fontSize: 11, color: '#C0392B' }}>
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
