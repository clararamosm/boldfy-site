'use client';

/**
 * Gráfico Ads vs TLG — Bloco 2 (Diagnóstico) do Playbook TLG.
 *
 * História visual:
 *   1. Mês 1 ao Mês 3 (inflexão): linha única roxa-escura semitransparente
 *      = "passado, só ads". Antes do Boldfy entrar.
 *   2. Mês 3 marcado com tracejada vertical = "Boldfy entrou".
 *   3. Mês 3 ao Mês 6: bifurca em 2 linhas.
 *      - Cinza ("Só ads"): continua linear, cenário hipotético se nada mudasse.
 *      - Rosa ("TLG com Boldfy"): mesmo gasto em ads + TLG adicional via
 *        colaboradores ativos. Sobe mais rápido.
 *
 * Premissa do gráfico: mesmo gasto em ads nos dois cenários. TLG é EXTRA,
 * não realocação. Card "Boldfy custaria" mostra o custo como % do ads atual
 * pra contextualizar que é fração pequena do que já se gasta.
 *
 * Dados:
 *   - `gastoMensalAdsMidpoint`: R$ por mês de ads (midpoint da faixa selecionada).
 *     Quando undefined, modo conceitual ativo (overlay sobre o gráfico).
 *   - `colabAtivos`: nº de colaboradores ativos estimados (vem de calcColabAtivos).
 *   - `custoBoldfyMensal`: vem de calcCustoBoldfyMensal (price * seats).
 *   - `earnedMediaMensal`: vem de calcEarnedMediaMensal (impressões * CPM).
 *
 * Spec: source-of-truth/specs/playbook-team-led-growth-copy-final.md §2.2b.
 */

import { useId } from 'react';

const LINKEDIN_CPM_PER_IMPRESSION = 0.30;

export type AdsVsElgChartProps = {
  /** Midpoint do gasto em ads em R$/mês. undefined = modo conceitual. */
  gastoMensalAdsMidpoint: number | null;
  /**
   * Label legível da faixa selecionada (ex: "R$ 11k a R$ 50k / mês").
   * Usado no card da esquerda + no sub-título do bloco. null em modo conceitual.
   */
  faixaLabel: string | null;
  /** Custo Boldfy/mês (já calculado pelo render — vem do mesmo getBetaPricePerSeat
   *  do RoiSimulator pra garantir paridade com a calculadora). */
  custoBoldfyMensal: number;
  /** Earned media em R$/mês via TLG (impressões * CPM). */
  earnedMediaMensal: number;
  /** Nº de colaboradores ativos (label dos cards). */
  colabAtivos: number;
};

/* -------------------------------------------------------------------------- */
/*  SVG chart constants                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Polish 3 (jun/2026): padR reduzido de 105 → 30 porque os labels finais
 * "TLG com Boldfy" / "Só ads" saíram do SVG (informação fica só na legenda
 * fixa no topo). Sobra mais largura útil pra curva e pra animação da bolinha.
 */
const CHART = {
  vbW: 660,
  vbH: 290,
  padL: 50,
  padR: 30,
  padT: 32,
  padB: 38,
  /** Inflexão no Mês 3 (index 2 de 0..5). */
  inflexaoIdx: 2,
} as const;

const CHART_W = CHART.vbW - CHART.padL - CHART.padR; // 505
const CHART_H = CHART.vbH - CHART.padT - CHART.padB; // 220

function xForMonth(i: number): number {
  return CHART.padL + (CHART_W / 5) * i;
}
function yForValue(v: number, max: number): number {
  if (max === 0) return CHART.padT + CHART_H;
  return CHART.padT + CHART_H - (v / max) * CHART_H;
}

/** Path SVG suave (Bézier) entre uma lista de pontos [x, y]. */
function buildPathFromPoints(points: ReadonlyArray<readonly [number, number]>): string {
  if (points.length === 0) return '';
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const cx1 = x0 + (x1 - x0) * 0.4;
    const cx2 = x1 - (x1 - x0) * 0.4;
    d += ` C ${cx1} ${y0}, ${cx2} ${y1}, ${x1} ${y1}`;
  }
  return d;
}

