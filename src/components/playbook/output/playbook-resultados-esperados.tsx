'use client';

/**
 * Bloco 4.5 — Resultados esperados (radar orgânico, jun/2026).
 *
 * Antes (mai/2026): grid empilhado de cards com Trophy icon. Funcionava
 * mas era visualmente estático, parecido com checklist.
 *
 * Agora (jun/2026): radar com a marca da empresa no centro emitindo
 * anéis pulsando (efeito sonar). Bolhas circulares orbitam ao redor —
 * cada uma com um resultado, mostra resumo curto (~2 palavras) por
 * default e expande pra frase completa no hover (tooltip rosa-escuro).
 *
 * Distribuição: ângulos não-cardeais (15°, 65°, 120°, 170°, 210°,
 * 260°, 305°, 340°) + 3 tamanhos de bolha rotacionando — quebra
 * sensação de tabuleiro. Flutuação suave de 8-12px em loop.
 *
 * Resumos curtos vêm de `RESULTADOS_SHORT_LABELS` em templates/index.ts
 * com fallback automático em `getResultadoShort`.
 *
 * Mobile (<768px): cai pro grid empilhado clássico — o radar precisa de
 * espaço lateral e fica apertado em viewports estreitos.
 */

import { Trophy } from 'lucide-react';
import { SectionTag } from './playbook-snapshot';
import { getResultadoShort } from '@/lib/playbook/templates';

