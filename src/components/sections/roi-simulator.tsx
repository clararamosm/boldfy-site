'use client';

/**
 * Simulador de ROI / Earned Media (componente compartilhado).
 *
 * Calcula o valor equivalente em mídia paga que um programa de Employee-
 * Led Growth gera no LinkedIn, comparado com o custo da plataforma Boldfy
 * e o custo de atingir o mesmo alcance via Ads.
 *
 * ⚠️ Não confundir com o Simulador de Proposta (pop-up com `proposal-builder`)
 * — aquele calcula "qual o pacote Boldfy ideal pra sua empresa?". Este aqui
 * é "quanto de mídia equivalente sua empresa ganha?".
 *
 * Componente sem props — sempre renderiza igual em qualquer lugar (home,
 * /beta-test, futuras LPs). Toda a lógica de preços e CPM vem de
 * `src/lib/constants.ts` — uma fonte da verdade só.
 */

import { useMemo, useState } from 'react';
import { Calculator, Eye, TrendingUp, Users } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useT } from '@/lib/i18n/context';
import {
  ADS_CPM_HIGH,
  ADS_CPM_LOW,
  BETA_PRICING_ENABLED,
  LINKEDIN_CPM_PER_IMPRESSION,
  getBetaPricePerSeat,
  getFullPricePerSeat,
} from '@/lib/constants';

