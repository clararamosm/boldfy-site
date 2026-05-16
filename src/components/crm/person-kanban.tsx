/**
 * Kanban de Pessoas — client component com drag-drop HTML5 nativo.
 *
 * Comportamento:
 *  - Card arrastável (draggable={true})
 *  - Coluna como dropzone: onDragOver previne default, onDrop chama movePerson
 *  - Confirmação se status destino tem is_terminal=true
 *  - Optimistic UI: card "desaparece" da coluna origem assim que solta (usa
 *    useTransition pra reverter se falhar)
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { PeopleByStatus } from '@/lib/crm-queries';
import { PersonCard } from './person-card';
import { movePerson } from '@/app/internal/crm/actions';

type Props = { data: PeopleByStatus };

export function PersonKanban({ data }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  function handleDragOver(e: React.DragEvent<HTMLDivElement>, colId: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColId !== colId) setDragOverColId(colId);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    // Só limpa se saiu da coluna inteira (não se entrou em filho)
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
    try {
      payload = JSON.parse(raw);
    } catch {
      return;
    }

    if (payload.kind !== 'person') return;
    if (payload.statusId === colId) return; // mesma coluna

    if (isTerminal) {
      const ok = confirm(`Mover esse lead pra "${colLabel}"? Status terminais não auto-promovem mais por score.`);
      if (!ok) return;
    }

    setMovingId(payload.id);
    startTransition(async () => {
      const res = await movePerson(payload.id, colId);
      if (!res.ok) {
        alert(`Erro ao mover: ${res.error}`);
      }
      setMovingId(null);
      router.refresh();
    });
  }

  return (
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
                  <div className="crm-col-empty">
                    {isDragOver ? '↓ Solta aqui' : 'vazio'}
                  </div>
                ) : (
                  people.map((person) => (
                    <div
                      key={person.id}
                      style={{ opacity: movingId === person.id ? 0.4 : 1, transition: 'opacity 0.2s' }}
                    >
                      <PersonCard person={person} />
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
