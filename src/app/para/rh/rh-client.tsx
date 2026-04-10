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
  Heart,
  UserCheck,
  DollarSign,
  Award,
  AlertTriangle,
  Eye,
  Users,
  Clock,
  Monitor,
  PenTool,
  ChevronDown,
  Search,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Reusable sub-components (blue accent)                              */
/* ------------------------------------------------------------------ */

/** Pre-tag pill (blue accent) */
function PreTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-6 inline-block rounded-full border border-blue-500/[0.25] bg-blue-500/[0.08] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-blue-600">
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
  color = 'bg-blue-500',
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
          'linear-gradient(rgba(59,130,246,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.055) 1px, transparent 1px)',
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

export function RhClient() {
  const t = useT();
  const { openPopup } = useDemoPopup();
  const { openBuilder } = useProposalBuilder();
  const c = t.paraRh;

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
                onClick={() => openBuilder('rh:hero')}
              >
                {c.heroCta1}
                <ArrowRight className="ml-2 h-[18px] w-[18px]" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => openPopup('rh:hero')}>
                {c.heroCta2}
              </Button>
            </div>
          </div>

          {/* Visual — hero image placeholder + floating mini-card */}
          <div className="relative h-[420px] lg:h-[500px]">
            <div className="absolute inset-0 overflow-hidden rounded-3xl">
              <Image
                src="/images/para-rh-hero.jpeg"
                alt="Time de RH usando Employee Advocacy para employer branding autêntico com a Boldfy"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>

            {/* Mini floating card — Candidaturas Inbound */}
            <div className="absolute -bottom-[30px] -right-[20px] z-20 w-[290px] rounded-[14px] bg-card p-4 shadow-[0_16px_40px_rgba(15,10,24,0.15),0_0_0_1px_rgba(59,130,246,0.15)]">
              <div className="mb-3.5 flex items-center gap-3">
                <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-blue-500/[0.12] text-blue-500">
                  <UserCheck className="h-[19px] w-[19px]" />
                </div>
                <div>
                  <div className="font-headline text-[13px] font-black text-accent-foreground">
                    Candidaturas Inbound
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    vaga: Product Designer Sr
                  </div>
                </div>
              </div>
              {[
                { name: 'Mariana S.', via: 'via post Carla' },
                { name: 'João P.', via: 'via post Rafa' },
                { name: 'Bia M.', via: 'via post Carla' },
              ].map((row) => (
                <div
                  key={row.name}
                  className="flex items-center justify-between border-t border-border py-2 text-[11px]"
                >
                  <span className="font-semibold text-accent-foreground">
                    {row.name}
                  </span>
                  <span className="rounded-full bg-blue-500/[0.12] px-2 py-0.5 text-[9px] font-bold text-blue-500">
                    {row.via}
                  </span>
                </div>
              ))}
              <div className="mt-2.5 flex items-center justify-between border-t border-border pt-2.5">
                <div className="font-headline text-[22px] font-black leading-none text-blue-500">
                  12
                </div>
                <div className="text-right text-[10px] leading-[1.3] text-muted-foreground">
                  candidaturas qualificadas
                  <br />
                  esta semana
                </div>
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
                  <Search className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold text-accent-foreground">
                  {c.diagStat1}
                </span>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-foreground/[0.08] text-accent-foreground/70">
                  <DollarSign className="h-3.5 w-3.5" />
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

          {/* VS Card */}
          <div className="rounded-[20px] border border-border bg-card p-7 shadow-[0_20px_50px_rgba(93,42,103,0.1)]">
            <div className="mb-6 text-center">
              <div className="font-headline text-sm font-black text-accent-foreground">
                {c.diagVsTitle}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {c.diagVsSub}
              </div>
            </div>

            <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
              {/* Your company */}
              <div className="rounded-[14px] border border-border bg-accent-foreground/[0.04] p-[18px] text-center">
                <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  {c.diagVsYouLabel}
                </div>
                <div className="mb-3 flex h-9 items-center justify-center">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/40 shadow-[0_2px_6px_rgba(0,0,0,0.08)]">
                    <svg className="h-3.5 w-3.5 text-muted-foreground/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                    </svg>
                  </div>
                </div>
                <div className="mb-1 font-headline text-2xl font-black text-accent-foreground">
                  {c.diagVsYouValue}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {c.diagVsYouDesc}
                </div>
              </div>

              {/* VS divider */}
              <div className="hidden font-headline text-[13px] font-black text-muted-foreground sm:block">
                VS
              </div>

              {/* Competitor */}
              <div className="rounded-[14px] border border-blue-500/30 bg-blue-500/[0.12] p-[18px] text-center">
                <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.1em] text-blue-700">
                  {c.diagVsThemLabel}
                </div>
                <div className="mb-3 flex h-9 items-center justify-center">
                  {[2, 3, 4, 5, 6].map((n, i) => (
                    <Image
                      key={n}
                      src={`/images/avatar-${n}.jpeg`}
                      alt={`Colaborador do concorrente ${i + 1}`}
                      width={28}
                      height={28}
                      className="-ml-2 first:ml-0 rounded-full border-2 border-white shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
                    />
                  ))}
                </div>
                <div className="mb-1 font-headline text-2xl font-black text-blue-700">
                  {c.diagVsThemValue}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {c.diagVsThemDesc}
                </div>
              </div>
            </div>

            <div className="mt-5 border-t border-border pt-[18px] text-center text-xs font-semibold leading-[1.5] text-accent-foreground">
              {c.diagVsFooter}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S3 — DIFERENCIAÇÃO CRÍTICA (exclusiva RH)                    */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 py-20 md:px-12">
        <Glow className="right-[-100px] top-0 h-[700px] w-[700px] opacity-[0.07]" />

        <div className="relative z-10 mx-auto max-w-[1100px]">
          <div className="grid grid-cols-1 items-start gap-7 rounded-[20px] border border-border border-l-[4px] border-l-blue-500 bg-card p-9 shadow-[0_20px_50px_rgba(59,130,246,0.08)] lg:grid-cols-[auto_1fr]">
            {/* Icon */}
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/[0.12] text-blue-500">
              <AlertTriangle className="h-8 w-8" />
            </div>

            {/* Content */}
            <div className="min-w-0">
              <span className="mb-3 inline-block rounded-full border border-blue-500/30 bg-blue-500/[0.12] px-[11px] py-[5px] text-[10px] font-bold uppercase tracking-[0.12em] text-blue-500">
                {c.diffTag}
              </span>
              <h3 className="mb-4 font-headline text-[clamp(22px,2.6vw,30px)] font-black leading-[1.15] tracking-[-0.02em] text-accent-foreground">
                {c.diffTitle}{' '}
                <span className="bg-gradient-to-br from-blue-500 to-blue-300 bg-clip-text text-transparent">
                  {c.diffTitleHighlight}
                </span>
                {c.diffTitleEnd}
              </h3>
              <p className="mb-[6px] text-sm leading-[1.6] text-muted-foreground">
                {c.diffBody}
              </p>

              {/* Two-column comparison */}
              <div className="mt-[18px] grid grid-cols-1 gap-5 sm:grid-cols-2">
                {/* Left — Não somos */}
                <div className="rounded-xl border border-border bg-accent-foreground/[0.04] p-4">
                  <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                    {c.diffLeftLabel}
                  </div>
                  <div className="mb-2.5 font-headline text-sm font-black text-accent-foreground">
                    {c.diffLeftTitle}
                  </div>
                  <div className="flex flex-wrap gap-[5px]">
                    {[c.diffLeftTag1, c.diffLeftTag2, c.diffLeftTag3, c.diffLeftTag4, c.diffLeftTag5].map((tag) => (
                      <span
                        key={tag}
                        className="inline-block rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-semibold text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right — Somos */}
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/[0.12] p-4">
                  <div className="mb-2 text-[9px] font-bold uppercase tracking-[0.1em] text-blue-700">
                    {c.diffRightLabel}
                  </div>
                  <div className="mb-2.5 font-headline text-sm font-black text-accent-foreground">
                    {c.diffRightTitle}
                  </div>
                  <div className="flex flex-wrap gap-[5px]">
                    {[c.diffRightTag1, c.diffRightTag2, c.diffRightTag3, c.diffRightTag4, c.diffRightTag5].map((tag) => (
                      <span
                        key={tag}
                        className="inline-block rounded-full border border-blue-500/30 bg-white px-2.5 py-1 text-[10px] font-semibold text-blue-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S4 — VIRADA                                                  */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 py-24 md:px-12">
        <Glow className="right-[-100px] top-0 h-[700px] w-[700px] opacity-[0.08]" />

        <div className="relative z-10 mx-auto grid max-w-[1280px] grid-cols-1 items-stretch gap-14 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Photo (left) */}
          <div className="relative min-h-[400px] overflow-hidden rounded-3xl lg:min-h-[600px]">
            <Image
              src="/images/para-rh-virada.jpeg"
              alt="Profissional de RH ativando programa de employer branding com colaboradores pela Boldfy"
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

            {/* 4 cards */}
            <div className="mb-6 flex flex-col gap-3.5">
              {[
                { num: 1, icon: Heart, title: c.virada1Title, desc: c.virada1Desc },
                { num: 2, icon: UserCheck, title: c.virada2Title, desc: c.virada2Desc },
                { num: 3, icon: DollarSign, title: c.virada3Title, desc: c.virada3Desc },
                { num: 4, icon: Award, title: c.virada4Title, desc: c.virada4Desc },
              ].map((card) => (
                <div
                  key={card.num}
                  className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-[0_4px_20px_rgba(93,42,103,0.04)] transition-all duration-300 hover:translate-x-1 hover:border-blue-500/30 hover:shadow-[0_12px_32px_rgba(59,130,246,0.1)]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] bg-blue-500/[0.12] text-blue-500">
                    <card.icon className="h-[22px] w-[22px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div>
                      <span className="font-headline text-xs font-black text-blue-500 mr-1.5">
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
      </section>

      {/* ============================================================ */}
      {/*  S5 — NÚMEROS                                                 */}
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
            <strong className="font-bold text-blue-500">
              {c.numCenario}
            </strong>
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
                icon: Users,
                value: c.numStat2Value,
                label: c.numStat2Label,
                tags: [c.numStat2Tag1, c.numStat2Tag2],
              },
              {
                icon: Heart,
                value: c.numStat3Value,
                label: c.numStat3Label,
                tags: [c.numStat3Tag1, c.numStat3Tag2],
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center rounded-[18px] border border-border bg-card p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_16px_40px_rgba(59,130,246,0.12)]"
              >
                <div className="mx-auto mb-3.5 flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-blue-500/[0.12] text-blue-500">
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
                      className="inline-block rounded-full border border-blue-500/30 bg-blue-500/[0.12] px-2.5 py-1 text-[10px] font-semibold leading-[1.3] text-blue-700"
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
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S6 — CASO DE USO                                             */}
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
            <div className="pointer-events-none absolute left-[60px] right-[60px] top-[28px] hidden h-[2px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent lg:block" />

            {[
              { month: c.caso1Month, stat: c.caso1Stat, label: c.caso1Label, tags: [c.caso1Tag1, c.caso1Tag2, c.caso1Tag3] },
              { month: c.caso2Month, stat: c.caso2Stat, label: c.caso2Label, tags: [c.caso2Tag1, c.caso2Tag2, c.caso2Tag3] },
              { month: c.caso3Month, stat: c.caso3Stat, label: c.caso3Label, tags: [c.caso3Tag1, c.caso3Tag2, c.caso3Tag3] },
              { month: c.caso4Month, stat: c.caso4Stat, label: c.caso4Label, tags: [c.caso4Tag1, c.caso4Tag2, c.caso4Tag3] },
            ].map((marco) => (
              <div
                key={marco.month}
                className="relative z-[1] rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-[0_16px_40px_rgba(59,130,246,0.12)]"
              >
                <span className="mb-3.5 inline-flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-[7px] font-headline text-xs font-black text-white shadow-[0_4px_12px_rgba(59,130,246,0.3)]">
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
                      className="inline-block rounded-full border border-blue-500/30 bg-blue-500/[0.12] px-2.5 py-1 text-[10px] font-semibold leading-[1.3] text-blue-700"
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
      {/*  S7 — CAMINHOS                                                */}
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
                <ArrowRight className="h-[15px] w-[15px]" />
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
      {/*  S8 — FAQ                                                     */}
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
