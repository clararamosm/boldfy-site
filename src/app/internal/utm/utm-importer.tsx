/**
 * Importer do JSON do localStorage do gerador HTML legado.
 *
 * Fluxo pra Clara:
 *   1. Abrir o HTML antigo (file:///.../utm-generator-boldfy.html) no browser
 *   2. Abrir DevTools (F12) → Application → Local Storage
 *   3. Localizar a chave 'boldfy_utm_history' e copiar o valor inteiro
 *      (começa com '[' e termina com ']')
 *   4. Colar no textarea daqui, clicar Importar
 *   5. Vê resultado: imported / skipped / invalid
 */

'use client';

import { useState, useTransition } from 'react';
import { importUtmLinksFromJson, type ImportResult } from './actions';

export function UtmImporter() {
  const [open, setOpen] = useState(false);
  const [json, setJson] = useState('');
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ImportResult | null>(null);

  function handleImport() {
    if (!json.trim()) return;
    setResult(null);
    startTransition(async () => {
      const r = await importUtmLinksFromJson(json);
      setResult(r);
      if (r.ok && r.imported > 0) {
        setJson(''); // limpa textarea após import bem-sucedido
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="crm-btn"
        style={{ fontSize: 12, color: '#9D85B3' }}
      >
        📥 Importar do gerador antigo (localStorage)
      </button>
    );
  }

  return (
    <div style={{ padding: 16, background: '#FAF7FF', border: '1px solid #E4D8ED', borderRadius: 12, marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#5E2A67' }}>📥 Importar do gerador antigo</h3>
        <button onClick={() => { setOpen(false); setResult(null); }} style={{ background: 'transparent', border: 'none', color: '#9D85B3', fontSize: 13, cursor: 'pointer' }}>
          ✕
        </button>
      </div>
      <details style={{ marginBottom: 12, fontSize: 12, color: '#45336B' }}>
        <summary style={{ cursor: 'pointer', color: '#CD50F1', fontWeight: 600 }}>Como pegar o JSON ↓</summary>
        <ol style={{ marginTop: 8, paddingLeft: 20, lineHeight: 1.7 }}>
          <li>Abre o HTML antigo (<code style={{ background: '#FFFFFF', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>cowork-artifacts/utm-generator-boldfy.html</code>) num browser</li>
          <li>Abre DevTools (F12 ou ⌥⌘I)</li>
          <li>Aba <strong>Application</strong> → painel esquerdo <strong>Local Storage</strong> → expande a URL do arquivo</li>
          <li>Localiza a chave <code style={{ background: '#FFFFFF', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>boldfy_utm_history</code></li>
          <li>Click no valor, copia tudo (Ctrl/⌘+A, Ctrl/⌘+C) — deve começar com <code>[</code> e terminar com <code>]</code></li>
          <li>Cola no textarea abaixo e clica Importar</li>
        </ol>
      </details>
      <textarea
        value={json}
        onChange={(e) => setJson(e.target.value)}
        placeholder='[{"ts":1234567890,"url":"https://...","data":{"baseUrl":"...","utm_source":"linkedin",...}},...]'
        disabled={pending}
        rows={6}
        style={{ width: '100%', padding: 10, border: '1px solid #E4D8ED', borderRadius: 8, fontFamily: 'monospace', fontSize: 11, color: '#45336B', background: '#FFFFFF', resize: 'vertical', minHeight: 100 }}
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 8 }}>
        <div style={{ fontSize: 11, color: '#9D85B3' }}>
          Idempotente · skipa links que já existem (match por URL completa)
        </div>
        <button onClick={handleImport} disabled={pending || !json.trim()} className="crm-btn crm-btn-primary" style={{ fontSize: 12 }}>
          {pending ? 'Importando…' : 'Importar'}
        </button>
      </div>
      {result ? (
        <div style={{ marginTop: 12, padding: 10, borderRadius: 6, fontSize: 12, background: result.ok ? 'rgba(16, 185, 129, 0.08)' : 'rgba(192, 57, 43, 0.08)', color: result.ok ? '#066B4D' : '#C0392B' }}>
          {result.ok ? (
            <>
              ✓ Resultado: <strong>{result.imported}</strong> importados ·{' '}
              <strong>{result.skipped}</strong> já existiam (skip) ·{' '}
              <strong>{result.invalid}</strong> inválidos ·{' '}
              <strong>{result.total}</strong> total no JSON
            </>
          ) : (
            <>⚠ {result.error}</>
          )}
        </div>
      ) : null}
    </div>
  );
}
