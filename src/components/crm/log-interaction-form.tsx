/**
 * Form pra logar interação manual.
 *
 * Usado em 2 lugares:
 * 1. /internal/crm/people/[id] — sempre pessoa-específica (passa só personId)
 * 2. /internal/crm/companies/[id] — radio entre "Empresa toda" (sem pessoa)
 *    e "Pessoa específica" (dropdown das pessoas linkadas).
 *
 * Sub-tipos com pesos:
 *   linkedin_message (+10), linkedin_engagement (+5), whatsapp (+15),
 *   email_manual (+20), phone_call (+20), meeting_extra (+25), other (+5)
 *
 * Quando company-level (sem pessoa), peso vira 0 — não distorce score
 * de pessoa nenhuma. A activity ainda aparece na timeline da empresa.
 *
 * Server action: logManualInteraction
 */

'use client';

import { useActionState, useState } from 'react';
import { logManualInteraction, type LogInteractionState } from '@/app/internal/crm/actions';

const SUBTYPES = [
  { value: 'linkedin_message', label: '💬 Mensagem no LinkedIn', weight: 10, placeholder: 'Sobre o que vocês conversaram?' },
  { value: 'linkedin_engagement', label: '👍 Engagement no LinkedIn (curtiu/comentou)', weight: 5, placeholder: 'Em qual post? Que tipo de engajamento?' },
  { value: 'whatsapp', label: '📱 WhatsApp', weight: 15, placeholder: 'Resumo da conversa, próximos passos…' },
  { value: 'email_manual', label: '✉ Email manual (fora AC)', weight: 20, placeholder: 'Assunto + contexto do email…' },
  { value: 'phone_call', label: '📞 Ligação', weight: 20, placeholder: 'Tempo, tópicos, próximos passos…' },
  { value: 'meeting_extra', label: '☕ Reunião extra (fora Cal.com)', weight: 25, placeholder: 'Onde, sobre o que, próximos passos…' },
  { value: 'other', label: '🔗 Outro', weight: 5, placeholder: 'Descreva o tipo de interação…' },
] as const;

type Person = { id: string; name: string; jobTitle?: string | null };

type Props =
  | { personId: string; companyId?: undefined; companyPeople?: undefined }
  | { personId?: undefined; companyId: string; companyPeople: Person[] };

