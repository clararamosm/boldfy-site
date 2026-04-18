'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { useDemoPopup } from '@/components/forms/demo-popup';
import { useProposalBuilder } from '@/components/proposal-builder';
import { BattleCardTrigger } from '@/components/battle-card';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Palette,
  Mic,
  ChevronDown,
  Calendar,
  Layers,
  LayoutGrid,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Copy,
  FileStack,
  CheckCircle2,
  MessageSquare,
  FileText,
  X,
  Check,
  Video,
  Compass,
  PenTool,
  FileSpreadsheet,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  CaaS accent: deep purple #5E2A67                                   */
/* ------------------------------------------------------------------ */

const CAAS_ACCENT = '#5E2A67';
const CAAS_ACCENT_LIGHT = '#9840AD';

function PreTag({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="mb-6 inline-block rounded-full border px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em]"
      style={{
        borderColor: 'rgba(94, 42, 103, 0.35)',
        backgroundColor: 'rgba(94, 42, 103, 0.08)',
        color: CAAS_ACCENT,
      }}
    >
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
      <span
        className="bg-clip-text text-transparent"
        style={{
          backgroundImage: `linear-gradient(135deg, ${CAAS_ACCENT} 0%, ${CAAS_ACCENT_LIGHT} 100%)`,
        }}
      >
        {highlight}
      </span>
      {suffix}
    </h2>
  );
}

