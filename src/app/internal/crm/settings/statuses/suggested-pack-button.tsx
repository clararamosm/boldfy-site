'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addSuggestedB2BPack, addSuggestedCompanyPack } from './actions';

export function SuggestedPackButton({ kind }: { kind: 'person' | 'company' }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const config = kind === 'person'
    ? {
        title: '💡 Adicionar pack B2B sugerido (Pessoas)',
        description: 'Inclui colunas comuns: LinkedIn Lead, Reunião marcada, Fechado, Perdido. Idempotent — só adiciona o que falta. Também zera o scoreThreshold do LinkedIn Lead se foi instalado com a regra antiga (entra agora só por sourceMethod).',
        action: addSuggestedB2BPack,
      }
    : {
        title: '💡 Adicionar pack B2B sugerido (Empresas)',
        description: 'Inclui colunas: No status (default), Quero prospectar, Reunião marcada, Em andamento, Fechado, Perdido. Idempotent.',
        action: addSuggestedCompanyPack,
      };

  function handleClick() {
    startTransition(async () => {
      const res = await config.action();
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
        <strong>{config.title}</strong>
        <div style={{ fontSize: 12, color: '#9D85B3', marginTop: 4 }}>
          {config.description}
        </div>
      </div>
      <button onClick={handleClick} disabled={pending} className="crm-btn crm-btn-primary">
        {pending ? 'Adicionando…' : '+ Adicionar pack'}
      </button>
    </div>
  );
}