// Defaults idênticos aos da página /beta-test atual
const DEFAULT_COLLABORATORS = 5;
const DEFAULT_IMPRESSIONS = 10_000;
const MIN_COLLABORATORS = 5;
const MAX_COLLABORATORS = 70;
const MIN_IMPRESSIONS = 1_000;
const MAX_IMPRESSIONS = 50_000;
const IMPRESSIONS_STEP = 1_000;

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function RoiSimulator() {
  const t = useT();

  const [collaborators, setCollaborators] = useState(DEFAULT_COLLABORATORS);
  const [impressionsPerCollab, setImpressionsPerCollab] = useState(DEFAULT_IMPRESSIONS);

  const results = useMemo(() => {
    const totalImpressions = collaborators * impressionsPerCollab;
    const valorBoldfy = totalImpressions * LINKEDIN_CPM_PER_IMPRESSION;
    const custoAdsLow = totalImpressions * ADS_CPM_LOW;
    const custoAdsHigh = totalImpressions * ADS_CPM_HIGH;

    const fullSeat = getFullPricePerSeat(collaborators);
    const betaSeat = getBetaPricePerSeat(collaborators);

    const custoMensalFull = collaborators * fullSeat;
    const custoMensalBeta = collaborators * betaSeat;

    // ROI compara valor de mídia gerado vs. o que o cliente vai pagar
    // (preço beta enquanto a oferta estiver ativa; preço cheio depois)
    const custoMensalAtual = BETA_PRICING_ENABLED ? custoMensalBeta : custoMensalFull;
    const roi = custoMensalAtual > 0
      ? ((valorBoldfy - custoMensalAtual) / custoMensalAtual) * 100
      : 0;

    return {
      totalImpressions,
      valorBoldfy,
      custoAdsLow,
      custoAdsHigh,
      fullSeat,
      betaSeat,
      custoMensalFull,
      custoMensalBeta,
      roi,
    };
  }, [collaborators, impressionsPerCollab]);

  return (
    <section className="border rounded-xl overflow-hidden">
      {/* Header dark */}
      <div className="bg-gradient-to-br from-[#0F0A18] via-[#1A0E2E] to-[#2D1445] px-6 py-4 flex items-center gap-3">
        <Calculator className="w-5 h-5 text-primary" />
        <div>
          <h3 className="font-headline text-sm font-black text-white">
            {t.betaTest.simulatorTitle}
          </h3>
          <p className="text-[10px] text-white/40">
            {t.betaTest.simulatorSubtitle}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="bg-card p-6">
        {/* Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Colaboradores */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-accent-foreground">
                  {t.betaTest.collaboratorsInProgram}
                </span>
              </div>
              <span className="text-sm font-bold text-primary bg-secondary px-3 py-1 rounded-full">
                {collaborators}
              </span>
            </div>
            <Slider
              value={[collaborators]}
              onValueChange={(v) => setCollaborators(v[0])}
              min={MIN_COLLABORATORS}
              max={MAX_COLLABORATORS}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-muted-foreground">{MIN_COLLABORATORS}</span>
              <span className="text-[9px] text-muted-foreground">{MAX_COLLABORATORS}</span>
            </div>
          </div>

          {/* Impressões */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-accent-foreground">
                  {t.betaTest.impressionsPerMonth}
                </span>
              </div>
              <span className="text-sm font-bold text-primary bg-secondary px-3 py-1 rounded-full">
                {impressionsPerCollab.toLocaleString('pt-BR')}
              </span>
            </div>
            <Slider
              value={[impressionsPerCollab]}
              onValueChange={(v) => setImpressionsPerCollab(v[0])}
              min={MIN_IMPRESSIONS}
              max={MAX_IMPRESSIONS}
              step={IMPRESSIONS_STEP}
              className="w-full"
            />
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-muted-foreground">
                {MIN_IMPRESSIONS.toLocaleString('pt-BR')}
              </span>
              <span className="text-[9px] text-muted-foreground">
                {MAX_IMPRESSIONS.toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        {/* Cards de resultado */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {/* Total impressões */}
          <div className="bg-secondary rounded-xl p-4 text-center">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              {t.betaTest.totalImpressionsMonth}
            </p>
            <p className="font-headline text-lg font-black text-accent-foreground">
              {results.totalImpressions.toLocaleString('pt-BR')}
            </p>
          </div>

          {/* Valor de mídia equivalente */}
          <div className="bg-secondary rounded-xl p-4 text-center border-2 border-primary">
            <p className="text-[9px] font-semibold text-primary uppercase tracking-wide mb-1">
              {t.betaTest.mediaEquivalentValue}
            </p>
            <p className="font-headline text-lg font-black text-primary">
              R$ {formatBRL(results.valorBoldfy)}
            </p>
            <p className="text-[8px] text-muted-foreground">{t.betaTest.perImpression}</p>
          </div>

          {/* Custo equivalente em Ads */}
          <div className="bg-secondary rounded-xl p-4 text-center">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              {t.betaTest.sameReachViaAds}
            </p>
            <p className="font-headline text-lg font-black text-accent-foreground">
              R$ {formatBRL(results.custoAdsLow)}
              <span className="text-xs font-normal text-muted-foreground"> a </span>
              R$ {formatBRL(results.custoAdsHigh)}
            </p>
            <p className="text-[8px] text-muted-foreground">{t.betaTest.cpmRange}</p>
          </div>

          {/* Custo Boldfy */}
          <div className="bg-secondary rounded-xl p-4 text-center border-2 border-primary/30">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              {t.betaTest.boldfyCostMonth}
            </p>
            {BETA_PRICING_ENABLED ? (
              <>
                <p className="text-[10px] text-muted-foreground line-through">
                  R$ {results.custoMensalFull.toLocaleString('pt-BR')}
                </p>
                <p className="font-headline text-lg font-black text-primary">
                  R$ {results.custoMensalBeta.toLocaleString('pt-BR')}
                </p>
                <p className="text-[8px] text-muted-foreground">
                  R$ {results.betaSeat}
                  {t.betaTest.perSeat}
                </p>
                <span className="inline-flex text-[7px] font-bold uppercase tracking-wide bg-primary/15 text-primary px-2 py-0.5 rounded-full mt-1">
                  {t.betaTest.betaPriceLabel}
                </span>
              </>
            ) : (
              <>
                <p className="font-headline text-lg font-black text-primary">
                  R$ {results.custoMensalFull.toLocaleString('pt-BR')}
                </p>
                <p className="text-[8px] text-muted-foreground">
                  R$ {results.fullSeat}
                  {t.betaTest.perSeat}
                </p>
              </>
            )}
          </div>
        </div>

        {/* ROI destacado */}
        {results.roi > 0 && (
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs font-bold text-accent-foreground">
                  {t.betaTest.roiTitle}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {t.betaTest.roiSubtitle}
                </p>
              </div>
            </div>
            <span className="font-headline text-2xl font-black text-primary">
              {results.roi > 0 ? '+' : ''}
              {results.roi.toFixed(0)}%
            </span>
          </div>
        )}

        {/* Nota de contexto */}
        <p className="text-[9px] text-muted-foreground text-center mt-4 leading-relaxed max-w-xl mx-auto">
          {t.betaTest.simulatorNote}
        </p>
      </div>
    </section>
  );
}

/**
 * Wrapper que adiciona padding vertical e título de seção (pra usar
 * em páginas onde o simulador é uma seção independente, ex: home).
 *
 * Em páginas como a /beta-test, onde o simulador faz parte de um fluxo
 * maior, use o `<RoiSimulator />` direto sem wrapper.
 */
export function RoiSimulatorSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <RoiSimulator />
      </div>
    </section>
  );
}
