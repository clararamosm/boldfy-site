/**
 * Person card — usado no kanban Pessoas.
 *
 * Suporta seleção múltipla via props opcionais (selected, onToggleSelect).
 * Quando anySelected=true, o checkbox aparece sempre. Quando false, só no hover.
 */

'use client';

import Link from 'next/link';
import type { PersonWithDetails } from '@/lib/crm-queries';
import { avatarHue, initials, timeAgo, formatDateTime, methodVia, channelLabel } from '@/lib/crm-format';

type Props = {
  person: PersonWithDetails;
  lastActionText?: string;
  selected?: boolean;
  anySelected?: boolean;
  onToggleSelect?: (id: string) => void;
};

export function PersonCard({ person, lastActionText, selected, anySelected, onToggleSelect }: Props) {
  const via = methodVia(person.sourceMethod);
  const hue = avatarHue(person.email);
  const channel = channelLabel(person.sourceChannel);

  const statusColor = person.status?.color ?? 'neutral';
  const scoreClass = statusColor === 'amber' || statusColor === 'orange'
    ? 'quente'
    : statusColor === 'blue'
      ? 'lead'
      : '';

  const showCheckbox = onToggleSelect && (anySelected || selected);

  function handleDragStart(e: React.DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData('text/plain', JSON.stringify({ kind: 'person', id: person.id, statusId: person.statusId }));
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleCheckboxClick(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    onToggleSelect?.(person.id);
  }

  return (
    <div
      draggable={!anySelected}
      onDragStart={handleDragStart}
      className={`crm-person-card-wrap ${selected ? 'selected' : ''}`}
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

      <Link href={`/internal/crm/people/${person.id}`} className="crm-person-card" draggable={false}>
        {via ? (
          <span className={`crm-via-badge ${via.classKey}`}>{via.label}</span>
        ) : null}

        <div className="crm-card-top">
          <div className={`crm-avatar hue-${hue}`}>
            {person.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={person.photoUrl} alt="" />
            ) : (
              initials(person.name)
            )}
          </div>

          <div className="crm-person-info">
            <div className="crm-person-name">{person.name}</div>
            {person.jobTitle ? (
              <div className="crm-person-job">
                {person.jobTitle}
                {person.company ? ` · ${person.company.name}` : ''}
              </div>
            ) : person.company ? (
              <div className="crm-person-job">{person.company.name}</div>
            ) : (
              <div className="crm-person-job-empty">cargo não informado</div>
            )}
          </div>

          <span className={`crm-score-pill ${scoreClass}`}>
            ⚡ {person.leadScore}
          </span>
        </div>

        <div className="crm-last-action">
          <span>{lastActionText ?? 'Última atividade'}</span>
          <span className="time" title={timeAgo(person.lastTouchAt)}>
            {person.lastTouchAt ? formatDateTime(person.lastTouchAt) : '—'}
          </span>
        </div>

        <div className="crm-origins">
          {person.sourceChannel && person.sourceChannel !== 'unknown' ? (
            <span className={`crm-origin-tag channel-${person.sourceChannel}`}>
              {channel}
            </span>
          ) : null}
          {person.sourcePage ? (
            <span className="crm-origin-tag page">{person.sourcePage}</span>
          ) : null}
        </div>
      </Link>
    </div>
  );
}
