'use client';

/**
 * Bloco 8 — CTA final.
 * Spec §2.8 do copy-final.
 *
 * 3 botões:
 *   - "Agendar demo" (primary roxo) → useDemoPopup
 *   - "Montar meu pacote" (primary âmbar/laranja) → useProposalBuilder('playbook:cta')
 *   - "Compartilhar link" (ghost) → copia URL
 *
 * Título dor-específico (CTA_TITULO_POR_DOR já interpolado com {empresa}).
 */

import { ArrowRight, Package, Upload } from 'lucide-react';
import { useDemoPopup } from '@/components/forms/demo-popup';
import { useProposalBuilder } from '@/components/proposal-builder';
import { trackEvent } from '@/lib/track';
import { ShareButton } from './share-button';

export function PlaybookCTA({
  ctaTitulo,
  shareUrl,
  slug,
}: {
  ctaTitulo: string;
  shareUrl: string;
  slug: string;
}) {
  const { openPopup } = useDemoPopup();
  const { openBuilder } = useProposalBuilder();

  const handleDemo = () => {
    trackEvent('playbook_cta_clicked', { cta_type: 'demo', slug });
    openPopup('playbook:cta');
  };
  const handlePacote = () => {
    trackEvent('playbook_cta_clicked', { cta_type: 'pacote', slug });
    openBuilder('playbook:cta');
  };

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-[820px] px-6">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-card to-secondary/40 p-8 text-center shadow-[0_24px_60px_rgba(93,42,103,.08)] sm:p-12">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            Próximo passo
          </div>
          <h2 className="mb-4 font-headline text-2xl font-black leading-tight tracking-tight text-foreground sm:text-3xl">
            {ctaTitulo}
          </h2>
          <p className="mx-auto mb-9 max-w-[560px] text-base leading-relaxed text-muted-foreground">
            Em 30 minutos a gente mostra como a Boldfy se encaixa no seu cenário e responde dúvidas específicas
            do seu time.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={handleDemo}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-[0_8px_24px_rgba(205,80,241,.28)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(205,80,241,.38)]"
            >
              Agendar demo
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>

            <button
              type="button"
              onClick={handlePacote}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-[0_8px_24px_rgba(249,115,22,.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(249,115,22,.45)]"
              style={{
                backgroundImage: 'linear-gradient(135deg, #F97316, #FBBF24)',
              }}
            >
              Montar meu pacote
              <Package className="h-3.5 w-3.5" strokeWidth={2.5} />
            </button>

            <ShareButton
              url={shareUrl}
              variant="light"
              onShare={() => trackEvent('playbook_cta_clicked', { cta_type: 'compartilhar', slug })}
            >
              <Upload className="mr-2 h-3.5 w-3.5" />
              Compartilhar link
            </ShareButton>
          </div>
        </div>

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          Playbook personalizado · Boldfy
        </footer>
      </div>
    </section>
  );
}
