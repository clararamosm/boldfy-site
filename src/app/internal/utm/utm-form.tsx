/**
 * Form do UTM Generator — client component.
 *
 * Port simplificado do HTML legado (utm-generator-boldfy.html):
 *   - Auto-sugestão de medium baseado em source
 *   - Slug automático nos valores (preview)
 *   - Preview do URL gerado em tempo real
 *   - Submit cria via server action e mostra link + QR code
 *
 * Auto-complete via <datalist> nativo do HTML (zero biblioteca).
 */

'use client';

import { useActionState, useEffect, useState } from 'react';
import { createUtmLink, type CreateUtmLinkState } from './actions';
import {
  slug,
  inferMedium,
  buildUtmUrl,
  COMMON_SOURCES,
  COMMON_MEDIUMS,
  COMMON_PAGES,
} from '@/lib/utm';

export function UtmForm() {
  const [state, formAction, pending] = useActionState<CreateUtmLinkState, FormData>(createUtmLink, null);
  const [label, setLabel] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://boldfy.com.br/');
  const [utmSource, setUtmSource] = useState('');
  const [utmMedium, setUtmMedium] = useState('');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmContent, setUtmContent] = useState('');
  const [utmTerm, setUtmTerm] = useState('');
  const [touchedMedium, setTouchedMedium] = useState(false);

  // Auto-sugere medium quando source muda (só se user ainda não tocou)
  useEffect(() => {
    if (touchedMedium) return;
    const inferred = inferMedium(utmSource);
    if (inferred) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- auto-sugestão linkada a outro input
      setUtmMedium(inferred);
    }
  }, [utmSource, touchedMedium]);

  // Limpa form quando submeteu com sucesso
  useEffect(() => {
    if (state?.ok) {
      setLabel('');
      setUtmCampaign('');
      setUtmContent('');
      setUtmTerm('');
      // Mantém baseUrl, source, medium pra próximo (geralmente são iguais)
    }
  }, [state]);

  // Preview do URL gerado em tempo real (best-effort, valida URL primeiro)
  let previewUrl: string | null = null;
  try {
    if (baseUrl && utmSource && utmMedium && utmCampaign) {
      previewUrl = buildUtmUrl({ baseUrl, utmSource, utmMedium, utmCampaign, utmContent, utmTerm });
    }
  } catch {
    previewUrl = null;
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #E4D8ED',
    borderRadius: 8,
    fontFamily: 'inherit',
    fontSize: 13,
    color: '#45336B',
    background: '#FFFFFF',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 10,
    fontWeight: 700,
    color: '#9D85B3',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 6,
  };

  return (
    <div className="crm-detail-card">
      <h2 style={{ fontFamily: 'var(--font-headline)', fontWeight: 900, fontSize: 18, color: '#5E2A67', marginBottom: 14 }}>
        🔗 Gerar link UTM
      </h2>

      <form action={formAction}>
        <div style={{ marginBottom: 12 }}>
          <label htmlFor="utm-label" style={labelStyle}>Label (opcional, só pra você identificar)</label>
          <input id="utm-label" type="text" name="label" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={120} placeholder="Post LinkedIn Beta Tester · Junho" style={inputStyle} disabled={pending} />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label htmlFor="utm-base" style={labelStyle}>Página de destino *</label>
          <input id="utm-base" list="utm-pages" type="text" name="baseUrl" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} maxLength={1000} required style={inputStyle} disabled={pending} />
          <datalist id="utm-pages">
            {COMMON_PAGES.map((p) => <option key={p.url} value={p.url}>{p.label}</option>)}
          </datalist>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label htmlFor="utm-source" style={labelStyle}>utm_source *</label>
            <input id="utm-source" list="utm-sources" type="text" name="utmSource" value={utmSource} onChange={(e) => setUtmSource(e.target.value)} maxLength={120} required placeholder="linkedin" style={inputStyle} disabled={pending} />
            <datalist id="utm-sources">
              {COMMON_SOURCES.map((s) => <option key={s} value={s} />)}
            </datalist>
            {utmSource ? <div style={{ fontSize: 10, color: '#9D85B3', marginTop: 4 }}>→ <code>{slug(utmSource)}</code></div> : null}
          </div>
          <div>
            <label htmlFor="utm-medium" style={labelStyle}>utm_medium *</label>
            <input id="utm-medium" list="utm-mediums" type="text" name="utmMedium" value={utmMedium} onChange={(e) => { setUtmMedium(e.target.value); setTouchedMedium(true); }} maxLength={120} required placeholder="organic" style={inputStyle} disabled={pending} />
            <datalist id="utm-mediums">
              {COMMON_MEDIUMS.map((m) => <option key={m} value={m} />)}
            </datalist>
            {utmMedium ? <div style={{ fontSize: 10, color: '#9D85B3', marginTop: 4 }}>→ <code>{slug(utmMedium)}</code></div> : null}
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label htmlFor="utm-campaign" style={labelStyle}>utm_campaign *</label>
          <input id="utm-campaign" type="text" name="utmCampaign" value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} maxLength={200} required placeholder="lancamento-beta-jun-26" style={inputStyle} disabled={pending} />
          {utmCampaign ? <div style={{ fontSize: 10, color: '#9D85B3', marginTop: 4 }}>→ <code>{slug(utmCampaign)}</code></div> : null}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label htmlFor="utm-content" style={labelStyle}>utm_content (opcional)</label>
            <input id="utm-content" type="text" name="utmContent" value={utmContent} onChange={(e) => setUtmContent(e.target.value)} maxLength={200} placeholder="cta-superior" style={inputStyle} disabled={pending} />
          </div>
          <div>
            <label htmlFor="utm-term" style={labelStyle}>utm_term (opcional)</label>
            <input id="utm-term" type="text" name="utmTerm" value={utmTerm} onChange={(e) => setUtmTerm(e.target.value)} maxLength={200} placeholder="agencia-marketing" style={inputStyle} disabled={pending} />
          </div>
        </div>

        {previewUrl ? (
          <div style={{ marginBottom: 12, padding: 10, background: '#FAF7FF', borderRadius: 8, fontSize: 11, color: '#5E2A67', wordBreak: 'break-all' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#9D85B3', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Preview</div>
            <code>{previewUrl}</code>
          </div>
        ) : null}

        {state && !state.ok ? (
          <p role="alert" style={{ color: '#C0392B', fontSize: 12, marginBottom: 10, fontWeight: 500 }}>{state.error}</p>
        ) : null}
        {state && state.ok ? (
          <div style={{ marginBottom: 10, padding: 10, background: 'rgba(16, 185, 129, 0.08)', borderRadius: 8, fontSize: 12, color: '#066B4D' }}>
            ✓ Link salvo no histórico. <a href={state.fullUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#10B981', fontWeight: 700 }}>Abrir</a>
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="submit" disabled={pending || !previewUrl} className="crm-btn crm-btn-primary">
            {pending ? 'Gerando…' : '+ Gerar link'}
          </button>
        </div>
      </form>
    </div>
  );
}
