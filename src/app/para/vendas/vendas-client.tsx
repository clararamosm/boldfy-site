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
  Eye,
  Clock,
  TrendingUp,
  MessageSquare,
  Target,
  Trophy,
  Monitor,
  ChevronDown,
  Mail,
  Inbox,
  BadgeCheck,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Reusable sub-components (amber accent)                             */
/* ------------------------------------------------------------------ */

/** Pre-tag pill (amber accent) */
function PreTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-6 inline-block rounded-full border border-amber-500/[0.35] bg-amber-500/[0.14] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-amber-700">
      {children}
    </span>
  );
}

/** Section heading with gradient highlight */
function SectionHeading({
  title,
  highlight,
  suffix,
  className = '',
}: {
  title: string;
  highlight: string;
  suffix?: string;
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
      {suffix}
    </h2>
  );
}

/** Ambient glow circle */
function Glow({
  className,
  color = 'bg-amber-500',
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
          'linear-gradient(rgba(205,80,241,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(205,80,241,0.055) 1px, transparent 1px)',
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

export function VendasClient() {
  const t = useT();
  const { openPopup } = useDemoPopup();
  const { openBuilder } = useProposalBuilder();
  const c = t.paraVendas;

  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const toggleFaq = (i: number) =>
    setFaqOpen((prev) => (prev === i ? null : i));

  return (
    <>
      {/* ============================================================ */}
      {/*  S1 — HERO                                                    */}
      {/* ============================================================ */}
      <section className="relative flex min-h-[90vh] items-center overflow-hidden bg-background px-6 py-24 md:px-12">
        <Glow className="right-[-150px] top-[-10%] h-[700px] w-[700px] opacity-[0.12]" />
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
                onClick={() => openBuilder('vendas:hero')}
              >
                {c.heroCta1}
                <ArrowRight className="ml-2 h-[18px] w-[18px]" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => openPopup('vendas:hero')}>
                {c.heroCta2}
              </Button>
            </div>
          </div>

          {/* Visual — hero image + floating mini-card (prospect engajou) */}
          <div className="relative h-[420px] lg:h-[500px]">
            <div className="absolute inset-0 overflow-hidden rounded-3xl">
              <Image
                src="/images/para-vendas-hero.jpeg"
                alt="Time de vendas B2B usando Social Selling estruturado com a Boldfy"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>

            {/* Mini floating card — prospect engajou */}
            <div className="absolute -bottom-[30px] -right-[20px] z-20 w-[300px] rounded-[14px] bg-card p-4 shadow-[0_16px_40px_rgba(15,10,24,0.15),0_0_0_1px_rgba(245,158,11,0.2)]">
              <div className="mb-2.5 flex items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-700 font-headline text-sm font-black text-white">
                  JS
                </div>
                <div className="flex-1">
                  <div className="font-headline text-[13px] font-black leading-tight text-accent-foreground">
                    João Silva
                  </div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    CMO · Empresa X (prospect)
                  </div>
                </div>
                <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.2)]" />
              </div>
              <div className="mb-1.5 flex items-center gap-2 rounded-[9px] bg-amber-500/[0.14] px-3 py-2 text-[11px] font-semibold text-amber-700">
                <Eye className="h-3.5 w-3.5 shrink-0" />
                Viu seu post sobre GTM B2B
              </div>
              <div className="mb-1.5 flex items-center gap-2 rounded-[9px] bg-amber-500/[0.14] px-3 py-2 text-[11px] font-semibold text-amber-700">
                <BadgeCheck className="h-3.5 w-3.5 shrink-0" />
                Salvou o post
              </div>
              <div className="text-right text-[10px] italic text-muted-foreground">
                há 2 minutos
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
                  <Mail className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-semibold text-accent-foreground">
                  {c.diagStat1}
                </span>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-foreground/[0.08] text-accent-foreground/70">
                  <Clock className="h-3.5 w-3.5" />
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

          {/* Inbox mockup — sequência de cold outreach morta */}
          <div className="rounded-[20px] border border-border bg-card p-7 shadow-[0_20px_50px_rgba(93,42,103,0.1)]">
            <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
              <div>
                <div className="font-headline text-sm font-black text-accent-foreground">
                  Sequência de cold outreach
                </div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">
                  SDR · 7 emails · 100 contas
                </div>
              </div>
              <div className="text-right">
                <div className="font-headline text-xl font-black leading-none text-accent-foreground/70">
                  2%
                </div>
                <div className="mt-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  taxa resposta
                </div>
              </div>
            </div>

            <div className="space-y-0">
              {[
                { n: 1, subj: 'Oi [Nome], posso te mostrar como a gente...', status: 'silêncio', reply: false },
                { n: 2, subj: 'Follow-up: viu meu último email?', status: 'silêncio', reply: false },
                { n: 3, subj: 'Caso de sucesso similar ao seu cenário', status: 'não, obrigado', reply: true },
                { n: 4, subj: 'Breaking the pattern: 3 insights rápidos', status: 'silêncio', reply: false },
                { n: 5, subj: 'Último toque antes de encerrar...', status: 'silêncio', reply: false },
              ].map((mail, i, arr) => (
                <div
                  key={mail.n}
                  className={`flex items-center gap-3 py-[11px] text-xs ${
                    i < arr.length - 1 ? 'border-b border-dashed border-border' : ''
                  }`}
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent-foreground/[0.08] text-[10px] font-bold text-accent-foreground/70">
                    {mail.n}
                  </div>
                  <div className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-muted-foreground">
                    {mail.subj}
                  </div>
                  {mail.reply ? (
                    <div className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[9px] font-semibold text-primary-foreground">
                      {mail.status}
                    </div>
                  ) : (
                    <div className="shrink-0 text-[10px] font-semibold text-accent-foreground/70">
                      {mail.status}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-border pt-4 text-center text-[11px] font-semibold text-accent-foreground">
              &ldquo;Na verdade eu <strong className="text-amber-700">não sabia que vocês existiam</strong>&rdquo;
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S3 — VIRADA                                                  */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 py-24 md:px-12">
        <Glow className="right-[-100px] top-0 h-[700px] w-[700px] opacity-[0.1]" />

        <div className="relative z-10 mx-auto grid max-w-[1280px] grid-cols-1 items-stretch gap-14 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Photo (left) */}
          <div className="relative min-h-[400px] overflow-hidden rounded-3xl lg:min-h-[600px]">
            <Image
              src="/images/para-vendas-virada.jpeg"
              alt="Vendedor B2B construindo autoridade no LinkedIn antes de abordar prospect com a Boldfy"
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
                { num: 1, icon: MessageSquare, title: c.virada1Title, desc: c.virada1Desc },
                { num: 2, icon: Clock, title: c.virada2Title, desc: c.virada2Desc },
                { num: 3, icon: Inbox, title: c.virada3Title, desc: c.virada3Desc },
                { num: 4, icon: Trophy, title: c.virada4Title, desc: c.virada4Desc },
              ].map((card) => (
                <div
                  key={card.num}
                  className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-[0_4px_20px_rgba(93,42,103,0.04)] transition-all duration-300 hover:translate-x-1 hover:border-amber-500/35 hover:shadow-[0_12px_32px_rgba(245,158,11,0.12)]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] bg-amber-500/[0.14] text-amber-700">
                    <card.icon className="h-[22px] w-[22px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div>
                      <span className="mr-1.5 font-headline text-xs font-black text-amber-700">
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
      {/*  S4 — LEADERBOARD (seção exclusiva Vendas)                    */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 py-24 md:px-12">
        <Glow className="left-[-100px] top-[20%] h-[700px] w-[700px] opacity-[0.1]" />

        <div className="relative z-10 mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          {/* Text */}
          <div>
            <PreTag>{c.lbTag}</PreTag>
            <SectionHeading
              title={c.lbTitle}
              highlight={c.lbTitleHighlight}
              className="mb-4"
            />
            <div className="space-y-3.5 text-[15px] leading-[1.65] text-muted-foreground">
              <p>
                {c.lbBody1intro}{' '}
                <strong className="font-bold text-accent-foreground">
                  {c.lbBody1bold}
                </strong>
                {c.lbBody1end}
              </p>
              <p>{c.lbBody2}</p>
              <p className="text-[15px] font-bold text-accent-foreground">
                {c.lbHighlight}
              </p>
            </div>
          </div>

          {/* Leaderboard card */}
          <div className="relative overflow-hidden rounded-[22px] border border-border bg-card p-7 shadow-[0_20px_50px_rgba(93,42,103,0.1)]">
            {/* Top accent bar */}
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-amber-500 to-amber-300" />

            {/* Header */}
            <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-amber-500/[0.14] text-amber-700">
                  <Trophy className="h-[17px] w-[17px]" />
                </div>
                <div>
                  <div className="font-headline text-sm font-black text-accent-foreground">
                    {c.lbCardTitle}
                  </div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    {c.lbCardSub}
                  </div>
                </div>
              </div>
              <span className="rounded-full bg-amber-500/[0.14] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-amber-700">
                {c.lbCardMonth}
              </span>
            </div>

            {/* Rows */}
            <div className="flex flex-col gap-2.5">
              {[
                { pos: 1, medal: '🥇', initials: 'RC', name: 'Rafa Costa', role: 'Account Executive Sr', pts: '2.840', podium: 1 },
                { pos: 2, medal: '🥈', initials: 'BM', name: 'Bia Martins', role: 'SDR', pts: '2.310', podium: 2 },
                { pos: 3, medal: '🥉', initials: 'PG', name: 'Pedro Gomes', role: 'Account Executive', pts: '1.950', podium: 3 },
                { pos: 4, medal: null, initials: 'CL', name: 'Camila Lima', role: 'SDR', pts: '1.680', podium: 0 },
                { pos: 5, medal: null, initials: 'TS', name: 'Tiago Santos', role: 'Account Executive', pts: '1.420', podium: 0 },
              ].map((row) => (
                <div
                  key={row.pos}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-3 ${
                    row.podium === 1
                      ? 'border border-amber-500/35 bg-gradient-to-r from-amber-500/[0.14] to-amber-300/[0.08]'
                      : row.podium === 2
                      ? 'bg-gradient-to-r from-muted-foreground/[0.08] to-muted-foreground/[0.04]'
                      : row.podium === 3
                      ? 'bg-gradient-to-r from-amber-700/[0.08] to-amber-500/[0.04]'
                      : 'bg-border/40'
                  }`}
                >
                  <div
                    className={`w-6 shrink-0 text-center font-headline text-base font-black ${
                      row.podium === 1 ? 'text-amber-700' : 'text-muted-foreground'
                    }`}
                  >
                    {row.medal ?? row.pos}
                  </div>
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-headline text-[11px] font-black ${
                      row.podium === 1
                        ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-white'
                        : 'bg-gradient-to-br from-secondary to-primary/30 text-accent-foreground'
                    }`}
                  >
                    {row.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold leading-tight text-accent-foreground">
                      {row.name}
                    </div>
                    <div className="mt-0.5 text-[10px] text-muted-foreground">
                      {row.role}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div
                      className={`font-headline text-[15px] font-black ${
                        row.podium === 1 ? 'text-amber-700' : 'text-accent-foreground'
                      }`}
                    >
                      {row.pts}
                    </div>
                    <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      pontos
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-[18px] flex items-center justify-between border-t border-border pt-4 text-[11px]">
              <span className="text-muted-foreground">{c.lbCardFooterLabel}</span>
              <span className="flex items-center gap-1.5 font-bold text-amber-700">
                <Trophy className="h-3 w-3" />
                {c.lbCardFooterPrize}
              </span>
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
            <strong className="font-bold text-amber-700">
              {c.numCenario}
            </strong>
          </p>

          {/* Stats grid — KPI card wider */}
          <div className="mb-6 grid grid-cols-1 gap-[18px] md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.5fr]">
            {[
              {
                icon: TrendingUp,
                value: c.numStat1Value,
                label: c.numStat1Label,
                tags: [c.numStat1Tag1, c.numStat1Tag2],
              },
              {
                icon: Inbox,
                value: c.numStat2Value,
                label: c.numStat2Label,
                tags: [c.numStat2Tag1, c.numStat2Tag2],
              },
              {
                icon: Clock,
                value: c.numStat3Value,
                label: c.numStat3Label,
                tags: [c.numStat3Tag1, c.numStat3Tag2],
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center rounded-[18px] border border-border bg-card p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/35 hover:shadow-[0_16px_40px_rgba(245,158,11,0.14)]"
              >
                <div className="mx-auto mb-3.5 flex h-[42px] w-[42px] items-center justify-center rounded-xl bg-amber-500/[0.14] text-amber-700">
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
                      className="inline-block rounded-full border border-amber-500/35 bg-amber-500/[0.14] px-2.5 py-1 text-[10px] font-semibold leading-[1.3] text-amber-700"
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
                <Target className="h-5 w-5" />
              </div>
              <div className="mb-1.5 font-headline text-lg font-black leading-[1.1] tracking-[-0.02em] text-accent-foreground">
                {c.numKpiTitle}
              </div>
              <div className="mb-3.5" />
              <div className="mt-auto flex w-full flex-wrap justify-center gap-[5px]">
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
      {/*  S6 — CAMINHOS (só 1 card pra Vendas)                         */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 py-24 md:px-12">
        <Glow
          className="right-[-100px] top-[10%] h-[700px] w-[700px] opacity-[0.08]"
          color="bg-primary"
        />

        <div className="relative z-10 mx-auto max-w-[900px]">
          <div className="mb-12">
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

          <div className="flex flex-col rounded-3xl border border-border bg-card p-9 transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_20px_48px_rgba(205,80,241,0.14)]">
            <span className="mb-[22px] inline-flex items-center gap-2 self-start rounded-full border border-primary/25 bg-secondary px-3.5 py-[7px] text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
              <Monitor className="h-[13px] w-[13px]" />
              {c.cam1Tag}
            </span>
            <h3 className="mb-3 font-headline text-[28px] font-black leading-[1.1] tracking-[-0.02em] text-accent-foreground">
              {c.cam1Title}
            </h3>
            <p className="mb-7 text-[15px] leading-[1.6] text-muted-foreground">
              {c.cam1Desc}
            </p>
            <Link
              href="/solucoes/software-as-a-service"
              className="group inline-flex items-center justify-center gap-2 self-start rounded-xl bg-primary px-[26px] py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(205,80,241,0.25)] transition-all duration-250 hover:-translate-y-0.5 hover:bg-[#d966f5] hover:shadow-[0_12px_28px_rgba(205,80,241,0.38)]"
            >
              {c.cam1Cta}
              <ArrowRight className="h-[15px] w-[15px] transition-transform group-hover:translate-x-0.5" />
            </Link>
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
            <SectionHeading
              title={c.faqTitle}
              highlight={c.faqTitleHighlight}
              suffix={c.faqTitleEnd}
            />
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
