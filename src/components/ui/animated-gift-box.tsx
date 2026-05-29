/**
 * <AnimatedGiftBox />
 *
 * Caixinha de presente animada com confetti, extraída do `MiniGift` em
 * `src/components/sections/product-motion.tsx` (seção "Tese Boldfy → gamificação
 * vira hábito" da home). Reutilizada aqui pra:
 *   1. Callout do pacote de design grátis na Dica 04 do Playbook ELG.
 *   2. Banner SEM_BUDGET acima da calculadora.
 *
 * Animações vivem em globals.css (.mini-gift-wrap / .gift-box / .gift-lid /
 * .gift-bow / .confetti-piece). Wrapper aplica `group/gift` pra triggerar no
 * hover ou em `data-animate-on-mount` pra disparar uma vez no mount.
 */

'use client';

import { useEffect, useRef, useState } from 'react';

export function AnimatedGiftBox({
  size = 'md',
  /**
   * Quando true, dispara a animação de abertura uma vez no mount em vez de
   * esperar hover. Útil pra callouts onde a pessoa não vai necessariamente
   * passar o mouse (ex: callout do pacote de design grátis na Dica 04).
   */
  animateOnMount = false,
  /**
   * Quando definido, controla o estado da caixinha externamente (jun/2026).
   * - `true` → caixinha aberta + confetti (mesma animação do hover).
   * - `false` → caixinha fechada.
   * Útil quando o trigger de animação é o hover do CONTAINER pai (ex: banner
   * beta inteiro), não do próprio gift. Sobrepõe `animateOnMount` quando
   * presente; sem ele, comportamento padrão é animar no hover do próprio gift.
   */
  open,
}: {
  size?: 'sm' | 'md';
  animateOnMount?: boolean;
  open?: boolean;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [forceAnimate, setForceAnimate] = useState(false);

  useEffect(() => {
    if (!animateOnMount) return;
    // Pequeno delay pra animação ser percebida (não dispara junto com o
    // mount do card pai).
    const t = setTimeout(() => setForceAnimate(true), 200);
    return () => clearTimeout(t);
  }, [animateOnMount]);

  // Estado final de "abrir caixinha":
  // - `open` (controlled) tem prioridade quando definido.
  // - Senão usa forceAnimate (que vem de animateOnMount).
  // - Senão depende de :hover puro do próprio wrapper via CSS.
  const isOpen = open ?? forceAnimate;

  // Sizes: md = original (100x110 box, 200 wrapper); sm = compacto pra usar
  // dentro de callouts inline (64x70 box, 96 wrapper).
  const dims =
    size === 'sm'
      ? { wrap: 96, box: 64, boxW: 70, bow: 9 }
      : { wrap: 200, box: 100, boxW: 110, bow: 14 };

  return (
    <div
      ref={wrapperRef}
      className={`mini-gift-wrap group/gift relative flex cursor-default items-center justify-center ${isOpen ? 'gift-force-animate' : ''}`}
      style={{ width: dims.wrap, height: dims.wrap }}
      aria-hidden="true"
    >
      <div
        className="gift-box relative transition-transform duration-500"
        style={{ height: dims.box, width: dims.boxW }}
      >
        {/* Box base */}
        <div className="absolute bottom-0 left-0 h-[70%] w-full rounded-lg bg-gradient-to-br from-primary to-[#E875FF] shadow-[0_8px_24px_rgba(205,80,241,0.35),inset_0_-8px_16px_rgba(94,42,103,0.2)]">
          <div className="absolute left-1/2 top-0 h-full w-4 -translate-x-1/2 bg-gradient-to-b from-amber-400 to-amber-600 shadow-[inset_0_0_8px_rgba(0,0,0,0.15)]" />
        </div>
        {/* Lid */}
        <div className="gift-lid absolute left-[-6%] top-0 z-[2] h-[32%] w-[112%] origin-bottom rounded-t-lg bg-gradient-to-br from-[#E875FF] to-primary shadow-[0_4px_12px_rgba(205,80,241,0.4),inset_0_-4px_8px_rgba(94,42,103,0.15)]">
          <div className="absolute left-1/2 top-0 h-full w-[18px] -translate-x-1/2 bg-gradient-to-b from-amber-400 to-amber-600 shadow-[inset_0_0_8px_rgba(0,0,0,0.15)]" />
        </div>
        {/* Bow */}
        <div className="gift-bow absolute -top-3.5 left-1/2 z-[3] -translate-x-1/2">
          <div
            className="absolute top-0 -rotate-[20deg] rounded-[50%_50%_0_50%] bg-gradient-to-br from-amber-400 to-amber-600 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.15)]"
            style={{ left: `-${dims.bow}px`, height: dims.bow + 4, width: dims.bow }}
          />
          <div
            className="absolute top-0 rotate-[20deg] scale-x-[-1] rounded-[50%_50%_0_50%] bg-gradient-to-br from-amber-400 to-amber-600 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.15)]"
            style={{ right: `-${dims.bow}px`, height: dims.bow + 4, width: dims.bow }}
          />
        </div>

        {/* Confetti */}
        {CONFETTI_COLORS.map((color, i) => (
          <span
            key={i}
            className={`confetti-piece absolute left-1/2 top-[30%] h-3 w-2 opacity-0 ${color} ${i % 2 === 0 ? '' : 'rounded-full'}`}
            style={
              {
                '--confetti-index': i,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}

const CONFETTI_COLORS = [
  'bg-primary',
  'bg-amber-400',
  'bg-emerald-500',
  'bg-[#E875FF]',
  'bg-orange-500',
  'bg-primary',
  'bg-amber-400',
  'bg-emerald-500',
  'bg-[#E875FF]',
  'bg-primary',
];
