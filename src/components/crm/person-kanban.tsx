/**
 * Kanban de Pessoas — client component com drag-drop nativo + seleção
 * múltipla pra merge.
 *
 * Task 2 (mai/2026 — spec crm-source-of-truth §8): coluna "Inativos" como
 * ÚLTIMA etapa, COLAPSADA por default. Click no header expande. Não ocupa
 * espaço quando colapsada. Não conta no badge total da sub-nav (mantido
 * fora de getCrmCounts.totalPeople).
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { PeopleByStatus, PersonWithDetails } from '@/lib/crm-queries';
import { PersonCard } from './person-card';
import { movePerson, mergePeople, deletePeople } from '@/app/internal/crm/actions';

type Props = {
  data: PeopleByStatus;
  inactivePeople?: PersonWithDetails[];
};

export function PersonKanban({ data, inactivePeople = [] }: Props) {
  const [inactiveExpanded, setInactiveExpanded] = useState(false);
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [merging, setMerging] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>, colId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColId !== colId) setDragOverColId(colId);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setDragOverColId(null);
    }
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>, colId: string, isTerminal: boolean, colLabel: string) {
    e.preventDefault();
    setDragOverColId(null);
    const raw = e.dataTransfer.getData('text/plain');
    if (!raw) return;
    let payload: { kind: string; id: string; statusId: string | null };
    try { payload = JSON.parse(raw); } catch { return; }
    if (payload.kind !== 'person') return;
    if (payload.statusId === colId) return;

    if (isTerminal) {
      const ok = confirm(`Mover esse lead pra "${colLabel}"? Status terminais não auto-promovem mais por score.`);
      if (!ok) return;
    }

    setMovingId(payload.id);
    startTransition(async () => {
      const res = await movePerson(payload.id, colId);
      if (!res.ok) alert(`Erro ao mover: ${res.error}`);
      setMovingId(null);
      router.refresh();
    });
  }

  function handleMerge() {
    if (selected.size < 2) return;
    const ids = Array.from(selected);
    const keepId = ids[0];
    const mergeIds = ids.slice(1);
    const ok = confirm(
      `Mesclar ${ids.length} leads em 1? Os ${mergeIds.length} secundários ficam arquivados (recuperáveis). Activities, meetings e tags todas viram do principal. Lead score = soma de todos.`,
    );
    if (!ok) return;

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

  function handleDelete() {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    const ok = confirm(
      `Excluir ${ids.length} lead${ids.length === 1 ? '' : 's'}? Activities e meetings linkados cascateiam. Empresas ficam intactas. Sem volta.`,
    );
    if (!ok) return;

    setDeleting(true);
    startTransition(async () => {
      const res = await deletePeople(ids);
      setDeleting(false);
      if (!res.ok) {
        alert(`Erro: ${res.error}`);
        return;
      }
      alert(`${res.deleted ?? 0} lead${res.deleted === 1 ? '' : 's'} excluído${res.deleted === 1 ? '' : 's'}.`);
      clearSelection();
      router.refresh();
    });
  }

  const anySelected = selected.size > 0;

  return (
    <>
      <div className="crm-kanban-wrap">
        <div
          className="crm-kanban"
          style={{
            // Coluna extra pros Inativos: largura fixa pequena quando colapsada,
            // largura normal quando expandida. Só renderiza se houver inativos.
            gridTemplateColumns: `repeat(${data.length}, minmax(280px, 1fr))${
              inactivePeople.length > 0
                ? inactiveExpanded
                  ? ' minmax(280px, 1fr)'
                  : ' 44px'
                : ''
            }`,
          }}
        >
          {data.map(({ status, people }) => {
            const isDragOver = dragOverColId === status.id;
            return (
              <div
                key={status.id}
                className={`crm-col ${isDragOver ? 'crm-col-dragover' : ''}`}
                onDragOver={(e) => handleDragOver(e, status.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, status.id, status.isTerminal, status.label)}
              >
                <div className="crm-col-header">
                  <div className="crm-col-title">
                    <span className={`crm-col-dot ${status.color ?? 'neutral'}`} />
                    {status.label}
                    {status.isTerminal ? <span style={{ fontSize: 9, color: '#9D85B3', fontWeight: 600 }}>(terminal)</span> : null}
                  </div>
                  <span className="crm-col-count">{people.length}</span>
                </div>
                <div className="crm-col-cards">
                  {people.length === 0 ? (
                    <div className="crm-col-empty">{isDragOver ? '↓ Solta aqui' : 'vazio'}</div>
                  ) : (
                    people.map((person) => (
                      <div key={person.id} style={{ opacity: movingId === person.id ? 0.4 : 1, transition: 'opacity 0.2s' }}>
                        <PersonCard
                          person={person}
                          selected={selected.has(person.id)}
                          anySelected={anySelected}
                          onToggleSelect={toggleSelect}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}

          {/* COLUNA INATIVOS — colapsada por default. Sempre depois de todos os
              statuses (incluindo terminais como Perdido/Fechado). */}
          {inactivePeople.length > 0 ? (
            inactiveExpanded ? (
              <div className="crm-col" style={{ background: 'rgba(157, 133, 179, 0.04)', borderColor: 'rgba(157, 133, 179, 0.2)' }}>
                <div className="crm-col-header" style={{ cursor: 'pointer' }} onClick={() => setInactiveExpanded(false)} title="Colapsar">
                  <div className="crm-col-title">
                    <span className="crm-col-dot" style={{ background: '#9D85B3' }} />
                    Inativos
                    <span style={{ fontSize: 9, color: '#9D85B3', fontWeight: 600 }}>(unsubscribed)</span>
                  </div>
                  <span className="crm-col-count" style={{ background: 'rgba(157, 133, 179, 0.18)', color: '#6B5B8A' }}>
                    {inactivePeople.length} ›
                  </span>
                </div>
                <div className="crm-col-cards">
                  {inactivePeople.map((person) => (
                    <div key={person.id} style={{ opacity: 0.6 }}>
                      <PersonCard
                        person={person}
                        selected={selected.has(person.id)}
                        anySelected={anySelected}
                        onToggleSelect={toggleSelect}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setInactiveExpanded(true)}
                title={`Mostrar ${inactivePeople.length} lead${inactivePeople.length === 1 ? '' : 's'} inativo${inactivePeople.length === 1 ? '' : 's'} (unsubscribed)`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: 8,
                  padding: '14px 0',
                  background: 'rgba(157, 133, 179, 0.06)',
                  border: '1px dashed rgba(157, 133, 179, 0.25)',
                  borderRadius: 10,
                  cursor: 'pointer',
                  color: '#6B5B8A',
                  fontFamily: 'inherit',
                  fontSize: 11,
                  fontWeight: 700,
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: 16 }}>‹</span>
                <span style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}>
                  Inativos · {inactivePeople.length}
                </span>
              </button>
            )
          ) : null}
        </div>
      </div>

      {anySelected ? (
        <div className="crm-select-toolbar">
          <div className="crm-select-count">
            <strong>{selected.size}</strong> {selected.size === 1 ? 'lead selecionado' : 'leads selecionados'}
          </div>
          <div className="crm-select-actions">
            {selected.size >= 2 ? (
              <button onClick={handleMerge} disabled={merging || deleting} className="crm-btn crm-btn-primary">
                {merging ? 'Mesclando…' : `🔀 Mesclar ${selected.size} leads`}
              </button>
            ) : null}
            <button
              onClick={handleDelete}
              disabled={merging || deleting}
              className="crm-btn"
              style={{ background: 'rgba(192, 57, 43, 0.1)', color: '#C0392B' }}
            >
              {deleting ? 'Excluindo…' : `🗑 Excluir ${selected.size}`}
            </button>
            <button onClick={clearSelection} className="crm-btn">Cancelar</button>
          </div>
        </div>
      ) : null}
    </>
  );
}
