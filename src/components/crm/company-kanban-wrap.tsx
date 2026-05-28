/**
 * CompanyKanbanWrap — wrapper client que adiciona seleção múltipla
 * + merge + delete no kanban de empresas.
 *
 * Espelha o PersonKanbanWrap (mesmo padrão de UX). Cada card ganha um
 * checkbox no canto que aparece no hover OU quando há outras empresas
 * já selecionadas.
 *
 * Toolbar flutuante no rodapé mostra ações em massa quando 1+ selecionada:
 *  - [Mesclar] (≥ 2 empresas): combina as selecionadas em 1
 *  - [Excluir] (1+ empresas): hard delete; bloqueia empresas com pessoas
 *    linkadas ativas (manda mensagem pra Clara fazer merge antes)
 *  - [Cancelar seleção]
 */

'use client';

import { useState, useTransition, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import type { CompaniesByStatus, CompanyWithDetails } from '@/lib/crm-queries';
import { CompanyKanban } from './company-kanban';
import { mergeCompanies, deleteCompanies } from '@/app/internal/crm/actions';

type SelectionContext = {
  selected: Set<string>;
  toggle: (id: string) => void;
  isSelected: (id: string) => boolean;
  anySelected: boolean;
};

const Ctx = createContext<SelectionContext | null>(null);

export function useCompanySelection(): SelectionContext {
  const c = useContext(Ctx);
  if (!c) throw new Error('useCompanySelection deve ser usado dentro de CompanyKanbanWrap');
  return c;
}

/**
 * Versão opcional do hook — retorna null se chamado fora do provider.
 * Permite CompanyKanban ser renderizado sem o wrapper (ex: drill-down de
 * uma única empresa) sem quebrar.
 */
export function useCompanySelectionOptional(): SelectionContext | null {
  return useContext(Ctx);
}

export function CompanyKanbanWrap({
  data,
  inactiveCompanies = [],
}: {
  data: CompaniesByStatus;
  inactiveCompanies?: CompanyWithDetails[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

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
    const keepId = ids[0];
    const mergeIds = ids.slice(1);
    const confirmation = confirm(
      `Mesclar ${ids.length} empresas em 1? As ${mergeIds.length} secundárias somem (hard delete). Pessoas, activities e o histórico das antigas ficam reparentados pra principal. Campos vazios da principal são preenchidos com dados das outras.`,
    );
    if (!confirmation) return;

    setBusy(true);
    startTransition(async () => {
      const res = await mergeCompanies(keepId, mergeIds);
      setBusy(false);
      if (!res.ok) {
        alert(`Erro: ${res.error}`);
        return;
      }
      clearSelection();
      router.push(`/internal/crm/companies/${keepId}`);
    });
  }

  function handleDelete() {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const confirmation = confirm(
      `Excluir ${ids.length} empresa${ids.length === 1 ? '' : 's'}? Empresas com pessoa linkada ativa serão BLOQUEADAS (precisa merge antes). Activities ligadas a essas empresas serão deletadas em cascata. Sem volta.`,
    );
    if (!confirmation) return;

    setBusy(true);
    startTransition(async () => {
      const res = await deleteCompanies(ids);
      setBusy(false);
      if (!res.ok) {
        alert(`Erro: ${res.error}`);
        return;
      }
      const blockedMsg = res.blocked && res.blocked.length > 0
        ? `\n⚠️ ${res.blocked.length} bloqueada${res.blocked.length === 1 ? '' : 's'} por pessoa linkada — faz merge antes.`
        : '';
      alert(`${res.deleted ?? 0} empresa${res.deleted === 1 ? '' : 's'} excluída${res.deleted === 1 ? '' : 's'}.${blockedMsg}`);
      clearSelection();
      router.refresh();
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
      <CompanyKanban data={data} inactiveCompanies={inactiveCompanies} />

      {selected.size > 0 ? (
        <div className="select-toolbar">
          <div className="select-count">
            <strong>{selected.size}</strong>{' '}
            {selected.size === 1 ? 'empresa selecionada' : 'empresas selecionadas'}
          </div>
          <div className="select-actions">
            {selected.size >= 2 ? (
              <button onClick={handleMerge} disabled={busy} className="crm-btn crm-btn-primary">
                {busy ? 'Processando…' : `🔀 Mesclar ${selected.size}`}
              </button>
            ) : null}
            <button onClick={handleDelete} disabled={busy} className="crm-btn crm-btn-danger">
              🗑 Excluir
            </button>
            <button onClick={clearSelection} disabled={busy} className="crm-btn">
              Cancelar
            </button>
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
          min-width: 420px;
        }
        .select-count { font-size: 13px; color: #45336B; }
        .select-count strong { color: #CD50F1; }
        .select-actions { display: flex; gap: 8px; align-items: center; }
        .crm-btn-danger {
          background: #FEE2E2;
          color: #DC2626;
          border-color: rgba(220, 38, 38, 0.3);
        }
        .crm-btn-danger:hover { background: #FECACA; }
        .crm-btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
    </Ctx.Provider>
  );
}
