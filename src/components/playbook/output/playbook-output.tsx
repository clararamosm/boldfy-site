'use client';

/**
 * Orquestrador da página /playbook/[slug].
 *
 * Renderiza os 8 blocos em ordem. Cliente pq precisa do hook
 * `useProposalBuilder` no CTA (botão "Montar meu pacote") e do
 * `navigator.clipboard` no botão "Compartilhar link".
 *
 * Spec: source-of-truth/specs/playbook-employee-led-growth-copy-final.md §1.
 */

import type { RenderedData } from '@/lib/playbook/templates/types';
import { PlaybookHero } from './playbook-hero';
import { PlaybookSnapshot } from './playbook-snapshot';
import { PlaybookTese } from './playbook-tese';
import { PlaybookDicas } from './playbook-dicas';
import { PlaybookChecklist } from './playbook-checklist';
import { PlaybookCalculadora } from './playbook-calculadora';
import { PlaybookBattleCard } from './playbook-battle-card';
import { PlaybookCTA } from './playbook-cta';

export type PlaybookOutputProps = {
  slug: string;
  data: RenderedData;
};

export function PlaybookOutput({ slug, data }: PlaybookOutputProps) {
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/playbook/${slug}`
      : `https://boldfy.com.br/playbook/${slug}`;

  return (
    <main className="min-h-screen bg-background">
      {/* Glows decorativos da identidade Boldfy */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-48 -top-48 h-[600px] w-[600px] rounded-full bg-primary opacity-[0.06] blur-[120px]" />
        <div className="absolute -bottom-48 -right-48 h-[600px] w-[600px] rounded-full bg-primary opacity-[0.05] blur-[120px]" />
      </div>

      {/* Bloco 1 — Hero */}
      <PlaybookHero hero={data.hero} colabAtivos={data.curvaAtivacao.colabAtivos} shareUrl={shareUrl} />

      {/* Bloco 2 — Snapshot + accordion curva */}
      <PlaybookSnapshot snapshot={data.snapshot} curvaAtivacao={data.curvaAtivacao} empresa={data.hero.headlineEmpresa} />

      {/* Bloco 3 — Tese (fixa) */}
      <PlaybookTese motivos={data.tese.motivos} />

      {/* Bloco 4 — Dicas + Boldfy (accordion) */}
      <PlaybookDicas dicas={data.dicas} />

      {/* Bloco 5 — Checklist */}
      <PlaybookChecklist antes={data.checklistAntes} naBoldfy={data.checklistBoldfy} />

      {/* Bloco 6 — Calculadora interativa (RoiSimulator embed) */}
      <PlaybookCalculadora calculadora={data.calculadora} outrasAreas={data.outrasAreas} />

      {/* Bloco 7 — Battle card (gráfico 2 colunas) */}
      <PlaybookBattleCard battleCard={data.battleCard} empresa={data.hero.headlineEmpresa} colabAtivos={data.curvaAtivacao.colabAtivos} />

      {/* Bloco 8 — CTA final */}
      <PlaybookCTA ctaTitulo={data.ctaTitulo} shareUrl={shareUrl} />
    </main>
  );
}
