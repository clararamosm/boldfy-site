/**
 * Person card — usado no kanban Pessoas.
 *
 * Design (validado, ver SPEC sec 9.1):
 *   [via X badge]
 *   [avatar] Nome              [score pill]
 *            Cargo · Empresa
 *   [icon] última ação · tempo
 *   [origem canal] [origem página]
 *
 * Sprint 3a: agora suporta drag-drop nativo HTML5 + status dinâmico vindo do
 * banco (cor + label).
 */

'use client';

import Link from 'next/link';
import type { PersonWithDetails } from '@/lib/crm-queries';
import { avatarHue, initials, timeAgo, methodVia, channelLabel } from '@/lib/crm-format';

type Props = {
  person: PersonWithDetails;
  lastActionText?: string;
};

export function PersonCard({ person, lastActionText }: Props) {
  const via = methodVia(person.sourceMethod);
  const hue = avatarHue(person.email);
  const channel = channelLabel(person.sourceChannel);

  // Score class baseada na ordem do status atual (cinza/azul/âmbar tendência)
  const statusColor = person.status?.color ?? 'neutral';
  const scoreClass = statusColor === 'amber' || statusColor === 'orange'
    ? 'quente'
    : statusColor === 'blue'
      ? 'lead'
      : '';

  function handleDragStart(e: React.DragEvent<HTMLDivElement>) {
    e.dataTransfer.setData('text/plain', JSON.stringify({ kind: 'person', id: person.id, statusId: person.statusId }));
    e.dataTransfer.effectAllowed = 'move';
    // Pequeno delay pra browser pegar o ghost antes do CSS aplicar
    setTimeout(() => {
      (e.target as HTMLElement).classList.add('crm-card-dragging');
    }, 0);
  }

  function handleDragEnd(e: React.DragEvent<HTMLDivElement>) {
    (e.target as HTMLElement).classList.remove('crm-card-dragging');
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="crm-person-card-wrap"
    >
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
          <span className="time">{timeAgo(person.lastTouchAt)}</span>
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
