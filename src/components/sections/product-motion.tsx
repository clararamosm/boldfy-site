'use client';

import { useT } from '@/lib/i18n/context';
import { Brain, Zap, BookOpen, Sparkles, Check, Circle } from 'lucide-react';

/* ================================================================== */
/*  Mini-component 1 — Brand Context + AI rotating phrases             */
/* ================================================================== */

const brandChecks = [
  'Tom de voz',
  'Posicionamento',
  'Público-alvo',
  'Inimigo de marca',
  'Valores',
];

const aiPhrases = [
  { text: 'Lendo o ', bold: 'Brand Context', suffix: '…' },
  { text: 'Analisando ', bold: 'tom de voz', suffix: '…' },
  { text: 'Alinhando com a ', bold: 'voz pessoal', suffix: '…' },
  { text: 'Gerando com a ', bold: 'sua voz', suffix: '…' },
];

function MiniIA() {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="font-headline text-[11px] font-black text-accent-foreground">
          Contexto de marca
        </span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">
          5/5
        </span>
      </div>

      {/* Brand checks */}
      <div className="mb-3.5 flex flex-wrap gap-1.5">
        {brandChecks.map((label) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/[0.06] px-2.5 py-1 text-[10px] font-semibold text-primary/80"
          >
            <span className="brand-check-dot h-2 w-2 shrink-0 rounded-full bg-amber-400" />
            {label}
          </span>
        ))}
      </div>

      {/* AI generating card with rotating border */}
      <div className="ai-generating-card relative flex min-h-[52px] items-center gap-2.5 rounded-lg bg-card p-3 shadow-sm">
        <div className="ai-spark flex shrink-0 items-center justify-center text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="relative min-h-[28px] min-w-0 flex-1">
          {aiPhrases.map((phrase, i) => (
            <span
              key={i}
              className="ai-phrase absolute inset-0 flex items-center text-[11px] font-semibold leading-snug text-accent-foreground"
              style={{ animationDelay: `${i * 3}s` }}
            >
              {phrase.text}
              <strong className="font-extrabold text-primary">
                {phrase.bold}
              </strong>
              {phrase.suffix}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Mini-component 2 — Gift box with confetti on hover                 */
/* ================================================================== */

const confettiColors = [
  'bg-primary',
  'bg-amber-400',
  'bg-emerald-500',
  'bg-[#E875FF]',
  'bg-orange-500',
  'bg-primary',
  'bg-amber-400',
  'bg-emerald-500',
  'bg-[#E875FF]',
  'bg-primary',
];

function MiniGift() {
  return (
    <div className="mini-gift-wrap group/gift relative flex h-[200px] cursor-pointer items-center justify-center">
      <div className="gift-box relative h-[100px] w-[110px] transition-transform duration-500">
        {/* Box base */}
        <div className="absolute bottom-0 left-0 h-[70%] w-full rounded-lg bg-gradient-to-br from-primary to-[#E875FF] shadow-[0_8px_24px_rgba(205,80,241,0.35),inset_0_-8px_16px_rgba(94,42,103,0.2)]">
          <div className="absolute left-1/2 top-0 h-full w-4 -translate-x-1/2 bg-gradient-to-b from-amber-400 to-amber-600 shadow-[inset_0_0_8px_rgba(0,0,0,0.15)]" />
        </div>
        {/* Lid */}
        <div className="gift-lid absolute left-[-6%] top-0 z-[2] h-[32%] w-[112%] origin-bottom rounded-t-lg bg-gradient-to-br from-[#E875FF] to-primary shadow-[0_4px_12px_rgba(205,80,241,0.4),inset_0_-4px_8px_rgba(94,42,103,0.15)]">
          <div className="absolute left-1/2 top-0 h-full w-[18px] -translate-x-1/2 bg-gradient-to-b from-amber-400 to-amber-600 shadow-[inset_0_0_8px_rgba(0,0,0,0.15)]" />
        </div>
        {/* Bow */}
        <div className="gift-bow absolute -top-3.5 left-1/2 z-[3] -translate-x-1/2">
          <div className="absolute left-[-14px] top-0 h-[18px] w-[14px] -rotate-[20deg] rounded-[50%_50%_0_50%] bg-gradient-to-br from-amber-400 to-amber-600 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.15)]" />
          <div className="absolute right-[-14px] top-0 h-[18px] w-[14px] rotate-[20deg] scale-x-[-1] rounded-[50%_50%_0_50%] bg-gradient-to-br from-amber-400 to-amber-600 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.15)]" />
        </div>

        {/* Confetti */}
        {confettiColors.map((color, i) => (
          <span
            key={i}
            className={`confetti-piece absolute left-1/2 top-[30%] h-3 w-2 opacity-0 ${color} ${i % 2 === 0 ? '' : 'rounded-full'}`}
            style={
              {
                '--confetti-index': i,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Badge on hover */}
      <div className="gift-badge absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 translate-y-2 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-3 py-1.5 text-[10px] font-bold text-accent-foreground opacity-0 shadow-[0_4px_12px_rgba(93,42,103,0.15)]">
        <Check className="h-3 w-3 text-emerald-500" />
        Missão concluída ·{' '}
        <span className="font-extrabold text-primary">+150 pts</span>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Mini-component 3 — Trail journey (mini steps)                      */
/* ================================================================== */

const trailSteps = [
  { title: 'Fundamentos de voz', pts: 60, status: 'done' as const },
  { title: 'Achando o ângulo', pts: 60, status: 'done' as const },
  { title: 'Estrutura de hook', pts: 60, status: 'done' as const },
  { title: 'Storytelling real', pts: 75, status: 'current' as const },
  { title: 'Publicação consistente', pts: 75, status: 'pending' as const },
];

function MiniTrail() {
  return (
    <div className="rounded-xl border border-border bg-background p-3.5">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <span className="font-headline text-[11px] font-black text-accent-foreground">
          Como criar conteúdo autoral
        </span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">
          3/5
        </span>
      </div>

      {/* Steps */}
      <div className="trail-steps relative flex flex-col gap-1.5">
        {/* Vertical connector line */}
        <div className="absolute bottom-[10px] left-[9px] top-[10px] w-0.5 bg-gradient-to-b from-primary from-60% to-border to-60%" />

        {trailSteps.map((step) => (
          <div
            key={step.title}
            className="relative z-[1] flex items-center gap-2"
          >
            {/* Dot */}
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                step.status === 'done'
                  ? 'bg-primary text-white'
                  : step.status === 'current'
                    ? 'border-2 border-primary bg-card text-primary shadow-[0_0_0_3px_rgba(205,80,241,0.15)]'
                    : 'border-2 border-border bg-card text-muted-foreground'
              }`}
            >
              {step.status === 'done' ? (
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              ) : step.status === 'current' ? (
                <Circle className="h-2 w-2 fill-current" />
              ) : (
                <Circle className="h-2.5 w-2.5" strokeWidth={2.5} />
              )}
            </div>

            {/* Content */}
            <div className="flex flex-1 items-center justify-between gap-1 py-0.5">
              <span
                className={`text-[11px] leading-tight ${
                  step.status === 'done'
                    ? 'font-semibold text-primary/70'
                    : step.status === 'current'
                      ? 'font-extrabold text-accent-foreground'
                      : 'font-medium text-muted-foreground'
                }`}
              >
                {step.title}
              </span>
              <span
                className={`flex shrink-0 items-center gap-0.5 text-[9px] font-bold ${
                  step.status === 'done' || step.status === 'current'
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                <Zap className="h-2.5 w-2.5 fill-current" />
                {step.pts}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Card wrapper                                                       */
/* ================================================================== */

interface SystemCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  middle?: boolean;
  children: React.ReactNode;
}

function SystemCard({
  icon: Icon,
  title,
  description,
  middle,
  children,
}: SystemCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-[20px] border border-border bg-card p-6 shadow-[0_8px_32px_rgba(93,42,103,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_48px_rgba(93,42,103,0.14)] ${
        middle ? 'lg:-mt-5 lg:pb-8' : ''
      }`}
    >
      {/* Icon */}
      <div className="mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-gradient-to-br from-secondary to-primary/15 text-primary">
        <Icon className="h-6 w-6" />
      </div>

      {/* Title */}
      <h3 className="mb-2 font-headline text-[20px] font-black leading-[1.2] tracking-[-0.015em] text-accent-foreground">
        {title}
      </h3>

      {/* Description */}
      <p className="mb-5 text-[13px] leading-relaxed text-muted-foreground">
        {description}
      </p>

      {/* Mini-component */}
      {children}
    </div>
  );
}

/* ================================================================== */
/*  Section                                                            */
/* ================================================================== */

export function ProductMotionSection() {
  const t = useT();

  return (
    <section className="relative bg-background px-6 py-16 md:px-12 md:py-24">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute right-[-100px] top-[-10%] h-[700px] w-[700px] rounded-full bg-primary opacity-[0.08] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[10%] left-[-50px] h-[500px] w-[500px] rounded-full bg-[#E875FF] opacity-[0.06] blur-[120px]" />

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
            {t.home.productTag}
          </span>
          <h2 className="mb-4 font-headline text-[clamp(28px,4vw,44px)] font-black leading-[1.08] tracking-[-0.025em] text-accent-foreground">
            {t.home.productTitle}{' '}
            <span className="bg-gradient-to-br from-primary to-[#E875FF] bg-clip-text text-transparent">
              {t.home.productTitleHighlight}
            </span>
          </h2>
          <p className="mx-auto max-w-[820px] text-base leading-relaxed text-muted-foreground">
            {t.home.productSubtitle}
          </p>
        </div>

        {/* Cards grid — middle card taller */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Card 1 — IA */}
          <SystemCard
            icon={Brain}
            title={t.home.productPillar1Title}
            description={t.home.productPillar1Desc}
          >
            <MiniIA />
          </SystemCard>

          {/* Card 2 — Gamificação (middle, taller) */}
          <SystemCard
            icon={Zap}
            title={t.home.productPillar2Title}
            description={t.home.productPillar2Desc}
            middle
          >
            <MiniGift />
          </SystemCard>

          {/* Card 3 — Trilhas */}
          <SystemCard
            icon={BookOpen}
            title={t.home.productPillar3Title}
            description={t.home.productPillar3Desc}
          >
            <MiniTrail />
          </SystemCard>
        </div>
      </div>
    </section>
  );
}
