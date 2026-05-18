/**
 * Column picker reutilizável pras table views do CRM.
 *
 * Persiste seleção em localStorage por storageKey. Default = todas visíveis.
 * Dropdown com checkboxes; click fora fecha.
 *
 * Uso:
 *   const ALL_COLUMNS = [{ key: 'name', label: 'Nome' }, ...] as const;
 *   const [visible, ColumnPickerUI] = useColumnPicker('crm-cols-people', ALL_COLUMNS);
 *   {ColumnPickerUI}
 *   {visible.has('name') ? <th>Nome</th> : null}
 *
 * Hidratação: SSR retorna "todas visíveis" pra não dar mismatch; useEffect
 * carrega do localStorage no client e re-renderiza. Caso de uso classico de
 * setState-in-effect — esse é OK porque é cache de UI, não dado de domínio.
 */

'use client';

import { useState, useEffect, useRef, type ReactNode } from 'react';

export type ColumnDef = { key: string; label: string };

export function useColumnPicker(
  storageKey: string,
  allColumns: readonly ColumnDef[],
  defaultVisibleKeys?: readonly string[],
): [Set<string>, ReactNode] {
  // Default: subset informado por defaultVisibleKeys OU todas visíveis (fallback).
  // SSR + primeira render no client usa esse default; useEffect abaixo carrega
  // preferência salva em localStorage (se existir) e re-renderiza.
  const allKeys = new Set(allColumns.map((c) => c.key));
  const initialVisible = defaultVisibleKeys
    ? new Set(defaultVisibleKeys.filter((k) => allKeys.has(k)))
    : allKeys;
  const [visible, setVisible] = useState<Set<string>>(initialVisible);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Carrega preferência do localStorage no client
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        const arr = JSON.parse(stored) as string[];
        // eslint-disable-next-line react-hooks/set-state-in-effect -- cache de UI
        setVisible(new Set(arr));
      }
    } catch {
      // localStorage indisponível ou JSON inválido — ignora, mantém default
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

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

  function toggle(key: string) {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      // Persistir
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
      } catch {
        // se localStorage não funciona, só mantém em memória
      }
      return next;
    });
  }

  function resetAll() {
    // "Reset" volta pro DEFAULT (subset configurado), não pra todas visíveis.
    // Pra mostrar todas, user clica em cada checkbox manualmente.
    setVisible(initialVisible);
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // ignored
    }
  }

  const ui = (
    <div ref={rootRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="crm-btn"
        style={{ fontSize: 12, padding: '8px 12px' }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        ⚙ Colunas
        <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.6 }}>
          {visible.size}/{allColumns.length}
        </span>
      </button>

      {open ? (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: 220,
            background: '#FFFFFF',
            border: '1px solid #E4D8ED',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(94, 42, 103, 0.12)',
            zIndex: 50,
            padding: 8,
            maxHeight: 360,
            overflowY: 'auto',
          }}
        >
          <div style={{ fontSize: 10, fontWeight: 700, color: '#9D85B3', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 8px 8px' }}>
            Colunas visíveis
          </div>
          {allColumns.map((col) => {
            const isVisible = visible.has(col.key);
            return (
              <label
                key={col.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 8px',
                  borderRadius: 6,
                  fontSize: 13,
                  color: '#45336B',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#FAF7FF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={() => toggle(col.key)}
                  style={{ cursor: 'pointer' }}
                />
                {col.label}
              </label>
            );
          })}
          <div style={{ borderTop: '1px solid #F0E5F8', marginTop: 6, paddingTop: 6 }}>
            <button
              type="button"
              onClick={resetAll}
              style={{
                width: '100%',
                padding: '6px 8px',
                background: 'transparent',
                border: 'none',
                fontSize: 12,
                color: '#9D85B3',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#FAF7FF'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              ↺ Resetar (voltar ao padrão)
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );

  return [visible, ui];
}
