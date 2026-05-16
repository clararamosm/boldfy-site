/**
 * Kanban de Empresas — client component com drag-drop HTML5 + scroll lateral
 * só no kanban (overflow-x no wrapper).
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { CompaniesByStatus } from '@/lib/crm-queries';
import { CompanyCard } from './company-card';
import { moveCompany } from '@/app/internal/crm/actions';

type Props = { data: CompaniesByStatus };

export function CompanyKanban({ data }: Props) {
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

    if (payload.kind !== 'company') return;
    if (payload.statusId === colId) return;

    if (isTerminal) {
      const ok = confirm(`Mover essa empresa pra "${colLabel}"? Tem certeza?`);
      if (!ok) return;
    }

    setMovingId(payload.id);
    startTransition(async () => {
      const res = await moveCompany(payload.id, colId);
      if (!res.ok) {
        alert(`Erro ao mover: ${res.error}`);
      }
      setMovingId(null);
      router.refresh();
    });
  }

  return (
    <div className="crm-kanban-wrap">
      <div className="crm-kanban" style={{ gridTemplateColumns: `repeat(${data.length}, 240px)` }}>
        {data.map(({ status, companies }) => {
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
                  <span className={`crm-col-dot ${status.color ?? 'gray'}`} />
                  {status.label}
                </div>
                <span className="crm-col-count">{companies.length}</span>
              </div>
              <div className="crm-col-cards">
                {companies.length === 0 ? (
                  <div className="crm-col-empty">{isDragOver ? '↓ Solta aqui' : 'vazio'}</div>
                ) : (
                  companies.map((company) => (
                    <div
                      key={company.id}
                      style={{ opacity: movingId === company.id ? 0.4 : 1, transition: 'opacity 0.2s' }}
                    >
                      <CompanyCard company={company} />
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
