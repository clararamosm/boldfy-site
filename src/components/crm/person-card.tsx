/**
 * Person card — usado no kanban Pessoas.
 *
 * Design (validado com Clara, ver SPEC sec 9.1):
 *   [via X badge]
 *   [avatar] Nome              [score pill]
 *            Cargo · Empresa
 *   [icon] última ação · tempo
 *   [origem canal] [origem página]
 *
 * Score pill top-right com cor por tier (cinza/azul/âmbar gradient).
 * Avatar: foto LinkedIn quando temos; senão iniciais + gradient determinístico.
 */

import Link from 'next/link';
import type { PersonWithCompany } from '@/lib/crm-queries';
import { avatarHue, initials, timeAgo, methodVia, channelLabel } from '@/lib/crm-format';
import { statusForScore } from '@/lib/crm';

type Props = {
  person: PersonWithCompany;
  /** Override texto da última ação (default: pega de lastTouchAt) */
  lastActionText?: string;
};

export function PersonCard({ person, lastActionText }: Props) {
  const via = methodVia(person.sourceMethod);
  const scoreTier = statusForScore(person.leadScore);
  const scoreClass = scoreTier === 'Quente' ? 'quente' : scoreTier === 'Lead' ? 'lead' : '';
  const hue = avatarHue(person.email);
  const channel = channelLabel(person.sourceChannel);

  return (
    <Link href={`/internal/crm/people/${person.id}`} className="crm-person-card">
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
  );
}
