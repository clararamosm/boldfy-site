'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { importFromFolk } from './actions';

type Result = {
  ok: true;
  importedPeople: number;
  updatedPeople: number;
  importedCompanies: number;
  updatedCompanies: number;
  errors: number;
} | { ok: false; error: string } | null;

export function ImportFolkButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Result>(null);

  function handleImport() {
    if (!confirm('Importar todos os Persons + Companies do Folk pro nosso CRM? Pode demorar alguns minutos.')) return;
    setResult(null);
    startTransition(async () => {
      const r = await importFromFolk();
      setResult(r);
      router.refresh();
    });
  }

  return (
    <div>
      <button onClick={handleImport} disabled={pending} className="crm-btn crm-btn-primary">
        {pending ? 'Importando… (pode demorar)' : '↓ Importar tudo do Folk'}
      </button>

      {result && result.ok ? (
        <div style={{ marginTop: 16, padding: 14, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 10, color: '#066B4D', fontSize: 13 }}>
          <strong>✓ Importação do Folk concluída.</strong>
          <ul style={{ marginTop: 6, paddingLeft: 20 }}>
            <li><strong>{result.importedPeople}</strong> Persons novos · <strong>{result.updatedPeople}</strong> atualizados</li>
            <li><strong>{result.importedCompanies}</strong> Companies novas · <strong>{result.updatedCompanies}</strong> atualizadas</li>
            {result.errors > 0 ? <li><strong>{result.errors}</strong> erros (ver logs Vercel)</li> : null}
          </ul>
        </div>
      ) : null}

      {result && !result.ok ? (
        <div style={{ marginTop: 16, padding: 14, background: 'rgba(238, 90, 82, 0.08)', border: '1px solid rgba(238, 90, 82, 0.25)', borderRadius: 10, color: '#C0392B', fontSize: 13 }}>
          <strong>Erro:</strong> {result.error}
        </div>
      ) : null}
    </div>
  );
}
