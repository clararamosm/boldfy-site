/**
 * Form do UTM Generator — client component.
 *
 *   - Auto-sugere medium baseado em source (só até user tocar)
 *   - Slug preview em cada input
 *   - Checkbox opt-in pra encurtar (KV /l/<code>)
 *   - Preview do URL gerado em tempo real
 *   - Submit cria via server action e devolve fullUrl + shortCode
 *   - Listener "utm:reuse" — quando user clica "Reusar" no histórico, preenche
 *     os campos automaticamente
 *
 * Auto-complete via <datalist> nativo (zero biblioteca).
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

export type ReusePayload = {
  label?: string | null;
  baseUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent?: string | null;
  utmTerm?: string | null;
};

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
  const [shorten, setShorten] = useState(false);

  // Auto-sugere medium quando source muda (só se user ainda não tocou)
  useEffect(() => {
    if (touchedMedium) return;
    const inferred = inferMedium(utmSource);
    if (inferred) setUtmMedium(inferred);
  }, [utmSource, touchedMedium]);

  // Limpa campos voláteis quando submeteu com sucesso (mantém base/source/medium)
  useEffect(() => {
    if (state?.ok) {
      setLabel('');
      setUtmCampaign('');
      setUtmContent('');
      setUtmTerm('');
    }
  }, [state]);

  // Listener "utm:reuse" — preenche o form quando user clica Reusar no histórico
  useEffect(() => {
    function onReuse(e: Event) {
      const detail = (e as CustomEvent<ReusePayload>).detail;
      if (!detail) return;
      setLabel(detail.label ?? '');
      setBaseUrl(detail.baseUrl);
      setUtmSource(detail.utmSource);
      setUtmMedium(detail.utmMedium);
      setUtmCampaign(detail.utmCampaign);
      setUtmContent(detail.utmContent ?? '');
      setUtmTerm(detail.utmTerm ?? '');
      setTouchedMedium(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.addEventListener('utm:reuse', onReuse);
    return () => window.removeEventListener('utm:reuse', onReuse);
  }, []);

  // Preview do URL gerado em tempo real (valida URL primeiro)
  let previewUrl: string | null = null;
  try {
    if (baseUrl && utmSource && utmMedium && utmCampaign) {
      previewUrl = buildUtmUrl({ baseUrl, utmSource, utmMedium, utmCampaign, utmContent, utmTerm });
    }
  } catch {
    previewUrl = null;
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <header className="mb-5 flex items-center gap-2">
        <span aria-hidden>📝</span>
        <h2 className="font-headline text-lg font-black text-accent-foreground">Configurar link</h2>
      </header>

      <form action={formAction} className="flex flex-col gap-4">
        <Field label="Label (opcional, só pra você identificar)" id="utm-label">
          <input
            id="utm-label" type="text" name="label" value={label} onChange={(e) => setLabel(e.target.value)}
            maxLength={120} placeholder="Post LinkedIn Beta Tester · Junho"
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-accent-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
            disabled={pending}
          />
        </Field>

        <Field
          label="Slug ou URL de destino *"
          id="utm-base"
          hint={<span className="text-[10px] text-muted-foreground">vazio = home (boldfy.com.br)</span>}
        >
          <div className="flex items-stretch overflow-hidden rounded-md border border-border bg-white focus-within:border-primary">
            <span className="bg-primary/[0.08] px-3 py-2 text-xs font-semibold text-primary">https://boldfy.com.br/</span>
            <input
              id="utm-base" list="utm-pages" type="text"
              value={baseUrl.replace(/^https?:\/\/boldfy\.com\.br\/?/, '')}
              onChange={(e) => {
                const path = e.target.value.replace(/^\/+/, '');
                setBaseUrl(path ? `https://boldfy.com.br/${path}` : 'https://boldfy.com.br/');
              }}
              maxLength={1000}
              placeholder="(deixe vazio pra home) — ou: precos, demo, rh…"
              className="w-full bg-transparent px-3 py-2 text-sm text-accent-foreground placeholder:text-muted-foreground/60 focus:outline-none"
              disabled={pending}
            />
          </div>
          {/* Hidden input que vai com o form (URL completa normalizada) */}
          <input type="hidden" name="baseUrl" value={baseUrl} />
          <datalist id="utm-pages">
            {COMMON_PAGES.map((p) => <option key={p.url} value={p.url.replace(/^https?:\/\/boldfy\.com\.br\/?/, '')}>{p.label}</option>)}
          </datalist>
        </Field>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="utm_source *" id="utm-source" hint={<span className="text-[10px] text-muted-foreground">de onde vem o tráfego</span>}>
            <input
              id="utm-source" list="utm-sources" type="text" name="utmSource"
              value={utmSource} onChange={(e) => setUtmSource(e.target.value)}
              maxLength={120} required placeholder="linkedin"
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-accent-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
              disabled={pending}
            />
            <datalist id="utm-sources">{COMMON_SOURCES.map((s) => <option key={s} value={s} />)}</datalist>
            {utmSource && slug(utmSource) !== utmSource ? <SlugHint value={slug(utmSource)} /> : null}
          </Field>

          <Field label="utm_medium *" id="utm-medium" hint={<span className="text-[10px] text-muted-foreground">tipo de canal</span>}>
            <input
              id="utm-medium" list="utm-mediums" type="text" name="utmMedium"
              value={utmMedium}
              onChange={(e) => { setUtmMedium(e.target.value); setTouchedMedium(true); }}
              maxLength={120} required placeholder="organic"
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-accent-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
              disabled={pending}
            />
            <datalist id="utm-mediums">{COMMON_MEDIUMS.map((m) => <option key={m} value={m} />)}</datalist>
            {utmMedium && slug(utmMedium) !== utmMedium ? <SlugHint value={slug(utmMedium)} /> : null}
          </Field>
        </div>

        <Field label="utm_campaign *" id="utm-campaign">
          <input
            id="utm-campaign" type="text" name="utmCampaign"
            value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)}
            maxLength={200} required placeholder="lancamento-beta-jun-26"
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-accent-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
            disabled={pending}
          />
          {utmCampaign && slug(utmCampaign) !== utmCampaign ? <SlugHint value={slug(utmCampaign)} /> : null}
        </Field>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="utm_content (opcional)" id="utm-content">
            <input
              id="utm-content" type="text" name="utmContent"
              value={utmContent} onChange={(e) => setUtmContent(e.target.value)}
              maxLength={200} placeholder="cta-superior"
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-accent-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
              disabled={pending}
            />
          </Field>
          <Field label="utm_term (opcional)" id="utm-term">
            <input
              id="utm-term" type="text" name="utmTerm"
              value={utmTerm} onChange={(e) => setUtmTerm(e.target.value)}
              maxLength={200} placeholder="agencia-marketing"
              className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-accent-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
              disabled={pending}
            />
          </Field>
        </div>

        {/* Toggle pra encurtar */}
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-secondary/40 p-3 text-sm">
          <input
            type="checkbox" name="shorten" checked={shorten} onChange={(e) => setShorten(e.target.checked)}
            className="mt-0.5 h-4 w-4 cursor-pointer accent-primary" disabled={pending}
          />
          <span>
            <span className="font-semibold text-accent-foreground">Gerar shortlink</span>
            <span className="ml-2 text-xs text-muted-foreground">
              cria também um <code className="rounded bg-white/60 px-1 py-0.5 text-[11px]">boldfy.com.br/l/&lt;code&gt;</code> que redireciona pro link UTM
            </span>
            <span className="mt-1 block text-[11px] text-muted-foreground">
              QR Code pode ser gerado depois pra qualquer link no histórico (botão &ldquo;QR Code&rdquo;).
            </span>
          </span>
        </label>

        {/* Preview */}
        {previewUrl ? (
          <div className="rounded-md bg-secondary/60 p-3 text-xs text-accent-foreground">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">Preview</div>
            <code className="break-all">{previewUrl}</code>
          </div>
        ) : null}

        {/* Feedback */}
        {state && !state.ok ? (
          <p role="alert" className="text-sm font-medium text-error">{state.error}</p>
        ) : null}
        {state && state.ok ? (
          <div className="rounded-md bg-emerald-500/[0.08] p-3 text-sm text-emerald-700">
            ✓ Link salvo no histórico.
            <a href={state.fullUrl} target="_blank" rel="noopener noreferrer" className="ml-2 font-bold text-emerald-700 underline">
              Abrir
            </a>
            {state.shortCode ? (
              <span className="ml-3">
                · short: <code className="rounded bg-white/60 px-1 py-0.5 text-[11px]">boldfy.com.br/l/{state.shortCode}</code>
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-2">
          <button
            type="submit" disabled={pending || !previewUrl}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? 'Gerando…' : '🔗 Gerar link'}
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({ label, id, hint, children }: { label: string; id: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
          {label}
        </label>
        {hint}
      </div>
      {children}
    </div>
  );
}

function SlugHint({ value }: { value: string }) {
  return <div className="mt-1 text-[10px] text-muted-foreground">→ <code className="rounded bg-secondary px-1 py-0.5 text-[10px]">{value}</code></div>;
}
