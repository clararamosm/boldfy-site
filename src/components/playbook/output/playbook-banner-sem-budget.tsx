'use client';

/**
 * Banner do programa Beta — Bloco 6 (acima da calculadora).
 *
 * Histórico:
 * - Mai/2026 (3ª curadoria): substituiu a antiga dica B_SEM_BUDGET.
 *   Aparecia só quando `budgetStatus === 'sem_budget'`.
 * - Jun/2026 (refinamento pós-preview): virou universal — 4 variantes
 *   de copy por budgetStatus, mesma oferta operacional.
 * - Jun/2026 (polish 2): box mais compacto e o gift virou pequeno por
 *   padrão. A caixinha agora ABRE no hover do BANNER inteiro (não só
 *   do próprio gift), em vez de animar uma vez no mount. Resultado é
 *   uma seção mais discreta no scroll, com a animação reservada pra
 *   quem se interessou e parou em cima.
 *
 * Visual:
 * - Container fino, sem padding excessivo.
 * - Gift à esquerda, conteúdo (título + descrição) à direita.
 * - No hover do banner: gift escala um pouco e abre (via prop `open`).
 *
 * Margem (jun/2026 polish 6.1): o banner agora aparece DEPOIS da
 * calculadora, e o `py-16 sm:py-24` do RoiSimulator gerava espaço
 * vertical gigante entre os dois. Margem negativa `-mt-*` puxa o
 * banner pra cima recuperando parte daquele padding (Clara: "margem
 * bem pequenininha"). pb pequeno antes do BattleCard.
 */

import { useState } from 'react';
import type { BannerOferta } from '@/lib/playbook/templates/types';
import { AnimatedGiftBox } from '@/components/ui/animated-gift-box';

export function PlaybookBannerSemBudget({ banner }: { banner: BannerOferta }) {
  const [hovered, setHovered] = useState(false);
  return (
    <section className="mx-auto -mt-10 max-w-[1080px] px-6 pb-4 sm:-mt-16 sm:pb-6">
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="group/banner relative flex items-center gap-4 overflow-visible rounded-2xl border border-dashed border-primary/40 bg-gradient-to-br from-primary/[0.05] to-card px-5 py-4 transition-all duration-300 hover:border-primary/70 hover:shadow-[0_8px_32px_rgba(205,80,241,.14)] sm:gap-5 sm:px-6 sm:py-4"
      >
        {/* Gift container compacto. Cresce no hover via transform.
            overflow-visible no parent permite que a caixinha escape
            (efeito de "expandir do box" pedido pela Clara). */}
        <div className="relative -my-2 flex-shrink-0 transition-transform duration-300 group-hover/banner:scale-110">
          <AnimatedGiftBox size="sm" open={hovered} />
        </div>

        <div className="flex-1">
          <h3 className="font-headline text-[15px] font-black leading-tight tracking-tight text-foreground sm:text-base">
            {banner.titulo}
          </h3>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{banner.desc}</p>
        </div>
      </div>
    </section>
  );
}
