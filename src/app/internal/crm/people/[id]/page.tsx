/**
 * Lead Detail page — perfil completo da Pessoa.
 *
 * Layout (validado com Clara, sec 9.4 da SPEC):
 *   Esquerda: header com foto + nome + cargo + ações + timeline cronológica
 *   Direita (sidebar): próximas reuniões, tags AC, empresa linkada
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getPersonById,
  getActivitiesForPerson,
  getUpcomingMeetingsForPerson,
} from '@/lib/crm-queries';
import {
  avatarHue,
  initials,
  timeAgo,
  formatScheduledAt,
  describeActivity,
  timelineDotClass,
  methodVia,
  channelLabel,
} from '@/lib/crm-format';
import { statusForScore } from '@/lib/crm';
import { LogInteractionForm } from '@/components/crm/log-interaction-form';

export const metadata: Metadata = {
  title: 'Lead',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params;

  const person = await getPersonById(id);
  if (!person) notFound();

  const [activitiesList, meetings] = await Promise.all([
    getActivitiesForPerson(id, 200),
    getUpcomingMeetingsForPerson(id),
  ]);

  const via = methodVia(person.sourceMethod);
  const scoreTier = statusForScore(person.leadScore);
  const scoreClass = scoreTier === 'Quente' ? 'quente' : scoreTier === 'Lead' ? 'lead' : '';
  const hue = avatarHue(person.email);

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href="/internal/crm" className="crm-btn">← Voltar pro kanban</Link>
      </div>

      <div className="crm-detail-layout">

        {/* === ESQUERDA === */}
        <div>
          <div className="crm-detail-card">
            <div className="crm-detail-header">
              <div className={`crm-detail-avatar hue-${hue}`}>
                {person.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={person.photoUrl} alt="" />
                ) : (
                  initials(person.name)
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                  <h1 className="crm-detail-name">{person.name}</h1>
                  <span className={`crm-score-pill ${scoreClass}`}>
                    ⚡ {scoreTier} · {person.leadScore} pts
                  </span>
                  {via ? (
                    <span className={`crm-via-badge ${via.classKey}`} style={{ margin: 0 }}>
                      {via.label}
                    </span>
                  ) : null}
                </div>

                <p className="crm-detail-headline">
                  {person.jobTitle ?? <em style={{ color: '#9D85B3' }}>cargo não informado</em>}
                  {person.company ? ` · ${person.company.name}` : ''}
                </p>

                <div className="crm-detail-links">
                  {person.linkedinUrl ? (
                    <a href={person.linkedinUrl} className="crm-detail-link" target="_blank" rel="noopener">
                      🔗 LinkedIn
                    </a>
                  ) : null}
                  <a href={`mailto:${person.email}`} className="crm-detail-link">✉ {person.email}</a>
                  {person.phone ? (
                    <a href={`tel:${person.phone}`} className="crm-detail-link">📞 {person.phone}</a>
                  ) : null}
                  {person.company ? (
                    <Link href={`/internal/crm/companies/${person.company.id}`} className="crm-detail-link">
                      🏢 {person.company.name}
                    </Link>
                  ) : null}
                  {person.sourceChannel && person.sourceChannel !== 'unknown' ? (
                    <span className="crm-detail-link">
                      📍 {channelLabel(person.sourceChannel)}
                      {person.sourcePage ? ` · ${person.sourcePage}` : ''}
                    </span>
                  ) : null}
                </div>

                <div className="crm-detail-actions">
                  <a href="#log-form" className="crm-btn crm-btn-primary">+ Log interação</a>
                </div>
              </div>
            </div>

            <h3 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 15, color: '#5E2A67', marginTop: 14, marginBottom: 10 }}>
              Timeline {activitiesList.length > 0 ? `(${activitiesList.length})` : ''}
            </h3>

            {activitiesList.length === 0 ? (
              <div className="crm-empty-timeline">
                Sem activities ainda. Quando esse lead interagir com o site, formulários ou você logar uma interação manual, aparece aqui.
              </div>
            ) : (
              <div className="crm-timeline">
                {activitiesList.map((act) => {
                  const display = describeActivity(act.type, act.data as Record<string, unknown> | null);
                  const dotClass = timelineDotClass(display.category);
                  const observation = (act.data as Record<string, unknown> | null)?.observation as string | undefined;
                  return (
                    <div key={act.id} className="crm-timeline-item">
                      <div className={`crm-timeline-dot ${dotClass}`}>
                        <span>{display.icon}</span>
                      </div>
                      <div className="crm-timeline-content">
                        <div className="crm-timeline-header">
                          <div className="crm-timeline-title">
                            {display.text}
                            {act.weight > 0 ? (
                              <span className="crm-score-delta">+{act.weight}</span>
                            ) : act.weight < 0 ? (
                              <span className="crm-score-delta negative">{act.weight}</span>
                            ) : null}
                          </div>
                          <div className="crm-timeline-time">{timeAgo(act.createdAt)}</div>
                        </div>
                        {observation ? (
                          <div className="crm-timeline-observation">{observation}</div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Log interaction form */}
          <div id="log-form">
            <LogInteractionForm personId={person.id} />
          </div>
        </div>

        {/* === DIREITA (SIDEBAR) === */}
        <aside>
          <div className="crm-side-card">
            <div className="crm-side-title">📅 Próximas reuniões</div>
            {meetings.length === 0 ? (
              <div style={{ fontSize: 12, color: '#9D85B3', textAlign: 'center', padding: 12 }}>
                Sem reuniões agendadas.
              </div>
            ) : (
              meetings.map((m) => (
                <div key={m.id} className="crm-meeting-item">
                  <div className="crm-meeting-when">{formatScheduledAt(m.scheduledAt)}</div>
                  <div className="crm-meeting-title">{m.title}</div>
                  <div className="crm-meeting-meta">{m.durationMin} min</div>
                  {m.meetingUrl ? (
                    <a href={m.meetingUrl} target="_blank" rel="noopener" style={{ display: 'inline-block', marginTop: 8, fontSize: 11, color: '#CD50F1', fontWeight: 600, textDecoration: 'none' }}>
                      Abrir reunião →
                    </a>
                  ) : null}
                </div>
              ))
            )}
          </div>

          {person.acTags && person.acTags.length > 0 ? (
            <div className="crm-side-card">
              <div className="crm-side-title">🏷 Tags ActiveCampaign</div>
              <div className="crm-tag-list">
                {person.acTags.map((tag) => (
                  <span key={tag} className="crm-tag">{tag}</span>
                ))}
              </div>
              <div style={{ fontSize: 10, color: '#9D85B3', marginTop: 10, fontStyle: 'italic' }}>
                Editor de tags (add/remove) vem no Sprint 4.
              </div>
            </div>
          ) : null}

          {person.company ? (
            <div className="crm-side-card">
              <div className="crm-side-title">🏢 Empresa</div>
              <Link href={`/internal/crm/companies/${person.company.id}`} style={{ textDecoration: 'none', display: 'block', padding: 14, background: '#FAF7FF', borderRadius: 10 }}>
                <div style={{ fontWeight: 700, color: '#5E2A67', marginBottom: 4 }}>{person.company.name}</div>
                <div style={{ fontSize: 11, color: '#9D85B3', marginBottom: 8 }}>
                  {person.company.industry ?? '—'}
                  {person.company.size ? ` · ${person.company.size}` : ''}
                </div>
                <div style={{ fontSize: 11, padding: '4px 8px', background: 'rgba(205, 80, 241, 0.1)', color: '#CD50F1', borderRadius: 6, fontWeight: 600, display: 'inline-block' }}>
                  Status: {person.company.status}
                </div>
              </Link>
            </div>
          ) : null}

          {person.internalNotes ? (
            <div className="crm-side-card">
              <div className="crm-side-title">📝 Notas internas</div>
              <div style={{ fontSize: 13, color: '#45336B', whiteSpace: 'pre-wrap' }}>{person.internalNotes}</div>
            </div>
          ) : null}
        </aside>

      </div>
    </div>
  );
}
