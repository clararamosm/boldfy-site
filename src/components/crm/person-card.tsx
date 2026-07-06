/**
 * Person card — usado no kanban Pessoas.
 *
 * Suporta seleção múltipla via props opcionais (selected, onToggleSelect).
 * Quando anySelected=true, o checkbox aparece sempre. Quando false, só no hover.
 */

'use client';

import Link from 'next/link';
import type { PersonWithDetails } from '@/lib/crm-queries';
import { avatarHue, initials, timeAgo, formatDateTime, methodVia, channelLabel, isUsablePhoto, isLinkedinExtract } from '@/lib/crm-format';
import { OwnerBadge, type OwnerOption } from './owner-badge';

type Props = {
  person: PersonWithDetails;
  lastActionText?: string;
  selected?: boolean;
  anySelected?: boolean;
  onToggleSelect?: (id: string) => void;
  /** Membros do time pra trocar responsável no card. Omitido = badge estático. */
  users?: OwnerOption[];
};

export function PersonCard({ person, lastActionText, selected, anySelected, onToggleSelect, users }: Props) {
  const via = methodVia(person.sourceMethod);
  // Fallback determinístico pra LinkedIn Leads sem email (mai/2026).
  const hue = avatarHue(person.email ?? person.linkedinUrl ?? person.id);
  const channel = channelLabel(person.sourceChannel);
  const linkedinExtract = isLinkedinExtract(person);

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
            {isUsablePhoto(person.photoUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={person.photoUrl!} alt="" />
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
          {/* Origem "como o lead apareceu": LinkedIn extract quando veio/foi
              enriquecido pela extensão (não mostra a URL crua do perfil).
              Senão, a página/LP de origem. */}
          {linkedinExtract ? (
            <span className="crm-origin-tag linkedin-extract">LinkedIn extract</span>
          ) : person.sourcePage ? (
            <span className="crm-origin-tag page">{person.sourcePage}</span>
          ) : null}
        </div>
      </Link>

      {/* Responsável — fora do <Link> pra ser clicável sem navegar. */}
      {users && users.length > 0 ? (
        <div className="crm-card-owner">
          <OwnerBadge personId={person.id} currentOwnerId={person.ownerId} users={users} />
        </div>
      ) : person.owner ? (
        <div className="crm-card-owner">
          <span
            className="crm-owner-badge"
            title={`Responsável: ${person.owner.name}`}
            aria-label={`Responsável: ${person.owner.name}`}
          >
            {isUsablePhoto(person.owner.photoUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={person.owner.photoUrl!} alt="" />
            ) : (
              initials(person.owner.name)
            )}
          </span>
        </div>
      ) : null}
    </div>
  );
}
