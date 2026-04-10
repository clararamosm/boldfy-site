'use client';

import { useT } from '@/lib/i18n/context';
import {
  ArrowRight,
  Monitor,
  Rocket,
  Clock,
  Palette,
  MessageSquare,
  Link2,
} from 'lucide-react';
import Link from 'next/link';

/* ================================================================== */
/*  Visual 1 — Plataforma: avatars + stats                            */
/* ================================================================== */

const avatars = [
  { initials: 'MC', gradient: 'from-primary to-[#E875FF]' },
  { initials: 'RS', gradient: 'from-amber-400 to-orange-500' },
  { initials: 'AL', gradient: 'from-emerald-500 to-emerald-600' },
  { initials: 'JP', gradient: 'from-blue-500 to-indigo-500' },
  { initials: 'FT', gradient: 'from-pink-500 to-pink-400' },
  { initials: 'BN', gradient: 'from-[#9840AD] to-primary' },
  { initials: 'DM', gradient: 'from-cyan-500 to-cyan-600' },
  { initials: 'GK', gradient: 'from-violet-500 to-violet-400' },
  { initials: 'VL', gradient: 'from-rose-500 to-rose-400' },
];

function VisualPlataforma() {
  return (
    <div className="mb-5 rounded-[14px] border border-border bg-background p-4">
      {/* Label */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
          Seu time na plataforma
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
          9 colaboradores
        </span>
      </div>

      {/* Avatars */}
      <div className="mb-3 flex items-center pl-3">
        {avatars.map((a, i) => (
          <div
            key={a.initials}
            className={`-ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-card bg-gradient-to-br font-headline text-[11px] font-extrabold text-white shadow-sm transition-transform hover:-translate-y-1 hover:z-10 ${a.gradient}`}
            style={{ zIndex: i }}
          >
            {a.initials}
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
        <div>
          <p className="font-headline text-base font-black leading-none text-accent-foreground">
            4.850
          </p>
          <p className="mt-1 text-[9px] leading-tight text-muted-foreground">
            pontos distribuídos
          </p>
        </div>
        <div>
          <p className="font-headline text-base font-black leading-none text-accent-foreground">
            128k
          </p>
          <p className="mt-1 text-[9px] leading-tight text-muted-foreground">
            impressões do mês
          </p>
        </div>
        <div>
          <p className="font-headline text-base font-black leading-none text-accent-foreground">
            <span className="text-[11px] font-bold text-muted-foreground">
              R$
            </span>
            38,4k
          </p>
          <p className="mt-1 text-[9px] leading-tight text-muted-foreground">
            em mídia paga equivalente
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Visual 2 — Produção: 3 mini cards                                  */
/* ================================================================== */

function VisualProducao() {
  const items = [
    {
      icon: Clock,
      title: 'Estratégia',
      sub: 'Narrativa e pilares',
      iconBg: 'bg-primary/10 text-primary',
    },
    {
      icon: Palette,
      title: 'Design',
      sub: 'Peças sob demanda',
      iconBg: 'bg-amber-400/15 text-amber-500',
    },
    {
      icon: MessageSquare,
      title: 'Operação',
      sub: 'Publica e mede',
      iconBg: 'bg-emerald-500/10 text-emerald-500',
    },
  ];

  return (
    <div className="mb-5 grid grid-cols-3 gap-2 rounded-[14px] border border-border bg-background p-3">
      {items.map((item) => (
        <div
          key={item.title}
          className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-3 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${item.iconBg}`}
          >
            <item.icon className="h-[18px] w-[18px]" />
          </div>
          <p className="font-headline text-[11px] font-black leading-tight text-accent-foreground">
            {item.title}
          </p>
          <p className="text-[9px] text-muted-foreground">{item.sub}</p>
        </div>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Steps list                                                         */
/* ================================================================== */

function Steps({ items }: { items: string[] }) {
  return (
    <div className="mb-5">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
        Como funciona
      </p>
      <div className="flex flex-col gap-2.5">
        {items.map((text, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-primary/10 font-headline text-[10px] font-extrabold text-primary">
              {i + 1}
            </div>
            <p className="text-[12.5px] font-medium leading-[1.45] text-accent-foreground">
              {text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Section                                                            */
/* ================================================================== */

export function SolutionsBentoSection() {
  const t = useT();

  return (
    <section className="relative bg-background px-6 py-16 md:px-12 md:py-24">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute left-[-100px] top-[-10%] h-[700px] w-[700px] rounded-full bg-primary opacity-[0.08] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[10%] right-[-50px] h-[500px] w-[500px] rounded-full bg-[#E875FF] opacity-[0.06] blur-[120px]" />

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

      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Header */}
        <div className="mx-auto mb-14 max-w-[1100px] text-center md:mb-16">
          <span className="mb-5 inline-block rounded-full border border-primary/20 bg-primary/[0.08] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
            {t.home.solutionsTag}
          </span>
          <h2 className="mb-4 font-headline text-[clamp(28px,4vw,44px)] font-black leading-[1.08] tracking-[-0.025em] text-accent-foreground">
            {t.home.solutionsTitle}{' '}
            <span className="bg-gradient-to-br from-primary to-[#E875FF] bg-clip-text text-transparent">
              {t.home.solutionsTitleHighlight}
            </span>
          </h2>
          <p className="mx-auto max-w-[1100px] text-base leading-relaxed text-muted-foreground">
            {t.home.solutionsSubtitle}
          </p>
        </div>

        {/* 2-card grid */}
        <div className="grid grid-cols-1 gap-7 md:grid-cols-2">
          {/* ── Card 1: Plataforma (SaaS) ── */}
          <div className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-[0_8px_32px_rgba(93,42,103,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-[0_20px_48px_rgba(93,42,103,0.14)] md:p-8">
            {/* Tag */}
            <span className="mb-4 inline-flex items-center gap-2 self-start rounded-full border border-primary/20 bg-primary/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
              <Monitor className="h-3 w-3" />
              {t.home.solSaasTag}
            </span>

            {/* Title + desc */}
            <h3 className="mb-2.5 font-headline text-[26px] font-black leading-[1.1] tracking-[-0.022em] text-accent-foreground">
              {t.home.solSaasTitle}
            </h3>
            <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
              {t.home.solSaasDesc}
            </p>

            {/* Visual */}
            <VisualPlataforma />

            {/* Steps */}
            <Steps
              items={[
                t.home.solSaasStep1,
                t.home.solSaasStep2,
                t.home.solSaasStep3,
                t.home.solSaasStep4,
                t.home.solSaasStep5,
              ]}
            />

            {/* Footer: price + CTA */}
            <div className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  A partir de
                </p>
                <p className="font-headline text-[22px] font-black leading-[1.1] tracking-[-0.02em] text-accent-foreground">
                  <span className="text-sm font-bold text-muted-foreground">
                    R$
                  </span>
                  {t.home.solSaasPrice}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {t.home.solSaasPriceUnit}
                </p>
              </div>
              <Link
                href="/solucoes/software-as-a-service"
                className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-5 py-3 text-[13px] font-bold text-white shadow-[0_6px_18px_rgba(205,80,241,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#d966f5] hover:shadow-[0_10px_24px_rgba(205,80,241,0.38)]"
              >
                {t.home.solSaasCta}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* ── Card 2: Produção (CaaS) ── */}
          <div className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-[0_8px_32px_rgba(93,42,103,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-[0_20px_48px_rgba(93,42,103,0.14)] md:p-8">
            {/* Tag */}
            <span className="mb-4 inline-flex items-center gap-2 self-start rounded-full border border-primary/20 bg-primary/[0.08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
              <Rocket className="h-3 w-3" />
              {t.home.solCaasTag}
            </span>

            {/* Title + desc */}
            <h3 className="mb-2.5 font-headline text-[26px] font-black leading-[1.1] tracking-[-0.022em] text-accent-foreground">
              {t.home.solCaasTitle}
            </h3>
            <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
              {t.home.solCaasDesc}
            </p>

            {/* Visual */}
            <VisualProducao />

            {/* Steps */}
            <Steps
              items={[
                t.home.solCaasStep1,
                t.home.solCaasStep2,
                t.home.solCaasStep3,
                t.home.solCaasStep4,
                t.home.solCaasStep5,
              ]}
            />

            {/* Sub-verticals: Design on Demand + Content Full-Service */}
            <div className="mt-auto grid grid-cols-2 gap-2.5 border-t border-border pt-5">
              <div className="flex flex-col gap-3 rounded-xl border border-border bg-background p-3.5 transition-colors hover:border-primary/30">
                <div>
                  <p className="font-headline text-[13px] font-black leading-tight text-accent-foreground">
                    {t.home.solCaasSub1Title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    a partir de{' '}
                    <strong className="font-extrabold text-primary">
                      {t.home.solCaasSub1Price}
                    </strong>
                    /mês
                  </p>
                </div>
                <Link
                  href="/solucoes/content-as-a-service"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[11px] font-bold text-white shadow-[0_4px_12px_rgba(205,80,241,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#d966f5] hover:shadow-[0_6px_16px_rgba(205,80,241,0.38)]"
                >
                  {t.home.solCaasCta}
                  <ArrowRight className="h-2.5 w-2.5" />
                </Link>
              </div>
              <div className="flex flex-col gap-3 rounded-xl border border-border bg-background p-3.5 transition-colors hover:border-primary/30">
                <div>
                  <p className="font-headline text-[13px] font-black leading-tight text-accent-foreground">
                    {t.home.solCaasSub2Title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    a partir de{' '}
                    <strong className="font-extrabold text-primary">
                      {t.home.solCaasSub2Price}
                    </strong>
                    /mês
                  </p>
                </div>
                <Link
                  href="/solucoes/content-as-a-service"
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[11px] font-bold text-white shadow-[0_4px_12px_rgba(205,80,241,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#d966f5] hover:shadow-[0_6px_16px_rgba(205,80,241,0.38)]"
                >
                  {t.home.solCaasCta}
                  <ArrowRight className="h-2.5 w-2.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Connection hint */}
        <div className="mx-auto mt-10 flex max-w-[720px] items-center justify-center gap-2.5 rounded-[14px] border border-dashed border-primary/30 bg-primary/[0.05] px-6 py-4 text-[13px] text-primary/80">
          <Link2 className="h-4 w-4 shrink-0 text-primary" />
          <span>
            {t.home.solutionsHint.split('mesma plataforma')[0]}
            <strong className="font-extrabold text-accent-foreground">
              mesma plataforma
            </strong>
            {t.home.solutionsHint.split('mesma plataforma')[1]}
          </span>
        </div>
      </div>
    </section>
  );
}
