'use client';

/**
 * Bloco 6 — Calculadora interativa (RoiSimulator embed).
 * Spec §1 e §3 do copy-final. Reusa o componente compartilhado <RoiSimulator />
 * com defaults pré-preenchidos pela curva de ativação.
 *
 * Embaixo da calculadora, bridge curto pras outras 2 áreas com link.
 */

import Link from 'next/link';
import type { RenderedData } from '@/lib/playbook/templates/types';
import { RoiSimulator } from '@/components/sections/roi-simulator';
import { SectionTag } from './playbook-snapshot';

export function PlaybookCalculadora({
  calculadora,
  outrasAreas,
}: {
  calculadora: RenderedData['calculadora'];
  outrasAreas: RenderedData['outrasAreas'];
}) {
  const linkPorSlug = (slug: 'marketing' | 'vendas' | 'rh') => `/para/${slug}`;

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

        {/* Bridge curto pras outras áreas */}
        {outrasAreas.length > 0 && (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            E ainda resolve pra{' '}
            {outrasAreas.map((a, i) => (
              <span key={a.slug}>
                <Link href={linkPorSlug(a.slug)} className="font-bold text-primary hover:underline">
                  {a.pretty}
                </Link>
                {i < outrasAreas.length - 1 ? ' e ' : ''}
              </span>
            ))}
            , com playbooks específicos pra cada área.
          </p>
        )}
      </div>
    </section>
  );
}
