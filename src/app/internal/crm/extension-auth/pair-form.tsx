'use client';

import { useState } from 'react';
import { generateExtensionToken } from './actions';

export function PairForm() {
  const [label, setLabel] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setError(null);
    setPending(true);
    const result = await generateExtensionToken(label);
    setPending(false);
    if (result.ok) {
      setToken(result.token);
    } else {
      setError(result.error);
    }
  }

  async function handleCopy() {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (token) {
    return (
      <div>
        <div
          style={{
            padding: 14,
            background: 'rgba(205, 80, 241, 0.08)',
            border: '1px solid rgba(205, 80, 241, 0.25)',
            borderRadius: 10,
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 12, color: '#9D85B3', marginBottom: 6 }}>
            Token pra copiar (mostrado uma única vez):
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 14,
              color: '#5E2A67',
              wordBreak: 'break-all',
              padding: 10,
              background: 'white',
              borderRadius: 6,
              border: '1px solid rgba(205, 80, 241, 0.15)',
            }}
          >
            {token}
          </div>
        </div>

        <button onClick={handleCopy} className="crm-btn" style={{ background: '#CD50F1', color: 'white' }}>
          {copied ? '✓ Copiado!' : '📋 Copiar token'}
        </button>

        <p style={{ marginTop: 18, fontSize: 12, color: '#9D85B3', lineHeight: 1.5 }}>
          Cola no popup da extensão e clica "Salvar". Depois disso, o token sai
          da tela. Pra gerar outro, atualiza essa página.
        </p>
      </div>
    );
  }

  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, color: '#6B5B8A', marginBottom: 6 }}>
        Label do dispositivo (vai aparecer na lista de tokens ativos)
      </label>
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="ex: Macbook Clara trabalho"
        disabled={pending}
        style={{
          width: '100%',
          padding: '10px 12px',
          fontSize: 14,
          borderRadius: 8,
          border: '1px solid rgba(205, 80, 241, 0.2)',
          marginBottom: 14,
        }}
      />

      {error ? (
        <div style={{ fontSize: 12, color: '#C0392B', marginBottom: 12 }}>{error}</div>
      ) : null}

      <button
        onClick={handleGenerate}
        disabled={pending || label.trim().length === 0}
        className="crm-btn"
        style={{
          background: pending ? '#9D85B3' : '#CD50F1',
          color: 'white',
          cursor: pending ? 'wait' : 'pointer',
        }}
      >
        {pending ? 'Gerando...' : '🔑 Gerar token'}
      </button>
    </div>
  );
}