function Glow({
  className,
  color = CAAS_ACCENT,
}: {
  className: string;
  color?: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full blur-[120px] ${className}`}
      style={{ backgroundColor: color }}
    />
  );
}

function GridPattern() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          'linear-gradient(rgba(94,42,103,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(94,42,103,0.06) 1px, transparent 1px)',
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
      className="overflow-hidden rounded-[14px] border bg-card transition-all duration-250"
      style={{
        borderColor: isOpen ? CAAS_ACCENT : undefined,
        boxShadow: isOpen ? '0 8px 24px rgba(94,42,103,0.14)' : undefined,
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-6 py-[22px] text-left transition-colors"
        aria-expanded={isOpen}
        style={{ color: isOpen ? CAAS_ACCENT : undefined }}
      >
        <span className="text-[15px] font-bold leading-[1.35] text-accent-foreground">
          {question}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 transition-transform duration-350 ${
            isOpen ? 'rotate-180' : ''
          }`}
          style={{
            color: CAAS_ACCENT,
            transitionTimingFunction: 'cubic-bezier(.2,.9,.3,1)',
          }}
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

export function CaasClient() {
  const t = useT();
  const { openPopup } = useDemoPopup();
  const { openBuilder } = useProposalBuilder();
  const c = t.solucoesCaas;

  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const toggleFaq = (i: number) =>
    setFaqOpen((prev) => (prev === i ? null : i));

  return (
    <>
      {/* ============================================================ */}
      {/*  S1 — HERO (Google Meet tiles + calendário + post aprovado)   */}
      {/* ============================================================ */}
      <section className="relative flex min-h-[90vh] items-center overflow-hidden bg-background px-6 py-24 md:px-12">
        <Glow className="right-[-150px] top-[-10%] h-[700px] w-[700px] opacity-[0.12]" />
        <Glow
          className="bottom-[-100px] left-[-50px] h-[500px] w-[500px] opacity-[0.10]"
          color={CAAS_ACCENT_LIGHT}
        />
        <GridPattern />

        <div className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-[60px]">
          {/* Text */}
          <div>
            <PreTag>{c.heroTag}</PreTag>
            <h1 className="font-headline text-[clamp(36px,4.6vw,58px)] font-black leading-[1.05] tracking-[-0.035em] text-accent-foreground">
              {c.heroTitle}{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${CAAS_ACCENT} 0%, ${CAAS_ACCENT_LIGHT} 100%)`,
                }}
              >
                {c.heroTitleHighlight}
              </span>
            </h1>
            <p className="mt-7 max-w-[540px] text-base leading-[1.6] text-muted-foreground">
              {c.heroSubtitle}
            </p>
            <div className="mt-9 flex flex-wrap gap-3.5">
              <Button
                size="lg"
                className="font-bold text-white"
                style={{
                  backgroundColor: CAAS_ACCENT,
                  boxShadow: `0 8px 24px rgba(94,42,103,0.35)`,
                }}
                onClick={() => openBuilder('caas:hero')}
              >
                {c.heroCta1}
                <ArrowRight className="ml-2 h-[18px] w-[18px]" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => openPopup('caas:hero')}>
                {c.heroCta2}
              </Button>
            </div>
          </div>

          {/* Visual: 4 elementos flutuando — 2 Meet tiles + calendário + post aprovado */}
          <div className="relative h-[540px] lg:h-[620px]">
            {/* Meet tile 1 — CEO (topo esquerda) */}
            <div className="absolute left-0 top-[10px] z-20 w-[200px] animate-hero-float overflow-hidden rounded-[14px] border-2 border-white bg-[#0F0A18] shadow-[0_20px_50px_rgba(94,42,103,0.24)] lg:w-[220px]">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src="/images/solucoes-caas-hero-ceo.jpeg"
                  alt="CEO em reunião de alinhamento de conteúdo"
                  fill
                  sizes="(max-width: 1024px) 200px, 220px"
                  className="object-cover"
                  priority
                />
                {/* Tag estilo Meet com nome + função */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between rounded-md bg-black/60 px-2 py-1 text-white backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-red-500" />
                    <span className="truncate text-[10px] font-semibold">
                      {c.heroMeetCeoName}
                    </span>
                  </div>
                  <span className="shrink-0 rounded bg-white/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider">
                    {c.heroMeetCeoLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Meet tile 2 — Estrategista (centro-direita, sobreposto levemente) */}
            <div className="absolute right-0 top-[120px] z-30 w-[200px] animate-hero-float-reverse overflow-hidden rounded-[14px] border-2 border-white bg-[#0F0A18] shadow-[0_20px_50px_rgba(94,42,103,0.28)] lg:w-[220px]">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src="/images/solucoes-caas-hero-estrategista.jpeg"
                  alt="Estrategista Boldfy em reunião de alinhamento de conteúdo"
                  fill
                  sizes="(max-width: 1024px) 200px, 220px"
                  className="object-cover"
                  priority
                />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between rounded-md bg-black/60 px-2 py-1 text-white backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-red-500" />
                    <span className="truncate text-[10px] font-semibold">
                      {c.heroMeetStrategistName}
                    </span>
                  </div>
                  <span
                    className="shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: CAAS_ACCENT }}
                  >
                    {c.heroMeetStrategistLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Calendário editorial — canto inferior esquerdo */}
            <div className="absolute bottom-[20px] left-[-10px] z-10 w-[260px] animate-hero-float-slow rounded-[18px] border border-border bg-card p-4 shadow-[0_20px_50px_rgba(94,42,103,0.14)] lg:w-[300px]">
              <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" style={{ color: CAAS_ACCENT }} />
                  <div>
                    <div className="font-headline text-[12px] font-black text-accent-foreground">
                      {c.heroMockupTitle}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {c.heroMockupSub}
                    </div>
                  </div>
                </div>
              </div>

              {/* Week view com 3 cores distintas (3 perfis: Pedro, Carol, Maria) */}
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { day: c.heroMockupDay1, post: c.heroMockupPost1, color: CAAS_ACCENT },
                  { day: c.heroMockupDay2, post: c.heroMockupPost2, color: CAAS_ACCENT_LIGHT },
                  { day: c.heroMockupDay3, post: c.heroMockupPost3, color: '#F59E0B' },
                  { day: c.heroMockupDay4, post: c.heroMockupPost4, color: CAAS_ACCENT },
                  { day: c.heroMockupDay5, post: c.heroMockupPost5, color: CAAS_ACCENT_LIGHT },
                ].map((d) => (
                  <div
                    key={d.day}
                    className="flex flex-col gap-1.5 rounded-lg border border-border bg-background/50 p-1.5"
                  >
                    <div className="text-center text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                      {d.day}
                    </div>
                    <div
                      className="rounded-md p-1.5 text-[8px] font-semibold leading-tight text-white"
                      style={{ backgroundColor: d.color }}
                    >
                      {d.post}
                    </div>
                  </div>
                ))}
              </div>

              {/* Legenda de perfis com cores */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[9px] text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: CAAS_ACCENT }} />
                  <span>Pedro</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: CAAS_ACCENT_LIGHT }} />
                  <span>Carol</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: '#F59E0B' }} />
                  <span>Maria</span>
                </div>
              </div>
            </div>

            {/* Mini-card Post aprovado — canto superior direito */}
            <div
              className="absolute -top-[6px] right-[18px] z-40 w-[220px] rounded-[12px] bg-card p-3"
              style={{ boxShadow: '0 16px 40px rgba(15,10,24,0.15), 0 0 0 1px rgba(94,42,103,0.2)' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: CAAS_ACCENT }}
                >
                  <CheckCircle2 className="h-[18px] w-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-headline text-[11px] font-black leading-tight text-accent-foreground">
                    {c.heroMiniCardTitle}
                  </div>
                  <div className="mt-0.5 text-[10px] font-semibold" style={{ color: CAAS_ACCENT }}>
                    {c.heroMiniCardSub}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S2 — DOIS MODOS (card duplo)                                 */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 py-24 md:px-12">
        <Glow className="left-[-100px] top-[30%] h-[600px] w-[600px] opacity-[0.05]" color={CAAS_ACCENT_LIGHT} />

        <div className="relative z-10 mx-auto max-w-[1200px]">
          <div className="mx-auto mb-14 max-w-[820px] text-center">
            <PreTag>{c.modesTag}</PreTag>
            <SectionHeading title={c.modesTitle} highlight={c.modesTitleHighlight} />
            <p className="mx-auto mt-5 max-w-[680px] text-[15px] leading-[1.65] text-muted-foreground">
              {c.modesSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Mode 1 — Design */}
            <div
              className="group rounded-[20px] border bg-card p-8 transition-all duration-300 hover:-translate-y-1"
              style={{ borderColor: 'rgba(94,42,103,0.2)' }}
            >
              <span
                className="mb-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white"
                style={{ backgroundColor: CAAS_ACCENT }}
              >
                <Palette className="h-3 w-3" />
                {c.mode1Tag}
              </span>
              <h3 className="mb-4 font-headline text-[22px] font-black leading-[1.15] tracking-[-0.02em] text-accent-foreground">
                {c.mode1Title}
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Target className="h-4 w-4 shrink-0 mt-0.5" style={{ color: CAAS_ACCENT }} />
                  <p className="text-[13px] leading-[1.5] text-muted-foreground">{c.mode1For}</p>
                </div>
                <div className="flex items-start gap-2">
                  <LayoutGrid className="h-4 w-4 shrink-0 mt-0.5" style={{ color: CAAS_ACCENT }} />
                  <p className="text-[13px] leading-[1.5] text-muted-foreground">{c.mode1Includes}</p>
                </div>
                <div className="flex items-start gap-2">
                  <Layers className="h-4 w-4 shrink-0 mt-0.5" style={{ color: CAAS_ACCENT }} />
                  <p className="text-[13px] leading-[1.5] text-muted-foreground">{c.mode1Deliverables}</p>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 shrink-0 mt-0.5" style={{ color: CAAS_ACCENT }} />
                  <p className="text-[13px] leading-[1.5] text-muted-foreground">{c.mode1Who}</p>
                </div>
              </div>
            </div>

            {/* Mode 2 — Executivo */}
            <div
              className="group rounded-[20px] border bg-card p-8 transition-all duration-300 hover:-translate-y-1"
              style={{
                borderColor: CAAS_ACCENT,
                backgroundImage: `linear-gradient(135deg, rgba(94,42,103,0.04) 0%, rgba(152,64,173,0.02) 100%)`,
              }}
            >
              <span
                className="mb-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white"
                style={{ backgroundColor: CAAS_ACCENT }}
              >
                <Mic className="h-3 w-3" />
                {c.mode2Tag}
              </span>
              <h3 className="mb-4 font-headline text-[22px] font-black leading-[1.15] tracking-[-0.02em] text-accent-foreground">
                {c.mode2Title}
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Target className="h-4 w-4 shrink-0 mt-0.5" style={{ color: CAAS_ACCENT }} />
                  <p className="text-[13px] leading-[1.5] text-muted-foreground">{c.mode2For}</p>
                </div>
                <div className="flex items-start gap-2">
                  <LayoutGrid className="h-4 w-4 shrink-0 mt-0.5" style={{ color: CAAS_ACCENT }} />
                  <p className="text-[13px] leading-[1.5] text-muted-foreground">{c.mode2Includes}</p>
                </div>
                <div className="flex items-start gap-2">
                  <Layers className="h-4 w-4 shrink-0 mt-0.5" style={{ color: CAAS_ACCENT }} />
                  <p className="text-[13px] leading-[1.5] text-muted-foreground">{c.mode2Deliverables}</p>
                </div>
                <div className="flex items-start gap-2">
                  <Users className="h-4 w-4 shrink-0 mt-0.5" style={{ color: CAAS_ACCENT }} />
                  <p className="text-[13px] leading-[1.5] text-muted-foreground">{c.mode2Who}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S3 — MODO DESIGN EM DETALHE                                  */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 py-24 md:px-12">
        <Glow className="right-[-100px] top-0 h-[700px] w-[700px] opacity-[0.07]" />

        <div className="relative z-10 mx-auto max-w-[1200px]">
          <div className="mb-12 max-w-[820px]">
            <PreTag>{c.designTag}</PreTag>
            <SectionHeading title={c.designTitle} highlight={c.designTitleHighlight} className="mb-5" />
            <p className="text-[15px] leading-[1.65] text-muted-foreground">{c.designBody}</p>
          </div>

          {/* Formatos em linha única compacta — boxes pequenos */}
          <div className="mb-10">
            <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              O que produzimos
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { icon: LayoutGrid, title: c.designItem1Title },
                { icon: TrendingUp, title: c.designItem2Title },
                { icon: Copy, title: c.designItem3Title },
                { icon: Sparkles, title: c.designItem4Title },
                { icon: Layers, title: c.designItem5Title },
                { icon: FileStack, title: c.designItem6Title },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-center gap-2 rounded-full border bg-card px-3 py-2 transition-all hover:-translate-y-0.5"
                  style={{
                    borderColor: 'rgba(94,42,103,0.2)',
                  }}
                >
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: 'rgba(94,42,103,0.12)',
                      color: CAAS_ACCENT,
                    }}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[12px] font-semibold text-accent-foreground">
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Como funciona — 4 cards coloridos estilo OLX (claros, com ícones, tags e checklist) */}
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: CAAS_ACCENT }}>
            Como funciona
          </div>
          <div className="relative grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Linha conectora desktop */}
            <div
              className="pointer-events-none absolute left-[60px] right-[60px] top-[30px] hidden h-[2px] md:block"
              style={{
                backgroundImage: `linear-gradient(90deg, transparent, rgba(94,42,103,0.35) 10%, rgba(94,42,103,0.35) 90%, transparent)`,
              }}
            />

            {[
              {
                icon: FileText,
                title: c.designStep1,
                tag: 'Input',
                accent: CAAS_ACCENT,
                bg: 'rgba(94,42,103,0.06)',
              },
              {
                icon: PenTool,
                title: c.designStep2,
                tag: 'Produção',
                accent: CAAS_ACCENT_LIGHT,
                bg: 'rgba(152,64,173,0.06)',
              },
              {
                icon: FileStack,
                title: c.designStep3,
                tag: 'Entrega',
                accent: '#F59E0B',
                bg: 'rgba(245,158,11,0.06)',
              },
              {
                icon: Users,
                title: c.designStep4,
                tag: 'Uso',
                accent: CAAS_ACCENT,
                bg: 'rgba(94,42,103,0.06)',
              },
            ].map((step, i) => (
              <div
                key={step.title}
                className="relative z-[1] rounded-[16px] border bg-card p-4 shadow-[0_8px_20px_rgba(94,42,103,0.06)] transition-all hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(94,42,103,0.12)]"
                style={{ borderColor: 'rgba(94,42,103,0.2)' }}
              >
                {/* Número flutuante */}
                <div
                  className="absolute -top-3 -left-3 flex h-7 w-7 items-center justify-center rounded-full font-headline text-[11px] font-black text-white shadow-md"
                  style={{ backgroundColor: step.accent }}
                >
                  {i + 1}
                </div>

                {/* Tag colorida */}
                <span
                  className="mb-3 inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em]"
                  style={{ backgroundColor: step.bg, color: step.accent }}
                >
                  {step.tag}
                </span>

                {/* Ícone */}
                <div
                  className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-[10px]"
                  style={{ backgroundColor: step.bg, color: step.accent }}
                >
                  <step.icon className="h-5 w-5" />
                </div>

                {/* Título */}
                <p className="text-[13px] font-semibold leading-[1.4] text-accent-foreground">
                  {step.title}
                </p>

                {/* Checklist item fake */}
                <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-2.5 text-[10px] text-muted-foreground">
                  <Check className="h-3 w-3" style={{ color: step.accent }} />
                  <span>Automatizado</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S4 — MODO EXECUTIVO EM DETALHE                               */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 py-24 md:px-12">
        <Glow className="left-[-100px] top-[5%] h-[700px] w-[700px] opacity-[0.08]" />

        <div className="relative z-10 mx-auto max-w-[1280px]">
          <div className="mb-12 grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1fr]">
            {/* Texto */}
            <div>
              <PreTag>{c.execTag}</PreTag>
              <SectionHeading title={c.execTitle} highlight={c.execTitleHighlight} className="mb-5" />
              <p className="text-[15px] leading-[1.65] text-muted-foreground">{c.execBody}</p>
            </div>

            {/* Pipeline mockup (exclusivo modo executivo) */}
            <div className="rounded-[20px] border border-border bg-card p-5 shadow-[0_20px_50px_rgba(94,42,103,0.1)]">
              <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-[9px]"
                    style={{ backgroundColor: 'rgba(94,42,103,0.12)', color: CAAS_ACCENT }}
                  >
                    <FileText className="h-[17px] w-[17px]" />
                  </div>
                  <div>
                    <div className="font-headline text-sm font-black text-accent-foreground">
                      {c.pipelineTitle}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{c.pipelineSub}</div>
                  </div>
                </div>
                <span
                  className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em]"
                  style={{
                    backgroundColor: 'rgba(245,158,11,0.14)',
                    color: '#B45309',
                  }}
                >
                  {c.pipelineStatus}
                </span>
              </div>

              {/* Post preview com comentário inline */}
              <div className="space-y-2.5">
                <div className="rounded-lg border border-border bg-background/50 p-3 text-[12px] leading-[1.5] text-accent-foreground">
                  {c.pipelinePost}
                </div>

                {/* Comentário inline */}
                <div
                  className="rounded-lg border-l-[3px] bg-background/70 p-3"
                  style={{ borderLeftColor: CAAS_ACCENT }}
                >
                  <div className="mb-1 flex items-center gap-1.5">
                    <MessageSquare className="h-3 w-3" style={{ color: CAAS_ACCENT }} />
                    <span className="text-[10px] font-bold" style={{ color: CAAS_ACCENT }}>
                      {c.pipelineCommentAuthor}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{c.pipelineComment1}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold text-white"
                    style={{ backgroundColor: CAAS_ACCENT }}
                  >
                    <Check className="h-3 w-3" />
                    {c.pipelineApprove}
                  </button>
                  <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-background/50 px-3 py-2 text-[11px] font-bold text-muted-foreground">
                    <X className="h-3 w-3" />
                    {c.pipelineRequest}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow: 5 cards horizontais (só título) com Step 5 destacado */}
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: CAAS_ACCENT }}>
            Como funciona
          </div>
          <div className="relative grid grid-cols-2 gap-3 md:grid-cols-5">
            {/* Linha conectora desktop */}
            <div
              className="pointer-events-none absolute left-[60px] right-[60px] top-[30px] hidden h-[2px] md:block"
              style={{
                backgroundImage: `linear-gradient(90deg, transparent, rgba(94,42,103,0.35) 5%, rgba(94,42,103,0.35) 95%, transparent)`,
              }}
            />

            {[
              { icon: Compass, label: c.execStep1Label, exclusive: false },
              { icon: Target, label: c.execStep2Label, exclusive: false },
              { icon: Video, label: c.execStep3Label, exclusive: false },
              { icon: Calendar, label: c.execStep4Label, exclusive: false },
              { icon: FileSpreadsheet, label: c.execStep5Label, exclusive: true },
            ].map((step, i) => (
              <div
                key={step.label}
                className="relative z-[1] rounded-[16px] bg-card p-4 shadow-[0_8px_20px_rgba(94,42,103,0.06)] transition-all hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(94,42,103,0.14)]"
                style={{
                  border: step.exclusive ? `2px solid ${CAAS_ACCENT}` : '1px solid rgba(94,42,103,0.2)',
                  backgroundImage: step.exclusive
                    ? `linear-gradient(135deg, rgba(94,42,103,0.08) 0%, rgba(152,64,173,0.04) 100%)`
                    : undefined,
                }}
              >
                {/* Número */}
                <div
                  className="absolute -top-3 -left-3 flex h-7 w-7 items-center justify-center rounded-full font-headline text-[11px] font-black text-white shadow-md"
                  style={{ backgroundColor: CAAS_ACCENT }}
                >
                  {i + 1}
                </div>

                {/* Badge Exclusivo */}
                {step.exclusive && (
                  <span
                    className="absolute -top-2.5 right-2 rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-white shadow-md"
                    style={{ backgroundColor: CAAS_ACCENT }}
                  >
                    {c.execStep5Exclusive}
                  </span>
                )}

                {/* Ícone */}
                <div
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-[10px]"
                  style={{
                    backgroundColor: step.exclusive ? CAAS_ACCENT : 'rgba(94,42,103,0.12)',
                    color: step.exclusive ? '#fff' : CAAS_ACCENT,
                  }}
                >
                  <step.icon className="h-5 w-5" />
                </div>

                {/* Título */}
                <p className="text-[13px] font-bold leading-[1.3] text-accent-foreground">
                  {step.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S5 — PLATAFORMA E SERVIÇO JUNTOS (invertido: CaaS primeiro)  */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 py-24 md:px-12">
        <Glow className="left-[-100px] top-[10%] h-[700px] w-[700px] opacity-[0.08]" />

        <div className="relative z-10 mx-auto max-w-[1000px]">
          <div className="mx-auto mb-14 max-w-[820px] text-center">
            <PreTag>{c.togetherTag}</PreTag>
            <SectionHeading title={c.togetherTitle} highlight={c.togetherTitleHighlight} />
            <p className="mx-auto mt-5 max-w-[720px] text-[15px] leading-[1.6] text-muted-foreground">
              {c.togetherIntro}
            </p>
            <div className="mt-6 flex justify-center">
              <BattleCardTrigger source="caas:together" variant="pill">
                {t.home.solutionsCompareLabel}
              </BattleCardTrigger>
            </div>
          </div>

          {/* 2 cards side by side + middle connector (CaaS esquerda/primeiro) */}
          <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-[1fr_auto_1fr]">
            {/* CaaS column (prioridade, fica à esquerda) */}
            <div
              className="flex flex-col rounded-[20px] border p-5 shadow-[0_12px_32px_rgba(94,42,103,0.1)] lg:p-6"
              style={{
                borderColor: CAAS_ACCENT,
                backgroundImage:
                  'linear-gradient(135deg, rgba(94,42,103,0.04) 0%, rgba(152,64,173,0.02) 100%)',
              }}
            >
              {/* Banner como card interno com margem */}
              <div className="relative mb-5 h-[120px] w-full overflow-hidden rounded-[14px] lg:h-[140px]">
                <Image
                  src="/images/caas-section-banner.jpg"
                  alt="Estrategista Boldfy operando conteúdo para executivo"
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover"
                />
              </div>

              <div className="flex flex-1 flex-col">
                <span
                  className="mb-4 inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white"
                  style={{ backgroundColor: CAAS_ACCENT }}
                >
                  <Mic className="h-3 w-3" />
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
                          style={{ color: CAAS_ACCENT }}
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

            {/* Middle connector */}
            <div className="flex items-center justify-center lg:px-1">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full border bg-card shadow-[0_4px_16px_rgba(94,42,103,0.1)]"
                style={{ borderColor: 'rgba(94,42,103,0.25)' }}
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={CAAS_ACCENT}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
            </div>

            {/* SaaS column (secundária, fica à direita) */}
            <div className="flex flex-col rounded-[20px] border border-primary/30 bg-card p-5 shadow-[0_12px_32px_rgba(205,80,241,0.08)] lg:p-6">
              {/* Banner como card interno com margem */}
              <div className="relative mb-5 h-[120px] w-full overflow-hidden rounded-[14px] lg:h-[140px]">
                <Image
                  src="/images/saas-section-banner.jpg"
                  alt="Time usando a Plataforma Boldfy em self-service"
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover"
                />
              </div>

              <div className="flex flex-1 flex-col">
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
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href="/solucoes/software-as-a-service"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-bold text-white shadow-[0_8px_20px_rgba(205,80,241,0.3)] transition-all duration-250 hover:-translate-y-0.5 hover:bg-[#d966f5]"
            >
              {c.togetherCtaSaas}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S6 — GHOSTWRITING VS BOLDFY (tabela comparativa visual)      */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 py-24 md:px-12">
        <Glow className="right-[-100px] top-[10%] h-[700px] w-[700px] opacity-[0.08]" color={CAAS_ACCENT_LIGHT} />

        <div className="relative z-10 mx-auto max-w-[1100px]">
          <div className="mx-auto mb-12 max-w-[820px] text-center">
            <PreTag>{c.compareTag}</PreTag>
            <SectionHeading title={c.compareTitle} highlight={c.compareTitleHighlight} />
            <p className="mx-auto mt-5 max-w-[720px] text-[15px] leading-[1.6] text-muted-foreground">
              {c.compareIntro}
            </p>
          </div>

          {/* Tabela comparativa visual com ícones grandes */}
          <div className="overflow-hidden rounded-[20px] border border-border bg-card shadow-[0_20px_50px_rgba(94,42,103,0.1)]">
            {/* Header */}
            <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-border">
              <div className="bg-background/50 px-5 py-4" />
              <div className="bg-background/80 px-5 py-5 text-center">
                <div className="mb-1 flex items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted-foreground/10 text-muted-foreground/70">
                    <X className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  {c.compareColGhost}
                </div>
              </div>
              <div
                className="px-5 py-5 text-center"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${CAAS_ACCENT} 0%, ${CAAS_ACCENT_LIGHT} 100%)`,
                }}
              >
                <div className="mb-1 flex items-center justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white">
                    <Check className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-white">
                  {c.compareColBoldfy}
                </div>
              </div>
            </div>

            {/* Rows */}
            {[
              { label: c.compareRow1Label, ghost: c.compareRow1Ghost, boldfy: c.compareRow1Boldfy },
              { label: c.compareRow2Label, ghost: c.compareRow2Ghost, boldfy: c.compareRow2Boldfy },
              { label: c.compareRow3Label, ghost: c.compareRow3Ghost, boldfy: c.compareRow3Boldfy },
              { label: c.compareRow4Label, ghost: c.compareRow4Ghost, boldfy: c.compareRow4Boldfy },
              { label: c.compareRow5Label, ghost: c.compareRow5Ghost, boldfy: c.compareRow5Boldfy },
              { label: c.compareRow6Label, ghost: c.compareRow6Ghost, boldfy: c.compareRow6Boldfy },
            ].map((row, i, arr) => (
              <div
                key={row.label}
                className={`grid grid-cols-[1fr_1fr_1fr] ${
                  i < arr.length - 1 ? 'border-b border-border' : ''
                }`}
              >
                <div className="bg-background/50 px-5 py-4">
                  <div className="text-[12px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                    {row.label}
                  </div>
                </div>
                <div className="flex items-start gap-2 px-5 py-4 text-[13px] leading-[1.5] text-muted-foreground">
                  <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted-foreground/15">
                    <X className="h-2.5 w-2.5 text-muted-foreground/70" />
                  </div>
                  <span>{row.ghost}</span>
                </div>
                <div
                  className="flex items-start gap-2 px-5 py-4 text-[13px] leading-[1.5] text-accent-foreground"
                  style={{ backgroundColor: 'rgba(94,42,103,0.04)' }}
                >
                  <div
                    className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: CAAS_ACCENT }}
                  >
                    <Check className="h-2.5 w-2.5 text-white" />
                  </div>
                  <span className="font-medium">{row.boldfy}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S7 — FAQ                                                     */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 py-24 md:px-12">
        <Glow className="left-[-100px] top-[10%] h-[600px] w-[600px] opacity-[0.08]" />

        <div className="relative z-10 mx-auto max-w-[900px]">
          <div className="mb-14 text-center">
            <PreTag>{c.faqTag}</PreTag>
            <SectionHeading title={c.faqTitle} highlight={c.faqTitleHighlight} />
          </div>

          <div className="flex flex-col gap-3">
            {[
              { q: c.faq1Q, answer: <p>{c.faq1A}</p> },
              {
                q: c.faq2Q,
                answer: (
                  <p>
                    {c.faq2Abefore}
                    <button
                      type="button"
                      onClick={() => openPopup('caas:faq')}
                      className="font-semibold underline underline-offset-2 transition-colors"
                      style={{ color: CAAS_ACCENT, textDecorationColor: 'rgba(94,42,103,0.4)' }}
                    >
                      {c.faq2AlinkLabel}
                    </button>
                    {c.faq2Aafter}
                  </p>
                ),
              },
              { q: c.faq3Q, answer: <p>{c.faq3A}</p> },
              { q: c.faq4Q, answer: <p>{c.faq4A}</p> },
            ].map((faq, i) => (
              <FaqItem
                key={faq.q}
                question={faq.q}
                isOpen={faqOpen === i}
                onToggle={() => toggleFaq(i)}
              >
                {faq.answer}
              </FaqItem>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S8 — CTA FINAL                                                */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 pb-28 pt-16 md:px-12">
        <Glow className="right-[-100px] top-0 h-[700px] w-[700px] opacity-[0.1]" />
        <Glow className="left-[-100px] bottom-0 h-[500px] w-[500px] opacity-[0.08]" color={CAAS_ACCENT_LIGHT} />
        <GridPattern />

        <div className="relative z-10 mx-auto max-w-[900px] text-center">
          <PreTag>{c.ctaTag}</PreTag>
          <SectionHeading title={c.ctaTitle} highlight={c.ctaTitleHighlight} className="mb-6" />
          <p className="mx-auto mb-10 max-w-[680px] text-[15px] leading-[1.65] text-muted-foreground">
            {c.ctaBody}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <Button
              size="lg"
              className="font-bold text-white"
              style={{
                backgroundColor: CAAS_ACCENT,
                boxShadow: `0 8px 24px rgba(94,42,103,0.35)`,
              }}
              onClick={() => openBuilder('caas:cta-final')}
            >
              {c.ctaCta1}
              <ArrowRight className="ml-2 h-[18px] w-[18px]" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => openPopup('caas:cta-final')}>
              {c.ctaCta2}
            </Button>
          </div>

          {/* Link voltando pro SaaS */}
          <div className="mt-10">
            <Link
              href="/solucoes/software-as-a-service"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowRight className="h-3.5 w-3.5 rotate-180" />
              Conhecer a Plataforma (Software as a Service)
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
