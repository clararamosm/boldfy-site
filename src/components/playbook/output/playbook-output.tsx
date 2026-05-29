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

import { useEffect } from 'react';
import type { RenderedData } from '@/lib/playbook/templates/types';
import { trackEvent } from '@/lib/track';
import { PlaybookHero } from './playbook-hero';
import { PlaybookSnapshot } from './playbook-snapshot';
import { PlaybookTese } from './playbook-tese';
import { PlaybookDicas } from './playbook-dicas';
import { PlaybookBannerSemBudget } from './playbook-banner-sem-budget';
import { PlaybookResultadosEsperados } from './playbook-resultados-esperados';
import { PlaybookChecklist } from './playbook-checklist';
import { PlaybookCalculadora } from './playbook-calculadora';
import { PlaybookBattleCard } from './playbook-battle-card';
import { PlaybookSobreBoldfy } from './playbook-sobre-boldfy';
import { PlaybookCTA } from './playbook-cta';

export type PlaybookOutputProps = {
  slug: string;
  templateKey: string;
  data: RenderedData;
};

export function PlaybookOutput({ slug, templateKey, data }: PlaybookOutputProps) {
  // Trackeia view da página no client (uma vez por mount). Tracking server-side
  // (view_count em playbook_outputs) acontece separadamente em track-action.ts.
  useEffect(() => {
    trackEvent('playbook_viewed', { template_key: templateKey, slug });
  }, [templateKey, slug]);

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
      <PlaybookSnapshot
        snapshot={data.snapshot}
        curvaAtivacao={data.curvaAtivacao}
        adsVsElgChart={data.adsVsElgChart}
        empresa={data.hero.headlineEmpresa}
        slug={slug}
      />

      {/* Bloco 3 — Tese + Bloco 3.5 Setor aplicação (mai/2026 3ª curadoria) */}
      <PlaybookTese
        motivos={data.tese.motivos}
        setorAplicacao={data.setorAplicacao}
        outrasAreas={data.outrasAreas}
      />

      {/* Bloco 4 — Dicas + Boldfy (accordion) */}
      <PlaybookDicas dicas={data.dicas} slug={slug} />

      {/* Bloco 4.5 — Resultados esperados (radar orgânico — jun/2026).
          Empresa no centro vem do hero.headlineEmpresa pra ser o mesmo
          nome usado em todo o playbook. */}
      {data.resultadosEsperados && data.resultadosEsperados.length > 0 && (
        <PlaybookResultadosEsperados
          resultados={data.resultadosEsperados}
          empresa={data.hero.headlineEmpresa}
        />
      )}

      {/* Bloco 5 — Checklist */}
      <PlaybookChecklist antes={data.checklistAntes} naBoldfy={data.checklistBoldfy} />

      {/* Bloco 6 — Banner Programa Beta (universal, narrativa por budgetStatus) +
          Calculadora interativa (RoiSimulator embed) */}
      {data.bannerSemBudget && <PlaybookBannerSemBudget banner={data.bannerSemBudget} />}
      <PlaybookCalculadora calculadora={data.calculadora} />

      {/* Bloco 7 — Battle card (gráfico 2 colunas) */}
      <PlaybookBattleCard battleCard={data.battleCard} empresa={data.hero.headlineEmpresa} colabAtivos={data.curvaAtivacao.colabAtivos} />

      {/* Bloco 7.5 — Sobre a Boldfy (SaaS sempre + CaaS condicional — mai/2026) */}
      {data.sobreBoldfy && (
        <PlaybookSobreBoldfy sobreBoldfy={data.sobreBoldfy} slug={slug} />
      )}

      {/* Bloco 8 — CTA final */}
      <PlaybookCTA ctaTitulo={data.ctaTitulo} shareUrl={shareUrl} slug={slug} />
    </main>
  );
}
