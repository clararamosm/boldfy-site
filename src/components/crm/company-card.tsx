/**
 * Company card — usado no kanban Empresas. Compact + drag-drop nativo.
 *
 * Suporta seleção múltipla pra merge (mesmo padrão do PersonCard).
 * Checkbox aparece no hover ou quando há outras selecionadas.
 */

'use client';

import Link from 'next/link';
import type { CompanyWithDetails } from '@/lib/crm-queries';
import { formatDateTime } from '@/lib/crm-format';

type Props = {
  company: CompanyWithDetails;
  selected?: boolean;
  anySelected?: boolean;
  onToggleSelect?: (id: string) => void;
};

function daysSinceUpdate(date: Date | string): number {
  const d = date instanceof Date ? date : new Date(date);
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export function CompanyCard({ company, selected, anySelected, onToggleSelect }: Props) {
  const stale = daysSinceUpdate(company.updatedAt) > 14 && !company.status?.isTerminal;
  const showCheckbox = onToggleSelect && (anySelected || selected);

  function handleDragStart(e: React.DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData('text/plain', JSON.stringify({ kind: 'company', id: company.id, statusId: company.statusId }));
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleCheckboxClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    onToggleSelect?.(company.id);
  }

  return (
    <div
      draggable={!anySelected}
      onDragStart={handleDragStart}
      className={`crm-company-card-wrap ${selected ? 'selected' : ''}`}
    >
      {onToggleSelect ? (
        <button
          type="button"
          onClick={handleCheckboxClick}
          className={`crm-card-checkbox ${selected ? 'checked' : ''} ${showCheckbox ? 'visible' : ''}`}
          aria-label={selected ? 'Desmarcar' : 'Selecionar pra mesclar'}
        >
          {selected ? '✓' : ''}
        </button>
      ) : null}

      <Link href={`/internal/crm/companies/${company.id}`} className="crm-company-card" draggable={false}>
        <div className="crm-company-name">{company.name}</div>
        <div className="crm-company-industry">
          {company.industry ?? '—'}
          {company.size ? ` · ${company.size}` : ''}
        </div>

        <div className="crm-company-stats">
          <span>👥 {company.peopleCount}</span>
          <span>⚡ {company.topScore}</span>
          {company.estimatedValue ? (
            <span>💰 R$ {Number(company.estimatedValue).toLocaleString('pt-BR')}</span>
          ) : null}
        </div>

        {company.nextAction ? (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #E4D8ED', fontSize: 10 }}>
            <div style={{ color: '#9D85B3', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Próximo
            </div>
            <div style={{ color: '#5E2A67', fontWeight: 600, marginTop: 2 }}>
              {company.nextAction}
              {company.nextActionAt ? ` · ${formatDateTime(company.nextActionAt)}` : ''}
            </div>
          </div>
        ) : null}

        {stale ? (
          <div style={{ marginTop: 8, padding: '3px 8px', background: 'rgba(245, 158, 11, 0.12)', color: '#92580E', borderRadius: 4, fontSize: 10, fontWeight: 700, display: 'inline-block' }}>
            ⏰ Parada há {daysSinceUpdate(company.updatedAt)}d
          </div>
        ) : null}
      </Link>
    </div>
  );
}
