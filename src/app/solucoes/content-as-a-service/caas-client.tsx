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
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  CaaS accent: deep purple #5E2A67                                   */
/* ------------------------------------------------------------------ */

const CAAS_ACCENT = '#5E2A67';

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
          backgroundImage: `linear-gradient(135deg, ${CAAS_ACCENT} 0%, #9840AD 100%)`,
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
      className={`overflow-hidden rounded-[14px] border bg-card transition-all duration-250`}
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
      {/*  S1 — HERO                                                    */}
      {/* ============================================================ */}
      <section className="relative flex min-h-[90vh] items-center overflow-hidden bg-background px-6 py-24 md:px-12">
        <Glow className="right-[-150px] top-[-10%] h-[700px] w-[700px] opacity-[0.12]" />
        <Glow
          className="bottom-[-100px] left-[-50px] h-[500px] w-[500px] opacity-[0.10]"
          color="#9840AD"
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
                  backgroundImage: `linear-gradient(135deg, ${CAAS_ACCENT} 0%, #9840AD 100%)`,
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

          {/* Visual: mockup calendário + pessoa + mini-card "post aprovado" */}
          <div className="relative h-[440px] lg:h-[560px]">
            {/* Mockup calendário editorial */}
            <div className="absolute inset-x-0 top-[40px] z-10 rounded-[20px] border border-border bg-card p-5 shadow-[0_20px_50px_rgba(94,42,103,0.14)]">
              <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" style={{ color: CAAS_ACCENT }} />
                  <div>
                    <div className="font-headline text-sm font-black text-accent-foreground">
                      {c.heroMockupTitle}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {c.heroMockupSub}
                    </div>
                  </div>
                </div>
              </div>

              {/* Week view */}
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { day: c.heroMockupDay1, post: c.heroMockupPost1, color: CAAS_ACCENT },
                  { day: c.heroMockupDay2, post: c.heroMockupPost2, color: '#9840AD' },
                  { day: c.heroMockupDay3, post: c.heroMockupPost3, color: CAAS_ACCENT },
                  { day: c.heroMockupDay4, post: c.heroMockupPost4, color: '#9840AD' },
                  { day: c.heroMockupDay5, post: c.heroMockupPost5, color: CAAS_ACCENT },
                ].map((d) => (
                  <div
                    key={d.day}
                    className="flex flex-col gap-1.5 rounded-lg border border-border bg-background/50 p-2"
                  >
                    <div className="text-center text-[9px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                      {d.day}
                    </div>
                    <div
                      className="rounded-md p-1.5 text-[9px] font-semibold leading-tight text-white"
                      style={{ backgroundColor: d.color }}
                    >
                      {d.post}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-[11px]">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: CAAS_ACCENT }} />
                <span className="text-muted-foreground">4 aprovados</span>
                <span className="ml-auto font-semibold text-accent-foreground">1 aguardando</span>
              </div>
            </div>

            {/* Pessoa */}
            <div className="pointer-events-none absolute inset-0 z-20 flex items-end justify-end">
              <Image
                src="/images/solucoes-caas-hero.png"
                alt="Executivo usando Content as a Service da Boldfy"
                width={340}
                height={440}
                className="h-full w-auto object-contain object-bottom"
                priority
              />
            </div>

            {/* Mini floating card — post aprovado */}
            <div className="absolute -top-2 right-0 z-30 w-[250px] rounded-[14px] bg-card p-3.5 shadow-[0_16px_40px_rgba(15,10,24,0.15)]"
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
                  <div className="font-headline text-[12px] font-black leading-tight text-accent-foreground">
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
        <Glow className="left-[-100px] top-[30%] h-[600px] w-[600px] opacity-[0.05]" color="#9840AD" />

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
              style={{
                borderColor: 'rgba(94,42,103,0.2)',
              }}
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
          <div className="mb-14 max-w-[820px]">
            <PreTag>{c.designTag}</PreTag>
            <SectionHeading title={c.designTitle} highlight={c.designTitleHighlight} className="mb-5" />
            <p className="text-[15px] leading-[1.65] text-muted-foreground">{c.designBody}</p>
          </div>

          {/* Grid de 6 tipos de peça */}
          <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: LayoutGrid, title: c.designItem1Title, desc: c.designItem1Desc },
              { icon: TrendingUp, title: c.designItem2Title, desc: c.designItem2Desc },
              { icon: Copy, title: c.designItem3Title, desc: c.designItem3Desc },
              { icon: Sparkles, title: c.designItem4Title, desc: c.designItem4Desc },
              { icon: Layers, title: c.designItem5Title, desc: c.designItem5Desc },
              { icon: FileStack, title: c.designItem6Title, desc: c.designItem6Desc },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1"
                style={{ borderColor: undefined }}
              >
                <div
                  className="mb-3 flex h-11 w-11 items-center justify-center rounded-[11px]"
                  style={{
                    backgroundColor: 'rgba(94,42,103,0.12)',
                    color: CAAS_ACCENT,
                  }}
                >
                  <item.icon className="h-[22px] w-[22px]" />
                </div>
                <h3 className="mb-2 font-headline text-[14px] font-black text-accent-foreground">
                  {item.title}
                </h3>
                <p className="text-[12px] leading-[1.5] text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Como funciona — 4 passos */}
          <div className="rounded-[20px] border border-border bg-card p-7">
            <div className="mb-5 text-center">
              <div
                className="mb-2 inline-block text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{ color: CAAS_ACCENT }}
              >
                Como funciona
              </div>
            </div>
            <div className="relative grid grid-cols-1 gap-4 md:grid-cols-4">
              <div
                className="pointer-events-none absolute left-[60px] right-[60px] top-5 hidden h-[2px] md:block"
                style={{
                  backgroundImage: `linear-gradient(90deg, transparent, rgba(94,42,103,0.35) 10%, rgba(94,42,103,0.35) 90%, transparent)`,
                }}
              />
              {[c.designStep1, c.designStep2, c.designStep3, c.designStep4].map((step, i) => (
                <div key={step} className="relative z-[1] text-center">
                  <div
                    className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-card font-headline text-sm font-black"
                    style={{ borderColor: CAAS_ACCENT, color: CAAS_ACCENT }}
                  >
                    {i + 1}
                  </div>
                  <p className="text-[12px] leading-[1.4] text-muted-foreground">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S4 — MODO EXECUTIVO EM DETALHE                               */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 py-24 md:px-12">
        <Glow className="left-[-100px] top-[5%] h-[700px] w-[700px] opacity-[0.08]" />

        <div className="relative z-10 mx-auto max-w-[1280px]">
          <div className="mb-14 grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1fr]">
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

          {/* Mini-cards com 3 etapas resumidas */}
          <div className="mb-12 grid grid-cols-1 gap-3.5 md:grid-cols-3">
            {[
              { icon: MessageSquare, label: c.execMiniCard1 },
              { icon: Target, label: c.execMiniCard2 },
              { icon: TrendingUp, label: c.execMiniCard3 },
            ].map((m) => (
              <div
                key={m.label}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
                  style={{ backgroundColor: 'rgba(94,42,103,0.12)', color: CAAS_ACCENT }}
                >
                  <m.icon className="h-5 w-5" />
                </div>
                <div className="font-headline text-[13px] font-black text-accent-foreground">
                  {m.label}
                </div>
              </div>
            ))}
          </div>

          {/* Timeline de 5 passos */}
          <div className="space-y-3">
            {[
              { num: 1, label: c.execStep1Label, desc: c.execStep1Desc, exclusive: false },
              { num: 2, label: c.execStep2Label, desc: c.execStep2Desc, exclusive: false },
              { num: 3, label: c.execStep3Label, desc: c.execStep3Desc, exclusive: false },
              { num: 4, label: c.execStep4Label, desc: c.execStep4Desc, exclusive: false },
              { num: 5, label: c.execStep5Label, desc: c.execStep5Desc, exclusive: true },
            ].map((step) => (
              <div
                key={step.num}
                className="flex items-start gap-5 rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:translate-x-1"
                style={
                  step.exclusive
                    ? {
                        borderColor: CAAS_ACCENT,
                        backgroundImage: `linear-gradient(90deg, rgba(94,42,103,0.06) 0%, transparent 60%)`,
                      }
                    : undefined
                }
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-headline text-base font-black text-white"
                  style={{ backgroundColor: CAAS_ACCENT }}
                >
                  {step.num}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="font-headline text-[16px] font-black tracking-[-0.015em] text-accent-foreground">
                      {step.label}
                    </h3>
                    {step.exclusive && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-white"
                        style={{ backgroundColor: CAAS_ACCENT }}
                      >
                        Exclusivo modo executivo
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] leading-[1.55] text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S5 — COMO PRESERVAMOS VOZ (manifesto)                        */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 py-28 md:px-12">
        <Glow className="left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 opacity-[0.06]" />
        <GridPattern />

        <div className="relative z-10 mx-auto max-w-[820px] text-center">
          <PreTag>{c.voiceTag}</PreTag>
          <h2 className="font-headline text-[clamp(32px,4vw,52px)] font-black leading-[1.1] tracking-[-0.03em] text-accent-foreground">
            {c.voiceTitle}{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: `linear-gradient(135deg, ${CAAS_ACCENT} 0%, #9840AD 100%)`,
              }}
            >
              {c.voiceTitleHighlight}
            </span>
            {c.voiceTitleEnd}
          </h2>

          <p className="mt-8 text-lg font-bold text-accent-foreground">{c.voiceBody1}</p>

          <p className="mt-6 text-[16px] leading-[1.75] text-muted-foreground">
            {c.voiceBody2}
          </p>
          <p className="mt-5 text-[16px] leading-[1.75] text-muted-foreground">
            {c.voiceBody3}
          </p>

          {/* Pullquotes */}
          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[c.voicePullquote1, c.voicePullquote2, c.voicePullquote3].map((q) => (
              <div
                key={q}
                className="rounded-2xl border p-6"
                style={{
                  borderColor: 'rgba(94,42,103,0.25)',
                  backgroundColor: 'rgba(94,42,103,0.04)',
                }}
              >
                <p
                  className="font-headline text-[17px] font-black leading-[1.3]"
                  style={{ color: CAAS_ACCENT }}
                >
                  {q}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  S6 — GHOSTWRITING VS BOLDFY (tabela comparativa)             */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 py-24 md:px-12">
        <Glow className="right-[-100px] top-[10%] h-[700px] w-[700px] opacity-[0.08]" color="#9840AD" />

        <div className="relative z-10 mx-auto max-w-[1100px]">
          <div className="mx-auto mb-12 max-w-[820px] text-center">
            <PreTag>{c.compareTag}</PreTag>
            <SectionHeading title={c.compareTitle} highlight={c.compareTitleHighlight} />
            <p className="mx-auto mt-5 max-w-[720px] text-[15px] leading-[1.6] text-muted-foreground">
              {c.compareIntro}
            </p>
          </div>

          {/* Tabela comparativa */}
          <div className="overflow-hidden rounded-[20px] border border-border bg-card shadow-[0_20px_50px_rgba(94,42,103,0.1)]">
            {/* Header */}
            <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-border">
              <div className="bg-background/50 px-5 py-4" />
              <div className="bg-background/80 px-5 py-4 text-center">
                <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                  {c.compareColGhost}
                </div>
              </div>
              <div
                className="px-5 py-4 text-center"
                style={{
                  backgroundImage: `linear-gradient(135deg, ${CAAS_ACCENT} 0%, #9840AD 100%)`,
                }}
              >
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
                  <X className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground/60" />
                  <span>{row.ghost}</span>
                </div>
                <div
                  className="flex items-start gap-2 px-5 py-4 text-[13px] leading-[1.5] text-accent-foreground"
                  style={{ backgroundColor: 'rgba(94,42,103,0.04)' }}
                >
                  <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: CAAS_ACCENT }} />
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

      {/* ============================================================ */}
      {/*  S8 — CTA FINAL                                                */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden bg-background px-6 pb-28 pt-16 md:px-12">
        <Glow className="right-[-100px] top-0 h-[700px] w-[700px] opacity-[0.1]" />
        <Glow className="left-[-100px] bottom-0 h-[500px] w-[500px] opacity-[0.08]" color="#9840AD" />
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
