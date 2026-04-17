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
  GraduationCap,
  BarChart3,
  BookOpen,
  Shield,
  Flame,
  MessageSquare,
  UserCheck,
  Award,
  Send,
  Users,
  Calendar,
  TrendingUp,
  CheckCircle2,
  ChevronDown,
  Lock,
  Settings,
  Eye,
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

          {/* Visual: mockup dashboard + pessoa + mini-card missão */}
          <div className="relative h-[440px] lg:h-[560px]">
            {/* Mockup dashboard colaborador (atrás) */}
            <div className="absolute inset-x-0 top-[40px] z-10 rounded-[20px] border border-border bg-card p-5 shadow-[0_20px_50px_rgba(93,42,103,0.12)]">
              <div className="mb-4 flex items-center gap-3 border-b border-border pb-3">
                <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-primary to-[#E875FF]" />
                <div className="min-w-0 flex-1">
                  <div className="font-headline text-sm font-black text-accent-foreground">
                    {c.heroMockupTitle}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {c.heroMockupSub}
                  </div>
                </div>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="rounded-xl border border-primary/20 bg-primary/[0.06] p-3 text-center">
                  <div className="font-headline text-lg font-black text-primary">
                    {c.heroMockupKpi1Value}
                  </div>
                  <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                    {c.heroMockupKpi1Label}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-background/50 p-3 text-center">
                  <div className="font-headline text-lg font-black text-accent-foreground">
                    {c.heroMockupKpi2Value}
                  </div>
                  <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                    {c.heroMockupKpi2Label}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-background/50 p-3 text-center">
                  <div className="font-headline text-lg font-black text-accent-foreground">
                    {c.heroMockupKpi3Value}
                  </div>
                  <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                    {c.heroMockupKpi3Label}
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-[11px]">
                <Trophy className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="text-muted-foreground">Ranking do mês</span>
                <span className="ml-auto font-semibold text-accent-foreground">#3 de 14</span>
              </div>
            </div>

            {/* Pessoa (na frente do mockup) */}
            <div className="pointer-events-none absolute inset-0 z-20 flex items-end justify-end">
              <Image
                src="/images/solucoes-saas-hero.png"
                alt="Colaboradora usando a plataforma Boldfy"
                width={340}
                height={440}
                className="h-full w-auto object-contain object-bottom"
                priority
              />
            </div>

            {/* Mini floating card — missão concluída */}
            <div className="absolute -top-2 right-0 z-30 w-[240px] rounded-[14px] bg-card p-3.5 shadow-[0_16px_40px_rgba(15,10,24,0.15),0_0_0_1px_rgba(205,80,241,0.2)]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                  <CheckCircle2 className="h-[18px] w-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-headline text-[12px] font-black leading-tight text-accent-foreground">
                    {c.heroMiniCardTitle}
                  </div>
                  <div className="mt-0.5 text-[10px] font-semibold text-primary">
                    {c.heroMiniCardSub}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S2 — PARA QUEM É                                             */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 py-24 md:px-12">
        <Glow
          className="left-[-100px] top-[30%] h-[600px] w-[600px] opacity-[0.05]"
          color="bg-[#E875FF]"
        />

        <div className="relative z-10 mx-auto max-w-[900px]">
          <PreTag>{c.forWhoTag}</PreTag>
          <h2 className="font-headline text-[clamp(28px,3.4vw,40px)] font-black leading-[1.1] tracking-[-0.025em] text-accent-foreground">
            {c.forWhoTitle}{' '}
            <span className="bg-gradient-to-br from-primary to-[#E875FF] bg-clip-text text-transparent">
              {c.forWhoTitleHighlight}
            </span>
            {c.forWhoTitleEnd}
          </h2>

          <p className="mt-6 text-[15px] leading-[1.65] text-muted-foreground">
            {c.forWhoBody}
          </p>

          <p className="mt-5 text-[16px] font-bold leading-[1.5] text-accent-foreground">
            {c.forWhoConclusion}
          </p>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S3 — ACCOUNT MANAGER (estrategista de conta)                 */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 py-20 md:px-12">
        <Glow className="right-[-100px] top-0 h-[700px] w-[700px] opacity-[0.07]" />

        <div className="relative z-10 mx-auto max-w-[1100px]">
          <div className="grid grid-cols-1 items-start gap-7 rounded-[20px] border border-border border-l-[4px] border-l-primary bg-card p-9 shadow-[0_20px_50px_rgba(205,80,241,0.08)] lg:grid-cols-[auto_1fr]">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/[0.12] text-primary">
              <UserCheck className="h-8 w-8" />
            </div>

            <div className="min-w-0">
              <PreTag>{c.amTag}</PreTag>
              <h3 className="mb-4 font-headline text-[clamp(22px,2.6vw,30px)] font-black leading-[1.15] tracking-[-0.02em] text-accent-foreground">
                {c.amTitle}{' '}
                <span className="bg-gradient-to-br from-primary to-[#E875FF] bg-clip-text text-transparent">
                  {c.amTitleHighlight}
                </span>
              </h3>
              <p className="mb-6 text-sm leading-[1.6] text-muted-foreground">
                {c.amBody}
              </p>

              <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
                {[
                  { title: c.amBullet1Title, desc: c.amBullet1Desc },
                  { title: c.amBullet2Title, desc: c.amBullet2Desc },
                  { title: c.amBullet3Title, desc: c.amBullet3Desc },
                ].map((b) => (
                  <div
                    key={b.title}
                    className="rounded-xl border border-border bg-background/50 p-4"
                  >
                    <div className="mb-1.5 font-headline text-[13px] font-black text-accent-foreground">
                      {b.title}
                    </div>
                    <div className="text-[12px] leading-[1.5] text-muted-foreground">
                      {b.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S4 — CLUSTER 1: Criação com IA                               */}
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

          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
            {/* Mockup Assistente IA + preview LinkedIn */}
            <div className="rounded-[20px] border border-border bg-card p-5 shadow-[0_20px_50px_rgba(205,80,241,0.08)]">
              <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-primary/[0.12] text-primary">
                    <Sparkles className="h-[17px] w-[17px]" />
                  </div>
                  <div className="font-headline text-sm font-black text-accent-foreground">
                    {c.cluster1MockupHeader}
                  </div>
                </div>
                <div className="rounded-full bg-primary/[0.08] px-2 py-0.5 text-[10px] font-bold text-primary">
                  48/50 créditos
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.1fr_1fr]">
                <div>
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {c.cluster1MockupTopic}
                  </div>
                  <div className="mb-3 rounded-lg border border-border bg-background/50 p-2.5 text-[11px] text-muted-foreground">
                    {c.cluster1MockupPrompt}
                  </div>

                  <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold text-amber-600">
                    <Flame className="h-3 w-3" />
                    {c.cluster1MockupHot}
                  </div>
                  <div className="space-y-1.5">
                    {[c.cluster1MockupHot1, c.cluster1MockupHot2, c.cluster1MockupHot3].map((h) => (
                      <div
                        key={h}
                        className="truncate rounded-md border border-dashed border-border/70 px-2 py-1.5 text-[11px] text-accent-foreground"
                      >
                        {h}
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-[11px] font-bold text-white">
                    <Sparkles className="h-3 w-3" />
                    {c.cluster1MockupGenerate}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background/50 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-to-br from-primary/40 to-[#E875FF]/40" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11px] font-bold text-accent-foreground">
                        Mariana Oliveira
                      </div>
                      <div className="truncate text-[9px] text-muted-foreground">
                        Head of Growth · Empresa
                      </div>
                    </div>
                  </div>
                  <div className="mb-2 text-[11px] leading-[1.4] text-accent-foreground">
                    {c.cluster1MockupPost}
                  </div>
                  <div className="mb-2 text-[10px] text-muted-foreground">...ver mais</div>
                  <div className="flex items-center justify-between border-t border-border pt-2 text-[10px] text-muted-foreground">
                    <span>👍 ❤️ 💡 124</span>
                    <span>18 comentários</span>
                  </div>
                  <div className="mt-2 text-[9px] font-semibold uppercase tracking-[0.05em] text-primary">
                    {c.cluster1MockupPreviewTitle}
                  </div>
                </div>
              </div>
            </div>

            {/* Cards de features */}
            <div className="flex flex-col gap-3.5">
              {[
                { icon: Sparkles, title: c.cluster1Card1Title, desc: c.cluster1Card1Desc },
                { icon: Flame, title: c.cluster1Card2Title, desc: c.cluster1Card2Desc },
                { icon: BookOpen, title: c.cluster1Card3Title, desc: c.cluster1Card3Desc },
              ].map((card) => (
                <div
                  key={card.title}
                  className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:translate-x-1 hover:border-primary/35 hover:shadow-[0_12px_32px_rgba(205,80,241,0.1)]"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] bg-primary/[0.12] text-primary">
                    <card.icon className="h-[22px] w-[22px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-headline text-[15px] font-black tracking-[-0.015em] text-accent-foreground">
                      {card.title}
                    </h3>
                    <p className="mt-1.5 text-[12px] leading-[1.5] text-muted-foreground">
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
      {/*  S5 — CLUSTER 2: Engajamento & Desenvolvimento                */}
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

          {/* 2 mockups lado a lado */}
          <div className="mb-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Leaderboard */}
            <div className="relative overflow-hidden rounded-[20px] border border-border bg-card p-5 shadow-[0_20px_50px_rgba(205,80,241,0.08)]">
              <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-primary to-[#E875FF]" />

              <div className="mb-3 flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="font-headline text-sm font-black text-accent-foreground">
                    Ranking do mês
                  </span>
                </div>
                <span className="rounded-full bg-primary/[0.12] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-primary">
                  Nov · 2026
                </span>
              </div>

              <div className="space-y-2">
                {[
                  { medal: '🥇', name: c.cluster2Lb1Name, role: c.cluster2Lb1Role, pts: c.cluster2Lb1Pts, first: true },
                  { medal: '🥈', name: c.cluster2Lb2Name, role: c.cluster2Lb2Role, pts: c.cluster2Lb2Pts, first: false },
                  { medal: '🥉', name: c.cluster2Lb3Name, role: c.cluster2Lb3Role, pts: c.cluster2Lb3Pts, first: false },
                ].map((row) => (
                  <div
                    key={row.name}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
                      row.first
                        ? 'border border-primary/30 bg-gradient-to-r from-primary/[0.1] to-[#E875FF]/[0.06]'
                        : 'bg-border/30'
                    }`}
                  >
                    <div className="shrink-0 text-xl">{row.medal}</div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-primary/20 font-headline text-[10px] font-black text-accent-foreground">
                      {row.name
                        .split(' ')
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join('')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-bold text-accent-foreground">{row.name}</div>
                      <div className="text-[10px] text-muted-foreground">{row.role}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div
                        className={`font-headline text-[14px] font-black ${
                          row.first ? 'text-primary' : 'text-accent-foreground'
                        }`}
                      >
                        {row.pts}
                      </div>
                      <div className="text-[9px] text-muted-foreground">pts</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-amber-500/[0.12] px-3 py-2 text-[11px] font-bold text-amber-700">
                <Award className="h-3.5 w-3.5" />
                {c.cluster2LbPrizeLabel}
              </div>
            </div>

            {/* Trilha em progresso */}
            <div className="rounded-[20px] border border-border bg-card p-5 shadow-[0_20px_50px_rgba(205,80,241,0.08)]">
              <div className="mb-3 flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <div>
                    <div className="font-headline text-sm font-black text-accent-foreground">
                      {c.cluster2TrailTitle}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {c.cluster2TrailProgress}
                    </div>
                  </div>
                </div>
                <span className="font-headline text-sm font-black text-primary">60%</span>
              </div>

              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-border">
                <div className="h-full w-[60%] rounded-full bg-gradient-to-r from-primary to-[#E875FF]" />
              </div>

              <div className="space-y-1.5">
                {[
                  { label: c.cluster2TrailModule1, done: true, current: false },
                  { label: c.cluster2TrailModule2, done: true, current: false },
                  { label: c.cluster2TrailModule3, done: true, current: false },
                  { label: c.cluster2TrailModule4, done: false, current: true },
                  { label: c.cluster2TrailModule5, done: false, current: false },
                ].map((m, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] ${
                      m.done
                        ? 'text-muted-foreground line-through'
                        : m.current
                          ? 'border border-primary/30 bg-primary/[0.06] text-accent-foreground'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {m.done ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                    ) : (
                      <div className="h-3.5 w-3.5 shrink-0 rounded-full border border-muted-foreground/40" />
                    )}
                    <span className="truncate">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
            {[
              { icon: Trophy, title: c.cluster2Card1Title, desc: c.cluster2Card1Desc },
              { icon: GraduationCap, title: c.cluster2Card2Title, desc: c.cluster2Card2Desc },
              { icon: UserCheck, title: c.cluster2Card3Title, desc: c.cluster2Card3Desc },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_12px_32px_rgba(205,80,241,0.1)]"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-[11px] bg-primary/[0.12] text-primary">
                  <card.icon className="h-[22px] w-[22px]" />
                </div>
                <h3 className="mb-2 font-headline text-[15px] font-black tracking-[-0.015em] text-accent-foreground">
                  {card.title}
                </h3>
                <p className="text-[12px] leading-[1.5] text-muted-foreground">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S6 — CLUSTER 3: Operação & Mensuração                        */}
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

          {/* Dashboard mockup */}
          <div className="mb-10 rounded-[20px] border border-border bg-card p-6 shadow-[0_20px_50px_rgba(205,80,241,0.08)]">
            <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-headline text-sm font-black text-accent-foreground">
                    {c.cluster3MockupHeader}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {c.cluster3MockupPeriod}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/[0.06] px-3 py-1 text-[10px] font-bold text-primary">
                <TrendingUp className="h-3 w-3" />
                +47% vs anterior
              </div>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { icon: Eye, label: c.cluster3MockupKpi1Label, value: c.cluster3MockupKpi1Value, highlight: false },
                { icon: Users, label: c.cluster3MockupKpi2Label, value: c.cluster3MockupKpi2Value, highlight: false },
                { icon: TrendingUp, label: c.cluster3MockupKpi3Label, value: c.cluster3MockupKpi3Value, highlight: false },
                { icon: Trophy, label: c.cluster3MockupKpi4Label, value: c.cluster3MockupKpi4Value, highlight: true },
              ].map((k) => (
                <div
                  key={k.label}
                  className={`rounded-xl border p-3.5 ${
                    k.highlight
                      ? 'border-primary/30 bg-gradient-to-br from-primary/[0.08] to-[#E875FF]/[0.04]'
                      : 'border-border bg-background/50'
                  }`}
                >
                  <div className="mb-2">
                    <k.icon
                      className={`h-4 w-4 ${k.highlight ? 'text-primary' : 'text-muted-foreground'}`}
                    />
                  </div>
                  <div
                    className={`font-headline text-[22px] font-black leading-none ${
                      k.highlight ? 'text-primary' : 'text-accent-foreground'
                    }`}
                  >
                    {k.value}
                  </div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                    {k.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Chart estilizado */}
            <div className="mb-5 flex h-20 items-end gap-1.5 rounded-xl border border-border bg-background/50 p-3">
              {[28, 35, 22, 48, 42, 55, 38, 62, 45, 72, 58, 85, 68, 95].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-gradient-to-b from-primary to-[#E875FF]/60"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>

            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.05em] text-muted-foreground">
                {c.cluster3MockupPostsTitle}
              </div>
              <div className="space-y-1.5">
                {[c.cluster3MockupPost1, c.cluster3MockupPost2, c.cluster3MockupPost3].map((p) => (
                  <div
                    key={p}
                    className="flex items-center justify-between rounded-md border border-dashed border-border px-3 py-2 text-[11px]"
                  >
                    <span className="truncate text-accent-foreground">{p}</span>
                    <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4 feature cards */}
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: BarChart3, title: c.cluster3Card1Title, desc: c.cluster3Card1Desc },
              { icon: Send, title: c.cluster3Card2Title, desc: c.cluster3Card2Desc },
              { icon: MessageSquare, title: c.cluster3Card3Title, desc: c.cluster3Card3Desc },
              { icon: Calendar, title: c.cluster3Card4Title, desc: c.cluster3Card4Desc },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_12px_32px_rgba(205,80,241,0.1)]"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[10px] bg-primary/[0.12] text-primary">
                  <card.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-headline text-[14px] font-black tracking-[-0.015em] text-accent-foreground">
                  {card.title}
                </h3>
                <p className="text-[12px] leading-[1.5] text-muted-foreground">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S7 — SEGURANÇA                                                */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 py-20 md:px-12">
        <Glow className="right-[-100px] top-0 h-[600px] w-[600px] opacity-[0.06]" />

        <div className="relative z-10 mx-auto max-w-[1000px]">
          <div className="rounded-[20px] border border-border border-l-[4px] border-l-primary bg-card p-9 shadow-[0_20px_50px_rgba(205,80,241,0.08)]">
            <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[auto_1fr]">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/[0.12] text-primary">
                <Lock className="h-8 w-8" />
              </div>

              <div className="min-w-0">
                <PreTag>{c.securityTag}</PreTag>
                <h3 className="mb-4 font-headline text-[clamp(22px,2.6vw,30px)] font-black leading-[1.15] tracking-[-0.02em] text-accent-foreground">
                  {c.securityTitle}{' '}
                  <span className="bg-gradient-to-br from-primary to-[#E875FF] bg-clip-text text-transparent">
                    {c.securityTitleHighlight}
                  </span>
                </h3>
                <p className="mb-5 text-sm leading-[1.6] text-muted-foreground">
                  {c.securityBody}
                </p>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {[c.sec1, c.sec2, c.sec3, c.sec4, c.sec5].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2.5 rounded-lg bg-background/50 px-3.5 py-2.5"
                    >
                      <Shield className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="text-[12px] font-semibold text-accent-foreground">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S8 — COMPARAÇÃO COM CaaS                                     */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 py-24 md:px-12">
        <Glow
          className="right-[-100px] top-[10%] h-[700px] w-[700px] opacity-[0.08]"
          color="bg-[#5E2A67]"
        />

        <div className="relative z-10 mx-auto max-w-[900px]">
          <div className="mb-10 text-center">
            <PreTag>{c.comparisonTag}</PreTag>
            <SectionHeading
              title={c.comparisonTitle}
              highlight={c.comparisonTitleHighlight}
            />
            <p className="mx-auto mt-5 max-w-[720px] text-[15px] leading-[1.6] text-muted-foreground">
              {c.comparisonBody}
            </p>
          </div>

          <div className="rounded-3xl border border-border bg-card p-9 text-center transition-all duration-300 hover:-translate-y-1 hover:border-[#5E2A67]/40 hover:shadow-[0_20px_48px_rgba(94,42,103,0.14)]">
            <Link
              href="/solucoes/content-as-a-service"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[#5E2A67] px-7 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(94,42,103,0.3)] transition-all duration-250 hover:-translate-y-0.5 hover:bg-[#6b3075] hover:shadow-[0_12px_28px_rgba(94,42,103,0.42)]"
            >
              {c.comparisonCta}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S9 — FAQ                                                     */}
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
