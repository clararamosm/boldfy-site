'use client';

import { useState, useTransition } from 'react';
import { snapshotCrm } from './actions';

export function SnapshotButton() {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);

  function handleClick() {
    setStatus(null);
    startTransition(async () => {
      const result = await snapshotCrm();
      if (!result.ok) {
        setStatus(`Erro: ${result.error}`);
        return;
      }
      // Trigger download client-side
      const blob = new Blob([result.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      a.download = `crm-snapshot-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const c = result.counts;
      setStatus(`✓ Snapshot baixado: ${c.people} pessoas · ${c.companies} empresas · ${c.activities} activities · ${c.meetings} meetings.`);
    });
  }

  return (
    <div>
      <button type="button" onClick={handleClick} disabled={pending} className="crm-btn crm-btn-primary">
        {pending ? 'Gerando snapshot…' : '📥 Baixar snapshot JSON'}
      </button>
      {status ? (
        <p style={{ marginTop: 10, fontSize: 12, color: status.startsWith('✓') ? '#10B981' : '#C0392B' }}>{status}</p>
      ) : null}
    </div>
  );
}
