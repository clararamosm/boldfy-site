'use client';

import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  /** Valor final (ex: 128 pra "128k") */
  to: number;
  prefix?: string;
  suffix?: string;
  /** Duração em ms */
  duration?: number;
  decimals?: number;
  className?: string;
}

/**
 * Anima um número de 0 até `to` quando entra na viewport (uma vez).
 * Respeita prefers-reduced-motion (mostra o valor final direto).
 */
export function CountUp({
  to,
  prefix = '',
  suffix = '',
  duration = 1400,
  decimals = 0,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setVal(to);
      return;
    }

    let raf = 0;
    let started = false;

    const run = (start: number) => {
      const step = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setVal(to * eased);
        if (t < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !started) {
          started = true;
          run(performance.now());
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, duration]);

  const display = decimals > 0 ? val.toFixed(decimals) : Math.round(val).toString();

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
