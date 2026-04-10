'use client';

import { useT } from '@/lib/i18n/context';
import { User } from 'lucide-react';
import Link from 'next/link';

export function ManifestoSection() {
  const t = useT();

  return (
    <section
      id="manifesto"
      className="relative w-full overflow-hidden px-6 py-11 md:px-12"
      style={{
        background:
          'linear-gradient(180deg, #0F0A18 0%, #1A0E2E 50%, #2D1445 100%)',
      }}
    >
      {/* Ambient glows */}
      <div className="pointer-events-none absolute left-[10%] top-[-10%] h-[600px] w-[600px] rounded-full bg-primary opacity-[0.20] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[5%] h-[500px] w-[500px] rounded-full bg-[#E875FF] opacity-[0.15] blur-[120px]" />
      <div className="pointer-events-none absolute left-[40%] top-[40%] h-[400px] w-[400px] rounded-full bg-[#F59E0B] opacity-[0.05] blur-[120px]" />

      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(205,80,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(205,80,241,0.05) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage:
            'radial-gradient(ellipse at center, black 30%, transparent 80%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, black 30%, transparent 80%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-[60px]">
        {/* ── Block 1: Manifesto text ── */}
        <div>
          <span className="mb-[18px] inline-block rounded-full border border-primary/[0.28] bg-primary/[0.12] px-3 py-[5px] text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
            {t.home.manifestoTag}
          </span>

          <div className="font-headline text-[clamp(15px,1.4vw,17px)] font-semibold leading-[1.5] tracking-[-0.005em] text-white">
            <p className="mb-2.5">
              O{' '}
              <strong className="font-black">marketing corporativo</strong>{' '}
              {t.home.manifestoBody1.split('marketing corporativo')[1]?.split('quem ele escuta são as pessoas')[0]}
              <strong className="font-black">
                quem ele escuta são as pessoas
              </strong>
              .
            </p>
            <p className="mb-2.5">{t.home.manifestoBody2}</p>
            <p>
              {t.home.manifestoBody3.split('sem perder a alma')[0]}
              <strong className="font-black">sem perder a alma</strong>.
            </p>
          </div>
        </div>

        {/* ── Block 2: Founder card ── */}
        <div className="mx-auto w-full max-w-[380px] lg:mx-0">
          <div className="rounded-2xl border border-white/[0.12] bg-white/[0.06] p-5 backdrop-blur-[20px]">
            {/* Header */}
            <div className="mb-3.5 flex items-center gap-3.5">
              {/* Photo placeholder */}
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-dashed border-primary/50 text-white/60"
                style={{
                  background:
                    'repeating-linear-gradient(45deg, rgba(205,80,241,.25), rgba(205,80,241,.25) 6px, rgba(205,80,241,.35) 6px, rgba(205,80,241,.35) 12px)',
                }}
              >
                <User className="h-[22px] w-[22px]" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-headline text-base font-black leading-[1.15] tracking-[-0.015em] text-white">
                  {t.home.founderName}
                </p>
                <p className="text-[11px] font-semibold text-white/55">
                  {t.home.founderRole}
                </p>
              </div>
            </div>

            {/* Bio */}
            <p className="mb-4 text-xs leading-[1.5] text-white/70">
              {t.home.founderBio}
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-3.5 border-t border-white/10 pt-3.5">
              <div className="flex flex-col">
                <span className="font-headline text-base font-black leading-none tracking-[-0.02em] text-white">
                  {t.home.founderFollowers}
                </span>
                <span className="mt-[3px] text-[9px] font-semibold uppercase tracking-[0.06em] text-white/50">
                  seguidores
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline text-base font-black leading-none tracking-[-0.02em] text-white">
                  {t.home.founderYears}
                </span>
                <span className="mt-[3px] text-[9px] font-semibold uppercase tracking-[0.06em] text-white/50">
                  anos no B2B
                </span>
              </div>
              <Link
                href="https://www.linkedin.com/in/clararamos"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="ml-auto flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/15 bg-white/[0.08] text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:shadow-[0_6px_16px_rgba(205,80,241,0.35)]"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
