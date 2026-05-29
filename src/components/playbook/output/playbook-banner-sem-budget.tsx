'use client';

/**
 * Banner SEM_BUDGET — Bloco 6 (acima da calculadora).
 *
 * Mai/2026 (3ª curadoria): substituiu a antiga dica B_SEM_BUDGET. Aparece
 * só quando `budgetStatus === 'sem_budget'`. Fica perto da calculadora pra
 * disparar leitura nesse perfil: a pessoa que tá calculando ROI vê a oferta
 * beta antes de começar a brincar com os sliders.
 *
 * Visual: container destacado com gradient + caixinha animada de presente
 * (AnimatedGiftBox), título + descrição em 2 colunas.
 */

import type { BannerOferta } from '@/lib/playbook/templates/types';
import { AnimatedGiftBox } from '@/components/ui/animated-gift-box';

export function PlaybookBannerSemBudget({ banner }: { banner: BannerOferta }) {
  return (
    <section className="mx-auto max-w-[1080px] px-6 pt-12 sm:pt-16">
      <div className="flex flex-col items-stretch gap-4 rounded-2xl border-2 border-dashed border-primary/60 bg-gradient-to-br from-primary/[0.08] to-card p-6 shadow-[0_8px_32px_rgba(205,80,241,.12)] sm:flex-row sm:items-center sm:gap-6 sm:p-7">
        <div className="flex-shrink-0">
          <AnimatedGiftBox size="md" animateOnMount />
        </div>
        <div className="flex-1">
          <h3 className="mb-2 font-headline text-lg font-black tracking-tight text-foreground sm:text-xl">
            {banner.titulo}
          </h3>
          <p className="text-[13.5px] leading-relaxed text-muted-foreground">{banner.desc}</p>
        </div>
      </div>
    </section>
  );
}