export function LogInteractionForm(props: Props) {
  const [state, formAction, pending] = useActionState<LogInteractionState, FormData>(
    logManualInteraction,
    null,
  );
  const [subtype, setSubtype] = useState<typeof SUBTYPES[number]['value']>('whatsapp');

  // Modo: 'person' (form veio do detalhe de pessoa OU usuário escolheu pessoa
  // na page da empresa) ou 'company' (interação company-level)
  const isCompanyContext = !!props.companyId;
  const [scope, setScope] = useState<'person' | 'company'>(
    isCompanyContext ? 'company' : 'person',
  );
  const [selectedPersonId, setSelectedPersonId] = useState<string>(
    isCompanyContext ? props.companyPeople[0]?.id ?? '' : (props.personId ?? ''),
  );

  const selected = SUBTYPES.find((s) => s.value === subtype) ?? SUBTYPES[0];

  // Peso efetivo: 0 quando company-level, peso do subtype quando pessoa
  const effectiveWeight =
    isCompanyContext && scope === 'company' ? 0 : selected.weight;

  // Pessoa enviada pro server action
  const personIdToSend = isCompanyContext
    ? scope === 'person'
      ? selectedPersonId
      : ''
    : props.personId;

  // Disable do submit quando "pessoa específica" mas nenhuma selecionada
  const submitDisabled =
    pending || (isCompanyContext && scope === 'person' && !selectedPersonId);

  return (
    <div className="crm-detail-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 16, color: '#5E2A67' }}>
          + Log interação manual
        </h3>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: effectiveWeight > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(157, 133, 179, 0.12)', color: effectiveWeight > 0 ? '#10B981' : '#6B5B8A', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
          ⚡ {effectiveWeight > 0 ? `+${effectiveWeight} pts` : 'sem peso'}
        </span>
      </div>

      <form action={formAction}>
        <input type="hidden" name="personId" value={personIdToSend} />
        {isCompanyContext ? <input type="hidden" name="companyId" value={props.companyId} /> : null}

        {/* Radio escopo — só na page da empresa */}
        {isCompanyContext ? (
          <div style={{ marginBottom: 14, padding: 10, background: '#FAF7FF', borderRadius: 8 }}>
            <div style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9D85B3', marginBottom: 8 }}>
              Vincular a
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#45336B', cursor: 'pointer' }}>
                <input type="radio" name="scope" value="company" checked={scope === 'company'} onChange={() => setScope('company')} disabled={pending} />
                Empresa toda <span style={{ fontSize: 11, color: '#9D85B3' }}>(sem score)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#45336B', cursor: props.companyPeople.length === 0 ? 'not-allowed' : 'pointer' }}>
                <input
                  type="radio"
                  name="scope"
                  value="person"
                  checked={scope === 'person'}
                  onChange={() => setScope('person')}
                  disabled={pending || props.companyPeople.length === 0}
                />
                Pessoa específica
              </label>
            </div>
            {scope === 'person' ? (
              props.companyPeople.length === 0 ? (
                <p style={{ marginTop: 8, fontSize: 12, color: '#C0392B' }}>
                  Nenhuma pessoa linkada à empresa.
                </p>
              ) : (
                <select
                  value={selectedPersonId}
                  onChange={(e) => setSelectedPersonId(e.target.value)}
                  disabled={pending}
                  style={{ marginTop: 8, width: '100%', padding: '8px 10px', border: '1px solid #E4D8ED', borderRadius: 6, fontFamily: 'inherit', fontSize: 13, color: '#45336B', background: '#FFFFFF' }}
                >
                  {props.companyPeople.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.jobTitle ? ` — ${p.jobTitle}` : ''}
                    </option>
                  ))}
                </select>
              )
            ) : null}
          </div>
        ) : null}

        <div style={{ marginBottom: 12 }}>
          <label htmlFor="subtype-select" style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9D85B3', marginBottom: 6 }}>
            Tipo
          </label>
          <select
            id="subtype-select"
            name="subtype"
            value={subtype}
            onChange={(e) => setSubtype(e.target.value as typeof subtype)}
            disabled={pending}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #E4D8ED', borderRadius: 8, fontFamily: 'inherit', fontSize: 13, color: '#45336B', background: '#FFFFFF' }}
          >
            {SUBTYPES.map((s) => (
              <option key={s.value} value={s.value}>{s.label} (+{s.weight})</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label htmlFor="observation-textarea" style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9D85B3', marginBottom: 6 }}>
            Observação
          </label>
          <textarea
            id="observation-textarea"
            name="observation"
            placeholder={selected.placeholder}
            required
            minLength={1}
            maxLength={2000}
            disabled={pending}
            rows={4}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #E4D8ED', borderRadius: 8, fontFamily: 'inherit', fontSize: 13, color: '#45336B', background: '#FFFFFF', resize: 'vertical', minHeight: 80 }}
          />
        </div>

        {state && !state.ok ? (
          <p role="alert" style={{ color: '#C0392B', fontSize: 12, marginBottom: 10, fontWeight: 500 }}>{state.error}</p>
        ) : null}
        {state && state.ok ? (
          <p style={{ color: '#10B981', fontSize: 12, marginBottom: 10, fontWeight: 500 }}>✓ Interação registrada na timeline.</p>
        ) : null}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="submit" disabled={submitDisabled} className="crm-btn crm-btn-primary">
            {pending ? 'Salvando…' : 'Salvar interação'}
          </button>
        </div>
      </form>
    </div>
  );
}
