/**
 * PersonKanbanWrap — wrapper client que adiciona seleção múltipla + merge.
 *
 * Cada card ganha um checkbox no canto que aparece no hover OU quando há
 * outros leads já selecionados.
 *
 * Toolbar flutuante no rodapé mostra ações em massa quando 1+ selecionado:
 *  - [Mesclar] (≥ 2 leads): combina os selecionados em 1
 *  - [Cancelar seleção]
 *
 * Estado de seleção fica no client (não persiste entre reloads).
 */

'use client';

import { useState, useTransition, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import type { PeopleByStatus } from '@/lib/crm-queries';
import { PersonKanban } from './person-kanban';
import { mergePeople } from '@/app/internal/crm/actions';

type SelectionContext = {
  selected: Set<string>;
  toggle: (id: string) => void;
  isSelected: (id: string) => boolean;
  anySelected: boolean;
};

const Ctx = createContext<SelectionContext | null>(null);

export function useSelection(): SelectionContext {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSelection deve ser usado dentro de PersonKanbanWrap');
  return c;
}

export function PersonKanbanWrap({ data }: { data: PeopleByStatus }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [merging, setMerging] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function isSelected(id: string) {
    return selected.has(id);
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function handleMerge() {
    if (selected.size < 2) return;
    const ids = Array.from(selected);
    // Mantém o primeiro (poderia ser refinado: deixar a Clara escolher qual fica)
    const keepId = ids[0];
    const mergeIds = ids.slice(1);
    const confirmation = confirm(
      `Mesclar ${ids.length} leads em 1? Os ${mergeIds.length} secundários ficam arquivados (recuperáveis). Activities, meetings e tags são todas transferidas pro principal. Lead score vira a soma.`,
    );
    if (!confirmation) return;

    setMerging(true);
    startTransition(async () => {
      const res = await mergePeople(keepId, mergeIds);
      setMerging(false);
      if (!res.ok) {
        alert(`Erro: ${res.error}`);
        return;
      }
      clearSelection();
      router.push(`/internal/crm/people/${keepId}`);
    });
  }

  const ctxValue: SelectionContext = {
    selected,
    toggle,
    isSelected,
    anySelected: selected.size > 0,
  };

  return (
    <Ctx.Provider value={ctxValue}>
      <PersonKanban data={data} />

      {selected.size > 0 ? (
        <div className="select-toolbar">
          <div className="select-count">
            <strong>{selected.size}</strong> {selected.size === 1 ? 'lead selecionado' : 'leads selecionados'}
          </div>
          <div className="select-actions">
            {selected.size >= 2 ? (
              <button onClick={handleMerge} disabled={merging} className="crm-btn crm-btn-primary">
                {merging ? 'Mesclando…' : `🔀 Mesclar ${selected.size} leads`}
              </button>
            ) : (
              <span style={{ fontSize: 11, color: '#9D85B3' }}>selecione mais 1 pra mesclar</span>
            )}
            <button onClick={clearSelection} className="crm-btn">Cancelar</button>
          </div>
        </div>
      ) : null}

      <style>{`
        .select-toolbar {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 60;
          background: #FFFFFF;
          border: 1px solid #E4D8ED;
          border-radius: 14px;
          padding: 12px 18px;
          box-shadow: 0 16px 48px rgba(15, 10, 24, 0.2);
          display: flex;
          align-items: center;
          gap: 18px;
          min-width: 380px;
        }
        .select-count { font-size: 13px; color: #45336B; }
        .select-count strong { color: #CD50F1; }
        .select-actions { display: flex; gap: 8px; align-items: center; }
      `}</style>
    </Ctx.Provider>
  );
}
