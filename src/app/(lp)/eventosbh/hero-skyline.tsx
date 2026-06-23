'use client';

/**
 * Skyline de BH em pontilhismo pro hero da LP /eventosbh.
 *
 * Comportamento:
 *  - Campo de partículas (canvas) que se monta progressivamente da esquerda
 *    pra direita, formando a silhueta de monumentos de BH (Mineirão, arcos da
 *    Pampulha, prédio com torre de relógio, torre curva tipo Niemeyer, torres
 *    da São José), encostada na direita/borda do hero.
 *  - Hover no hero: as partículas se dispersam ("bagunça"); ao sair, remontam.
 *  - Paleta SÓ da ilustração: amarelo quente + branco + roxos da Boldfy.
 *  - `prefers-reduced-motion`: desenha a silhueta estática, sem animação.
 *  - Só desktop/tablet (≥640px) — no mobile some pra não competir com o texto.
 *  - Decorativo (aria-hidden) e `pointer-events: none` (não bloqueia o texto).
 */

import { useEffect, useRef } from 'react';

type Particle = {
  hx: number;
  hy: number;
  sx: number;
  sy: number;
  x: number;
  y: number;
  ph: number;
  sz: number;
  c: string;
  delay: number;
};

export function HeroSkyline() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cnv = canvasRef.current;
    if (!cnv) return;
    const host = cnv.parentElement;
    if (!host) return;
    const context = cnv.getContext('2d');
    if (!context) return;

    const ctx = context;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mql = window.matchMedia('(min-width: 640px)');

    let W = 0;
    let H = 0;
    let rL = 0;
    let RW = 0;
    let parts: Particle[] = [];
    let scatter = false;
    let buildStart = 0;
    let raf = 0;
    let retry: number | undefined;
    let started = false;

    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

    const pick = () => {
      const r = Math.random();
      if (r < 0.4) return '#F9B233'; // amarelo quente (predominante)
      if (r < 0.7) return '#ffffff'; // branco
      if (r < 0.88) return '#E0A4F7'; // roxo claro
      if (r < 0.96) return '#CD50F1'; // roxo vibrante
      return '#9840AD'; // roxo escuro
    };

    const skylinePoints = (): Array<[number, number]> => {
      const oc = document.createElement('canvas');
      oc.width = W;
      oc.height = H;
      const o = oc.getContext('2d');
      if (!o) return [];
      o.fillStyle = '#fff';
      rL = W * 0.3;
      RW = W - rL;
      const B = H;
      const bld = (xf: number, wf: number, hf: number) =>
        o.fillRect(rL + RW * xf, B - H * hf, RW * wf, H * hf);
      const dome = (xf: number, rxf: number, ryf: number) => {
        o.beginPath();
        o.ellipse(rL + RW * xf, B - H * 0.03, RW * rxf, H * ryf, 0, Math.PI, 2 * Math.PI);
        o.fill();
      };
      const spire = (xf: number, baseHf: number, topHf: number, wf: number) => {
        const x = rL + RW * xf;
        o.beginPath();
        o.moveTo(x - RW * wf, B - H * baseHf);
        o.lineTo(x, B - H * topHf);
        o.lineTo(x + RW * wf, B - H * baseHf);
        o.closePath();
        o.fill();
      };

      // Mineirão (cúpula rasa) + base
      dome(0.07, 0.1, 0.17);
      bld(-0.02, 0.17, 0.06);
      // Igrejinha da Pampulha (arcos ondulados) + campanário
      dome(0.235, 0.04, 0.16);
      dome(0.3, 0.04, 0.14);
      dome(0.365, 0.04, 0.12);
      bld(0.205, 0.22, 0.06);
      bld(0.39, 0.015, 0.27);
      // Prédio central com torre de relógio
      bld(0.44, 0.16, 0.33);
      bld(0.505, 0.04, 0.55);
      spire(0.525, 0.55, 0.64, 0.024);
      // Torre curva (tipo Niemeyer)
      bld(0.63, 0.046, 0.6);
      // Igreja São José (torres góticas gêmeas)
      bld(0.71, 0.18, 0.35);
      spire(0.75, 0.35, 0.63, 0.024);
      spire(0.86, 0.35, 0.63, 0.024);
      bld(0.8, 0.018, 0.43);
      // Torres modernas até a borda direita
      bld(0.9, 0.075, 0.51);
      bld(0.975, 0.05, 0.39);

      let data: Uint8ClampedArray;
      try {
        data = o.getImageData(0, 0, W, H).data;
      } catch {
        return [];
      }
      const res: Array<[number, number]> = [];
      const step = Math.max(5, Math.floor(W / 160));
      for (let y = 0; y < H; y += step) {
        for (let x = 0; x < W; x += step) {
          if (data[(y * W + x) * 4 + 3] > 128) res.push([x, y]);
        }
      }
      return res;
    };

    const build = () => {
      W = host.clientWidth;
      H = host.clientHeight;
      if (!W || !H) return;
      cnv.width = W * dpr;
      cnv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const pts = skylinePoints();
      parts = pts.map(([hx, hy]) => ({
        hx,
        hy,
        sx: clamp(hx + rnd(-1, 1) * W * 0.14, 0, W),
        sy: clamp(hy + rnd(-1, 1) * H * 0.34, 0, H),
        x: rnd(0, W),
        y: rnd(0, H),
        ph: Math.random() * 6.28,
        sz: rnd(0.7, 2),
        c: pick(),
        delay: ((hx - rL) / Math.max(1, RW)) * 1100 + rnd(0, 180),
      }));
      buildStart = performance.now();
    };

    const frame = (now: number) => {
      const t = now / 1000;
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        let tx: number;
        let ty: number;
        let active = true;
        if (scatter) {
          tx = p.sx;
          ty = p.sy;
        } else {
          if (now - buildStart < p.delay) active = false;
          tx = p.hx;
          ty = p.hy;
        }
        if (active) {
          p.x += (tx - p.x) * 0.08;
          p.y += (ty - p.y) * 0.08;
        }
        const tw = 0.5 + 0.5 * Math.sin(t * 1.7 + p.ph);
        ctx.globalAlpha = (0.3 + 0.55 * tw) * (scatter ? 0.7 : 1);
        ctx.fillStyle = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.sz, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      build();
      if (!parts.length) {
        retry = window.setTimeout(start, 80);
        return;
      }
      if (reduce) {
        ctx.clearRect(0, 0, W, H);
        for (const p of parts) {
          ctx.globalAlpha = 0.78;
          ctx.fillStyle = p.c;
          ctx.beginPath();
          ctx.arc(p.hx, p.hy, p.sz, 0, 6.2832);
          ctx.fill();
        }
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const maybeStart = () => {
      if (mql.matches && !started) {
        started = true;
        start();
      }
    };

    const onEnter = () => {
      scatter = true;
    };
    const onLeave = () => {
      scatter = false;
      buildStart = performance.now();
    };

    let rz: number | undefined;
    const onResize = () => {
      window.clearTimeout(rz);
      rz = window.setTimeout(() => {
        if (started) build();
      }, 150);
    };

    host.addEventListener('pointerenter', onEnter);
    host.addEventListener('pointerleave', onLeave);
    window.addEventListener('resize', onResize);
    mql.addEventListener('change', maybeStart);
    maybeStart();

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(retry);
      window.clearTimeout(rz);
      host.removeEventListener('pointerenter', onEnter);
      host.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('resize', onResize);
      mql.removeEventListener('change', maybeStart);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden h-full w-full sm:block"
    />
  );
}
