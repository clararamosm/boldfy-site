'use client';

import { useState, useTransition } from 'react';
import { revokeTokenAction } from './actions';

export function RevokeButton({ tokenId, label }: { tokenId: string; label: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    const ok = window.confirm(`Revogar o token "${label}"? A extensão nesse dispositivo vai parar de funcionar imediatamente.`);
    if (!ok) return;

    setError(null);
    startTransition(async () => {
      const result = await revokeTokenAction(tokenId);
      if (!result.ok) setError(result.error);
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <button
        onClick={handleClick}
        disabled={pending}
        className="crm-btn"
        style={{
          background: 'rgba(192, 57, 43, 0.1)',
          color: '#C0392B',
          fontSize: 12,
          padding: '6px 12px',
        }}
      >
        {pending ? 'Revogando...' : 'Revogar'}
      </button>
      {error ? <span style={{ fontSize: 10, color: '#C0392B' }}>{error}</span> : null}
    </div>
  );
}
