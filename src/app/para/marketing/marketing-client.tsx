'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { useDemoPopup } from '@/components/forms/demo-popup';
import { useProposalBuilder } from '@/components/proposal-builder';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Compass,
  Wrench,
  Trophy,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  Eye,
  Monitor,
  PenTool,
  ChevronDown,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Reusable sub-components                                            */
/* ------------------------------------------------------------------ */

/** Pre-tag pill (green accent) */
function PreTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-6 inline-block rounded-full border border-green-500/[0.25] bg-green-500/[0.08] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-green-600">
      {children}
    </span>
  );
}

/** Section heading with gradient highlight */
function SectionHeading({
  title,
  highlight,
  className = '',
}: {
  title: string;
  highlight: string;
  className?: string;
}) {
  return (
    <h2
      className={`font-headline text-[clamp(28px,3.4vw,40px)] font-black leading-[1.1] tracking-[-0.025em] text-accent-foreground ${className}`}
    >
      {title}{' '}
      <span className="bg-gradient-to-br from-primary to-[#E875FF] bg-clip-text text-transparent">
        {highlight}
      </span>
    </h2>
  );
}

/** Ambient glow circle */
function Glow({
  className,
  color = 'bg-green-500',
}: {
  className: string;
  color?: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full ${color} blur-[120px] ${className}`}
    />
  );
}

/** Grid pattern overlay */
function GridPattern() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          'linear-gradient(rgba(16,185,129,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.055) 1px, transparent 1px)',
        backgroundSize: '64px 64px',
        maskImage:
          'radial-gradient(ellipse at center, black 30%, transparent 80%)',
        WebkitMaskImage:
          'radial-gradient(ellipse at center, black 30%, transparent 80%)',
      }}
    />
  );
}

/** FAQ accordion item */
function FaqItem({
  question,
  children,
  isOpen,
  onToggle,
}: {
  question: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[14px] border bg-card transition-all duration-250 ${
        isOpen
          ? 'border-primary shadow-[0_8px_24px_rgba(205,80,241,0.12)]'
          : 'border-border hover:border-primary/35'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-6 py-[22px] text-left transition-colors hover:text-primary"
        aria-expanded={isOpen}
      >
        <span className="text-[15px] font-bold leading-[1.35] text-accent-foreground">
          {question}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-primary transition-transform duration-350 ${
            isOpen ? 'rotate-180' : ''
          }`}
          style={{
            transitionTimingFunction: 'cubic-bezier(.2,.9,.3,1)',
          }}
        />
      </button>
      <div
        className={`grid transition-all duration-400 ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
        style={{
          transitionTimingFunction: 'cubic-bezier(.2,.9,.3,1)',
        }}
      >
        <div className="overflow-hidden">
          <div className="px-6 pb-[22px] text-sm leading-[1.65] text-muted-foreground">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page component                                                */
/* ------------------------------------------------------------------ */

export function MarketingClient() {
  const t = useT();
  const { openPopup } = useDemoPopup();
  const { openBuilder } = useProposalBuilder();
  const c = t.paraMarketing;

  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const toggleFaq = (i: number) =>
    setFaqOpen((prev) => (prev === i ? null : i));

  return (
    <>
      {/* ============================================================ */}
      {/*  S1 — HERO                                                    */}
      {/* ============================================================ */}
      <section className="relative flex min-h-[90vh] items-center overflow-hidden bg-background px-6 py-24 md:px-12">
        <Glow className="right-[-150px] top-[-10%] h-[700px] w-[700px] opacity-[0.10]" />
        <Glow
          className="bottom-[-100px] left-[-50px] h-[500px] w-[500px] opacity-[0.12]"
          color="bg-primary"
        />
        <GridPattern />

        <div className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-[60px]">
          {/* Text */}
          <div>
            <PreTag>{c.heroTag}</PreTag>
            <h1 className="font-headline text-[clamp(36px,4.6vw,58px)] font-black leading-[1.05] tracking-[-0.035em] text-accent-foreground">
              {c.heroTitle}{' '}
              <span className="bg-gradient-to-br from-primary to-[#E875FF] bg-clip-text text-transparent">
                {c.heroTitleHighlight}
              </span>
            </h1>
            <p className="mt-7 max-w-[540px] text-base leading-[1.6] text-muted-foreground">
              {c.heroSubtitle}
            </p>
            <div className="mt-9 flex flex-wrap gap-3.5">
              <Button
                size="lg"
                className="font-bold shadow-[0_8px_24px_rgba(205,80,241,0.28)]"
                onClick={openBuilder}
              >
                {c.heroCta1}
                <ArrowRight className="ml-2 h-[18px] w-[18px]" />
              </Button>
              <Button variant="outline" size="lg" onClick={openPopup}>
                {c.heroCta2}
              </Button>
            </div>
          </div>

          {/* Visual — hero image + floating mini-card */}
          <div className="relative h-[420px] lg:h-[500px]">
            <div className="absolute inset-0 overflow-hidden rounded-3xl">
              <Image
                src="/images/para-marketing-hero.jpeg"
                alt="Marketing team collaborating"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>

            {/* Mini floating card */}
            <div className="absolute -bottom-[30px] -right-[20px] z-20 flex w-[280px] items-center gap-3.5 rounded-[14px] bg-card p-4 shadow-[0_16px_40px_rgba(15,10,24,0.15),0_0_0_1px_rgba(16,185,129,0.15)]">
              <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-green-500/[0.12] text-green-500">
                <TrendingUp className="h-[22px] w-[22px]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  Impressões orgânicas
                </div>
                <div className="font-headline text-[22px] font-black leading-none tracking-[-0.02em] text-accent-foreground">
                  128k
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  <strong className="font-bold text-green-500">+47%</strong> vs
                  mês anterior
                </div>
              </div>
              {/* Mini bar chart */}
              <div className="flex h-8 shrink-0 items-end gap-[3px]">
                {[35, 50, 42, 68, 78, 100].map((h, i) => (
                  <div
                    key={i}
                    className="w-[5px] rounded-t bg-gradient-to-b from-green-500 to-green-700"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S2 — DIAGNÓSTICO                                             */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 py-24 md:px-12">
        <Glow
          className="left-[-100px] top-[30%] h-[600px] w-[600px] opacity-[0.05]"
          color="bg-primary"
        />

        <div className="relative z-10 mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-[60px]">
          {/* Text */}
          <div>
            <PreTag>{c.diagTag}</PreTag>
            <SectionHeading
              title={c.diagTitle}
              highlight={c.diagTitleHighlight}
              className="mb-6"
            />

            {/* Stat chips */}
            <div className="mb-6 flex flex-wrap gap-3">
              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-foreground/[0.08] text-accent-foreground/70">
                  <TrendingUp className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold text-accent-foreground">
                  {c.diagStat1}
                </span>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-foreground/[0.08] text-accent-foreground/70">
                  <Eye className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold text-accent-foreground">
                  {c.diagStat2}
                </span>
              </div>
            </div>

            <div className="space-y-3.5 text-[15px] leading-[1.65] text-muted-foreground">
              <p>{c.diagBody1}</p>
              <p>{c.diagBody2}</p>
            </div>
          </div>

          {/* CAC Chart Card */}
          <div className="rounded-[20px] border border-border bg-card p-7 shadow-[0_20px_50px_rgba(93,42,103,0.1)]">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-headline text-sm font-black text-accent-foreground">
                {c.diagChartTitle}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-foreground/[0.08] px-2.5 py-1 text-[10px] font-bold text-accent-foreground/70">
                <TrendingUp className="h-[11px] w-[11px]" />
                {c.diagChartPill}
              </span>
            </div>

            {/* SVG chart */}
            <svg
              className="h-[180px] w-full"
              viewBox="0 0 320 180"
              preserveAspectRatio="none"
            >
              <line x1="0" y1="45" x2="320" y2="45" stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="3 4" />
              <line x1="0" y1="90" x2="320" y2="90" stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="3 4" />
              <line x1="0" y1="135" x2="320" y2="135" stroke="hsl(var(--border))" strokeWidth="1" strokeDasharray="3 4" />
              <defs>
                <linearGradient id="cacGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--accent-foreground))" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="hsl(var(--accent-foreground))" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M 10 140 L 70 125 L 130 100 L 190 75 L 250 45 L 310 20 L 310 180 L 10 180 Z" fill="url(#cacGrad)" />
              <path d="M 10 140 L 70 125 L 130 100 L 190 75 L 250 45 L 310 20" fill="none" stroke="hsl(var(--accent-foreground))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {[[10,140],[70,125],[130,100],[190,75],[250,45]].map(([cx,cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="4" fill="hsl(var(--card))" stroke="hsl(var(--accent-foreground))" strokeWidth="2" />
              ))}
              <circle cx="310" cy="20" r="5" fill="hsl(var(--accent-foreground))" />
              {['Q1','Q2','Q3','Q4','Q1+1'].map((label, i) => (
                <text key={label} x={10 + i * 60 + (i === 4 ? 8 : 0)} y="172" fill="hsl(var(--muted-foreground))" fontSize="9" fontFamily="Inter">{label}</text>
              ))}
              <text x="294" y="172" fill="hsl(var(--accent-foreground))" fontSize="9" fontFamily="Inter" fontWeight="700">Hoje</text>
            </svg>

            {/* Bottom stats */}
            <div className="mt-5 grid grid-cols-3 gap-3.5 border-t border-border pt-5">
              {[
                { value: c.diagCacYoy, label: c.diagCacYoyLabel },
                { value: c.diagRoasYoy, label: c.diagRoasYoyLabel },
                { value: c.diagCurtidas, label: c.diagCurtidasLabel },
              ].map((s) => (
                <div key={s.label}>
                  <div className="font-headline text-lg font-black leading-none text-accent-foreground">
                    {s.value}
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S3 — VIRADA                                                  */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 py-24 md:px-12">
        <Glow className="right-[-100px] top-0 h-[700px] w-[700px] opacity-[0.08]" />

        <div className="relative z-10 mx-auto grid max-w-[1280px] grid-cols-1 items-stretch gap-14 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Photo (left) */}
          <div className="relative min-h-[400px] overflow-hidden rounded-3xl lg:min-h-[600px]">
            <Image
              src="/images/para-marketing-virada.jpeg"
              alt="Como a Boldfy resolve"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
          </div>

          {/* Content (right) */}
          <div className="flex flex-col">
            <div className="mb-7">
              <PreTag>{c.viradaTag}</PreTag>
              <SectionHeading
                title={c.viradaTitle}
                highlight={c.viradaTitleHighlight}
                className="mb-4"
              />
              <p className="text-[15px] leading-[1.6] text-muted-foreground">
                {c.viradaIntro}
              </p>
            </div>

            {/* 3 cards */}
            <div className="mb-6 flex flex-col gap-3.5">
              {[
                { num: 1, icon: Compass, title: c.virada1Title, desc: c.virada1Desc },
                { num: 2, icon: Wrench, title: c.virada2Title, desc: c.virada2Desc },
                { num: 3, icon: Trophy, title: c.virada3Title, desc: c.virada3Desc },
              ].map((card) => (
                <div
                  key={card.num}
                  className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-[0_4px_20px_rgba(93,42,103,0.04)] transition-all duration-300 hover:translate-x-1 hover:border-green-500/30 hover:shadow-[0_12px_32px_rgba(16,185,129,0.1)]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] bg-green-500/[0.12] text-green-500">
                    <card.icon className="h-[22px] w-[22px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div>
                      <span className="font-headline text-xs font-black text-green-500 mr-1.5">
                        {card.num}.
                      </span>
                      <h3 className="inline font-headline text-[17px] font-black tracking-[-0.015em] text-accent-foreground">
                        {card.title}
                      </h3>
                    </div>
                    <p className="mt-1.5 text-[13px] leading-[1.5] text-muted-foreground">
                      {card.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Resultado block (full-width below) */}
        <div className="relative z-10 mx-auto mt-14 max-w-[1280px]">
          <div className="rounded-[18px] border border-green-500/30 bg-green-500/[0.06] p-6 md:p-7">
            <span className="mb-3.5 inline-block text-[10px] font-bold uppercase tracking-[0.12em] text-green-700">
              Resultado
            </span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-x-6">
              {[c.result1, c.result2, c.result3, c.result4].map((r) => (
                <div key={r} className="flex items-start gap-2.5 text-[13px] leading-[1.45] text-accent-foreground">
                  <div className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-green-500 text-white">
                    <Check className="h-[11px] w-[11px]" />
                  </div>
                  {r}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S4 — NÚMEROS                                                 */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 py-24 md:px-12">
        <Glow
          className="right-[-50px] top-[20%] h-[600px] w-[600px] opacity-[0.08]"
          color="bg-primary"
        />

        <div className="relative z-10 mx-auto max-w-[1200px]">
          {/* Header */}
          <div className="mx-auto mb-4 max-w-[720px] text-center">
            <PreTag>{c.numTag}</PreTag>
            <SectionHeading title={c.numTitle} highlight={c.numTitleHighlight} />
          </div>

          <p className="mx-auto mb-10 text-center text-[13px] text-muted-foreground">
            Cenário base:{' '}
            <strong className="font-bold text-green-500">
              20 colaboradores ativos publicando 2x por mês
            </strong>{' '}
            · CPM LinkedIn Brasil R$ 300/mil
          </p>

          {/* Stats grid — KPI card wider */}
          <div className="mb-6 grid grid-cols-1 gap-[18px] md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.5fr]">
            {/* Metric cards */}
            {[
              {
                icon: Eye,
                value: c.numStat1Value,
                label: c.numStat1Label,
                tags: [c.numStat1Tag1, c.numStat1Tag2],
              },
              {
                icon: DollarSign,
                value: c.numStat2Value,
                label: c.numStat2Label,
                tags: [c.numStat2Tag1, c.numStat2Tag2],
              },
              {
                icon: Users,
                value: c.numStat3Value,
                label: c.numStat3Label,
                tags: [c.numStat3Tag1, c.numStat3Tag2],
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center rounded-[18px] border border-border bg-card p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-green-500/30 hover:shadow-[0_16px_40px_rgba(16,185,129,0.12)]"
              >
                <div className="mx-auto mb-3.5 flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-green-500/[0.12] text-green-500">
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className="mb-1.5 font-headline text-[22px] font-black leading-none tracking-[-0.025em] text-accent-foreground">
                  {stat.value}
                </div>
                <div className="mb-3.5 text-[11px] leading-[1.4] text-muted-foreground">
                  {stat.label}
                </div>
                <div className="mt-auto flex flex-wrap justify-center gap-[5px]">
                  {stat.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block rounded-full border border-green-500/30 bg-green-500/[0.12] px-2.5 py-1 text-[10px] font-semibold leading-[1.3] text-green-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {/* KPI card (wider, purple) */}
            <div className="flex flex-col items-center rounded-[18px] border border-border bg-card p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_16px_40px_rgba(205,80,241,0.12)]">
              <div className="mx-auto mb-3.5 flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-secondary text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div className="mb-1.5 font-headline text-lg font-black leading-[1.1] tracking-[-0.02em] text-accent-foreground">
                {c.numKpiTitle}
              </div>
              {/* Spacer to push tags down */}
              <div className="mb-3.5" />
              <div className="mt-auto flex flex-wrap justify-center gap-[5px] w-full">
                {[
                  c.numKpiTag1,
                  c.numKpiTag2,
                  c.numKpiTag3,
                  c.numKpiTag4,
                  c.numKpiTag5,
                  c.numKpiTag6,
                ].map((tag) => (
                  <span
                    key={tag}
                    className="inline-block rounded-full border border-primary/25 bg-secondary px-2.5 py-1 text-[10px] font-semibold leading-[1.3] text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <p className="mx-auto mb-8 max-w-[720px] text-center text-xs italic leading-[1.5] text-muted-foreground">
            {c.numDisclaimer}
          </p>

          <div className="text-center">
            <Link
              href="/precos#simulador"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-[22px] py-[13px] text-sm font-bold text-primary transition-all duration-250 hover:border-primary hover:bg-secondary"
            >
              {c.numCta}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S5 — CASO DE USO                                             */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 py-24 md:px-12">
        <Glow className="bottom-0 left-[-100px] h-[600px] w-[600px] opacity-[0.07]" />

        <div className="relative z-10 mx-auto max-w-[1200px]">
          <div className="mb-8 max-w-[760px]">
            <PreTag>{c.casoTag}</PreTag>
            <SectionHeading
              title={c.casoTitle}
              highlight={c.casoTitleHighlight}
              className="mb-3.5"
            />
            <p className="text-xs italic text-muted-foreground">
              {c.casoNota}
            </p>
          </div>

          {/* Timeline cards */}
          <div className="relative grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
            {/* Connecting line (desktop only) */}
            <div className="pointer-events-none absolute left-[60px] right-[60px] top-[28px] hidden h-[2px] bg-gradient-to-r from-transparent via-green-500/30 to-transparent lg:block" />

            {[
              { month: c.caso1Month, stat: c.caso1Stat, label: c.caso1Label, tags: [c.caso1Tag1, c.caso1Tag2, c.caso1Tag3] },
              { month: c.caso2Month, stat: c.caso2Stat, label: c.caso2Label, tags: [c.caso2Tag1, c.caso2Tag2, c.caso2Tag3] },
              { month: c.caso3Month, stat: c.caso3Stat, label: c.caso3Label, tags: [c.caso3Tag1, c.caso3Tag2, c.caso3Tag3] },
              { month: c.caso4Month, stat: c.caso4Stat, label: c.caso4Label, tags: [c.caso4Tag1, c.caso4Tag2, c.caso4Tag3] },
            ].map((marco) => (
              <div
                key={marco.month}
                className="relative z-[1] rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-green-500/30 hover:shadow-[0_16px_40px_rgba(16,185,129,0.12)]"
              >
                <span className="mb-3.5 inline-flex items-center gap-1.5 rounded-lg bg-green-500 px-3 py-[7px] font-headline text-xs font-black text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]">
                  {marco.month}
                </span>
                <div className="mb-1.5 font-headline text-[22px] font-black leading-none tracking-[-0.02em] text-accent-foreground">
                  {marco.stat}
                </div>
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                  {marco.label}
                </div>
                <div className="flex flex-wrap gap-[5px]">
                  {marco.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block rounded-full border border-green-500/30 bg-green-500/[0.12] px-2.5 py-1 text-[10px] font-semibold leading-[1.3] text-green-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S6 — CAMINHOS                                                */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 py-24 md:px-12">
        <Glow
          className="right-[-100px] top-[10%] h-[700px] w-[700px] opacity-[0.08]"
          color="bg-primary"
        />

        <div className="relative z-10 mx-auto max-w-[1200px]">
          <div className="mb-14 max-w-[820px]">
            <PreTag>{c.camTag}</PreTag>
            <SectionHeading
              title={c.camTitle}
              highlight={c.camTitleHighlight}
              className="mb-4"
            />
            <p className="text-[15px] leading-[1.6] text-muted-foreground">
              {c.camIntro}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* SaaS card */}
            <div className="flex flex-col rounded-3xl border border-border bg-card p-9 transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_20px_48px_rgba(205,80,241,0.14)]">
              <span className="mb-[22px] inline-flex items-center gap-2 self-start rounded-full border border-primary/25 bg-secondary px-3.5 py-[7px] text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
                <Monitor className="h-[13px] w-[13px]" />
                {c.cam1Tag}
              </span>
              <h3 className="mb-3 font-headline text-[26px] font-black leading-[1.1] tracking-[-0.02em] text-accent-foreground">
                {c.cam1Title}
              </h3>
              <p className="mb-7 flex-1 text-sm leading-[1.6] text-muted-foreground">
                {c.cam1Desc}
              </p>
              <Link
                href="/solucoes/software-as-a-service"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-[22px] py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(205,80,241,0.25)] transition-all duration-250 hover:-translate-y-0.5 hover:bg-[#d966f5] hover:shadow-[0_12px_28px_rgba(205,80,241,0.38)]"
              >
                {c.cam1Cta}
                <ArrowRight className="h-[15px] w-[15px] transition-transform duration-250 group-hover:translate-x-[3px]" />
              </Link>
            </div>

            {/* CaaS card */}
            <div className="flex flex-col rounded-3xl border border-border bg-card p-9 transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/35 hover:shadow-[0_20px_48px_rgba(249,115,22,0.14)]">
              <span className="mb-[22px] inline-flex items-center gap-2 self-start rounded-full border border-orange-500/25 bg-orange-500/[0.08] px-3.5 py-[7px] text-[11px] font-bold uppercase tracking-[0.12em] text-orange-500">
                <PenTool className="h-[13px] w-[13px]" />
                {c.cam2Tag}
              </span>
              <h3 className="mb-3 font-headline text-[26px] font-black leading-[1.1] tracking-[-0.02em] text-accent-foreground">
                {c.cam2Title}
              </h3>
              <p className="mb-7 flex-1 text-sm leading-[1.6] text-muted-foreground">
                {c.cam2Desc}
              </p>
              <Link
                href="/solucoes/content-as-a-service"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-[22px] py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(205,80,241,0.25)] transition-all duration-250 hover:-translate-y-0.5 hover:bg-[#d966f5] hover:shadow-[0_12px_28px_rgba(205,80,241,0.38)]"
              >
                {c.cam2Cta}
                <ArrowRight className="h-[15px] w-[15px]" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S7 — FAQ                                                     */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 pb-10 pt-24 md:px-12">
        <Glow
          className="right-[-100px] top-[10%] h-[600px] w-[600px] opacity-[0.08]"
          color="bg-primary"
        />
        <GridPattern />

        <div className="relative z-10 mx-auto max-w-[900px]">
          <div className="mb-14 text-center">
            <PreTag>{c.faqTag}</PreTag>
            <SectionHeading title={c.faqTitle} highlight={c.faqTitleHighlight} />
          </div>

          <div className="flex flex-col gap-3">
            {[
              { q: c.faq1Q, a: c.faq1A },
              { q: c.faq2Q, a: c.faq2A },
              { q: c.faq3Q, a: c.faq3A },
              { q: c.faq4Q, a: c.faq4A },
              { q: c.faq5Q, a: c.faq5A },
            ].map((faq, i) => (
              <FaqItem
                key={faq.q}
                question={faq.q}
                isOpen={faqOpen === i}
                onToggle={() => toggleFaq(i)}
              >
                <p>{faq.a}</p>
              </FaqItem>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
