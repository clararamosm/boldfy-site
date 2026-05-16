'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addSuggestedB2BPack } from './actions';

export function SuggestedPackButton({ kind }: { kind: 'person' | 'company' }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (kind !== 'person') return null;

  function handleClick() {
    startTransition(async () => {
      const res = await addSuggestedB2BPack();
      if (!res.ok) {
        alert(`Erro: ${res.error}`);
      } else {
        alert('Pack adicionado. Confere lá embaixo, edita o que precisar.');
      }
      router.refresh();
    });
  }

  return (
    <div style={{ background: 'rgba(205, 80, 241, 0.06)', border: '1px dashed rgba(205, 80, 241, 0.35)', borderRadius: 14, padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ fontSize: 13, color: '#5E2A67' }}>
        <strong>💡 Adicionar pack B2B sugerido</strong>
        <div style={{ fontSize: 12, color: '#9D85B3', marginTop: 4 }}>
          Inclui colunas adicionais comuns pra Pessoas: LinkedIn Lead, Reunião marcada, Fechado, Perdido.
          Só adiciona o que ainda não existe.
        </div>
      </div>
      <button onClick={handleClick} disabled={pending} className="crm-btn crm-btn-primary">
        {pending ? 'Adicionando…' : '+ Adicionar pack'}
      </button>
    </div>
  );
}
