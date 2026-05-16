/**
 * Kanban de Empresas — 6 colunas com horizontal scroll APENAS no kanban (não
 * na página inteira). Usa overflow-x:auto no wrapper.
 */

import type { CompaniesByStatus } from '@/lib/crm-queries';
import { CompanyCard } from './company-card';

type Props = { data: CompaniesByStatus };

const COLUMNS: Array<{
  key: keyof CompaniesByStatus;
  label: string;
  dot: 'gray' | 'blue' | 'purple' | 'amber' | 'green' | 'neutral';
}> = [
  { key: 'No status', label: 'No status', dot: 'gray' },
  { key: 'Quero prospectar', label: 'Quero prospectar', dot: 'blue' },
  { key: 'Reunião marcada', label: 'Reunião marcada', dot: 'purple' },
  { key: 'Em andamento', label: 'Em andamento', dot: 'amber' },
  { key: 'Fechado', label: 'Fechado', dot: 'green' },
  { key: 'Perdido', label: 'Perdido', dot: 'neutral' },
];

export function CompanyKanban({ data }: Props) {
  return (
    <div className="crm-kanban-wrap">
      <div className="crm-kanban crm-kanban-6">
        {COLUMNS.map((col) => {
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
                  <div className="crm-col-empty">vazio</div>
                ) : (
                  items.map((company) => (
                    <CompanyCard key={company.id} company={company} />
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
