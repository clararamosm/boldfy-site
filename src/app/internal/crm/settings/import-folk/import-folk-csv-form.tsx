'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { importFolkCSV } from './actions';

type Result =
  | { ok: true; companies: { inserted: number; updated: number; errors: number }; persons: { updated: number; notFound: number; errors: number } }
  | { ok: false; error: string }
  | null;

export function ImportFolkCSVForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Result>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [peopleFileName, setPeopleFileName] = useState<string | null>(null);
  const [companiesFileName, setCompaniesFileName] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setResult(null);
    startTransition(async () => {
      const r = await importFolkCSV(formData);
      setResult(r);
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9D85B3' }}>
            👤 people.csv (grupo Leads)
          </span>
          <div style={{ padding: 14, border: '2px dashed #E4D8ED', borderRadius: 10, background: '#FAF7FF', cursor: 'pointer', textAlign: 'center' }}>
            <input
              type="file"
              name="people"
              accept=".csv,text/csv"
              onChange={(e) => setPeopleFileName(e.target.files?.[0]?.name ?? null)}
              style={{ display: 'block', width: '100%', fontSize: 12 }}
            />
            {peopleFileName ? <div style={{ marginTop: 8, fontSize: 11, color: '#10B981', fontWeight: 600 }}>✓ {peopleFileName}</div> : null}
          </div>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9D85B3' }}>
            🏢 companies.csv (grupo Prospects)
          </span>
          <div style={{ padding: 14, border: '2px dashed #E4D8ED', borderRadius: 10, background: '#FAF7FF', cursor: 'pointer', textAlign: 'center' }}>
            <input
              type="file"
              name="companies"
              accept=".csv,text/csv"
              onChange={(e) => setCompaniesFileName(e.target.files?.[0]?.name ?? null)}
              style={{ display: 'block', width: '100%', fontSize: 12 }}
            />
            {companiesFileName ? <div style={{ marginTop: 8, fontSize: 11, color: '#10B981', fontWeight: 600 }}>✓ {companiesFileName}</div> : null}
          </div>
        </label>
      </div>

      <button type="submit" disabled={pending || (!peopleFileName && !companiesFileName)} className="crm-btn crm-btn-primary">
        {pending ? 'Importando…' : '↓ Importar Folk'}
      </button>

      {pending ? (
        <div style={{ marginTop: 12, fontSize: 12, color: '#9D85B3' }}>
          Processando CSVs… NÃO feche a aba.
        </div>
      ) : null}

      {result && result.ok ? (
        <div style={{ marginTop: 16, padding: 14, background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 10, color: '#066B4D', fontSize: 13 }}>
          <strong>✓ Importação Folk concluída.</strong>
          <ul style={{ marginTop: 6, paddingLeft: 20 }}>
            <li>Empresas: <strong>{result.companies.inserted}</strong> novas, <strong>{result.companies.updated}</strong> atualizadas{result.companies.errors > 0 ? `, ${result.companies.errors} erros` : ''}</li>
            <li>Pessoas: <strong>{result.persons.updated}</strong> atualizadas (com dados Folk), <strong>{result.persons.notFound}</strong> não encontradas no nosso CRM (ficam só no AC){result.persons.errors > 0 ? `, ${result.persons.errors} erros` : ''}</li>
          </ul>
        </div>
      ) : null}

      {result && !result.ok ? (
        <div style={{ marginTop: 16, padding: 14, background: 'rgba(238, 90, 82, 0.08)', border: '1px solid rgba(238, 90, 82, 0.25)', borderRadius: 10, color: '#C0392B', fontSize: 13 }}>
          <strong>Erro:</strong> {result.error}
        </div>
      ) : null}
    </form>
  );
}
