/**
 * Kanban de Empresas — client component com drag-drop HTML5 + scroll lateral
 * só no kanban (overflow-x no wrapper).
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { CompaniesByStatus, CompanyWithDetails } from '@/lib/crm-queries';
import { CompanyCard } from './company-card';
import { moveCompany } from '@/app/internal/crm/actions';
import { useCompanySelectionOptional } from './company-kanban-wrap';

type Props = {
  data: CompaniesByStatus;
  inactiveCompanies?: CompanyWithDetails[];
};

export function CompanyKanban({ data, inactiveCompanies = [] }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [inactiveExpanded, setInactiveExpanded] = useState(false);

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
      <div
        className="crm-kanban"
        style={{
          // Coluna extra "Inativos" — fina (44px) quando colapsada, 240px expandida.
          // Spec §8: empresa inativa = peopleCount > 0 AND todas linkadas unsub.
          gridTemplateColumns: `repeat(${data.length}, 240px)${
            inactiveCompanies.length > 0
              ? inactiveExpanded
                ? ' 240px'
                : ' 44px'
              : ''
          }`,
        }}
      >
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
                      <CompanyCardWithSelection company={company} />
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}

        {/* COLUNA INATIVAS — empresa cujos linkados estão TODOS unsub.
            Colapsada por default; click pra expandir/colapsar. */}
        {inactiveCompanies.length > 0 ? (
          inactiveExpanded ? (
            <div className="crm-col" style={{ background: 'rgba(157, 133, 179, 0.04)', borderColor: 'rgba(157, 133, 179, 0.2)' }}>
              <div className="crm-col-header" style={{ cursor: 'pointer' }} onClick={() => setInactiveExpanded(false)} title="Colapsar">
                <div className="crm-col-title">
                  <span className="crm-col-dot" style={{ background: '#9D85B3' }} />
                  Inativas
                  <span style={{ fontSize: 9, color: '#9D85B3', fontWeight: 600 }}>(todos linkados unsub)</span>
                </div>
                <span className="crm-col-count" style={{ background: 'rgba(157, 133, 179, 0.18)', color: '#6B5B8A' }}>
                  {inactiveCompanies.length} ›
                </span>
              </div>
              <div className="crm-col-cards">
                {inactiveCompanies.map((company) => (
                  <div key={company.id} style={{ opacity: 0.6 }}>
                    <CompanyCard company={company} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setInactiveExpanded(true)}
              title={`Mostrar ${inactiveCompanies.length} empresa${inactiveCompanies.length === 1 ? '' : 's'} inativa${inactiveCompanies.length === 1 ? '' : 's'} (todos linkados unsubscribed)`}
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
                Inativas · {inactiveCompanies.length}
              </span>
            </button>
          )
        ) : null}
      </div>
    </div>
  );
}

/**
 * Wrapper interno que conecta o CompanyCard ao contexto de seleção, se
 * existir. Se não existir (drill-down sem wrap), renderiza card normal
 * sem checkbox.
 */
function CompanyCardWithSelection({ company }: { company: CompanyWithDetails }) {
  const sel = useCompanySelectionOptional();
  if (!sel) return <CompanyCard company={company} />;
  return (
    <CompanyCard
      company={company}
      selected={sel.isSelected(company.id)}
      anySelected={sel.anySelected}
      onToggleSelect={sel.toggle}
    />
  );
}
