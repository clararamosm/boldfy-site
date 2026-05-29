'use client';

/**
 * Bloco 6 — Calculadora interativa (RoiSimulator embed).
 * Spec §1 e §3 do copy-final. Reusa o componente compartilhado <RoiSimulator />
 * com defaults pré-preenchidos pela curva de ativação.
 *
 * Jun/2026 (refinamento pós-preview): o bridge "E ainda resolve pra X e Y"
 * que ficava aqui embaixo migrou pro Bloco 3.5 (Setor Aplicação) — faz mais
 * sentido lá, onde o respondente acabou de ver a versão personalizada do
 * setor dele.
 */

import type { RenderedData } from '@/lib/playbook/templates/types';
import { RoiSimulator } from '@/components/sections/roi-simulator';
import { SectionTag } from './playbook-snapshot';

export function PlaybookCalculadora({
  calculadora,
}: {
  calculadora: RenderedData['calculadora'];
}) {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-[1080px] px-6">
        <SectionTag>Simulação</SectionTag>
        <h2 className="mb-3 font-headline text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          Quanto sua empresa pode{' '}
          <span className="bg-gradient-to-br from-[#CD50F1] to-[#E875FF] bg-clip-text text-transparent">
            ganhar em earned media
          </span>
        </h2>
        <p className="mb-8 max-w-[720px] text-base leading-relaxed text-muted-foreground">
          Mexe nos sliders pra simular cenários diferentes de adesão e consistência. Os valores vêm
          pré-preenchidos com a estimativa pra sua empresa ({calculadora.colabAtivosEstimados} colaboradores ativos).
        </p>

        <RoiSimulator
          initialCollaborators={calculadora.initialCollaborators}
          initialImpressions={calculadora.initialImpressions}
          // Esconde o card "Mesmo alcance via Ads" — não casa com o framing
          // editorial do playbook (a comparação relevante aqui é earned vs
          // custo Boldfy, não earned vs custo Ads).
          hideAdsComparison
        />
      </div>
    </section>
  );
}
