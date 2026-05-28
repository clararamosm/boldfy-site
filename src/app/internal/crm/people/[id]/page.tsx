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
  formatDateTime,
  formatDateBR,
  describeActivity,
  activityKind,
  activityIconName,
  channelLabel,
  type LucideIconName,
} from '@/lib/crm-format';
import {
  Target, FlaskConical, Download, FileSearch, Briefcase, BookOpen,
  Calendar, CalendarCheck, CalendarX, CalendarMinus,
  Eye, DollarSign, Puzzle, CalendarPlus,
  MailOpen, MousePointerClick, Reply, Forward,
  UserMinus, UserPlus, Ban, CircleDot,
} from 'lucide-react';

/**
 * Mapeamento string → componente Lucide. Espelha LucideIconName em crm-format.
 * Adicionar tipo novo: adiciona aqui + lá.
 */
const LUCIDE_ICONS: Record<LucideIconName, typeof Target> = {
  Target, FlaskConical, Download, FileSearch, Briefcase, BookOpen,
  Calendar, CalendarCheck, CalendarX, CalendarMinus,
  Eye, DollarSign, Puzzle, CalendarPlus,
  MailOpen, MousePointerClick, Reply, Forward,
  UserMinus, UserPlus, Ban, CircleDot,
};
import { segmentLabel } from '@/lib/ac-tags';
import { LogInteractionForm } from '@/components/crm/log-interaction-form';
import { TagManager } from '@/components/crm/tag-manager';
import { FormsSubmittedChipList } from '@/components/crm/forms-submitted-chip-list';
import { EngagementSection } from '@/components/crm/engagement-section';

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

  /**
   * Task 1 — 3 chips compostos no header:
   *  - Via: deriva de sourceMethod (Via Form / Via Extension / Via Manual)
   *  - Canal: deriva de sourceChannel quando disponível
   *  - Form: deriva do último slug em forms_submitted ou do sourceMethod
   * Substitui o chip único "Via Form Report" do legado.
   */
  function buildOriginChips(p: NonNullable<typeof person>): Array<{ label: string; bg: string; color: string; key: string }> {
    const chips: Array<{ label: string; bg: string; color: string; key: string }> = [];
    const method = p.sourceMethod ?? 'manual';
    // Via
    // Via = cinza neutro (spec §8 tabela: Via=cinza, Canal=azul, Form=roxo)
    const VIA_BG = '#E5E5EA';
    const VIA_FG = '#5E5E68';
    if (method.startsWith('form_')) {
      chips.push({ key: 'via', label: 'Via Form', bg: VIA_BG, color: VIA_FG });
    } else if (method === 'extension_linkedin') {
      chips.push({ key: 'via', label: 'Via Extension', bg: VIA_BG, color: VIA_FG });
    } else if (method === 'imported_folk') {
      chips.push({ key: 'via', label: 'Via LinkedIn (legado)', bg: VIA_BG, color: VIA_FG });
    } else if (method === 'manual') {
      chips.push({ key: 'via', label: 'Via Manual', bg: VIA_BG, color: VIA_FG });
    }
    // Canal
    if (p.sourceChannel && p.sourceChannel !== 'unknown') {
      chips.push({
        key: 'canal',
        label: channelLabel(p.sourceChannel),
        bg: 'rgba(59, 130, 246, 0.12)',
        color: '#3B82F6',
      });
    } else if (method === 'extension_linkedin') {
      chips.push({ key: 'canal', label: 'LinkedIn', bg: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6' });
    }
    // Form (último do array; vazio se extensão/manual)
    const FORM_LABELS: Record<string, string> = {
      report: 'Report',
      beta: 'Beta',
      demo: 'Demo',
      proposta: 'Proposta',
      linkedin_extension: 'LinkedIn',
    };
    const forms = p.formsSubmitted ?? [];
    const lastForm = forms.length > 0 ? forms[forms.length - 1] : null;
    if (lastForm && lastForm !== 'linkedin_extension') {
      chips.push({
        key: 'form',
        label: FORM_LABELS[lastForm] ?? lastForm,
        bg: 'rgba(205, 80, 241, 0.12)',
        color: '#CD50F1',
      });
    } else if (method.startsWith('form_')) {
      // Fallback derivado de sourceMethod quando forms_submitted ainda vazio
      const slug = method.replace('form_', '');
      chips.push({
        key: 'form',
        label: FORM_LABELS[slug] ?? slug,
        bg: 'rgba(205, 80, 241, 0.12)',
        color: '#CD50F1',
      });
    }
    return chips;
  }
  const originChips = buildOriginChips(person);
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
                  {/* Badge UNSUBSCRIBED — Task 1: lead saiu da lista via webhook AC */}
                  {person.unsubscribed ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 10px',
                        background: '#E5E5E5',
                        color: '#6B5B8A',
                        borderRadius: 999,
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                      title={[
                        person.firstTouchAt ? `Inscrito desde ${new Date(person.firstTouchAt).toLocaleDateString('pt-BR')}` : null,
                        person.unsubscribedAt ? `Saiu em ${new Date(person.unsubscribedAt).toLocaleDateString('pt-BR')}` : null,
                      ].filter(Boolean).join(' · ')}
                    >
                      ❌ Unsubscribed
                    </span>
                  ) : null}
                  <span className={`crm-score-pill ${scoreClass}`}>
                    ⚡ {person.status?.label ?? 'sem status'} · {person.leadScore} pts
                  </span>
                  {/* 3 chips compostos de origem — substitui chip único "Via Form Report".
                      Spec §8 tabela: Via | Canal | Form. Segment badge fica na
                      sidebar "Contexto" (não no header). */}
                  {originChips.map((chip) => (
                    <span
                      key={chip.key}
                      style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        background: chip.bg,
                        color: chip.color,
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {chip.label}
                    </span>
                  ))}
                </div>

                <p className="crm-detail-headline">
                  {person.jobTitle ?? <em style={{ color: '#9D85B3' }}>cargo não informado</em>}
                  {person.company ? ` · ${person.company.name}` : ''}
                </p>

                {/* Headline (4º campo default do header — spec §8: Foto, nome,
                    jobTitle, headline). Headline costuma ser do LinkedIn ou AC
                    e dá contexto além do cargo formal (ex: "Founder & CEO @ X
                    · Helping founders ship faster"). */}
                {person.headline ? (
                  <p style={{
                    margin: '4px 0 0',
                    fontSize: 13,
                    color: '#6B5B8A',
                    fontStyle: 'italic',
                    lineHeight: 1.4,
                  }}>
                    {person.headline}
                  </p>
                ) : null}

                <div className="crm-detail-links">
                  {person.linkedinUrl ? (
                    <a href={person.linkedinUrl} className="crm-detail-link" target="_blank" rel="noopener noreferrer">
                      🔗 LinkedIn
                    </a>
                  ) : null}
                  <a href={`mailto:${person.email}`} className="crm-detail-link">✉ {person.email}</a>
                  {/* Pill de bounce ao lado do email se AC marcou como bounce */}
                  {(() => {
                    const m = person.metadata as Record<string, unknown> | null;
                    const ext = m?.ac_extra as { bounced_hard?: boolean; bounced_soft?: boolean; bounced_date?: string | null } | undefined;
                    if (!ext) return null;
                    if (ext.bounced_hard) {
                      return (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'rgba(192, 57, 43, 0.12)', color: '#C0392B', borderRadius: 999, fontSize: 11, fontWeight: 700 }} title={ext.bounced_date ? `desde ${ext.bounced_date}` : undefined}>
                          ⚠ Bounce hard
                        </span>
                      );
                    }
                    if (ext.bounced_soft) {
                      return (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'rgba(245, 158, 11, 0.12)', color: '#92580E', borderRadius: 999, fontSize: 11, fontWeight: 700 }} title={ext.bounced_date ? `desde ${ext.bounced_date}` : undefined}>
                          ⚠ Bounce soft
                        </span>
                      );
                    }
                    return null;
                  })()}
                  {person.phone ? (
                    <a href={`tel:${person.phone}`} className="crm-detail-link">📞 {person.phone}</a>
                  ) : null}
                  {person.company ? (
                    <Link href={`/internal/crm/companies/${person.company.id}`} className="crm-detail-link">
                      🏢 {person.company.name}
                    </Link>
                  ) : null}
                  {person.location ? (
                    <span className="crm-detail-link" title="Localização (AC geo)">
                      🌎 {person.location}
                    </span>
                  ) : null}
                </div>

                <div className="crm-detail-actions">
                  <a href="#log-form" className="crm-btn crm-btn-primary">+ Log interação</a>
                  {/* Botão Proposta — Task 1: aparece quando lead preencheu Simulador */}
                  {person.proposalUrl ? (
                    <a
                      href={person.proposalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="crm-btn"
                      style={{
                        background: '#10B981',
                        color: '#FFFFFF',
                        borderColor: '#10B981',
                        fontWeight: 700,
                      }}
                    >
                      📄 Ver proposta
                    </a>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Bloco "Jornada do lead" removido (decisão Clara 2026-05-18 — info
                redundante com chips do header + sidebar "Origem do lead"). */}

            <h3 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 15, color: '#5E2A67', marginTop: 18, marginBottom: 10 }}>
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
                  // Hierarquia visual (Clara 2026-05-26): ações do lead têm
                  // destaque (bolinha cheia + ícone Lucide + texto forte);
                  // ações do sistema/usuário ficam discretas (dot pequeno + texto leve).
                  const kind = activityKind(act.type);
                  const IconComponent = kind === 'lead' ? LUCIDE_ICONS[activityIconName(act.type)] : null;
                  const data = (act.data as Record<string, unknown> | null) ?? {};
                  const observation = data.observation as string | undefined;
                  const isFormSubmit = act.type.startsWith('form_submit_');
                  const formSlug = (data.form_slug as string | undefined)
                    ?? act.type.replace('form_submit_', '');

                  /* ---- Task 2: render rico de form_submit (spec §8: "mostra TODOS
                       os campos preenchidos") ----
                     Estratégia: itera por TUDO de activityData, exceto chaves com
                     tratamento próprio (form_type, form_slug, utms, observacoes).
                     Labels conhecidos viram label legível; desconhecidos viram
                     humanize(key). Forms futuros (sem código novo) já aparecem
                     completos. */
                  const canonicalChips: Array<{ k: string; v: string }> = [];
                  const utmChips: Array<{ k: string; v: string }> = [];
                  let obsBlock: string | undefined;

                  if (isFormSubmit) {
                    // Labels prettify pra chaves conhecidas. Desconhecidas caem
                    // em humanize() (snake_case → Title Case).
                    const FIELD_LABELS: Record<string, string> = {
                      cargo: 'Cargo',
                      empresa: 'Empresa',
                      setor: 'Setor',
                      funcionarios: 'Funcionários',
                      colaboradores_para_beta: 'Colaboradores no beta',
                      intencao_uso: 'Intenção',
                      tipo_lead: 'Tipo de lead',
                      objetivo_principal: 'Objetivo',
                      como_conheceu: 'Como conheceu',
                      newsletter_opt_in: 'Newsletter',
                      total_mensal: 'Total mensal',
                      total_full: 'Total cheio',
                      savings: 'Economia',
                      beta_active: 'Beta ativo',
                      origem: 'Origem',
                      proposal_url: 'URL proposta',
                    };
                    // Chaves com tratamento separado (não vão pra chips genéricos)
                    const SKIP_KEYS = new Set([
                      'form_type', 'form_slug', 'utms', 'observacoes',
                      'observation', 'reconstructed', 'from',
                      // UTMs planos (legado pre-Task 1) — renderizados como
                      // chips azuis dedicados abaixo. Sem isso, apareceriam 2x.
                      'utm_source', 'utm_medium', 'utm_campaign',
                      'utm_content', 'utm_term',
                      // Chaves legadas do import AC — info já redundante na sidebar
                      'utm_source_first', 'utm_medium_first', 'utm_campaign_first',
                      'sourceChannel', 'campaign_name',
                    ]);
                    function humanize(k: string): string {
                      return FIELD_LABELS[k]
                        ?? k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                    }
                    function formatValue(key: string, v: unknown): string {
                      if (typeof v === 'boolean') return v ? 'SIM' : 'NÃO';
                      if (typeof v === 'number') {
                        return key === 'total_mensal' || key === 'savings' || key === 'total_full'
                          ? `R$ ${v.toLocaleString('pt-BR')}`
                          : String(v);
                      }
                      if (typeof v === 'object' && v !== null) return JSON.stringify(v);
                      return String(v);
                    }

                    for (const [key, raw] of Object.entries(data)) {
                      if (SKIP_KEYS.has(key)) continue;
                      // Skip undefined/null/'' — boolean false segue (Newsletter: NÃO é info)
                      if (raw === undefined || raw === null || raw === '') continue;
                      canonicalChips.push({ k: humanize(key), v: formatValue(key, raw) });
                    }

                    obsBlock = (data.observacoes as string | undefined) || observation;

                    // UTMs como chips dedicados (mais visíveis que texto inline).
                    // Suporta DOIS formatos: aninhado {utms: {source, ...}} (novo,
                    // pós-Task 1) E plano {utm_source, utm_medium, ...} (legado,
                    // pré-Task 1 — activities históricas têm assim).
                    const UTM_LABEL: Record<string, string> = {
                      source: 'UTM source',
                      medium: 'UTM medium',
                      campaign: 'UTM campaign',
                      content: 'UTM content',
                      term: 'UTM term',
                    };
                    const utmsNested = data.utms as Record<string, string | undefined> | undefined;
                    if (utmsNested) {
                      for (const [k, v] of Object.entries(utmsNested)) {
                        if (!v) continue;
                        utmChips.push({ k: UTM_LABEL[k] ?? `UTM ${k}`, v: String(v) });
                      }
                    } else {
                      // Fallback: campos planos utm_source/utm_medium/etc
                      for (const k of ['source', 'medium', 'campaign', 'content', 'term']) {
                        const v = data[`utm_${k}`];
                        if (!v) continue;
                        utmChips.push({ k: UTM_LABEL[k], v: String(v) });
                      }
                    }
                  }

                  return (
                    <div
                      key={act.id}
                      className={`crm-timeline-item ${kind}`}
                      id={isFormSubmit ? `form-${formSlug}` : undefined}
                    >
                      <div className={`crm-timeline-dot ${kind}`}>
                        {IconComponent ? <IconComponent /> : null}
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

                        {/* Render rico de form_submit (Task 1 da spec): campos como tags visuais */}
                        {isFormSubmit && canonicalChips.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                            {canonicalChips.map((c) => (
                              <span
                                key={c.k}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'baseline',
                                  gap: 4,
                                  padding: '3px 8px',
                                  background: '#FAF7FF',
                                  borderRadius: 6,
                                  fontSize: 11,
                                }}
                              >
                                <span style={{ color: '#9D85B3', fontWeight: 600 }}>{c.k}:</span>
                                <span style={{ color: '#45336B', fontWeight: 500 }}>{c.v}</span>
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {/* Observação do lead (Beta) — bloco destacado */}
                        {obsBlock ? (
                          <div className="crm-timeline-observation" style={{ marginTop: 8 }}>
                            <strong style={{ color: '#9D85B3', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>
                              📝 Observação do lead
                            </strong>
                            {obsBlock}
                          </div>
                        ) : null}

                        {/* UTMs como chips dedicados (mais visíveis que texto inline) */}
                        {isFormSubmit && utmChips.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                            {utmChips.map((c) => (
                              <span
                                key={c.k}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'baseline',
                                  gap: 4,
                                  padding: '2px 7px',
                                  background: 'rgba(59, 130, 246, 0.08)',
                                  borderRadius: 6,
                                  fontSize: 10,
                                }}
                              >
                                <span style={{ color: '#3B82F6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{c.k}:</span>
                                <span style={{ color: '#45336B' }}>{c.v}</span>
                              </span>
                            ))}
                          </div>
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

          {/* Engajamento — consent LGPD + sessões GA4 da pessoa (mai/2026).
              Server component standalone, render condicional dentro do
              próprio componente (não polui perfis legados). */}
          <EngagementSection personId={person.id} />
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
              {/* Newsletter — coluna dedicada em people (Task 1) */}
              <div style={{ marginTop: 4, paddingTop: 6, borderTop: '1px solid #F0E5F8' }}>
                <span style={{ color: '#9D85B3' }}>Newsletter:</span>{' '}
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  background: person.newsletterOptIn ? 'rgba(16, 185, 129, 0.12)' : 'rgba(157, 133, 179, 0.12)',
                  color: person.newsletterOptIn ? '#10B981' : '#6B5B8A',
                }}>
                  {person.newsletterOptIn ? 'SIM' : 'NÃO'}
                </span>
              </div>
            </div>
          </div>

          {/* Formulários preenchidos — componente reusável (spec §13).
              Render null se array vazio (não polui sidebar). */}
          <FormsSubmittedChipList formsSubmitted={person.formsSubmitted ?? []} />

          {/* Origem do lead — card consolidado na sidebar com todos os campos
              de "primeiro toque": canal, página, campanha, data, e o(s)
              formulário(s) preenchido(s). Complementa o card Jornada (à
              esquerda) que mostra a sequência visual. */}
          {(() => {
            const formsPreenchidos = activitiesList
              .filter((a) => a.type.startsWith('form_submit_'))
              .map((a) => a.type);
            const uniqueForms = Array.from(new Set(formsPreenchidos));
            const formLabelMap: Record<string, string> = {
              form_submit_demo: 'Demo',
              form_submit_beta: 'Beta',
              form_submit_algoritmo_linkedin: 'Algoritmo LinkedIn',
              form_submit_case_semrush: 'Case Semrush',
              form_submit_proposta: 'Proposta',
            };
            const hasOrigin = person.firstTouchAt
              || (person.sourceChannel && person.sourceChannel !== 'unknown')
              || person.sourcePage
              || person.firstTouchCampaign
              || uniqueForms.length > 0;
            if (!hasOrigin) return null;
            return (
              <div className="crm-side-card">
                <div className="crm-side-title">📍 Origem do lead</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
                  {person.sourceChannel && person.sourceChannel !== 'unknown' ? (
                    <div>
                      <span style={{ color: '#9D85B3' }}>Canal:</span>{' '}
                      <strong style={{ color: '#45336B' }}>{channelLabel(person.sourceChannel)}</strong>
                    </div>
                  ) : null}
                  {person.sourcePage ? (
                    <div>
                      <span style={{ color: '#9D85B3' }}>Página:</span>{' '}
                      <code style={{ fontSize: 11, color: '#5E2A67', background: '#FAF7FF', padding: '1px 6px', borderRadius: 4 }}>{person.sourcePage}</code>
                    </div>
                  ) : null}
                  {uniqueForms.length > 0 ? (
                    <div>
                      <span style={{ color: '#9D85B3' }}>Formulário{uniqueForms.length > 1 ? 's' : ''}:</span>{' '}
                      <strong style={{ color: '#45336B' }}>{uniqueForms.map((f) => formLabelMap[f] ?? f).join(' · ')}</strong>
                    </div>
                  ) : null}
                  {person.firstTouchCampaign ? (
                    <div>
                      <span style={{ color: '#9D85B3' }}>Campanha:</span>{' '}
                      <strong style={{ color: '#45336B' }}>{person.firstTouchCampaign}</strong>
                    </div>
                  ) : null}
                  {person.firstTouchAt ? (
                    <div style={{ marginTop: 4, paddingTop: 8, borderTop: '1px solid #F0E5F8' }}>
                      <span style={{ color: '#9D85B3' }}>Primeiro toque:</span>{' '}
                      <strong style={{ color: '#45336B' }}>{formatDateBR(person.firstTouchAt)}</strong>
                      <div style={{ fontSize: 10, color: '#9D85B3', marginTop: 2 }}>{timeAgo(person.firstTouchAt)}</div>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })()}

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

          {/* Sidebar "Contexto" — spec §8: segment badge + intencaoUso +
              objetivoPrincipal + comoConheceu + outros campos de metadata.form_data.
              Acumulável: novos campos de forms futuros aparecem aqui sem ALTER. */}
          {(() => {
            const m = person.metadata as Record<string, unknown> | null;
            const formData = (m?.form_data as Record<string, unknown> | undefined) ?? {};
            const hasContent = person.segment
              || Object.values(formData).some((v) => v !== null && v !== undefined && v !== '');
            if (!hasContent) return null;

            // Labels conhecidos pra render bonito; outros caem em fallback "humanize"
            const FIELD_LABELS: Record<string, string> = {
              intencao_uso: 'Intenção',
              objetivo_principal: 'Objetivo',
              como_conheceu: 'Como conheceu',
              observacoes: 'Observações',
              tipo_de_lead: 'Tipo de lead',
              cargo: 'Cargo',
              empresa: 'Empresa',
              setor: 'Setor',
            };
            // Enum-like → render como tag clicável (spec §8: "tag clicável quando for enum")
            const ENUM_FIELDS = new Set(['intencao_uso', 'tipo_de_lead', 'como_conheceu', 'setor']);
            // Multi-line (textareas) → bloco destacado
            const LONG_FIELDS = new Set(['objetivo_principal', 'observacoes']);

            function humanize(key: string): string {
              if (FIELD_LABELS[key]) return FIELD_LABELS[key];
              return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
            }

            const segmentColors = {
              lider_b2b: { bg: 'rgba(205, 80, 241, 0.14)', color: '#CD50F1' },
              parceiro: { bg: 'rgba(59, 130, 246, 0.14)', color: '#3B82F6' },
              profissional_individual: { bg: 'rgba(245, 158, 11, 0.14)', color: '#F59E0B' },
            } as const;

            // Campos opcionais ordenados (segment vem primeiro). Pula values vazios.
            const orderedKeys = ['intencao_uso', 'tipo_de_lead', 'cargo', 'objetivo_principal', 'como_conheceu', 'observacoes', 'setor', 'empresa'];
            const knownKeys = new Set([...orderedKeys, ...Object.keys(FIELD_LABELS)]);
            const extraKeys = Object.keys(formData).filter((k) => !knownKeys.has(k));
            const allKeys = [...orderedKeys, ...extraKeys];

            return (
              <div className="crm-side-card">
                <div className="crm-side-title">🧩 Contexto</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
                  {/* Segment badge — sempre primeiro */}
                  {person.segment ? (
                    <div>
                      <span style={{ color: '#9D85B3', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>
                        Segmento
                      </span>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          background: segmentColors[person.segment as keyof typeof segmentColors]?.bg ?? '#FAF7FF',
                          color: segmentColors[person.segment as keyof typeof segmentColors]?.color ?? '#45336B',
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {segmentLabel(person.segment) ?? person.segment}
                      </span>
                    </div>
                  ) : null}

                  {/* Demais campos do form */}
                  {allKeys.map((key) => {
                    const value = formData[key];
                    if (value === null || value === undefined || value === '') return null;
                    const strVal = typeof value === 'object' ? JSON.stringify(value) : String(value);
                    const label = humanize(key);

                    if (LONG_FIELDS.has(key)) {
                      return (
                        <div key={key}>
                          <span style={{ color: '#9D85B3', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>
                            {label}
                          </span>
                          <div style={{ padding: '6px 10px', background: '#FAF7FF', borderRadius: 6, color: '#45336B', whiteSpace: 'pre-wrap' }}>
                            {strVal}
                          </div>
                        </div>
                      );
                    }

                    if (ENUM_FIELDS.has(key)) {
                      return (
                        <div key={key}>
                          <span style={{ color: '#9D85B3', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>
                            {label}
                          </span>
                          <span style={{ display: 'inline-block', padding: '2px 8px', background: '#FAF7FF', color: '#45336B', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                            {strVal}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div key={key}>
                        <span style={{ color: '#9D85B3' }}>{label}:</span>{' '}
                        <strong style={{ color: '#45336B', fontWeight: 600 }}>{strVal}</strong>
                      </div>
                    );
                  })}
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

          {/* Listas AC — fonte de verdade dos segmentos (paralelo às tags) */}
          {(() => {
            const m = person.metadata as Record<string, unknown> | null;
            const ext = m?.ac_extra as { ac_lists?: string[] } | undefined;
            const lists = ext?.ac_lists ?? [];
            if (lists.length === 0) return null;
            return (
              <div className="crm-side-card">
                <div className="crm-side-title">📬 Listas AC (subscribed)</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {lists.map((list) => (
                    <span key={list} style={{ display: 'inline-block', padding: '3px 8px', background: '#FAF7FF', color: '#45336B', borderRadius: 999, fontSize: 11, fontWeight: 500 }}>
                      {list}
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 10, color: '#9D85B3', marginTop: 10 }}>
                  Listas onde o contato está como &ldquo;subscribed&rdquo;. Source of truth dos segmentos.
                </div>
              </div>
            );
          })()}

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

          {/* people.internal_notes removida na Task 1 do CRM source-of-truth.
              Notas livres viram activity 'interaction_manual' (botão "+ Nota"
              vai pro header do perfil — Task 2 da spec). */}
        </aside>

      </div>
    </div>
  );
}
