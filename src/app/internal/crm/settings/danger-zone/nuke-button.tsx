'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { nukeCrm } from './actions';

export function NukeButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmText, setConfirmText] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [armed, setArmed] = useState(false);

  function handleNuke() {
    setStatus(null);
    startTransition(async () => {
      const result = await nukeCrm(confirmText);
      if (!result.ok) {
        setStatus(`Erro: ${result.error}`);
        return;
      }
      const d = result.deleted;
      setStatus(`✓ Apagado: ${d.people} pessoas · ${d.companies} empresas · ${d.activities} activities · ${d.meetings} meetings. Roda agora /internal/crm/settings/import pra re-popular pelo AC.`);
      setConfirmText('');
      setArmed(false);
      router.refresh();
    });
  }

  if (!armed) {
    return (
      <button type="button" onClick={() => setArmed(true)} className="crm-btn" style={{ background: '#FEE', color: '#C0392B', border: '1px solid rgba(192, 57, 43, 0.3)' }}>
        💣 Iniciar nuke do CRM
      </button>
    );
  }

  return (
    <div style={{ padding: 16, background: 'rgba(192, 57, 43, 0.05)', border: '1px solid rgba(192, 57, 43, 0.3)', borderRadius: 10 }}>
      <p style={{ fontSize: 13, color: '#5E2A67', marginBottom: 12, lineHeight: 1.5 }}>
        Isso vai <strong>apagar permanentemente</strong> todas as pessoas, empresas, activities e meetings do CRM. Statuses, tokens OAuth e config ficam intactos. <strong>Não dá pra desfazer.</strong> Roda o snapshot acima primeiro se quiser ter um backup.
      </p>
      <p style={{ fontSize: 12, color: '#9D85B3', marginBottom: 12 }}>
        Pra confirmar, digite exatamente: <code style={{ background: '#FAF7FF', padding: '2px 6px', borderRadius: 4, fontWeight: 700, color: '#C0392B' }}>DELETAR TUDO</code>
      </p>
      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        disabled={pending}
        placeholder="DELETAR TUDO"
        style={{ width: '100%', padding: '10px 12px', border: '1px solid #E4D8ED', borderRadius: 8, fontFamily: 'inherit', fontSize: 13, marginBottom: 12 }}
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => { setArmed(false); setConfirmText(''); setStatus(null); }} disabled={pending} className="crm-btn">
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleNuke}
          disabled={pending || confirmText !== 'DELETAR TUDO'}
          className="crm-btn"
          style={{ background: '#C0392B', color: '#FFFFFF', border: 'none', opacity: confirmText === 'DELETAR TUDO' ? 1 : 0.5 }}
        >
          {pending ? 'Apagando…' : '💣 NUKE'}
        </button>
      </div>
      {status ? (
        <p style={{ marginTop: 10, fontSize: 12, color: status.startsWith('✓') ? '#10B981' : '#C0392B' }}>{status}</p>
      ) : null}
    </div>
  );
}
