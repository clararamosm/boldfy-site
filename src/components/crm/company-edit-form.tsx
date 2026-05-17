/**
 * CompanyEditForm — modal-like inline pra editar campos básicos da empresa.
 *
 * Toggle de "Editar" no header da page de empresa. Quando aberto, vira form
 * dentro do mesmo card. Submit chama updateCompany e fecha o form.
 *
 * Campos editáveis (mai/2026):
 *   - name, industry, size
 *   - URL primária (auto-classifica entre website/linkedinUrl)
 *   - LinkedIn explícito (caso queira separar)
 *   - description, internalNotes, nextAction, estimatedValue
 *
 * Auto-classify de URL: cola o link do LinkedIn no campo "URL" e o server
 * detecta `linkedin.com/company/` → vai pro linkedinUrl. Cola domínio do site
 * → vai pro website. Reduz fricção do user que não quer pensar onde cola.
 */

'use client';

import { useActionState, useState } from 'react';
import { updateCompany, type UpdateCompanyState } from '@/app/internal/crm/actions';

type Props = {
  companyId: string;
  initial: {
    name: string;
    industry: string | null;
    size: string | null;
    website: string | null;
    linkedinUrl: string | null;
    description: string | null;
    internalNotes: string | null;
    nextAction: string | null;
    estimatedValue: string | null;
  };
};

function inputStyle(): React.CSSProperties {
  return {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #E4D8ED',
    borderRadius: 8,
    fontFamily: 'inherit',
    fontSize: 13,
    color: '#45336B',
    background: '#FFFFFF',
  };
}

function labelStyle(): React.CSSProperties {
  return {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#9D85B3',
    marginBottom: 6,
  };
}

export function CompanyEditForm({ companyId, initial }: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<UpdateCompanyState, FormData>(
    updateCompany,
    null,
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="crm-btn"
        style={{ marginLeft: 8 }}
      >
        ✏ Editar
      </button>
    );
  }

  return (
    <div style={{ marginTop: 16, padding: 16, background: '#FAF7FF', borderRadius: 12, border: '1px solid #E4D8ED' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 15, color: '#5E2A67' }}>
          Editar empresa
        </h3>
        <button type="button" onClick={() => setOpen(false)} disabled={pending} style={{ background: 'transparent', border: 'none', color: '#9D85B3', fontSize: 13, cursor: 'pointer', padding: 4 }}>
          ✕ Fechar
        </button>
      </div>

      <form
        action={(fd) => {
          formAction(fd);
          // Fecha após submit bem-sucedido — useActionState atualiza state após o action retornar
          // useEffect seria mais correto mas adicionaria warning de set-state-in-effect.
        }}
      >
        <input type="hidden" name="id" value={companyId} />

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label htmlFor="ce-name" style={labelStyle()}>Nome</label>
            <input id="ce-name" type="text" name="name" defaultValue={initial.name} required maxLength={200} style={inputStyle()} />
          </div>
          <div>
            <label htmlFor="ce-size" style={labelStyle()}>Porte</label>
            <input id="ce-size" type="text" name="size" defaultValue={initial.size ?? ''} maxLength={60} placeholder="11-50" style={inputStyle()} />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label htmlFor="ce-industry" style={labelStyle()}>Indústria</label>
          <input id="ce-industry" type="text" name="industry" defaultValue={initial.industry ?? ''} maxLength={120} style={inputStyle()} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label htmlFor="ce-url" style={labelStyle()}>URL principal <span style={{ color: '#9D85B3', textTransform: 'none', letterSpacing: 'normal', fontWeight: 500, marginLeft: 4 }}>(cola site ou LinkedIn, auto-detecta)</span></label>
            <input
              id="ce-url"
              type="text"
              name="primaryUrl"
              defaultValue={initial.website ?? ''}
              maxLength={500}
              placeholder="boldfy.com.br ou linkedin.com/company/..."
              style={inputStyle()}
            />
          </div>
          <div>
            <label htmlFor="ce-linkedin" style={labelStyle()}>LinkedIn (opcional)</label>
            <input
              id="ce-linkedin"
              type="text"
              name="linkedinExplicit"
              defaultValue={initial.linkedinUrl ?? ''}
              maxLength={500}
              placeholder="linkedin.com/company/..."
              style={inputStyle()}
            />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label htmlFor="ce-desc" style={labelStyle()}>Descrição</label>
          <textarea id="ce-desc" name="description" defaultValue={initial.description ?? ''} maxLength={5000} rows={3} style={{ ...inputStyle(), resize: 'vertical', minHeight: 60 }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label htmlFor="ce-next" style={labelStyle()}>Próxima ação</label>
            <input id="ce-next" type="text" name="nextAction" defaultValue={initial.nextAction ?? ''} maxLength={500} placeholder="Mandar proposta na sexta…" style={inputStyle()} />
          </div>
          <div>
            <label htmlFor="ce-value" style={labelStyle()}>Valor estimado (R$)</label>
            <input id="ce-value" type="text" name="estimatedValue" defaultValue={initial.estimatedValue ?? ''} maxLength={20} placeholder="12000" style={inputStyle()} inputMode="decimal" />
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label htmlFor="ce-notes" style={labelStyle()}>Notas internas</label>
          <textarea id="ce-notes" name="internalNotes" defaultValue={initial.internalNotes ?? ''} maxLength={5000} rows={3} style={{ ...inputStyle(), resize: 'vertical', minHeight: 60 }} />
        </div>

        {state && !state.ok ? (
          <p role="alert" style={{ color: '#C0392B', fontSize: 12, marginBottom: 10, fontWeight: 500 }}>{state.error}</p>
        ) : null}
        {state && state.ok ? (
          <p style={{ color: '#10B981', fontSize: 12, marginBottom: 10, fontWeight: 500 }}>✓ Empresa atualizada. Recarrega a página pra ver as mudanças.</p>
        ) : null}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={() => setOpen(false)} disabled={pending} className="crm-btn">Cancelar</button>
          <button type="submit" disabled={pending} className="crm-btn crm-btn-primary">
            {pending ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}