function formatBRL(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (v >= 10_000) return `R$ ${Math.round(v / 1000)}k`;
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
}
function formatNumberShort(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (v >= 1000) return `${Math.round(v / 1000)}k`;
  return `${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
}

/* -------------------------------------------------------------------------- */
/*  Componente principal                                                       */
/* -------------------------------------------------------------------------- */

export function AdsVsElgChart({
  gastoMensalAdsMidpoint,
  faixaLabel,
  custoBoldfyMensal,
  earnedMediaMensal,
  colabAtivos,
}: AdsVsElgChartProps) {
  const conceitual = gastoMensalAdsMidpoint === null;
  const semAds = gastoMensalAdsMidpoint === 0;

  // Em modo conceitual usamos benchmark visual (não personalizado).
  // Em "sem ads" mostramos uma linha cinza fraquinha pra dar referência visual.
  const gastoAdsParaGrafico =
    conceitual ? Math.max(15_000, custoBoldfyMensal * 5)
    : semAds   ? Math.max(5000, custoBoldfyMensal * 0.8)
    :            (gastoMensalAdsMidpoint as number);

  const impressoesElgMes = earnedMediaMensal / LINKEDIN_CPM_PER_IMPRESSION;
  const impressoesAdsMes = gastoAdsParaGrafico / LINKEDIN_CPM_PER_IMPRESSION;

  // Linha "Só ads": linear ao longo dos 6 meses (continuação hipotética).
  const adsData = [1, 2, 3, 4, 5, 6].map((m) => impressoesAdsMes * m);
  // Linha "TLG com Boldfy": idêntica até a inflexão, depois ganha TLG adicional
  // por mês. inflexaoIdx=2 = Mês 3; TLG entra a partir do Mês 4 (i >= 3).
  const elgData = [1, 2, 3, 4, 5, 6].map((m, i) => {
    const adsAcum = impressoesAdsMes * m;
    const mesesElg = Math.max(0, i - CHART.inflexaoIdx); // 0, 0, 0, 1, 2, 3
    return adsAcum + impressoesElgMes * mesesElg;
  });

  return (
    <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-[0_8px_32px_rgba(93,42,103,.06)] sm:p-7">
      {/* Layout jun/2026 (polish 4): h3 (título) virou linha 1 full-width
          do bloco. As 2 colunas começam ABAIXO do título — coluna esquerda
          inicia no subtítulo + cards; coluna direita só com o gráfico,
          esticando vertical pra ocupar a mesma altura. Resultado: título
          tem peso visual de seção, gráfico fica maior e a grade visual é
          mais clara. */}
      <HeaderTitulo />

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_1.55fr] lg:items-stretch lg:gap-7">
        {/* Coluna esquerda — subtítulo + cards */}
        <div className="flex flex-col gap-4">
          <HeaderSubtitulo faixaLabel={faixaLabel} conceitual={conceitual} semAds={semAds} />
          <div className="grid grid-cols-2 gap-3">
            <MiniCard
              label="Você investe em ads"
              valor={semAds ? 'R$ 0' : conceitual ? '—' : formatBRL(gastoAdsParaGrafico)}
              nota={
                semAds
                  ? 'Marcou que não investe em ads — gráfico fica conceitual.'
                  : conceitual
                  ? 'Pulou a pergunta. Refaz o quiz pra ver o seu.'
                  : `por mês (faixa ${faixaLabel ?? ''})`
              }
            />
            <MiniCard
              label="Boldfy custaria"
              valor={formatBRL(custoBoldfyMensal)}
              nota={
                conceitual || semAds || gastoAdsParaGrafico === 0
                  ? `por mês para ${colabAtivos} ativos.`
                  : (
                      <>
                        por mês ={' '}
                        <strong className="text-foreground">
                          {Math.round((custoBoldfyMensal / gastoAdsParaGrafico) * 100)}% do que você
                          já investe em ads
                        </strong>
                      </>
                    )
              }
              highlight
            />
          </div>
          <MiniCard
            label="Earned media via TLG"
            valor={formatBRL(earnedMediaMensal)}
            nota={
              <>
                por mês, gerado pelos <strong className="text-foreground">{colabAtivos} ativos</strong>.
                Acumula sem custo de mídia.
              </>
            }
            stretch
          />
        </div>

        {/* Coluna direita — gráfico maior. Legenda dentro, top-right. */}
        <ChartWrapper conceitual={conceitual}>
          <Legend />
          <ChartSvg adsData={adsData} elgData={elgData} />
        </ChartWrapper>
      </div>

      <Disclaimer
        seats={colabAtivos}
        impressoesElgMes={impressoesElgMes}
        custoBoldfyMensal={custoBoldfyMensal}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-componentes                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Título do bloco (jun/2026 polish 4) — vira linha 1 full-width do bloco,
 * acima do grid de 2 colunas. Antes vivia na coluna esquerda em cima dos
 * cards; agora tem peso de "título de seção" e marca o início do bloco.
 */
function HeaderTitulo() {
  return (
    <h3 className="font-headline text-xl font-black leading-tight tracking-tight text-foreground sm:text-2xl">
      Quando você{' '}
      <span className="bg-gradient-to-br from-[#CD50F1] to-[#E875FF] bg-clip-text text-transparent">
        diversifica o budget
      </span>{' '}
      em TLG
    </h3>
  );
}

/**
 * Subtítulo personalizado pelo respondente (faixa de ads ou estado conceitual).
 * Vive na coluna esquerda em cima dos cards. Bloca verticalmente com o início
 * do gráfico — Clara pediu pra "alinhar gráfico com o subtítulo, não com o
 * título" (polish 4).
 */
function HeaderSubtitulo({
  faixaLabel,
  conceitual,
  semAds,
}: {
  faixaLabel: string | null;
  conceitual: boolean;
  semAds: boolean;
}) {
  return (
    <p className="text-[13.5px] leading-relaxed text-muted-foreground">
      {conceitual ? (
        <>Você pulou a pergunta sobre ads. Olha o cenário típico pra empresas do seu porte.</>
      ) : semAds ? (
        <>
          Você marcou que <strong>não investe em ads</strong>. TLG vira o canal pra começar a gerar
          earned media sem precisar abrir budget de mídia paga.
        </>
      ) : (
        <>
          Você marcou que <strong>investe {faixaLabel}</strong> em ads. Olha o que muda no alcance
          acumulado quando parte do orçamento vira programa de TLG.
        </>
      )}
    </p>
  );
}

/**
 * Legenda no canto superior direito do wrapper do gráfico (jun/2026).
 * Era um bloco em cima do gráfico ocupando espaço vertical; agora absolute
 * no topo-direita pra liberar área do SVG e permitir simetria com os cards
 * na coluna esquerda. Background semi-transparente pra não atropelar a curva.
 */
function Legend() {
  return (
    <div className="absolute right-4 top-4 z-10 flex items-center gap-3 rounded-lg bg-card/85 px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground backdrop-blur-sm">
      <span className="inline-flex items-center gap-1.5">
        <span className="block h-[3px] w-[12px] rounded-sm bg-[#B8A4CC]" />
        Só ads
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="block h-[3px] w-[12px] rounded-sm bg-primary" />
        TLG com Boldfy
      </span>
    </div>
  );
}

/**
 * Wrapper do gráfico — flex container que estica vertical (`h-full`) pra
 * ocupar a mesma altura da coluna de cards à esquerda quando o grid é
 * `lg:items-stretch`. Mais padding lateral pro SVG ter espaço pros labels
 * "TLG com Boldfy" e "Só ads" no fim das linhas.
 */
function ChartWrapper({
  conceitual,
  children,
}: {
  conceitual: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex h-full min-h-[380px] flex-col rounded-xl border border-border bg-secondary/40 p-4 sm:p-5">
      {children}
      {conceitual && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#FBF7FD]/93 to-[#F5EDF8]/96 px-6 text-center">
          <div className="max-w-[300px]">
            <h4 className="mb-2 font-headline text-[15px] font-black leading-tight tracking-tight text-foreground">
              Cenário típico de empresa do seu porte
            </h4>
            <p className="text-[12.5px] leading-relaxed text-muted-foreground">
              Pra ver o gráfico personalizado, refaz o quiz e responde a faixa de gasto em ads.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ChartSvg({ adsData, elgData }: { adsData: number[]; elgData: number[] }) {
  const gradId = useId();
  const inflex = CHART.inflexaoIdx;

  const allValues = [...adsData, ...elgData];
  const max = (Math.max(...allValues) * 1.08) || 1;

  const adsPoints = adsData.map((v, i) => [xForMonth(i), yForValue(v, max)] as const);
  const elgPoints = elgData.map((v, i) => [xForMonth(i), yForValue(v, max)] as const);

  const sharedPath = buildPathFromPoints(adsPoints.slice(0, inflex + 1));
  const adsTrechoPath = buildPathFromPoints(adsPoints.slice(inflex));
  const elgTrechoPath = buildPathFromPoints(elgPoints.slice(inflex));

  // Área abaixo do trecho rosa (gradient sutil)
  const baselineY = CHART.padT + CHART_H;
  const firstElgX = elgPoints[inflex][0];
  const lastElgX = elgPoints[elgPoints.length - 1][0];
  const elgAreaPath = `${elgTrechoPath} L ${lastElgX} ${baselineY} L ${firstElgX} ${baselineY} Z`;

  // Y ticks
  const yTicks = 4;
  const yGrid: React.ReactElement[] = [];
  const yLabels: React.ReactElement[] = [];
  for (let i = 0; i <= yTicks; i++) {
    const v = (max * i) / yTicks;
    const y = yForValue(v, max);
    yGrid.push(
      <line
        key={`g${i}`}
        x1={CHART.padL}
        y1={y}
        x2={CHART.vbW - CHART.padR}
        y2={y}
        stroke="rgba(184,164,204,0.18)"
        strokeWidth={0.6}
      />,
    );
    yLabels.push(
      <text
        key={`yl${i}`}
        x={CHART.padL - 6}
        y={y + 3}
        textAnchor="end"
        fontFamily="Inter, sans-serif"
        fontSize={9}
        fill="#7A5C8C"
      >
        {formatNumberShort(v)}
      </text>,
    );
  }

  // X labels (Mês 1..6)
  const xLabels: React.ReactElement[] = [];
  for (let i = 0; i < 6; i++) {
    xLabels.push(
      <text
        key={`xl${i}`}
        x={xForMonth(i)}
        y={CHART.vbH - 14}
        textAnchor="middle"
        fontFamily="Inter, sans-serif"
        fontSize={10}
        fontWeight={600}
        fill="#7A5C8C"
      >
        Mês {i + 1}
      </text>,
    );
  }

  const inflexX = xForMonth(inflex);
  const finalAdsX = adsPoints[5][0];
  const finalAdsY = adsPoints[5][1];
  const finalElgX = elgPoints[5][0];
  const finalElgY = elgPoints[5][1];

  /* ---------- Animação (jun/2026 polish 3) ----------
     Bolinha que percorre a curva combinada (compartilhada M1-M3 + TLG M3-M6),
     em loop. Implementação via SMIL <animateMotion> seguindo o path do
     `combinedPath` (sharedPoints + elgPoints[inflex..5]).

     Sequência (dur=5.5s):
       0–2s    bolinha percorre o trecho compartilhado (M1 → M3) — fica
               cinza-escura (cor do trecho), sem brilho ainda.
       2–4s    bolinha sobe pela curva TLG (M3 → M6) — fica rosa primary,
               com glow sutil acompanhando.
       4–5.5s  pausa rápida no ponto final + reset.
     Usa repeatCount="indefinite" pra loopar enquanto a página estiver aberta.

     A mudança de cor M3→M6 é feita interpolando `fill` do círculo via
     <animate> em paralelo. */
  const combinedPoints = [...adsPoints.slice(0, inflex + 1), ...elgPoints.slice(inflex + 1)];
  const combinedPath = buildPathFromPoints(combinedPoints);
  const animationDurationS = 5.5;
  const animationKeyTimes = '0;0.36;0.73;1';
  // 36% = chegou no M3 (inflexão); 73% = chegou no M6 (final TLG); 100% = pausa

  return (
    <svg
      viewBox={`0 0 ${CHART.vbW} ${CHART.vbH}`}
      preserveAspectRatio="xMidYMid meet"
      className="block h-full min-h-0 w-full flex-1"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#CD50F1" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#CD50F1" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {yGrid}

      {/* Área sob a curva TLG */}
      <path d={elgAreaPath} fill={`url(#${gradId})`} stroke="none" />

      {/* Trecho compartilhado (M1 ao M3 inclusive) — cor neutra */}
      <path d={sharedPath} fill="none" stroke="#5E2A67" strokeWidth={2.6} strokeLinecap="round" opacity={0.55} />

      {/* Trecho "Só ads" (do M3 ao M6) */}
      <path d={adsTrechoPath} fill="none" stroke="#B8A4CC" strokeWidth={2.5} strokeLinecap="round" />

      {/* Trecho "TLG com Boldfy" (do M3 ao M6) */}
      <path d={elgTrechoPath} fill="none" stroke="#CD50F1" strokeWidth={3.2} strokeLinecap="round" />

      {/* Linha vertical "Boldfy entrou" */}
      <line
        x1={inflexX}
        y1={CHART.padT}
        x2={inflexX}
        y2={CHART.padT + CHART_H}
        stroke="rgba(205,80,241,0.5)"
        strokeWidth={1}
        strokeDasharray="4 4"
      />
      <text
        x={inflexX}
        y={CHART.padT - 8}
        textAnchor="middle"
        fontFamily="Inter, sans-serif"
        fontSize={10}
        fontWeight={700}
        fill="#CD50F1"
      >
        Boldfy entrou
      </text>

      {yLabels}
      {xLabels}

      {/* Pontos finais */}
      <circle cx={finalAdsX} cy={finalAdsY} r={3.5} fill="#B8A4CC" stroke="#FBF7FD" strokeWidth={1.5} />
      <circle cx={finalElgX} cy={finalElgY} r={4.5} fill="#CD50F1" stroke="#FBF7FD" strokeWidth={1.5} />

      {/* Bolinha animada (jun/2026 polish 3) — percorre a curva combinada
          em loop. Glow rosa puxa o olhar. Path animado vai do M1 ao M6
          atravessando a inflexão; a cor da bolinha interpola pra dar o
          efeito "cinza no shared → rosa na curva TLG" sem precisar de 2
          círculos separados. */}
      <circle r={6} fill="#CD50F1" opacity={0.95}>
        <animateMotion
          dur={`${animationDurationS}s`}
          repeatCount="indefinite"
          path={combinedPath}
          rotate="auto"
          keyTimes={animationKeyTimes}
          keyPoints="0;0.5;1;1"
          calcMode="linear"
        />
        <animate
          attributeName="fill"
          values="#5E2A67;#5E2A67;#CD50F1;#CD50F1"
          keyTimes={animationKeyTimes}
          dur={`${animationDurationS}s`}
          repeatCount="indefinite"
        />
        <animate
          attributeName="r"
          values="4;4;6;5"
          keyTimes={animationKeyTimes}
          dur={`${animationDurationS}s`}
          repeatCount="indefinite"
        />
      </circle>
      {/* Glow externo (segue a bolinha — 2º circle com mesmo animateMotion). */}
      <circle r={12} fill="#CD50F1" opacity={0}>
        <animateMotion
          dur={`${animationDurationS}s`}
          repeatCount="indefinite"
          path={combinedPath}
          keyTimes={animationKeyTimes}
          keyPoints="0;0.5;1;1"
          calcMode="linear"
        />
        <animate
          attributeName="opacity"
          values="0;0;0.3;0.15"
          keyTimes={animationKeyTimes}
          dur={`${animationDurationS}s`}
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}

/**
 * Card minimal. `stretch=true` faz o card crescer pra ocupar o restante
 * da altura disponível do flex parent (usado no earned media embaixo dos
 * 2 cards superiores). Conteúdo fica centralizado vertical quando estica.
 */
function MiniCard({
  label,
  valor,
  nota,
  highlight = false,
  stretch = false,
}: {
  label: string;
  valor: string;
  nota: React.ReactNode;
  highlight?: boolean;
  stretch?: boolean;
}) {
  const base = highlight
    ? 'rounded-xl border border-primary/30 bg-gradient-to-br from-primary/[0.06] to-card p-4'
    : 'rounded-xl border border-border bg-secondary/40 p-4';
  const stretchClasses = stretch ? ' flex-1 flex flex-col justify-center' : '';
  return (
    <div className={base + stretchClasses}>
      <div className="mb-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div
        className={
          highlight
            ? 'mb-1 font-headline text-[22px] font-black leading-tight text-primary'
            : 'mb-1 font-headline text-[22px] font-black leading-tight text-foreground'
        }
      >
        {valor}
      </div>
      <div className="text-[11.5px] leading-relaxed text-muted-foreground">{nota}</div>
    </div>
  );
}

function Disclaimer({
  seats,
  impressoesElgMes,
  custoBoldfyMensal,
}: {
  seats: number;
  impressoesElgMes: number;
  custoBoldfyMensal: number;
}) {
  const precoSeat = seats > 0 ? Math.round(custoBoldfyMensal / seats) : 0;
  return (
    <p className="mt-5 border-t border-dashed border-border pt-4 text-center text-[11.5px] leading-relaxed text-muted-foreground">
      Cálculo: gasto em ads usa o midpoint da faixa selecionada. Custo Boldfy: {seats} ativos × R${' '}
      {precoSeat}/seat (mesma tabela do simulador embaixo). Earned media:{' '}
      {impressoesElgMes.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} impressões × R$ 0,30
      (CPM conservador LinkedIn).
    </p>
  );
}
