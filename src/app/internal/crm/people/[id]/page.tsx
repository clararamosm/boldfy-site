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
import { LogInteractionForm } from '@/components/crm/log-interaction-form';
import { TagManager } from '@/components/crm/tag-manager';

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
  const statusColor = person.status?.color ?? 'neutral';
  const scoreClass = statusColor === 'amber' || statusColor === 'orange'
    ? 'quente'
    : statusColor === 'blue'
      ? 'lead'
      : '';
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
                    ⚡ {person.status?.label ?? 'sem status'} · {person.leadScore} pts
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
                    <a href={person.linkedinUrl} className="crm-detail-link" target="_blank" rel="noopener noreferrer">
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
          {/* Contato */}
          <div className="crm-side-card">
            <div className="crm-side-title">📞 Contato</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
              <div><span style={{ color: '#9D85B3' }}>Email:</span> <a href={`mailto:${person.email}`} style={{ color: '#CD50F1' }}>{person.email}</a></div>
              {person.phone ? <div><span style={{ color: '#9D85B3' }}>Telefone:</span> {person.phone}</div> : null}
              {person.linkedinUrl ? (
                <div>
                  <span style={{ color: '#9D85B3' }}>LinkedIn:</span>{' '}
                  <a href={person.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#CD50F1' }}>perfil</a>
                </div>
              ) : null}
              {person.location ? <div><span style={{ color: '#9D85B3' }}>Localização:</span> {person.location}</div> : null}
            </div>
          </div>

          {/* Origem */}
          {person.sourceChannel && person.sourceChannel !== 'unknown' ? (
            <div className="crm-side-card">
              <div className="crm-side-title">📍 Origem</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                <div><span style={{ color: '#9D85B3' }}>Canal:</span> {channelLabel(person.sourceChannel)}</div>
                {person.sourcePage ? <div><span style={{ color: '#9D85B3' }}>Página:</span> <code style={{ fontSize: 11 }}>{person.sourcePage}</code></div> : null}
                {person.firstTouchCampaign ? <div><span style={{ color: '#9D85B3' }}>Campanha:</span> {person.firstTouchCampaign}</div> : null}
                {person.firstTouchAt ? <div><span style={{ color: '#9D85B3' }}>Primeiro toque:</span> {new Date(person.firstTouchAt).toLocaleDateString('pt-BR')}</div> : null}
              </div>
            </div>
          ) : null}

          {/* Card Proposta destacado — quando lead preencheu form Proposta, a
              URL do HTML da proposta + valor mensal ficam no header da sidebar
              pra acesso rápido durante atendimento. */}
          {(() => {
            const m = person.metadata as Record<string, unknown> | null;
            const cf = m?.ac_custom_fields as Record<string, string | undefined> | undefined;
            const urlProposta = cf?.url_proposta;
            const totalMensal = cf?.total_mensal_proposta;
            if (!urlProposta && !totalMensal) return null;
            return (
              <div className="crm-side-card" style={{ borderLeft: '3px solid #10B981', background: 'rgba(16, 185, 129, 0.04)' }}>
                <div className="crm-side-title">💰 Proposta gerada</div>
                {totalMensal ? (
                  <div style={{ fontSize: 18, fontFamily: 'var(--font-headline)', fontWeight: 900, color: '#10B981', marginBottom: 8 }}>
                    R$ {totalMensal}<span style={{ fontSize: 11, fontWeight: 500, color: '#9D85B3' }}>/mês</span>
                  </div>
                ) : null}
                {urlProposta ? (
                  <a href={urlProposta} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '6px 12px', background: '#10B981', color: '#FFFFFF', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                    Abrir proposta →
                  </a>
                ) : null}
              </div>
            );
          })()}

          {/* Dados de form (vindos do AC custom fields ou direto) */}
          {(() => {
            const m = person.metadata as Record<string, unknown> | null;
            const formData = m?.form_data as Record<string, string | undefined> | undefined;
            if (!formData || Object.values(formData).every((v) => !v)) return null;
            return (
              <div className="crm-side-card">
                <div className="crm-side-title">📋 Dados do form</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                  {formData.tipo_de_lead ? <div><span style={{ color: '#9D85B3' }}>Tipo:</span> {formData.tipo_de_lead}</div> : null}
                  {formData.intencao_uso ? <div><span style={{ color: '#9D85B3' }}>Intenção:</span> {formData.intencao_uso}</div> : null}
                  {formData.objetivo_principal ? <div><span style={{ color: '#9D85B3' }}>Objetivo:</span><div style={{ marginTop: 2, padding: '6px 8px', background: '#FAF7FF', borderRadius: 6 }}>{formData.objetivo_principal}</div></div> : null}
                  {formData.como_conheceu ? <div><span style={{ color: '#9D85B3' }}>Como conheceu:</span> {formData.como_conheceu}</div> : null}
                  {formData.observacoes ? <div><span style={{ color: '#9D85B3' }}>Observações:</span><div style={{ marginTop: 2, padding: '6px 8px', background: '#FAF7FF', borderRadius: 6 }}>{formData.observacoes}</div></div> : null}
                </div>
              </div>
            );
          })()}

          {/* AC custom fields (resto, raw) */}
          {(() => {
            const m = person.metadata as Record<string, unknown> | null;
            const cf = m?.ac_custom_fields as Record<string, string | undefined> | undefined;
            if (!cf) return null;
            const shown = new Set(['empresa', 'cargo', 'porte', 'colaboradores', 'funcionarios', 'setor', 'industry', 'utm_source_first', 'utm_medium_first', 'utm_campaign_first', 'objetivo_principal', 'como_conheceu', 'intencao_uso', 'tipo_de_lead', 'observacoes', 'job_title', 'url_proposta', 'total_mensal_proposta']);
            const extras = Object.entries(cf).filter(([k, v]) => v && !shown.has(k));
            if (extras.length === 0) return null;
            return (
              <div className="crm-side-card">
                <div className="crm-side-title">🔖 Custom fields AC</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
                  {extras.map(([k, v]) => (
                    <div key={k}><span style={{ color: '#9D85B3' }}>{k}:</span> {v}</div>
                  ))}
                </div>
              </div>
            );
          })()}

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
                    <a href={m.meetingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 8, fontSize: 11, color: '#CD50F1', fontWeight: 600, textDecoration: 'none' }}>
                      Abrir reunião →
                    </a>
                  ) : null}
                </div>
              ))
            )}
          </div>

          <div className="crm-side-card">
            <div className="crm-side-title">🏷 Tags ActiveCampaign</div>
            <TagManager personId={person.id} initialTags={person.acTags ?? []} />
            <div style={{ fontSize: 10, color: '#9D85B3', marginTop: 10 }}>
              Tags disparam automations no AC (cadências, listas, emails).
            </div>
          </div>

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
                  Empresa
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
