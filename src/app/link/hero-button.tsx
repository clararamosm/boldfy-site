'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight } from 'lucide-react';

const CONFETTI_COLORS = [
  '#CD50F1',
  '#E875FF',
  '#9840AD',
  '#F59E0B',
  '#10B981',
  '#3B82F6',
];

/**
 * Botão herói da LP /link (criar o Playbook).
 * Borda com gradiente girando + pulse vêm do CSS (.link-hero-frame /
 * .link-hero-pulse). Aqui mora a interação-assinatura: confetti no clique,
 * e só então navega. Respeita prefers-reduced-motion (navega direto, sem
 * confetti) e cliques com modificador (deixa abrir em nova aba).
 */
export function HeroButton({ href }: { href: string }) {
  const router = useRouter();
  const ref = useRef<HTMLAnchorElement>(null);

  function fireConfetti() {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    for (let i = 0; i < 22; i++) {
      const p = document.createElement('div');
      p.className = 'link-confetti';
      p.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      p.style.left = `${cx}px`;
      p.style.top = `${cy}px`;
      document.body.appendChild(p);
      const ang = Math.PI * 2 * (i / 22) + (Math.random() - 0.5);
      const dist = 90 + Math.random() * 120;
      const dx = Math.cos(ang) * dist;
      const dy = Math.sin(ang) * dist - 60;
      const rot = `${Math.random() * 720 - 360}deg`;
      p.animate(
        [
          { transform: 'translate(-50%, -50%) rotate(0deg) scale(1)', opacity: 1 },
          {
            transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rot}) scale(0.6)`,
            opacity: 0,
          },
        ],
        { duration: 900 + Math.random() * 400, easing: 'cubic-bezier(.2,.7,.3,1)' },
      );
      window.setTimeout(() => p.remove(), 1400);
    }
  }

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    e.preventDefault();
    fireConfetti();
    window.setTimeout(() => router.push(href), 550);
  }

  return (
    <div className="link-hero-frame w-full">
      <span className="link-hero-pulse" aria-hidden="true" />
      <a
        ref={ref}
        href={href}
        onClick={handleClick}
        className="relative z-[1] flex w-full items-center justify-center gap-2.5 rounded-[13.5px] bg-gradient-to-br from-primary to-[#9840AD] px-6 py-[19px] text-base font-bold text-white shadow-[0_10px_30px_rgba(205,80,241,0.32)] transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_16px_40px_rgba(205,80,241,0.45)]"
      >
        <Sparkles className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
        Criar meu Playbook
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-[0.08em]">
          grátis
        </span>
        <ArrowRight className="h-[18px] w-[18px] shrink-0" strokeWidth={2.5} />
      </a>
    </div>
  );
}
