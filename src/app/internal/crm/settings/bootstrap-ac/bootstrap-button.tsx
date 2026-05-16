'use client';

import { useState, useTransition } from 'react';
import { bootstrapACCustomFields, type BootstrapResult } from './actions';

export function BootstrapACButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<BootstrapResult | null>(null);

  function handleClick() {
    setResult(null);
    startTransition(async () => {
      const r = await bootstrapACCustomFields();
      setResult(r);
    });
  }

  return (
    <div>
      <button type="button" onClick={handleClick} disabled={pending} className="crm-btn crm-btn-primary">
        {pending ? 'Criando campos no AC…' : '🧰 Criar 4 custom fields no AC'}
      </button>

      {result && result.ok ? (
        <div style={{ marginTop: 14, padding: 14, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 10, color: '#066B4D', fontSize: 13 }}>
          <strong>✓ Campos processados.</strong>
          <ul style={{ marginTop: 6, paddingLeft: 20 }}>
            {result.created.map((f) => (
              <li key={f.perstag}>
                <code>{f.perstag}</code> — {f.status === 'created_or_existing' ? `OK (id: ${f.id})` : 'falhou'}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 8, fontSize: 12, color: '#45336B' }}>
            Idempotent — pode rodar de novo sem duplicar. Próximos submits dos forms já vão popular esses campos automaticamente.
          </div>
        </div>
      ) : null}

      {result && !result.ok ? (
        <div style={{ marginTop: 14, padding: 14, background: 'rgba(238, 90, 82, 0.08)', border: '1px solid rgba(238, 90, 82, 0.25)', borderRadius: 10, color: '#C0392B', fontSize: 13 }}>
          <strong>Erro:</strong> {result.error}
        </div>
      ) : null}
    </div>
  );
}