export function PlaybookResultadosEsperados({
  resultados,
  empresa,
}: {
  resultados: string[];
  /** Nome da empresa pra colocar no centro do radar (jun/2026). */
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
        <p className="mb-8 max-w-[720px] text-sm leading-relaxed text-muted-foreground">
          Esses são os resultados típicos que aparecem nos 3 a 6 primeiros meses, quando o programa
          cobre os 3 motores: porquê, como e ferramenta.
        </p>

        {/* Desktop: radar orgânico. Mobile (< md): grid empilhado abaixo. */}
        <div className="hidden md:block">
          <Radar resultados={resultados} empresa={empresa} />
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
/*  Radar — centro + anéis + bolhas                                            */
/* -------------------------------------------------------------------------- */

/**
 * Distribuição angular orgânica de até 8 bolhas. Os ângulos foram escolhidos
 * pra NÃO bater nos pontos cardeais (0°/90°/180°/270°) nem nas diagonais
 * (45°/135°/225°/315°) — efeito menos "tabuleiro", mais "espaço".
 *
 * `distance` em pixels do centro do radar (max-width: 760px = raio útil
 * ~250px depois de descontar tamanho das bolhas e padding). Distâncias
 * variadas reforçam a sensação orgânica.
 *
 * Pra 6 resultados, usamos os 6 primeiros slots; pra 7, 7 primeiros; etc.
 * Acima de 8 resultados, módulo do array (raro — universais (4) + dor (até 2)
 * + budget (até 1) = 7 max).
 */
const RADAR_SLOTS: Array<{ angle: number; distance: number; size: 'sm' | 'md' | 'lg' }> = [
  { angle: 15,  distance: 215, size: 'md' },
  { angle: 65,  distance: 230, size: 'lg' },
  { angle: 120, distance: 215, size: 'md' },
  { angle: 170, distance: 220, size: 'sm' },
  { angle: 210, distance: 235, size: 'md' },
  { angle: 260, distance: 220, size: 'lg' },
  { angle: 305, distance: 240, size: 'sm' },
  { angle: 340, distance: 200, size: 'md' },
];

function Radar({ resultados, empresa }: { resultados: string[]; empresa: string }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[760px] px-4 py-6">
      {/* Background blob orgânico atrás do radar */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[-20px] z-0 rounded-full opacity-100"
        style={{
          background:
            'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(205,80,241,0.08), transparent 70%), radial-gradient(ellipse 40% 30% at 25% 35%, rgba(232,117,255,0.06), transparent 60%), radial-gradient(ellipse 35% 40% at 75% 65%, rgba(205,80,241,0.05), transparent 60%)',
          filter: 'blur(8px)',
        }}
      />
      {/* Estrelinhas no fundo */}
      <div
        aria-hidden
        className="resultados-radar-stars pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(1.5px 1.5px at 18% 22%, #CD50F1 50%, transparent),
            radial-gradient(1.5px 1.5px at 82% 28%, #E875FF 50%, transparent),
            radial-gradient(1px 1px at 55% 88%, #CD50F1 50%, transparent),
            radial-gradient(1px 1px at 12% 78%, #E875FF 50%, transparent),
            radial-gradient(1.5px 1.5px at 88% 62%, #CD50F1 50%, transparent),
            radial-gradient(1px 1px at 40% 12%, #E875FF 50%, transparent),
            radial-gradient(1px 1px at 65% 18%, #CD50F1 50%, transparent)
          `,
          backgroundSize: '100% 100%',
          animation: 'resultados-radar-twinkle 4s ease-in-out infinite',
        }}
      />

      {/* 3 anéis radar pulsando do centro */}
      {[
        { size: 260, delay: '0s' },
        { size: 400, delay: '1.3s' },
        { size: 560, delay: '2.6s' },
      ].map((a, i) => (
        <span
          key={i}
          aria-hidden
          className="resultados-radar-anel pointer-events-none absolute left-1/2 top-1/2 rounded-full border border-primary/40"
          style={{
            width: `${a.size}px`,
            height: `${a.size}px`,
            transform: 'translate(-50%, -50%) scale(0.5)',
            opacity: 0,
            animation: `resultados-radar-anel 4s ease-out infinite ${a.delay}`,
          }}
        />
      ))}

      {/* Centro: empresa */}
      <div
        className="absolute left-1/2 top-1/2 z-[5] flex h-[150px] w-[150px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-gradient-to-br from-[#CD50F1] to-[#E875FF] p-3 text-center text-white shadow-[0_8px_28px_rgba(205,80,241,0.30),inset_0_-8px_16px_rgba(94,42,103,0.25),inset_0_4px_12px_rgba(255,255,255,0.20)]"
      >
        <div className="mb-1 text-[9px] font-bold uppercase tracking-[0.15em] opacity-85">
          Sua marca
        </div>
        <div className="font-headline text-[22px] font-black leading-tight tracking-tight">
          {empresa}
        </div>
      </div>

      {/* Bolhas — uma pra cada resultado, posicionadas pelos slots */}
      {resultados.slice(0, RADAR_SLOTS.length).map((r, i) => {
        const slot = RADAR_SLOTS[i];
        const rad = (slot.angle * Math.PI) / 180;
        const x = Math.round(Math.cos(rad) * slot.distance);
        const y = Math.round(Math.sin(rad) * slot.distance);
        const driftIdx = i % 4;
        return (
          <RadarBolha
            key={i}
            x={x}
            y={y}
            size={slot.size}
            driftIdx={driftIdx}
            resumoCurto={getResultadoShort(r)}
            textoCompleto={r}
          />
        );
      })}
    </div>
  );
}

function RadarBolha({
  x,
  y,
  size,
  driftIdx,
  resumoCurto,
  textoCompleto,
}: {
  x: number;
  y: number;
  size: 'sm' | 'md' | 'lg';
  driftIdx: number;
  resumoCurto: string;
  textoCompleto: string;
}) {
  const dimensions = size === 'lg' ? 145 : size === 'md' ? 130 : 120;
  return (
    <div
      className="resultados-radar-bolha group absolute left-1/2 top-1/2 z-[2] flex cursor-default flex-col items-center justify-center rounded-full border-[1.5px] border-primary/20 bg-card p-3 text-center shadow-[0_6px_20px_rgba(93,42,103,0.06),0_12px_32px_rgba(205,80,241,0.08)] transition-[box-shadow,border-color] duration-300 hover:z-[10] hover:border-primary/55 hover:shadow-[0_10px_28px_rgba(93,42,103,0.10),0_20px_48px_rgba(205,80,241,0.30),0_0_0_4px_rgba(205,80,241,0.10)]"
      style={
        {
          width: `${dimensions}px`,
          height: `${dimensions}px`,
          '--rb-x': `${x}px`,
          '--rb-y': `${y}px`,
          transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
          animation: `resultados-radar-drift-${driftIdx} ${12 + driftIdx * 2}s ease-in-out infinite ${driftIdx * 0.4}s`,
        } as React.CSSProperties
      }
    >
      {/* hover pausa a animação (CSS native) */}
      <style>{`.resultados-radar-bolha:hover { animation-play-state: paused; }`}</style>

      <span className="mb-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary/12 to-primary-light/5 text-primary transition-[transform,background,color] duration-300 group-hover:rotate-[-8deg] group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-[#E875FF] group-hover:text-white">
        <Trophy className="h-3.5 w-3.5" />
      </span>
      <span className="font-headline text-[11px] font-extrabold leading-tight tracking-tight text-foreground">
        {resumoCurto}
      </span>

      {/* Tooltip com texto completo no hover */}
      <span
        className="pointer-events-none absolute bottom-[calc(100%+12px)] left-1/2 z-20 w-[220px] -translate-x-1/2 translate-y-1.5 rounded-lg bg-[#5E2A67] px-3 py-2 text-[11px] leading-snug text-white opacity-0 shadow-[0_8px_20px_rgba(94,42,103,0.25)] transition-[opacity,transform] duration-200 group-hover:translate-y-0 group-hover:opacity-100"
      >
        {textoCompleto}
        <span
          aria-hidden
          className="absolute -bottom-[5px] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45 bg-[#5E2A67]"
        />
      </span>
    </div>
  );
}
