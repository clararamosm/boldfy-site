/**
 * Kanban de Pessoas — server component que renderiza 3 colunas (Ativo, Lead,
 * Quente) com cards.
 *
 * Drag-drop visual entre colunas fica pra Sprint 3 (necessita Client Component
 * + drag library). Por hora, ações de mover acontecem dentro do Lead Detail.
 */

import type { PeopleByStatus } from '@/lib/crm-queries';
import { PersonCard } from './person-card';

type Props = { data: PeopleByStatus };

export function PersonKanban({ data }: Props) {
  const columns: Array<{
    key: 'Ativo' | 'Lead' | 'Quente';
    label: string;
    dot: 'neutral' | 'blue' | 'amber';
  }> = [
    { key: 'Ativo', label: 'Ativo', dot: 'neutral' },
    { key: 'Lead', label: 'Lead', dot: 'blue' },
    { key: 'Quente', label: 'Quente', dot: 'amber' },
  ];

  return (
    <div className="crm-kanban-wrap">
      <div className="crm-kanban crm-kanban-3">
        {columns.map((col) => {
          const items = data[col.key];
          return (
            <div key={col.key} className="crm-col">
              <div className="crm-col-header">
                <div className="crm-col-title">
                  <span className={`crm-col-dot ${col.dot}`} />
                  {col.label}
                </div>
                <span className="crm-col-count">{items.length}</span>
              </div>
              <div className="crm-col-cards">
                {items.length === 0 ? (
                  <div className="crm-col-empty">
                    {col.key === 'Ativo'
                      ? 'Sem leads ainda.'
                      : col.key === 'Lead'
                        ? 'Sem leads qualificados.'
                        : 'Sem leads quentes.'}
                  </div>
                ) : (
                  items.map((person) => (
                    <PersonCard key={person.id} person={person} />
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
