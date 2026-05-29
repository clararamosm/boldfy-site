'use client';

/**
 * Bloco 4.5 — Resultados esperados (rede orgânica, jun/2026 polish 5).
 *
 * Histórico curto:
 * - Mai/2026: grid empilhado clássico de cards com Trophy icon.
 * - Jun/2026 #1: radar circular com bolhas redondas — Clara achou
 *   "monstruoso" (muito espaço vazio, radial demais, sem dinamismo).
 * - Jun/2026 #2 (ATUAL): rede orgânica. Marca pulsa no centro (efeito
 *   sonar). Tags-pílulas espalhadas em posições semi-aleatórias (não
 *   distribuídas em ângulos uniformes), com algumas linhas tracejadas
 *   conectando centro↔tag E tag↔tag pra formar teia. Flutuação ampliada
 *   (10-14px). Mais tags (até 12) porque os labels viraram keywords
 *   curtas que cabem em pílula.
 *
 * Mobile (<md): grid empilhado clássico — rede não funciona em viewport
 * estreito.
 */

import { SectionTag } from './playbook-snapshot';
import { getResultadoShort } from '@/lib/playbook/templates';
import { Trophy } from 'lucide-react';

export function PlaybookResultadosEsperados({
  resultados,
  empresa,
}: {
  resultados: string[];
  /** Nome da empresa pra colocar no centro pulsando (jun/2026). */
  empresa: string;
}) {
  if (!resultados || resultados.length === 0) return null;

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-[1080px] px-6">
        <SectionTag>Resultados esperados</SectionTag>
        <h2 className="mb-2 font-headline text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          O que vocês{' '}
          <span className="bg-gradient-to-br from-[#CD50F1] to-[#E875FF] bg-clip-text text-transparent">
            podem destravar
          </span>
        </h2>
        <p className="mb-6 max-w-[720px] text-sm leading-relaxed text-muted-foreground">
          Esses são os resultados típicos que aparecem nos 3 a 6 primeiros meses, quando o programa
          cobre os 3 motores: porquê, como e ferramenta.
        </p>

        {/* Desktop: rede orgânica. Mobile (<md): grid empilhado. */}
        <div className="hidden md:block">
          <RedeOrganica resultados={resultados} empresa={empresa} />
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 md:hidden">
          {resultados.map((r, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-[0_4px_16px_rgba(93,42,103,.04)]"
            >
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Trophy className="h-3.5 w-3.5" />
              </span>
              <span className="text-[14px] leading-snug text-foreground">{r}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Rede orgânica — marca pulsando no centro + tags-pílulas espalhadas         */
/* -------------------------------------------------------------------------- */

/**
 * Posições das tags em coordenadas (x, y) em pixels do centro do canvas
 * 800×520 (viewBox -400 -260 800 520). Posições CURADAS — não geradas em
 * runtime — pra garantir que não sobrepõem o centro (raio 100px) nem
 * entre si (distância mínima ~130px entre tags), mas semi-aleatórias o
 * suficiente pra NÃO formar padrão radial. Mistura de distâncias (perto
 * e longe) reforça a aleatoriedade.
 *
 * driftIdx (0-3): seleciona qual keyframe @resultados-radar-drift-* a tag
 * usa pra flutuação. 4 keyframes diferentes garantem que tags vizinhas não
 * floatam em sincronia (importante: animações em sync parecem grid).
 */
const TAG_POSITIONS: Array<{ x: number; y: number; driftIdx: number }> = [
  { x: -280, y: -160, driftIdx: 0 },
  { x:  -40, y: -210, driftIdx: 1 },
  { x:  180, y: -180, driftIdx: 2 },
  { x:  320, y:  -40, driftIdx: 3 },
  { x:  290, y:  130, driftIdx: 0 },
  { x:   40, y:  215, driftIdx: 1 },
  { x: -200, y:  210, driftIdx: 2 },
  { x: -310, y:   60, driftIdx: 3 },
  { x: -160, y:  -60, driftIdx: 1 },
  { x:  170, y:  -50, driftIdx: 2 },
  { x: -100, y:  140, driftIdx: 3 },
  { x:  200, y:   80, driftIdx: 0 },
];

/**
 * Pares de conexão (linhas tracejadas no SVG de fundo). Mistura:
 *   - Algumas conexões centro (0,0) → tag (sugere "emana da marca")
 *   - Algumas conexões tag → tag (sugere "resultados se reforçam entre si")
 * Não é exaustivo (só algumas conexões pra ficar teia visual sem virar
 * spaghetti). Índices se referem ao TAG_POSITIONS acima.
 */
const TAG_CONNECTIONS: Array<[number, number] | [null, number]> = [
  // Centro → algumas tags (não todas — só as "linhas mestras")
  [null, 0], [null, 2], [null, 5], [null, 7], [null, 9], [null, 10],
  // Tag → tag (forma triângulos/teia entre vizinhas)
  [0, 8],  // -280,-160 ↔ -160,-60
  [1, 9],  // -40,-210 ↔ 170,-50
  [2, 3],  // 180,-180 ↔ 320,-40
  [4, 11], // 290,130 ↔ 200,80
  [5, 10], // 40,215 ↔ -100,140
  [6, 7],  // -200,210 ↔ -310,60
  [8, 1],  // -160,-60 ↔ -40,-210
];

function RedeOrganica({ resultados, empresa }: { resultados: string[]; empresa: string }) {
  // Limita a 12 (capacidade do TAG_POSITIONS). Empresas raras com mais
  // resultados (universais + 2 dores + budget = max 7 hoje) sempre cabem.
  const tags = resultados.slice(0, TAG_POSITIONS.length).map((r, i) => ({
    short: getResultadoShort(r),
    long: r,
    pos: TAG_POSITIONS[i],
  }));

  return (
    <div className="relative mx-auto h-[560px] w-full max-w-[920px] overflow-visible">
      {/* Background blob orgânico — sem cantos, sem retângulo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[-20px] z-0"
        style={{
          background:
            'radial-gradient(ellipse 55% 55% at 50% 50%, rgba(205,80,241,0.07), transparent 70%), radial-gradient(ellipse 35% 30% at 22% 30%, rgba(232,117,255,0.05), transparent 60%), radial-gradient(ellipse 30% 35% at 78% 70%, rgba(205,80,241,0.04), transparent 60%)',
          filter: 'blur(10px)',
        }}
      />

      {/* SVG das conexões em teia (centro↔tag + tag↔tag). viewBox cobre
          800x520 ao redor do centro pra coincidir com as coords das tags. */}
      <svg
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 z-[1] -translate-x-1/2 -translate-y-1/2"
        viewBox="-400 -260 800 520"
        width="100%"
        style={{ maxWidth: 920 }}
      >
        {TAG_CONNECTIONS.map(([from, to], i) => {
          const fromPos = from === null ? { x: 0, y: 0 } : TAG_POSITIONS[from];
          const toPos = TAG_POSITIONS[to];
          if (!toPos) return null;
          return (
            <line
              key={i}
              x1={fromPos.x}
              y1={fromPos.y}
              x2={toPos.x}
              y2={toPos.y}
              stroke="rgba(205,80,241,0.20)"
              strokeWidth="1"
              strokeDasharray="2 6"
            />
          );
        })}
      </svg>

      {/* Centro: marca com pulse (efeito sonar — vem da Opção C) */}
      <div className="absolute left-1/2 top-1/2 z-[5] -translate-x-1/2 -translate-y-1/2">
        <span
          aria-hidden
          className="resultados-rede-pulse pointer-events-none absolute left-1/2 top-1/2 h-[150px] w-[150px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-primary/45"
        />
        <span
          aria-hidden
          className="resultados-rede-pulse pointer-events-none absolute left-1/2 top-1/2 h-[150px] w-[150px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-primary/45"
          style={{ animationDelay: '1.4s' }}
        />
        <div
          className="relative flex h-[140px] w-[140px] flex-col items-center justify-center rounded-full bg-gradient-to-br from-[#CD50F1] to-[#E875FF] p-3 text-center text-white shadow-[0_12px_36px_rgba(205,80,241,0.40),inset_0_-8px_16px_rgba(94,42,103,0.25),inset_0_4px_12px_rgba(255,255,255,0.20),0_0_60px_rgba(205,80,241,0.20)]"
        >
          <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.15em] opacity-85">
            Sua marca
          </div>
          <div className="font-headline text-[22px] font-black leading-tight tracking-tight">
            {empresa}
          </div>
        </div>
      </div>

      {/* Tags espalhadas */}
      {tags.map((t, i) => (
        <RedeTag
          key={i}
          x={t.pos.x}
          y={t.pos.y}
          driftIdx={t.pos.driftIdx}
          short={t.short}
          long={t.long}
        />
      ))}
    </div>
  );
}

function RedeTag({
  x,
  y,
  driftIdx,
  short,
  long,
}: {
  x: number;
  y: number;
  driftIdx: number;
  short: string;
  long: string;
}) {
  return (
    <div
      className="resultados-rede-tag group absolute left-1/2 top-1/2 z-[3] inline-flex cursor-default items-center gap-2 whitespace-nowrap rounded-full border border-primary/25 bg-card px-4 py-2 font-headline text-[12px] font-bold text-foreground shadow-[0_4px_14px_rgba(93,42,103,0.06)] transition-[box-shadow,border-color,transform] duration-300 hover:z-[10] hover:border-primary/55 hover:shadow-[0_8px_20px_rgba(205,80,241,0.22),0_0_0_3px_rgba(205,80,241,0.10)]"
      style={
        {
          // CSS vars consumidas pelo keyframe @resultados-rede-drift-*
          '--rb-x': `${x}px`,
          '--rb-y': `${y}px`,
          transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
          animation: `resultados-rede-drift-${driftIdx} ${11 + driftIdx * 2}s ease-in-out infinite ${driftIdx * 0.4}s`,
        } as React.CSSProperties
      }
      title={long}
    >
      <span className="block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
      <span>{short}</span>
    </div>
  );
}
