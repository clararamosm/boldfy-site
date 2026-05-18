/**
 * Histórico de links UTM — client component.
 *
 * Layout inspirado no HTML legado (utm-generator-boldfy.html):
 *   - Cada card mostra title (campaign · content), meta (data/hora), pills
 *     coloridas (source/medium/campaign), URL longa + URL curta (se existir)
 *   - Sessões GA4 cruzadas (canto superior direito)
 *   - Botões: Copiar longo / Copiar curto (ou Encurtar) / QR Code / Reusar / Remover
 *
 * "Reusar" dispara CustomEvent('utm:reuse') escutado pelo UtmForm.
 * "QR Code" dispara CustomEvent('utm:qr-open') escutado pelo QrModal.
 */

'use client';

import { useState, useTransition } from 'react';
import { deleteUtmLink, clearAllUtmLinks, shortenUtmLink } from './actions';

type LinkRow = {
  id: string;
  label: string | null;
  baseUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string | null;
  utmTerm: string | null;
  fullUrl: string;
  shortCode: string | null;
  createdAt: Date;
  sessionsGa4: number | null;
};

const SHORT_DOMAIN = 'https://boldfy.com.br';

export function UtmHistory({ links }: { links: LinkRow[] }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      // no-op
    }
  }

  function openQr(url: string) {
    window.dispatchEvent(new CustomEvent('utm:qr-open', { detail: { url } }));
  }

  function reuse(link: LinkRow) {
    window.dispatchEvent(new CustomEvent('utm:reuse', {
      detail: {
        label: link.label, baseUrl: link.baseUrl,
        utmSource: link.utmSource, utmMedium: link.utmMedium, utmCampaign: link.utmCampaign,
        utmContent: link.utmContent, utmTerm: link.utmTerm,
      },
    }));
  }

  function handleDelete(id: string) {
    if (!confirm('Remover esse link do histórico?')) return;
    startTransition(() => { deleteUtmLink(id); });
  }

  function handleClearAll() {
    if (!confirm(`Apagar TODOS os ${links.length} links do histórico? Não dá pra desfazer.`)) return;
    startTransition(() => { clearAllUtmLinks(); });
  }

  function handleShorten(id: string) {
    startTransition(async () => {
      const r = await shortenUtmLink(id);
      if (!r.ok && r.error) alert('Falhou: ' + r.error);
    });
  }

  if (links.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
        Nenhum link gerado ainda. Use o form acima pra começar.
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <header className="mb-1 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span aria-hidden>🕘</span>
          <h2 className="font-headline text-lg font-black text-accent-foreground">Histórico ({links.length})</h2>
        </div>
        <button
          type="button" onClick={handleClearAll} disabled={pending}
          className="text-xs font-semibold text-muted-foreground transition-colors hover:text-error disabled:opacity-50"
        >
          Limpar histórico
        </button>
      </header>
      <p className="mb-5 text-xs text-muted-foreground">
        Salvos no DB · sessões GA4 dos últimos 90 dias cruzadas por (source · medium · campaign).
      </p>

      <ul className="flex flex-col gap-3">
        {links.map((link) => {
          const shortUrl = link.shortCode ? `${SHORT_DOMAIN}/l/${link.shortCode}` : null;
          return (
            <li key={link.id} className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40">
              {/* Header — title + meta + sessions */}
              <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-accent-foreground">
                    {link.label ?? link.utmCampaign}
                    {link.utmContent ? (
                      <span className="ml-1 font-normal text-muted-foreground">· {link.utmContent}</span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Pill kind="source">source:{link.utmSource}</Pill>
                    <Pill kind="medium">medium:{link.utmMedium}</Pill>
                    <Pill kind="campaign">campaign:{link.utmCampaign}</Pill>
                    {link.utmContent ? <Pill kind="muted">content:{link.utmContent}</Pill> : null}
                    {link.utmTerm ? <Pill kind="muted">term:{link.utmTerm}</Pill> : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-[11px] text-muted-foreground">{formatTime(link.createdAt)}</span>
                  {link.sessionsGa4 !== null ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${link.sessionsGa4 > 0 ? 'bg-emerald-500/[0.12] text-emerald-700' : 'bg-secondary text-muted-foreground'}`}
                      title="Sessões GA4 nos últimos 90 dias"
                    >
                      {link.sessionsGa4} sessões GA4
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">sem GA4</span>
                  )}
                </div>
              </div>

              {/* Short URL (se existe) */}
              {shortUrl ? (
                <div className="mb-2 break-all font-mono text-xs font-semibold text-primary">
                  🔗 {shortUrl}
                </div>
              ) : null}

              {/* Full URL */}
              <div className="mb-3 break-all font-mono text-[11px] leading-snug text-muted-foreground">
                {link.fullUrl}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-1.5">
                <ActionBtn onClick={() => copy(`${link.id}:long`, link.fullUrl)} variant="solid">
                  {copiedKey === `${link.id}:long` ? '✓ Copiado' : 'Copiar longo'}
                </ActionBtn>
                {shortUrl ? (
                  <ActionBtn onClick={() => copy(`${link.id}:short`, shortUrl)} variant="solid">
                    {copiedKey === `${link.id}:short` ? '✓ Copiado' : 'Copiar curto'}
                  </ActionBtn>
                ) : (
                  <ActionBtn onClick={() => handleShorten(link.id)} variant="solid" disabled={pending}>
                    Encurtar
                  </ActionBtn>
                )}
                <ActionBtn onClick={() => openQr(shortUrl ?? link.fullUrl)} variant="solid">
                  QR Code
                </ActionBtn>
                <ActionBtn onClick={() => reuse(link)} variant="ghost">
                  Reusar
                </ActionBtn>
                <ActionBtn onClick={() => handleDelete(link.id)} variant="danger" disabled={pending}>
                  Remover
                </ActionBtn>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ helpers */

function Pill({ kind, children }: { kind: 'source' | 'medium' | 'campaign' | 'muted'; children: React.ReactNode }) {
  const styles: Record<typeof kind, string> = {
    source: 'bg-blue-500/[0.12] text-blue-700',
    medium: 'bg-amber-500/[0.12] text-amber-700',
    campaign: 'bg-primary/[0.12] text-primary',
    muted: 'bg-secondary text-muted-foreground',
  } as Record<'source' | 'medium' | 'campaign' | 'muted', string>;
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${styles[kind]}`}>
      {children}
    </span>
  );
}

function ActionBtn({
  onClick, children, variant, disabled,
}: { onClick: () => void; children: React.ReactNode; variant: 'solid' | 'ghost' | 'danger'; disabled?: boolean }) {
  const cls = {
    solid: 'border-border bg-white text-accent-foreground hover:bg-secondary',
    ghost: 'border-transparent bg-transparent text-muted-foreground hover:bg-secondary',
    danger: 'border-transparent bg-transparent text-error hover:bg-error/[0.08]',
  }[variant];
  return (
    <button
      type="button" onClick={onClick} disabled={disabled}
      className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${cls}`}
    >
      {children}
    </button>
  );
}

function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}
