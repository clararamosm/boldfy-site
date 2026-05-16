/**
 * Kanban de Pessoas — client component com drag-drop nativo + seleção
 * múltipla pra merge.
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { PeopleByStatus } from '@/lib/crm-queries';
import { PersonCard } from './person-card';
import { movePerson, mergePeople } from '@/app/internal/crm/actions';

type Props = { data: PeopleByStatus };

export function PersonKanban({ data }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [merging, setMerging] = useState(false);

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

  const anySelected = selected.size > 0;

  return (
    <>
      <div className="crm-kanban-wrap">
        <div className="crm-kanban" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(280px, 1fr))` }}>
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
        </div>
      </div>

      {anySelected ? (
        <div className="crm-select-toolbar">
          <div className="crm-select-count">
            <strong>{selected.size}</strong> {selected.size === 1 ? 'lead selecionado' : 'leads selecionados'}
          </div>
          <div className="crm-select-actions">
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
    </>
  );
}
