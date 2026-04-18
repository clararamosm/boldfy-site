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
  Sparkles,
  Trophy,
  Award,
  BookOpen,
  Flame,
  MessageSquare,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Settings,
  UserCheck,
  Target,
  Brain,
  Wrench,
  Gift,
  GraduationCap,
  BarChart3,
  Send,
  Rss,
  Users,
  LinkIcon,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Reusable sub-components (primary/purple accent)                    */
/* ------------------------------------------------------------------ */

function PreTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-6 inline-block rounded-full border border-primary/[0.25] bg-primary/[0.08] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-primary">
      {children}
    </span>
  );
}

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

function Glow({
  className,
  color = 'bg-primary',
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
          style={{ transitionTimingFunction: 'cubic-bezier(.2,.9,.3,1)' }}
        />
      </button>
      <div
        className={`grid transition-all duration-400 ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
        style={{ transitionTimingFunction: 'cubic-bezier(.2,.9,.3,1)' }}
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
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function SaasPageClient() {
  const t = useT();
  const { openPopup } = useDemoPopup();
  const { openBuilder } = useProposalBuilder();
  const c = t.solucoesSaas;

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
          className="bottom-[-100px] left-[-50px] h-[500px] w-[500px] opacity-[0.10]"
          color="bg-[#E875FF]"
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
                onClick={() => openBuilder('saas:hero')}
              >
                {c.heroCta1}
                <ArrowRight className="ml-2 h-[18px] w-[18px]" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => openPopup('saas:hero')}>
                {c.heroCta2}
              </Button>
            </div>
          </div>

          {/* Visual: imagem vertical em box arredondado + mockups flutuando sobrepostos */}
          <div className="relative mx-auto h-[540px] w-full max-w-[420px] lg:h-[640px] lg:max-w-[460px]">
            {/* Imagem principal vertical (formato original 2:3) em box rounded-3xl */}
            <div className="absolute inset-0 overflow-hidden rounded-3xl">
              <Image
                src="/images/solucoes-saas-hero.jpeg"
                alt="Colaboradora criando conteúdo na plataforma Boldfy"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 420px, 460px"
                priority
              />
            </div>

            {/* Mockup Dashboard — flutuando no canto superior esquerdo */}
            <div className="absolute -left-[18px] top-[24px] z-20 w-[250px] animate-hero-float rounded-[16px] border border-border bg-card p-3.5 shadow-[0_20px_50px_rgba(93,42,103,0.18)] lg:-left-[24px] lg:w-[270px]">
              <div className="mb-3 flex items-center gap-2.5 border-b border-border pb-2.5">
                <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-primary to-[#E875FF]" />
                <div className="min-w-0 flex-1">
                  <div className="font-headline text-[11px] font-black leading-tight text-accent-foreground">
                    {c.heroMockupTitle}
                  </div>
                  <div className="text-[9px] text-muted-foreground">
                    {c.heroMockupSub}
                  </div>
                </div>
                <Settings className="h-3.5 w-3.5 text-muted-foreground" />
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <div className="rounded-lg border border-primary/20 bg-primary/[0.06] p-2 text-center">
                  <div className="font-headline text-[13px] font-black leading-none text-primary">
                    {c.heroMockupKpi1Value}
                  </div>
                  <div className="mt-1 text-[8px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
                    {c.heroMockupKpi1Label}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-background/50 p-2 text-center">
                  <div className="font-headline text-[13px] font-black leading-none text-accent-foreground">
                    {c.heroMockupKpi2Value}
                  </div>
                  <div className="mt-1 text-[8px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
                    {c.heroMockupKpi2Label}
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-background/50 p-2 text-center">
                  <div className="font-headline text-[13px] font-black leading-none text-accent-foreground">
                    {c.heroMockupKpi3Value}
                  </div>
                  <div className="mt-1 text-[8px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
                    {c.heroMockupKpi3Label}
                  </div>
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1.5 text-[10px]">
                <Trophy className="h-3 w-3 shrink-0 text-primary" />
                <span className="text-muted-foreground">Ranking do mês</span>
                <span className="ml-auto font-semibold text-accent-foreground">#3</span>
              </div>
            </div>

            {/* Mini-card Missão Concluída — canto superior direito */}
            <div className="absolute -right-[14px] -top-[18px] z-30 w-[220px] animate-hero-float-reverse rounded-[12px] bg-card p-3 shadow-[0_16px_40px_rgba(15,10,24,0.15),0_0_0_1px_rgba(205,80,241,0.2)]">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-headline text-[11px] font-black leading-tight text-accent-foreground">
                    {c.heroMiniCardTitle}
                  </div>
                  <div className="mt-0.5 text-[9px] font-semibold text-primary">
                    {c.heroMiniCardSub}
                  </div>
                </div>
              </div>
            </div>

            {/* Mockup Assistente IA — flutuando no canto inferior direito */}
            <div className="absolute -bottom-[22px] -right-[18px] z-20 w-[230px] animate-hero-float-slow rounded-[16px] border border-border bg-card p-3.5 shadow-[0_20px_50px_rgba(93,42,103,0.22)] lg:-right-[24px] lg:w-[250px]">
              <div className="mb-2.5 flex items-center justify-between border-b border-border pb-2">
                <div className="flex items-center gap-1.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/[0.12] text-primary">
                    <Sparkles className="h-3.5 w-3.5" />
                  </div>
                  <div className="font-headline text-[11px] font-black text-accent-foreground">
                    Assistente IA
                  </div>
                </div>
                <div className="rounded-full bg-primary/[0.08] px-1.5 py-0.5 text-[8px] font-bold text-primary">
                  48/50
                </div>
              </div>

              <div className="mb-1.5 flex items-center gap-1 text-[9px] font-semibold text-amber-600">
                <Flame className="h-2.5 w-2.5" />
                Hot topics
              </div>
              <div className="space-y-1">
                {[c.cluster1MockupHot1, c.cluster1MockupHot2].map((h) => (
                  <div
                    key={h}
                    className="truncate rounded border border-dashed border-border/70 px-1.5 py-1 text-[10px] text-accent-foreground"
                  >
                    {h}
                  </div>
                ))}
              </div>

              <div className="mt-2 flex items-center justify-center gap-1 rounded-md bg-primary px-2 py-1.5 text-[10px] font-bold text-white">
                <Sparkles className="h-2.5 w-2.5" />
                Gerar hook
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S2 — PROBLEMAS & SOLUÇÕES (wide-frame workflow)              */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 py-24 md:px-12">
        <Glow
          className="left-[-100px] top-[30%] h-[600px] w-[600px] opacity-[0.05]"
          color="bg-[#E875FF]"
        />
        <GridPattern />

        <div className="relative z-10 mx-auto max-w-[1280px]">
          <div className="mx-auto mb-14 max-w-[820px] text-center">
            <PreTag>{c.problemsTag}</PreTag>
            <SectionHeading title={c.problemsTitle} highlight={c.problemsTitleHighlight} />
            <p className="mx-auto mt-5 max-w-[720px] text-[15px] leading-[1.65] text-muted-foreground">
              {c.problemsIntro}
            </p>
          </div>

          {/* Wide-frame workflow: problemas (esquerda) → Boldfy (centro) → soluções (direita) */}
          <div className="relative">
            {/* SVG de linhas conectoras (desktop) */}
            <svg
              className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
              viewBox="0 0 1200 520"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="line-in" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#CD50F1" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#CD50F1" stopOpacity="0.5" />
                </linearGradient>
                <linearGradient id="line-out" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#CD50F1" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#CD50F1" stopOpacity="0.15" />
                </linearGradient>
              </defs>
              {/* Problemas → Hub (3 linhas convergindo) */}
              <path
                d="M 320 80 C 440 80, 500 240, 600 240"
                stroke="url(#line-in)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="6 4"
              >
                <animate attributeName="stroke-dashoffset" from="10" to="0" dur="1.2s" repeatCount="indefinite" />
              </path>
              <path
                d="M 320 260 L 600 260"
                stroke="url(#line-in)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="6 4"
              >
                <animate attributeName="stroke-dashoffset" from="10" to="0" dur="1.5s" repeatCount="indefinite" />
              </path>
              <path
                d="M 320 440 C 440 440, 500 280, 600 280"
                stroke="url(#line-in)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="6 4"
              >
                <animate attributeName="stroke-dashoffset" from="10" to="0" dur="1.8s" repeatCount="indefinite" />
              </path>
              {/* Hub → Soluções (3 linhas divergindo) */}
              <path
                d="M 700 240 C 760 240, 820 80, 880 80"
                stroke="url(#line-out)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="6 4"
              >
                <animate attributeName="stroke-dashoffset" from="0" to="10" dur="1.3s" repeatCount="indefinite" />
              </path>
              <path
                d="M 700 260 L 880 260"
                stroke="url(#line-out)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="6 4"
              >
                <animate attributeName="stroke-dashoffset" from="0" to="10" dur="1.6s" repeatCount="indefinite" />
              </path>
              <path
                d="M 700 280 C 760 280, 820 440, 880 440"
                stroke="url(#line-out)"
                strokeWidth="2"
                fill="none"
                strokeDasharray="6 4"
              >
                <animate attributeName="stroke-dashoffset" from="0" to="10" dur="1.9s" repeatCount="indefinite" />
              </path>
            </svg>

            <div className="relative grid grid-cols-1 items-center gap-5 lg:grid-cols-[1fr_auto_1fr] lg:gap-0">
              {/* Coluna esquerda: Problemas */}
              <div className="flex flex-col gap-5 lg:pr-6">
                {[
                  { num: '01', icon: Target, label: c.problem1Label, desc: c.problem1Desc },
                  { num: '02', icon: Brain, label: c.problem2Label, desc: c.problem2Desc },
                  { num: '03', icon: Wrench, label: c.problem3Label, desc: c.problem3Desc },
                ].map((item) => (
                  <div
                    key={item.num}
                    className="group relative rounded-[16px] border border-border bg-card p-4 shadow-[0_4px_20px_rgba(93,42,103,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-accent-foreground/[0.06] text-muted-foreground">
                        <item.icon className="h-[18px] w-[18px]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="font-headline text-[10px] font-black text-muted-foreground">
                            {item.num}
                          </span>
                          <h3 className="font-headline text-[14px] font-black tracking-[-0.015em] text-accent-foreground">
                            {item.label}
                          </h3>
                        </div>
                        <p className="text-[12px] leading-[1.5] text-muted-foreground">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Hub central: Boldfy */}
              <div className="mx-auto flex w-full max-w-[200px] flex-col items-center gap-2 lg:max-w-none lg:px-4">
                {/* Mobile: mostra seta pra baixo no lugar da conexão lateral */}
                <div className="flex items-center justify-center lg:hidden">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/[0.12] text-primary">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
                <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-2 border-primary/30 bg-gradient-to-br from-primary/[0.12] to-[#E875FF]/[0.08] shadow-[0_8px_32px_rgba(205,80,241,0.2)] lg:h-40 lg:w-40">
                  <div className="absolute inset-3 rounded-full border border-primary/20" />
                  <div className="text-center">
                    <div className="font-headline text-[22px] font-black tracking-[-0.02em] text-primary lg:text-[28px]">
                      Boldfy
                    </div>
                    <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-muted-foreground lg:text-[10px]">
                      resolve
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center lg:hidden">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/[0.12] text-primary">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Coluna direita: Soluções */}
              <div className="flex flex-col gap-5 lg:pl-6">
                {[
                  { icon: Trophy, label: c.problem1SolLabel, desc: c.problem1SolDesc },
                  { icon: GraduationCap, label: c.problem2SolLabel, desc: c.problem2SolDesc },
                  { icon: Sparkles, label: c.problem3SolLabel, desc: c.problem3SolDesc },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="group rounded-[16px] border border-primary/30 bg-gradient-to-br from-primary/[0.06] to-[#E875FF]/[0.03] p-4 shadow-[0_8px_24px_rgba(205,80,241,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_12px_32px_rgba(205,80,241,0.14)]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-primary/[0.15] text-primary">
                        <item.icon className="h-[18px] w-[18px]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-primary">
                          Na Boldfy
                        </div>
                        <h3 className="mb-1 font-headline text-[14px] font-black tracking-[-0.015em] text-accent-foreground">
                          {item.label}
                        </h3>
                        <p className="text-[12px] leading-[1.5] text-muted-foreground">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S3 — CLUSTER 1: Criação de conteúdo                           */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 py-24 md:px-12">
        <Glow className="left-[-100px] top-[10%] h-[700px] w-[700px] opacity-[0.09]" />

        <div className="relative z-10 mx-auto max-w-[1280px]">
          <div className="mx-auto mb-14 max-w-[820px] text-center">
            <PreTag>{c.cluster1Tag}</PreTag>
            <SectionHeading title={c.cluster1Title} highlight={c.cluster1TitleHighlight} />
            <p className="mt-5 text-[15px] leading-[1.65] text-muted-foreground">
              {c.cluster1Intro}
            </p>
          </div>

          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.25fr_1fr]">
            {/* Visual composto: Assistente IA (esquerda) + Mariana com celular (frente centro) + Preview LinkedIn (direita/atrás) */}
            <div className="relative h-[520px] lg:h-[580px]">
              {/* Mockup Assistente IA — atrás, esquerda */}
              <div className="absolute left-0 top-[20px] z-10 w-[280px] animate-hero-float-slow rounded-[18px] border border-border bg-card p-4 shadow-[0_20px_50px_rgba(205,80,241,0.12)] lg:w-[320px]">
                <div className="mb-3 flex items-center justify-between border-b border-border pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-primary/[0.12] text-primary">
                      <Sparkles className="h-[15px] w-[15px]" />
                    </div>
                    <div className="font-headline text-[12px] font-black text-accent-foreground">
                      {c.cluster1MockupHeader}
                    </div>
                  </div>
                  <div className="rounded-full bg-primary/[0.08] px-2 py-0.5 text-[9px] font-bold text-primary">
                    48/50
                  </div>
                </div>

                <div className="mb-2 text-[9px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                  {c.cluster1MockupTopic}
                </div>
                <div className="mb-3 rounded-lg border border-border bg-background/50 p-2 text-[10px] text-muted-foreground">
                  {c.cluster1MockupPrompt}
                </div>

                <div className="mb-1.5 flex items-center gap-1 text-[9px] font-semibold text-amber-600">
                  <Flame className="h-2.5 w-2.5" />
                  {c.cluster1MockupHot}
                </div>
                <div className="space-y-1">
                  {[c.cluster1MockupHot1, c.cluster1MockupHot2, c.cluster1MockupHot3].map((h) => (
                    <div
                      key={h}
                      className="truncate rounded border border-dashed border-border/70 px-2 py-1 text-[10px] text-accent-foreground"
                    >
                      {h}
                    </div>
                  ))}
                </div>

                <div className="mt-2.5 flex items-center justify-center gap-1 rounded-md bg-primary px-2 py-1.5 text-[10px] font-bold text-white">
                  <Sparkles className="h-2.5 w-2.5" />
                  {c.cluster1MockupGenerate}
                </div>
              </div>

              {/* Mini-mockup Calendário pessoal — blocado no canto superior direito do Assistente */}
              <div className="absolute right-0 top-0 z-20 w-[200px] animate-hero-float-reverse rounded-[14px] border border-border bg-card p-3 shadow-[0_16px_40px_rgba(205,80,241,0.14)] lg:w-[220px]">
                <div className="mb-2 flex items-center gap-1.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/[0.12] text-primary">
                    <Calendar className="h-3 w-3" />
                  </div>
                  <div className="font-headline text-[10px] font-black text-accent-foreground">
                    Calendário pessoal
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-0.5">
                  {Array.from({ length: 14 }).map((_, i) => {
                    const hasPost = [2, 5, 9, 12].includes(i);
                    return (
                      <div
                        key={i}
                        className={`aspect-square rounded-[3px] ${
                          hasPost
                            ? 'bg-gradient-to-br from-primary to-[#E875FF]'
                            : 'bg-background/70 border border-border/40'
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="mt-2 flex items-center justify-between text-[9px] text-muted-foreground">
                  <span>4 posts</span>
                  <span className="font-semibold text-primary">próximos 14d</span>
                </div>
              </div>

              {/* Mini-card Preview LinkedIn — canto inferior direito com avatar da Mariana (avatar-8) */}
              <div className="absolute bottom-0 right-0 z-20 w-[240px] animate-hero-float rounded-[14px] border border-border bg-card p-3 shadow-[0_16px_40px_rgba(205,80,241,0.14)] lg:w-[260px]">
                <div className="mb-2 flex items-center gap-2">
                  <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-border">
                    <Image
                      src="/images/avatar-8.jpeg"
                      alt="Avatar de Mariana Oliveira"
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] font-bold text-accent-foreground">
                      Mariana Oliveira
                    </div>
                    <div className="truncate text-[9px] text-muted-foreground">
                      Head of Growth
                    </div>
                  </div>
                </div>
                <div className="mb-1.5 text-[10px] leading-[1.4] text-accent-foreground">
                  {c.cluster1MockupPost}
                </div>
                <div className="flex items-center justify-between border-t border-border pt-1.5 text-[9px] text-muted-foreground">
                  <span>👍 ❤️ 💡 124</span>
                  <span>18 coments</span>
                </div>
              </div>

              {/* Mariana com celular — personagem real, por cima dos mockups (frente) */}
              <div className="pointer-events-none absolute inset-0 z-30 flex items-end justify-center">
                <Image
                  src="/images/mariana-oliveira.png"
                  alt="Mariana Oliveira usando a plataforma Boldfy no celular"
                  width={380}
                  height={570}
                  className="h-full w-auto object-contain object-bottom"
                />
              </div>
            </div>

            {/* Cards de features (4 agora, com calendário pessoal) */}
            <div className="flex flex-col gap-3">
              {/* Card 1: Assistente IA com tags */}
              <div className="group rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:translate-x-1 hover:border-primary/35 hover:shadow-[0_12px_32px_rgba(205,80,241,0.1)]">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] bg-primary/[0.12] text-primary">
                    <Sparkles className="h-[22px] w-[22px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-headline text-[15px] font-black tracking-[-0.015em] text-accent-foreground">
                      {c.cluster1Card1Title}
                    </h3>
                    <p className="mt-1.5 text-[12.5px] leading-[1.5] text-muted-foreground">
                      {c.cluster1Card1Desc}
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      <span className="rounded-full border border-primary/25 bg-primary/[0.08] px-2 py-0.5 text-[10px] font-semibold text-primary">
                        {c.cluster1Card1Tag1}
                      </span>
                      <span className="rounded-full border border-primary/25 bg-primary/[0.08] px-2 py-0.5 text-[10px] font-semibold text-primary">
                        {c.cluster1Card1Tag2}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cards 2, 3, 4 compactos */}
              {[
                { icon: Flame, title: c.cluster1Card2Title, desc: c.cluster1Card2Desc },
                { icon: BookOpen, title: c.cluster1Card3Title, desc: c.cluster1Card3Desc },
                { icon: Calendar, title: c.cluster1Card4Title, desc: c.cluster1Card4Desc },
              ].map((card) => (
                <div
                  key={card.title}
                  className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-4 transition-all duration-300 hover:translate-x-1 hover:border-primary/35 hover:shadow-[0_12px_32px_rgba(205,80,241,0.08)]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-primary/[0.1] text-primary">
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-headline text-[14px] font-black tracking-[-0.015em] text-accent-foreground">
                      {card.title}
                    </h3>
                    <p className="mt-1 text-[12px] leading-[1.5] text-muted-foreground">
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
      {/*  S4 — CLUSTER 2: Engajamento e Desenvolvimento                */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 py-24 md:px-12">
        <Glow
          className="right-[-100px] top-[10%] h-[700px] w-[700px] opacity-[0.08]"
          color="bg-[#E875FF]"
        />

        <div className="relative z-10 mx-auto max-w-[1280px]">
          <div className="mx-auto mb-14 max-w-[820px] text-center">
            <PreTag>{c.cluster2Tag}</PreTag>
            <SectionHeading title={c.cluster2Title} highlight={c.cluster2TitleHighlight} />
            <p className="mt-5 text-[15px] leading-[1.65] text-muted-foreground">
              {c.cluster2Intro}
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {/* Bloco 1: Trilha (esquerda) + Missões & Ranking (direita) */}
            <div className="grid grid-cols-1 items-stretch gap-5 rounded-[22px] border border-border bg-card p-5 shadow-[0_12px_36px_rgba(205,80,241,0.06)] lg:grid-cols-[0.9fr_1.1fr] lg:p-6">
              {/* Mockup Trilha */}
              <div className="rounded-[14px] border border-border/70 bg-background/50 p-4">
                <div className="mb-3 flex items-center justify-between border-b border-border pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-primary/[0.12] text-primary">
                      <GraduationCap className="h-[15px] w-[15px]" />
                    </div>
                    <div>
                      <div className="font-headline text-[12px] font-black text-accent-foreground">
                        {c.cluster2TrailTitle}
                      </div>
                      <div className="text-[9px] text-muted-foreground">
                        {c.cluster2TrailProgress}
                      </div>
                    </div>
                  </div>
                  <span className="font-headline text-[13px] font-black text-primary">60%</span>
                </div>

                <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-border">
                  <div className="h-full w-[60%] rounded-full bg-gradient-to-r from-primary to-[#E875FF]" />
                </div>

                <div className="space-y-1.5">
                  {[
                    { label: c.cluster2TrailModule1, done: true },
                    { label: c.cluster2TrailModule2, done: true },
                    { label: c.cluster2TrailModule3, done: false },
                  ].map((m, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] ${
                        m.done
                          ? 'text-muted-foreground line-through'
                          : 'border border-primary/30 bg-primary/[0.06] text-accent-foreground'
                      }`}
                    >
                      {m.done ? (
                        <CheckCircle2 className="h-3 w-3 shrink-0 text-primary" />
                      ) : (
                        <div className="h-3 w-3 shrink-0 rounded-full border border-muted-foreground/40" />
                      )}
                      <span className="truncate">{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2 feature cards: Missões + Ranking */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {[
                  { icon: Target, title: c.cluster2Card1Title, desc: c.cluster2Card1Desc },
                  { icon: Trophy, title: c.cluster2Card2Title, desc: c.cluster2Card2Desc },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="flex flex-col rounded-[14px] border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_10px_28px_rgba(205,80,241,0.1)]"
                  >
                    <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary/[0.12] text-primary">
                      <card.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-1.5 font-headline text-[14px] font-black tracking-[-0.015em] text-accent-foreground">
                      {card.title}
                    </h3>
                    <p className="text-[12px] leading-[1.5] text-muted-foreground">{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bloco 2: Ranking (esquerda) + Recompensas & Trilhas (direita) */}
            <div className="grid grid-cols-1 items-stretch gap-5 rounded-[22px] border border-border bg-card p-5 shadow-[0_12px_36px_rgba(205,80,241,0.06)] lg:grid-cols-[0.9fr_1.1fr] lg:p-6">
              {/* Mockup Ranking */}
              <div className="rounded-[14px] border border-border/70 bg-background/50 p-4">
                <div className="mb-3 flex items-center justify-between border-b border-border pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-primary/[0.12] text-primary">
                      <Trophy className="h-[15px] w-[15px]" />
                    </div>
                    <span className="font-headline text-[12px] font-black text-accent-foreground">
                      Ranking do mês
                    </span>
                  </div>
                  <span className="rounded-full bg-primary/[0.12] px-2 py-0.5 text-[9px] font-bold uppercase text-primary">
                    Nov
                  </span>
                </div>

                <div className="space-y-1.5">
                  {[
                    { medal: '🥇', name: c.cluster2Lb1Name, role: c.cluster2Lb1Role, pts: c.cluster2Lb1Pts, first: true },
                    { medal: '🥈', name: c.cluster2Lb2Name, role: c.cluster2Lb2Role, pts: c.cluster2Lb2Pts, first: false },
                    { medal: '🥉', name: c.cluster2Lb3Name, role: c.cluster2Lb3Role, pts: c.cluster2Lb3Pts, first: false },
                  ].map((row) => (
                    <div
                      key={row.name}
                      className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${
                        row.first
                          ? 'border border-primary/30 bg-gradient-to-r from-primary/[0.1] to-[#E875FF]/[0.06]'
                          : 'bg-border/30'
                      }`}
                    >
                      <div className="shrink-0 text-base">{row.medal}</div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[11px] font-bold text-accent-foreground">{row.name}</div>
                        <div className="truncate text-[9px] text-muted-foreground">{row.role}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className={`font-headline text-[12px] font-black ${row.first ? 'text-primary' : 'text-accent-foreground'}`}>
                          {row.pts}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-center gap-1.5 rounded-md bg-amber-500/[0.12] px-2 py-1.5 text-[10px] font-bold text-amber-700">
                  <Award className="h-3 w-3" />
                  {c.cluster2LbPrizeLabel}
                </div>
              </div>

              {/* 2 feature cards: Recompensas + Trilhas */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {[
                  { icon: Gift, title: c.cluster2Card3Title, desc: c.cluster2Card3Desc },
                  { icon: GraduationCap, title: c.cluster2Card4Title, desc: c.cluster2Card4Desc },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="flex flex-col rounded-[14px] border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_10px_28px_rgba(205,80,241,0.1)]"
                  >
                    <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary/[0.12] text-primary">
                      <card.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-1.5 font-headline text-[14px] font-black tracking-[-0.015em] text-accent-foreground">
                      {card.title}
                    </h3>
                    <p className="text-[12px] leading-[1.5] text-muted-foreground">{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S5 — CLUSTER 3: LinkedIn e Métricas                          */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 py-24 md:px-12">
        <Glow className="left-[-100px] bottom-0 h-[600px] w-[600px] opacity-[0.08]" />

        <div className="relative z-10 mx-auto max-w-[1280px]">
          <div className="mx-auto mb-14 max-w-[820px] text-center">
            <PreTag>{c.cluster3Tag}</PreTag>
            <SectionHeading title={c.cluster3Title} highlight={c.cluster3TitleHighlight} />
            <p className="mt-5 text-[15px] leading-[1.65] text-muted-foreground">
              {c.cluster3Intro}
            </p>
          </div>

          <div className="flex flex-col gap-5">
            {/* Bloco 1: Stats KPIs (esquerda) + Publicação Direta & LinkedIn Feed (direita) */}
            <div className="grid grid-cols-1 items-stretch gap-5 rounded-[22px] border border-border bg-card p-5 shadow-[0_12px_36px_rgba(205,80,241,0.06)] lg:grid-cols-[1fr_1.1fr] lg:p-6">
              {/* Mini-dashboard KPIs */}
              <div className="rounded-[14px] border border-border/70 bg-background/50 p-4">
                <div className="mb-3 flex items-center justify-between border-b border-border pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-primary/[0.12] text-primary">
                      <BarChart3 className="h-[15px] w-[15px]" />
                    </div>
                    <div>
                      <div className="font-headline text-[12px] font-black text-accent-foreground">
                        {c.cluster3MockupHeader}
                      </div>
                      <div className="text-[9px] text-muted-foreground">
                        {c.cluster3MockupPeriod}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: c.cluster3MockupKpi1Label, value: c.cluster3MockupKpi1Value, highlight: false },
                    { label: c.cluster3MockupKpi2Label, value: c.cluster3MockupKpi2Value, highlight: false },
                    { label: c.cluster3MockupKpi3Label, value: c.cluster3MockupKpi3Value, highlight: true },
                  ].map((k) => (
                    <div
                      key={k.label}
                      className={`rounded-lg border p-2.5 text-center ${
                        k.highlight
                          ? 'border-primary/30 bg-gradient-to-br from-primary/[0.08] to-[#E875FF]/[0.04]'
                          : 'border-border bg-card'
                      }`}
                    >
                      <div
                        className={`font-headline text-[15px] font-black leading-none ${
                          k.highlight ? 'text-primary' : 'text-accent-foreground'
                        }`}
                      >
                        {k.value}
                      </div>
                      <div className="mt-1 text-[8px] font-semibold uppercase tracking-[0.04em] text-muted-foreground leading-tight">
                        {k.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2 feature cards: Publicação Direta + LinkedIn Feed */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {[
                  { icon: Send, title: c.cluster3Card1Title, desc: c.cluster3Card1Desc },
                  { icon: Rss, title: c.cluster3Card2Title, desc: c.cluster3Card2Desc },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="flex flex-col rounded-[14px] border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_10px_28px_rgba(205,80,241,0.1)]"
                  >
                    <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary/[0.12] text-primary">
                      <card.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-1.5 font-headline text-[14px] font-black tracking-[-0.015em] text-accent-foreground">
                      {card.title}
                    </h3>
                    <p className="text-[12px] leading-[1.5] text-muted-foreground">{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Bloco 2: LinkedIn Leads (esquerda) + Dashboard & LinkedIn Ads (direita) */}
            <div className="grid grid-cols-1 items-stretch gap-5 rounded-[22px] border border-border bg-card p-5 shadow-[0_12px_36px_rgba(205,80,241,0.06)] lg:grid-cols-[1fr_1.1fr] lg:p-6">
              {/* Mockup LinkedIn Leads */}
              <div className="rounded-[14px] border border-primary/25 bg-gradient-to-br from-primary/[0.06] to-[#E875FF]/[0.03] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white">
                    <Users className="h-[18px] w-[18px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                      {c.cluster3MockupLeadsLabel}
                    </div>
                    <div className="font-headline text-[22px] font-black leading-none text-primary">
                      +{c.cluster3MockupLeadsValue}
                    </div>
                  </div>
                </div>

                {/* Lista de leads mockada com avatares */}
                <div className="space-y-1.5">
                  {[
                    { avatar: 1, name: 'Ricardo Mendes', role: 'VP Marketing · Tech Inc.', action: 'curtiu 3 posts' },
                    { avatar: 3, name: 'Juliana Torres', role: 'CMO · Startup B2B', action: 'comentou em 2' },
                    { avatar: 5, name: 'Felipe Araújo', role: 'Head of Sales', action: 'salvou post' },
                  ].map((lead) => (
                    <div
                      key={lead.name}
                      className="flex items-center gap-2 rounded-md bg-card px-2 py-1.5"
                    >
                      <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full border border-border">
                        <Image
                          src={`/images/avatar-${lead.avatar}.jpeg`}
                          alt={`Avatar de ${lead.name}`}
                          fill
                          sizes="24px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[10px] font-bold text-accent-foreground">
                          {lead.name}
                        </div>
                        <div className="truncate text-[9px] text-muted-foreground">
                          {lead.role}
                        </div>
                      </div>
                      <div className="shrink-0 rounded-full bg-primary/[0.1] px-2 py-0.5 text-[9px] font-semibold text-primary">
                        {lead.action}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2 feature cards: Dashboard + LinkedIn Leads */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {[
                  { icon: BarChart3, title: c.cluster3Card3Title, desc: c.cluster3Card3Desc },
                  { icon: MessageSquare, title: c.cluster3Card4Title, desc: c.cluster3Card4Desc },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="flex flex-col rounded-[14px] border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_10px_28px_rgba(205,80,241,0.1)]"
                  >
                    <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary/[0.12] text-primary">
                      <card.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-1.5 font-headline text-[14px] font-black tracking-[-0.015em] text-accent-foreground">
                      {card.title}
                    </h3>
                    <p className="text-[12px] leading-[1.5] text-muted-foreground">{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S6 — ESTRATEGISTA DE CONTA (blocked with features)           */}
      {/* ============================================================ */}
      <section className="relative bg-background px-6 py-16 md:px-12 md:py-20">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid grid-cols-1 items-stretch gap-5 rounded-[22px] border border-border bg-card p-5 shadow-[0_12px_36px_rgba(205,80,241,0.06)] lg:grid-cols-[1fr_1.3fr] lg:p-6">
            {/* Header com título e corpo */}
            <div className="flex flex-col justify-center rounded-[14px] border border-primary/25 bg-gradient-to-br from-primary/[0.08] to-[#E875FF]/[0.04] p-5 lg:p-6">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[11px] bg-primary text-white shadow-[0_6px_20px_rgba(205,80,241,0.28)]">
                <UserCheck className="h-[22px] w-[22px]" />
              </div>
              <h3 className="mb-2 font-headline text-[20px] font-black leading-tight tracking-[-0.02em] text-accent-foreground lg:text-[22px]">
                {c.amLineTitle}
              </h3>
              <p className="text-[13px] leading-[1.55] text-muted-foreground">
                {c.amLineBody}
              </p>
            </div>

            {/* 3 feature cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { icon: Settings, title: c.amFeature1Title, desc: c.amFeature1Desc },
                { icon: Users, title: c.amFeature2Title, desc: c.amFeature2Desc },
                { icon: MessageSquare, title: c.amFeature3Title, desc: c.amFeature3Desc },
              ].map((card) => (
                <div
                  key={card.title}
                  className="flex flex-col rounded-[14px] border border-border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_10px_28px_rgba(205,80,241,0.1)]"
                >
                  <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary/[0.12] text-primary">
                    <card.icon className="h-5 w-5" />
                  </div>
                  <h4 className="mb-1.5 font-headline text-[14px] font-black tracking-[-0.015em] text-accent-foreground">
                    {card.title}
                  </h4>
                  <p className="text-[12px] leading-[1.5] text-muted-foreground">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S7 — SAAS + CAAS TRABALHANDO JUNTOS                          */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 py-24 md:px-12">
        <Glow
          className="right-[-100px] top-[10%] h-[700px] w-[700px] opacity-[0.08]"
          color="bg-[#5E2A67]"
        />

        <div className="relative z-10 mx-auto max-w-[1200px]">
          <div className="mx-auto mb-14 max-w-[820px] text-center">
            <PreTag>{c.togetherTag}</PreTag>
            <SectionHeading title={c.togetherTitle} highlight={c.togetherTitleHighlight} />
            <p className="mx-auto mt-5 max-w-[720px] text-[15px] leading-[1.6] text-muted-foreground">
              {c.togetherIntro}
            </p>
          </div>

          {/* 2 cards side by side + middle connector */}
          <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-[1fr_auto_1fr]">
            {/* SaaS column */}
            <div className="flex flex-col rounded-[20px] border border-primary/30 bg-card p-6 shadow-[0_12px_32px_rgba(205,80,241,0.08)]">
              <span className="mb-4 inline-flex items-center gap-1.5 self-start rounded-full border border-primary/25 bg-primary/[0.08] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
                <Sparkles className="h-3 w-3" />
                {c.togetherSaasLabel}
              </span>
              <h3 className="mb-5 font-headline text-[20px] font-black leading-[1.15] tracking-[-0.02em] text-accent-foreground">
                {c.togetherSaasTitle}
              </h3>
              <div className="flex flex-col gap-2.5">
                {[c.togetherSaasItem1, c.togetherSaasItem2, c.togetherSaasItem3, c.togetherSaasItem4].map(
                  (item) => (
                    <div key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-[13px] leading-[1.5] text-muted-foreground">
                        {item}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* Middle connector */}
            <div className="flex items-center justify-center lg:px-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/25 bg-card shadow-[0_4px_16px_rgba(94,42,103,0.1)]">
                <LinkIcon className="h-5 w-5 text-primary" />
              </div>
            </div>

            {/* CaaS column */}
            <div
              className="flex flex-col rounded-[20px] border p-6 shadow-[0_12px_32px_rgba(94,42,103,0.1)]"
              style={{
                borderColor: 'rgba(94,42,103,0.3)',
                backgroundImage:
                  'linear-gradient(135deg, rgba(94,42,103,0.04) 0%, rgba(152,64,173,0.02) 100%)',
              }}
            >
              <span
                className="mb-4 inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white"
                style={{ backgroundColor: '#5E2A67' }}
              >
                <MessageSquare className="h-3 w-3" />
                {c.togetherCaasLabel}
              </span>
              <h3 className="mb-5 font-headline text-[20px] font-black leading-[1.15] tracking-[-0.02em] text-accent-foreground">
                {c.togetherCaasTitle}
              </h3>
              <div className="flex flex-col gap-2.5">
                {[c.togetherCaasItem1, c.togetherCaasItem2, c.togetherCaasItem3, c.togetherCaasItem4].map(
                  (item) => (
                    <div key={item} className="flex items-start gap-2">
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0"
                        style={{ color: '#5E2A67' }}
                      />
                      <span className="text-[13px] leading-[1.5] text-muted-foreground">
                        {item}
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href="/solucoes/content-as-a-service"
              className="group inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-bold text-white transition-all duration-250 hover:-translate-y-0.5"
              style={{
                backgroundColor: '#5E2A67',
                boxShadow: '0 8px 20px rgba(94,42,103,0.3)',
              }}
            >
              {c.togetherCtaCaas}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S8 — FAQ                                                     */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 pb-20 pt-24 md:px-12">
        <Glow className="right-[-100px] top-[10%] h-[600px] w-[600px] opacity-[0.08]" />
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
              { q: c.faq6Q, a: c.faq6A },
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
