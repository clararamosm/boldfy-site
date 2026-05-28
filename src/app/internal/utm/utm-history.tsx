/**
 * Histórico de links UTM — client component.
 *
 * Lista de UtmLinkCard com analytics enriquecido (sessões, usuários únicos,
 * % engajamento + bar chart diário expandable). Bindings de Reusar/QR/Encurtar/
 * Remover são via CustomEvent (forma já consolidada na page) ou direto via
 * actions importadas.
 */

'use client';

import { useTransition } from 'react';
import { deleteUtmLink, clearAllUtmLinks, shortenUtmLink } from './actions';
import { UtmLinkCard, type UtmLinkData } from '@/components/utm/utm-link-card';
import { analyticsKey, type UtmAnalytics } from '@/lib/ga4-utm-analytics';

type LinkRow = UtmLinkData & { sessionsGa4: number | null /* legacy — não usado mais */ };

export function UtmHistory({
  links,
  analyticsByKey,
}: {
  links: LinkRow[];
  analyticsByKey: Record<string, UtmAnalytics>;
}) {
  const [pending, startTransition] = useTransition();

  function handleShorten(id: string) {
    startTransition(async () => {
      const r = await shortenUtmLink(id);
      if (!r.ok && r.error) alert('Falhou: ' + r.error);
    });
  }

  function handleDelete(id: string) {
    if (!confirm('Remover esse link do histórico?')) return;
    startTransition(() => { deleteUtmLink(id); });
  }

  function handleClearAll() {
    if (!confirm(`Apagar TODOS os ${links.length} links do histórico? Não dá pra desfazer.`)) return;
    startTransition(() => { clearAllUtmLinks(); });
  }

  function handleReuse(link: UtmLinkData) {
    window.dispatchEvent(new CustomEvent('utm:reuse', {
      detail: {
        label: link.label, baseUrl: link.baseUrl,
        utmSource: link.utmSource, utmMedium: link.utmMedium, utmCampaign: link.utmCampaign,
        utmContent: link.utmContent, utmTerm: link.utmTerm,
      },
    }));
  }

  function handleQrOpen(url: string) {
    window.dispatchEvent(new CustomEvent('utm:qr-open', { detail: { url } }));
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
        Salvos no DB · métricas GA4 calculadas desde a criação de cada link · expanda pra ver acessos por dia.
      </p>

      <ul className="flex flex-col gap-3">
        {links.map((link) => {
          const key = analyticsKey(
            link.utmSource,
            link.utmMedium,
            link.utmCampaign,
            link.utmContent,
            link.utmTerm,
          );
          const analytics = analyticsByKey[key] ?? null;
          return (
            <UtmLinkCard
              key={link.id}
              link={link}
              analytics={analytics}
              actions={{
                onShorten: handleShorten,
                onDelete: handleDelete,
                onReuse: handleReuse,
                onQrOpen: handleQrOpen,
              }}
            />
          );
        })}
      </ul>
    </section>
  );
}
