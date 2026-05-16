'use client';

import { useActionState } from 'react';
import { createArticle } from './actions';

type State = { ok: true } | { ok: false; error: string } | null;

export function ArticleForm() {
  const [state, formAction, pending] = useActionState<State, FormData>(
    async (_prev: State, formData: FormData) => createArticle(formData),
    null,
  );

  return (
    <form action={formAction} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginTop: 10 }}>
      <input
        name="title"
        placeholder="Título do artigo *"
        required
        maxLength={300}
        style={{ padding: '10px 12px', border: '1px solid #E4D8ED', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
      />
      <input
        name="publishedAt"
        type="date"
        required
        defaultValue={new Date().toISOString().split('T')[0]}
        style={{ padding: '10px 12px', border: '1px solid #E4D8ED', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
      />
      <input
        name="shortlinkCode"
        placeholder="Shortlink (ex: pr-elg-mai26)"
        maxLength={60}
        style={{ padding: '10px 12px', border: '1px solid #E4D8ED', borderRadius: 8, fontSize: 13, fontFamily: 'inherit' }}
      />
      <input
        name="utmCampaign"
        placeholder="UTM campaign"
        maxLength={120}
        style={{ padding: '10px 12px', border: '1px solid #E4D8ED', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', gridColumn: '1 / 3' }}
      />
      <button type="submit" disabled={pending} className="crm-btn crm-btn-primary">
        {pending ? 'Salvando…' : '+ Adicionar'}
      </button>

      <input
        name="notes"
        placeholder="Notas (opcional)"
        maxLength={2000}
        style={{ padding: '10px 12px', border: '1px solid #E4D8ED', borderRadius: 8, fontSize: 13, fontFamily: 'inherit', gridColumn: '1 / 4' }}
      />

      {state && !state.ok ? (
        <p role="alert" style={{ gridColumn: '1 / 4', color: '#C0392B', fontSize: 12 }}>{state.error}</p>
      ) : null}
      {state && state.ok ? (
        <p style={{ gridColumn: '1 / 4', color: '#10B981', fontSize: 12 }}>✓ Artigo cadastrado.</p>
      ) : null}
    </form>
  );
}
