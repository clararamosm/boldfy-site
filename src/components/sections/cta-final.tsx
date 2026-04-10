'use client';

import { useT } from '@/lib/i18n/context';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function CtaFinalSection() {
  const t = useT();

  return (
    <section className="relative overflow-hidden bg-background px-6 py-[100px] text-center md:px-12">
      {/* Centered glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary opacity-[0.10] blur-[140px]" />

      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(205,80,241,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(205,80,241,0.055) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage:
            'radial-gradient(ellipse at center, black 30%, transparent 80%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, black 30%, transparent 80%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-[760px]">
        <span className="mb-6 inline-block rounded-full border border-primary/[0.22] bg-primary/[0.08] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
          {t.home.ctaTag}
        </span>

        <h2 className="mb-4 font-headline text-[clamp(30px,4vw,46px)] font-black leading-[1.08] tracking-[-0.025em] text-accent-foreground">
          {t.home.ctaTitle}{' '}
          <span className="bg-gradient-to-br from-primary to-[#E875FF] bg-clip-text text-transparent">
            {t.home.ctaTitleHighlight}
          </span>
        </h2>

        <p className="mb-9 text-base leading-[1.55] text-muted-foreground">
          {t.home.ctaSubtitle}
        </p>

        <Link
          href="/precos"
          className="inline-flex items-center gap-2.5 rounded-xl bg-primary px-8 py-4 text-[15px] font-bold text-white shadow-[0_10px_28px_rgba(205,80,241,0.32)] transition-all duration-250 hover:-translate-y-0.5 hover:bg-[#d966f5] hover:shadow-[0_14px_36px_rgba(205,80,241,0.42)]"
        >
          {t.home.ctaCta1}
          <ArrowRight className="h-[18px] w-[18px]" />
        </Link>
      </div>
    </section>
  );
}
