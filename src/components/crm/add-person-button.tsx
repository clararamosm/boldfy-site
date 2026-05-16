/**
 * Botão "+ Adicionar lead" com modal.
 * Cria pessoa manualmente (nome + email + opcional: cargo, empresa, LinkedIn, telefone).
 */

'use client';

import { useState, useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPersonManual } from '@/app/internal/crm/actions';

type State = { ok: true; personId?: string } | { ok: false; error: string } | null;

export function AddPersonButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prev, formData) => createPersonManual(_prev, formData),
    null,
  );

  useEffect(() => {
    if (state?.ok && state.personId) {
      setOpen(false);
      router.push(`/internal/crm/people/${state.personId}`);
    }
  }, [state, router]);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="crm-btn crm-btn-primary">
        + Adicionar lead
      </button>
    );
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="crm-btn crm-btn-primary">
        + Adicionar lead
      </button>

      <div className="apb-backdrop" onClick={() => setOpen(false)}>
        <div className="apb-modal" onClick={(e) => e.stopPropagation()}>
          <div className="apb-header">
            <h2>Adicionar lead</h2>
            <button onClick={() => setOpen(false)} className="apb-close">×</button>
          </div>

          <form action={formAction} className="apb-form">
            <label className="apb-label">
              Nome *
              <input name="name" required maxLength={120} autoFocus className="apb-input" />
            </label>
            <label className="apb-label">
              Email *
              <input name="email" type="email" required maxLength={254} className="apb-input" />
            </label>
            <div className="apb-row">
              <label className="apb-label">
                Cargo
                <input name="jobTitle" maxLength={120} className="apb-input" placeholder="ex: CMO" />
              </label>
              <label className="apb-label">
                Empresa
                <input name="companyName" maxLength={200} className="apb-input" placeholder="ex: Nubank" />
              </label>
            </div>
            <label className="apb-label">
              LinkedIn URL
              <input name="linkedinUrl" type="url" className="apb-input" placeholder="https://linkedin.com/in/…" />
            </label>
            <label className="apb-label">
              Telefone
              <input name="phone" maxLength={40} className="apb-input" placeholder="+55 11 9 9999-9999" />
            </label>

            {state && !state.ok ? (
              <p className="apb-error">{state.error}</p>
            ) : null}

            <div className="apb-actions">
              <button type="button" onClick={() => setOpen(false)} className="crm-btn">Cancelar</button>
              <button type="submit" disabled={pending} className="crm-btn crm-btn-primary">
                {pending ? 'Salvando…' : 'Adicionar lead'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .apb-backdrop {
          position: fixed; inset: 0;
          background: rgba(15, 10, 24, 0.5);
          backdrop-filter: blur(4px);
          z-index: 100;
          display: flex; align-items: flex-start; justify-content: center;
          padding-top: 8vh;
        }
        .apb-modal {
          width: 100%; max-width: 480px;
          background: #FFFFFF;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 24px 64px rgba(15, 10, 24, 0.25);
          margin: 0 16px;
        }
        .apb-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
        .apb-header h2 { font-family: var(--font-headline); font-weight: 900; font-size: 18px; color: #5E2A67; }
        .apb-close { background: transparent; border: none; font-size: 24px; color: #9D85B3; cursor: pointer; line-height: 1; }
        .apb-close:hover { color: #CD50F1; }

        .apb-form { display: flex; flex-direction: column; gap: 12px; }
        .apb-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .apb-label { display: flex; flex-direction: column; gap: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9D85B3; }
        .apb-input { padding: 10px 12px; border: 1px solid #E4D8ED; border-radius: 8px; font-family: inherit; font-size: 13px; color: #45336B; }
        .apb-input:focus { outline: none; border-color: #CD50F1; box-shadow: 0 0 0 3px rgba(205, 80, 241, 0.12); }
        .apb-error { color: #C0392B; font-size: 12px; margin-top: -4px; }
        .apb-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
      `}</style>
    </>
  );
}
