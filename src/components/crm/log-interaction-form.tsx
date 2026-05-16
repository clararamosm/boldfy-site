/**
 * Form pra logar interação manual no lead detail.
 *
 * Sub-tipos com pesos:
 *   linkedin_message (+10), linkedin_engagement (+5), whatsapp (+15),
 *   email_manual (+20), phone_call (+20), meeting_extra (+25), other (+5)
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

export function LogInteractionForm({ personId }: { personId: string }) {
  const [state, formAction, pending] = useActionState<LogInteractionState, FormData>(
    logManualInteraction,
    null,
  );
  const [subtype, setSubtype] = useState<typeof SUBTYPES[number]['value']>('whatsapp');

  const selected = SUBTYPES.find((s) => s.value === subtype) ?? SUBTYPES[0];

  return (
    <div className="crm-detail-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 16, color: '#5E2A67' }}>
          + Log interação manual
        </h3>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
          ⚡ +{selected.weight} pts
        </span>
      </div>

      <form action={formAction}>
        <input type="hidden" name="personId" value={personId} />

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
          <button type="submit" disabled={pending} className="crm-btn crm-btn-primary">
            {pending ? 'Salvando…' : 'Salvar interação'}
          </button>
        </div>
      </form>
    </div>
  );
}
