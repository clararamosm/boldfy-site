/**
 * Company Detail page — Visão 360 da conta.
 *
 * Briefing pra entrar numa reunião: tudo que importa visível sem clicar
 * em pessoa.
 *
 * Layout 2 colunas (crm-detail-layout):
 *   ESQUERDA: header com KPIs/ações, pessoas linkadas (com status real),
 *             timeline cruzada (activities da empresa + de todas as pessoas
 *             linkadas), LogInteractionForm com radio empresa/pessoa.
 *   DIREITA  : Contato, Origem, Próximas reuniões agregadas, Tags AC
 *             agregadas, slot de Inteligência (extensão futura + fallback
 *             discreto pro folk_research_brief legado), Notas internas.
 *
 * O slot "Inteligência" é o ponto de extensão pra quando a extensão Boldfy
 * começar a popular metadata.company_intelligence — UI estável, migração
 * suave de Folk → extensão sem refactor.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getCompanyById,
  getActivitiesForCompany,
  getPeopleForCompany,
  getUpcomingMeetingsForCompany,
  getAggregatedAcTagsForCompany,
} from '@/lib/crm-queries';
import { getStatuses } from '@/lib/statuses';
import {
  avatarHue,
  initials,
  timeAgo,
  formatScheduledAt,
  formatDateTime,
  describeActivity,
  timelineDotClass,
  methodVia,
  channelLabel,
} from '@/lib/crm-format';
import { LogInteractionForm } from '@/components/crm/log-interaction-form';
import { StatusChanger } from '@/components/crm/status-changer';
import { CompanyEditForm } from '@/components/crm/company-edit-form';

export const metadata: Metadata = {
  title: 'Empresa',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

type IntelligenceData = {
  company_intelligence?: {
    summary?: string;
    captured_at?: string;
    sources?: string[];
    [k: string]: unknown;
  };
  folk_research_brief?: string;
};

export default async function CompanyDetailPage({ params }: Props) {
  const { id } = await params;

  const company = await getCompanyById(id);
  if (!company) notFound();

  const [companyPeople, companyActivities, upcomingMeetings, aggregatedTags, allStatuses] = await Promise.all([
    getPeopleForCompany(id),
    getActivitiesForCompany(id, 200),
    getUpcomingMeetingsForCompany(id),
    getAggregatedAcTagsForCompany(id),
    getStatuses('company'),
  ]);

  const peopleForForm = companyPeople.map(({ person, status }) => ({
    id: person.id,
    name: person.name,
    jobTitle: person.jobTitle ?? status?.label ?? null,
  }));

  const meta = (company.metadata ?? {}) as IntelligenceData;
  const intelligence = meta.company_intelligence;
  const folkBrief = meta.folk_research_brief;
  const hasAnyIntelligence = !!intelligence?.summary || !!folkBrief;

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link href="/internal/crm/empresas" className="crm-btn">← Voltar pro kanban</Link>
      </div>

      <div className="crm-detail-layout">

        {/* ============================ ESQUERDA ============================ */}
        <div>

          {/* Header */}
          <div className="crm-detail-card">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <h1 className="crm-detail-name">{company.name}</h1>
                <p className="crm-detail-headline">
                  {company.industry ?? <em style={{ color: '#9D85B3' }}>indústria não informada</em>}
                  {company.size ? ` · ${company.size}` : ''}
                </p>

                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <StatusChanger
                    entity="company"
                    entityId={company.id}
                    currentStatusId={company.statusId}
                    currentLabel={company.status?.label ?? null}
                    statuses={allStatuses.map((s) => ({ id: s.id, label: s.label, color: s.color }))}
                  />
                  {company.website ? (
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="crm-detail-link" style={{ margin: 0 }}>
                      🌐 Website
                    </a>
                  ) : null}
                  {company.linkedinUrl ? (
                    <a href={company.linkedinUrl} target="_blank" rel="noopener noreferrer" className="crm-detail-link" style={{ margin: 0 }}>
                      🔗 LinkedIn
                    </a>
                  ) : null}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: '#9D85B3', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pessoas</div>
                  <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 28, color: '#5E2A67', lineHeight: 1 }}>{company.peopleCount}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: '#9D85B3', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Top score</div>
                  <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 28, color: '#5E2A67', lineHeight: 1 }}>{company.topScore}</div>
                </div>
                {company.estimatedValue ? (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: '#9D85B3', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Valor estimado</div>
                    <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 18, color: '#10B981', lineHeight: 1 }}>
                      R$ {Number(company.estimatedValue).toLocaleString('pt-BR')}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Próxima ação destacada */}
            {company.nextAction ? (
              <div style={{ marginTop: 16, padding: '12px 14px', background: '#FAF7FF', borderRadius: 10, fontSize: 13, color: '#45336B' }}>
                <strong style={{ color: '#CD50F1' }}>⚡ Próxima ação: </strong>
                {company.nextAction}
                {company.nextActionAt ? ` · ${timeAgo(company.nextActionAt)}` : ''}
              </div>
            ) : null}

            {/* Descrição */}
            {company.description ? (
              <div style={{ marginTop: 14, padding: 14, background: '#FAFAFC', borderRadius: 10, fontSize: 13, color: '#45336B', whiteSpace: 'pre-wrap', borderLeft: '3px solid #E4D8ED' }}>
                {company.description}
              </div>
            ) : null}

            {/* Ações: marginTop dedicado pra não colar no status pill / KPIs acima */}
            <div className="crm-detail-actions" style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <a href="#log-form" className="crm-btn crm-btn-primary">+ Log interação</a>
              <CompanyEditForm
                companyId={company.id}
                initial={{
                  name: company.name,
                  industry: company.industry,
                  size: company.size,
                  website: company.website,
                  linkedinUrl: company.linkedinUrl,
                  description: company.description,
                  internalNotes: company.internalNotes,
                  nextAction: company.nextAction,
                  estimatedValue: company.estimatedValue,
                }}
              />
            </div>
          </div>

          {/* Pessoas linkadas */}
          <div className="crm-detail-card">
            <h2 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 16, color: '#5E2A67', marginBottom: 14 }}>
              Pessoas linkadas ({companyPeople.length})
            </h2>
            {companyPeople.length === 0 ? (
              <div className="crm-empty-timeline">Nenhuma pessoa linkada ainda.</div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {companyPeople.map(({ person: p, status }) => {
                  // Fallback determinístico pra LinkedIn Leads sem email.
                  const hue = avatarHue(p.email ?? p.linkedinUrl ?? p.id);
                  const statusColor = status?.color ?? 'neutral';
                  const scoreClass = statusColor === 'amber' || statusColor === 'orange'
                    ? 'quente'
                    : statusColor === 'blue'
                      ? 'lead'
                      : '';
                  const via = methodVia(p.sourceMethod);
                  return (
                    <Link key={p.id} href={`/internal/crm/people/${p.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: '#FAF7FF', borderRadius: 10, textDecoration: 'none', color: 'inherit' }}>
                      <div className={`crm-avatar hue-${hue}`} style={{ width: 36, height: 36, fontSize: 13 }}>
                        {p.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.photoUrl} alt="" />
                        ) : (
                          initials(p.name)
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: '#5E2A67' }}>{p.name}</span>
                          {status ? (
                            <span className={`crm-score-pill ${scoreClass}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                              {status.label}
                            </span>
                          ) : null}
                          {via ? (
                            <span className={`crm-via-badge ${via.classKey}`} style={{ margin: 0, fontSize: 10 }}>
                              {via.label}
                            </span>
                          ) : null}
                        </div>
                        <div style={{ fontSize: 11, color: '#9D85B3', marginTop: 2 }}>
                          {p.jobTitle ?? p.email ?? 'LinkedIn Lead'}
                          {p.lastTouchAt ? ` · último toque ${timeAgo(p.lastTouchAt)}` : ''}
                        </div>
                      </div>
                      <span className={`crm-score-pill ${scoreClass}`}>⚡ {p.leadScore}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="crm-detail-card">
            <h2 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 16, color: '#5E2A67', marginBottom: 14 }}>
              Histórico ({companyActivities.length})
            </h2>
            {companyActivities.length === 0 ? (
              <div className="crm-empty-timeline">Sem activities registradas pra essa empresa.</div>
            ) : (
              <div className="crm-timeline">
                {companyActivities.map((act) => {
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
                          <div className="crm-timeline-time" title={timeAgo(act.createdAt)}>
                            <div>{formatDateTime(act.createdAt)}</div>
                            <div style={{ fontSize: 9, color: '#9D85B3', marginTop: 1 }}>{timeAgo(act.createdAt)}</div>
                          </div>
                        </div>
                        {/* Vincular à pessoa quando a activity pertence a uma */}
                        {act.personName && act.personId ? (
                          <div className="crm-timeline-meta">
                            <Link href={`/internal/crm/people/${act.personId}`} style={{ color: '#CD50F1', textDecoration: 'none' }}>
                              {act.personName}
                            </Link>
                          </div>
                        ) : null}
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
            <LogInteractionForm companyId={company.id} companyPeople={peopleForForm} />
          </div>
        </div>

        {/* ============================ DIREITA (SIDEBAR) ============================ */}
        <aside>

          {/* Contato */}
          <div className="crm-side-card">
            <div className="crm-side-title">🏢 Empresa</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
              {company.website ? (
                <div><span style={{ color: '#9D85B3' }}>Site:</span>{' '}
                  <a href={company.website} target="_blank" rel="noopener noreferrer" style={{ color: '#CD50F1' }}>{company.website.replace(/^https?:\/\//, '')}</a>
                </div>
              ) : null}
              {company.linkedinUrl ? (
                <div><span style={{ color: '#9D85B3' }}>LinkedIn:</span>{' '}
                  <a href={company.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#CD50F1' }}>perfil</a>
                </div>
              ) : null}
              {company.industry ? <div><span style={{ color: '#9D85B3' }}>Indústria:</span> {company.industry}</div> : null}
              {company.size ? <div><span style={{ color: '#9D85B3' }}>Porte:</span> {company.size}</div> : null}
            </div>
          </div>

          {/* Origem */}
          {company.firstTouchAt || company.firstTouchSource || company.firstTouchCampaign ? (
            <div className="crm-side-card">
              <div className="crm-side-title">📍 Origem</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                {company.firstTouchSource ? <div><span style={{ color: '#9D85B3' }}>Canal:</span> {channelLabel(company.firstTouchSource)}</div> : null}
                {company.firstTouchCampaign ? <div><span style={{ color: '#9D85B3' }}>Campanha:</span> {company.firstTouchCampaign}</div> : null}
                {company.firstTouchAt ? <div><span style={{ color: '#9D85B3' }}>Primeiro toque:</span> {new Date(company.firstTouchAt).toLocaleDateString('pt-BR')}</div> : null}
              </div>
            </div>
          ) : null}

          {/* Próximas reuniões agregadas */}
          <div className="crm-side-card">
            <div className="crm-side-title">📅 Próximas reuniões</div>
            {upcomingMeetings.length === 0 ? (
              <div style={{ fontSize: 12, color: '#9D85B3', textAlign: 'center', padding: 12 }}>
                Sem reuniões agendadas com nenhuma pessoa da empresa.
              </div>
            ) : (
              upcomingMeetings.map((m) => (
                <div key={m.id} className="crm-meeting-item">
                  <div className="crm-meeting-when">{formatScheduledAt(m.scheduledAt)}</div>
                  <div className="crm-meeting-title">{m.title}</div>
                  <div className="crm-meeting-meta">
                    {m.durationMin} min
                    {m.personName && m.personIdRef ? (
                      <>
                        {' · com '}
                        <Link href={`/internal/crm/people/${m.personIdRef}`} style={{ color: '#CD50F1', textDecoration: 'none' }}>
                          {m.personName}
                        </Link>
                      </>
                    ) : null}
                  </div>
                  {m.meetingUrl ? (
                    <a href={m.meetingUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 8, fontSize: 11, color: '#CD50F1', fontWeight: 600, textDecoration: 'none' }}>
                      Abrir reunião →
                    </a>
                  ) : null}
                </div>
              ))
            )}
          </div>

          {/* Tags AC agregadas */}
          {aggregatedTags.length > 0 ? (
            <div className="crm-side-card">
              <div className="crm-side-title">🏷 Tags AC (agregadas)</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {aggregatedTags.map((tag) => (
                  <span key={tag} style={{ display: 'inline-block', padding: '3px 8px', background: '#FAF7FF', color: '#45336B', borderRadius: 999, fontSize: 11, fontWeight: 500 }}>
                    {tag}
                  </span>
                ))}
              </div>
              <div style={{ fontSize: 10, color: '#9D85B3', marginTop: 10 }}>
                União das tags de todas as pessoas linkadas à empresa.
              </div>
            </div>
          ) : null}

          {/* Inteligência — slot da extensão futura + fallback Folk legado */}
          <div className="crm-side-card">
            <div className="crm-side-title">🧠 Inteligência da empresa</div>
            {intelligence?.summary ? (
              <div>
                <div style={{ fontSize: 13, color: '#45336B', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {intelligence.summary}
                </div>
                {intelligence.captured_at ? (
                  <div style={{ fontSize: 10, color: '#9D85B3', marginTop: 8 }}>
                    Coletado em {new Date(intelligence.captured_at).toLocaleDateString('pt-BR')}
                    {intelligence.sources?.length ? ` · ${intelligence.sources.join(', ')}` : ''}
                  </div>
                ) : null}
              </div>
            ) : folkBrief ? (
              <div>
                <div style={{ display: 'inline-block', marginBottom: 8, padding: '2px 8px', background: 'rgba(157, 133, 179, 0.12)', color: '#6B5B8A', borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Importado do Folk (legado)
                </div>
                <div style={{ fontSize: 12, color: '#6B5B8A', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {folkBrief}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#9D85B3', textAlign: 'center', padding: '12px 4px' }}>
                Nenhuma inteligência coletada ainda.
                <div style={{ marginTop: 6, fontSize: 10 }}>
                  Vai ser populada pela extensão Boldfy quando capturar a empresa no LinkedIn.
                </div>
              </div>
            )}
            {/* Debug-only se vier campos extra de intelligence */}
            {hasAnyIntelligence ? null : null}
          </div>

          {/* Notas internas */}
          {company.internalNotes ? (
            <div className="crm-side-card">
              <div className="crm-side-title">📝 Notas internas</div>
              <div style={{ fontSize: 13, color: '#45336B', whiteSpace: 'pre-wrap' }}>{company.internalNotes}</div>
            </div>
          ) : null}
        </aside>

      </div>
    </div>
  );
}
