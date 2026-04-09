'use client';

import { useEffect, useRef } from 'react';
import { useT } from '@/lib/i18n/context';
import {
  LayoutGrid,
  Megaphone,
  MinusCircle,
  Building2,
  MessageSquare,
  Ghost,
  XCircle,
  CheckCircle2,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Timeline step data builder                                         */
/* ------------------------------------------------------------------ */

interface TimelineStep {
  title: string;
  detail: string;
  chips: string[];
  chipVariant: 'default' | 'gray' | 'red';
  icon: React.ReactNode;
}

function useTimelineSteps(): TimelineStep[] {
  const t = useT();
  return [
    {
      title: t.home.timelineStep1Title,
      detail: t.home.timelineStep1Detail,
      chips: (t.home.timelineStep1Chips ?? '').split(',').filter(Boolean),
      chipVariant: 'default',
      icon: <LayoutGrid className="h-6 w-6" />,
    },
    {
      title: t.home.timelineStep2Title,
      detail: t.home.timelineStep2Detail,
      chips: [],
      chipVariant: 'default',
      icon: <Megaphone className="h-6 w-6" />,
    },
    {
      title: t.home.timelineStep3Title,
      detail: t.home.timelineStep3Detail,
      chips: (t.home.timelineStep3Chips ?? '').split(',').filter(Boolean),
      chipVariant: 'gray',
      icon: <MinusCircle className="h-6 w-6" />,
    },
    {
      title: t.home.timelineStep4Title,
      detail: t.home.timelineStep4Detail,
      chips: (t.home.timelineStep4Chips ?? '').split(',').filter(Boolean),
      chipVariant: 'red',
      icon: <Building2 className="h-6 w-6" />,
    },
    {
      title: t.home.timelineStep5Title,
      detail: t.home.timelineStep5Detail,
      chips: (t.home.timelineStep5Chips ?? '').split(',').filter(Boolean),
      chipVariant: 'gray',
      icon: <MessageSquare className="h-6 w-6" />,
    },
    {
      title: t.home.timelineStep6Title,
      detail: t.home.timelineStep6Detail,
      chips: (t.home.timelineStep6Chips ?? '').split(',').filter(Boolean),
      chipVariant: 'red',
      icon: <Ghost className="h-6 w-6" />,
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Virada data                                                        */
/* ------------------------------------------------------------------ */

function useViradaData() {
  const t = useT();
  return {
    problems: [
      t.home.viradaProblem1,
      t.home.viradaProblem2,
      t.home.viradaProblem3,
      t.home.viradaProblem4,
      t.home.viradaProblem5,
    ],
    solutions: [
      t.home.viradaSolution1,
      t.home.viradaSolution2,
      t.home.viradaSolution3,
      t.home.viradaSolution4,
      t.home.viradaSolution5,
    ],
  };
}

/* ------------------------------------------------------------------ */
/*  ProblemSection                                                     */
/* ------------------------------------------------------------------ */

export function ProblemSection() {
  const t = useT();
  const steps = useTimelineSteps();
  const virada = useViradaData();

  const timelineRef = useRef<HTMLDivElement>(null);
  const viradaRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGSVGElement>(null);

  /* ── Timeline: cascade animation on scroll ── */
  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const items = el.querySelectorAll<HTMLElement>('[data-step]');
            items.forEach((item, i) => {
              setTimeout(() => item.classList.add('visible'), i * 180);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* ── Virada: cascade chips + scroll-driven line ── */
  useEffect(() => {
    const container = viradaRef.current;
    const svg = lineRef.current;
    if (!container || !svg) return;

    // Cascade chips on enter
    const chipObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const chips =
              container.querySelectorAll<HTMLElement>('[data-fluxo]');
            chips.forEach((chip, i) => {
              // Left side first (0-4), then right (5-9)
              const delay = i < 5 ? i * 120 : (i - 5) * 120 + 800;
              setTimeout(() => chip.classList.add('visible'), delay);
            });
            chipObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );
    chipObserver.observe(container);

    // Scroll-driven line draw
    const paths = svg.querySelectorAll<SVGPathElement>('path');

    function onScroll() {
      const rect = container!.getBoundingClientRect();
      const viewH = window.innerHeight;
      // progress 0→1 as the section scrolls through the viewport
      const raw = 1 - rect.top / viewH;
      const progress = Math.min(Math.max(raw, 0), 1);

      paths.forEach((path) => {
        const totalLength = path.getTotalLength();
        path.style.strokeDasharray = `${totalLength}`;
        path.style.strokeDashoffset = `${totalLength * (1 - progress)}`;
      });
    }

    onScroll(); // initial
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      chipObserver.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <section className="relative bg-background px-6 pb-28 pt-8 md:px-12 md:pb-36 md:pt-12">
      {/* ── Ambient glows (continuation from hero) ── */}
      <div className="pointer-events-none absolute -left-[200px] top-[30%] h-[700px] w-[700px] rounded-full bg-primary opacity-[0.08] blur-[120px]" />
      <div className="pointer-events-none absolute -right-[100px] bottom-[5%] h-[500px] w-[500px] rounded-full bg-[#E875FF] opacity-[0.06] blur-[120px]" />

      {/* ── Grid pattern (continuation from hero) ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--primary) / 0.055) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.055) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage:
            'radial-gradient(ellipse at center, black 30%, transparent 80%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, black 30%, transparent 80%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1280px]">
        {/* ════════════ HEADER ════════════ */}
        <div className="mx-auto mb-20 max-w-[820px] text-center">
          <span className="mb-6 inline-block rounded-full border border-primary/20 bg-primary/[0.08] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-primary">
            {t.home.problemTag}
          </span>
          <h2 className="font-headline text-[clamp(34px,4.5vw,54px)] font-black leading-[1.05] tracking-[-0.03em] text-accent-foreground">
            {t.home.problemTitle}{' '}
            <span className="bg-gradient-to-br from-primary to-[#E875FF] bg-clip-text text-transparent">
              {t.home.problemTitleHighlight}
            </span>
          </h2>
        </div>

        {/* ════════════ TIMELINE DO FRACASSO ════════════ */}
        <div className="mb-28 md:mb-36">
          {/* Label */}
          <div className="mb-8 flex items-center justify-center gap-3.5 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            <span className="h-px w-8 bg-border" />
            {t.home.timelineLabel}
            <span className="h-px w-8 bg-border" />
          </div>

          {/* Grid */}
          <div
            ref={timelineRef}
            className="relative grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6 lg:gap-4"
          >
            {/* Connector line (desktop only) */}
            <div className="pointer-events-none absolute left-[8.33%] right-[8.33%] top-8 z-0 hidden h-0.5 bg-gradient-to-r from-transparent via-primary/25 to-transparent lg:block" />

            {steps.map((step, i) => (
              <div
                key={i}
                data-step={i}
                className="timeline-step relative z-[1] flex flex-col items-center text-center"
              >
                {/* Circle icon */}
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-card text-primary shadow-sm transition-all duration-300">
                  {step.icon}
                </div>

                {/* Card */}
                <div className="flex flex-1 flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-sm">
                  <p className="font-headline text-xs font-black leading-tight tracking-tight text-accent-foreground">
                    {step.title}
                  </p>
                  <p className="text-[10px] leading-snug text-muted-foreground">
                    {step.detail}
                  </p>
                  {step.chips.length > 0 && (
                    <div className="mt-1 flex flex-wrap justify-center gap-1">
                      {step.chips.map((chip) => (
                        <span
                          key={chip}
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                            step.chipVariant === 'red'
                              ? 'bg-destructive/10 text-destructive'
                              : step.chipVariant === 'gray'
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-secondary text-secondary-foreground'
                          }`}
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ════════════ VIRADA BOLDFY ════════════ */}
        <div>
          {/* Label */}
          <div className="mb-10 flex items-center justify-center gap-3.5 text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
            <span className="h-px w-8 bg-border" />
            {t.home.viradaLabel}
            <span className="h-px w-8 bg-border" />
          </div>

          {/* Fluxograma grid: problems | boldfy | solutions */}
          <div
            ref={viradaRef}
            className="relative mx-auto grid max-w-[1100px] items-center gap-8 md:grid-cols-[1fr_auto_1fr] md:gap-14"
          >
            {/* ── SVG connector lines (desktop) ── */}
            <svg
              ref={lineRef}
              className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full md:block"
              viewBox="0 0 1100 500"
              preserveAspectRatio="none"
            >
              {/* Problem lines (left → center) */}
              <path
                d="M 380 50 Q 430 50 480 180 T 530 250"
                fill="none"
                stroke="hsl(0 84% 60% / 0.35)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M 380 140 Q 430 140 480 210 T 530 250"
                fill="none"
                stroke="hsl(0 84% 60% / 0.35)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M 380 250 L 530 250"
                fill="none"
                stroke="hsl(0 84% 60% / 0.35)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M 380 360 Q 430 360 480 290 T 530 250"
                fill="none"
                stroke="hsl(0 84% 60% / 0.35)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M 380 450 Q 430 450 480 320 T 530 250"
                fill="none"
                stroke="hsl(0 84% 60% / 0.35)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              {/* Solution lines (center → right) */}
              <path
                d="M 570 250 Q 620 250 670 180 T 720 50"
                fill="none"
                stroke="hsl(160 72% 40% / 0.45)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M 570 250 Q 620 250 670 210 T 720 140"
                fill="none"
                stroke="hsl(160 72% 40% / 0.45)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M 570 250 L 720 250"
                fill="none"
                stroke="hsl(160 72% 40% / 0.45)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M 570 250 Q 620 250 670 290 T 720 360"
                fill="none"
                stroke="hsl(160 72% 40% / 0.45)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M 570 250 Q 620 250 670 320 T 720 450"
                fill="none"
                stroke="hsl(160 72% 40% / 0.45)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>

            {/* ── LEFT: Problems ── */}
            <div className="relative z-[1] flex flex-col gap-3.5">
              {virada.problems.map((text, i) => (
                <div
                  key={i}
                  data-fluxo={i}
                  className="virada-chip virada-chip-left flex items-center gap-3 rounded-full border-[1.5px] border-destructive/30 bg-card px-5 py-3 text-[13px] font-semibold text-destructive/80 shadow-sm"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <XCircle className="h-4 w-4" />
                  </span>
                  {text}
                </div>
              ))}
            </div>

            {/* ── CENTER: Boldfy logo ── */}
            <div className="virada-center relative z-[2] mx-auto flex h-[180px] w-[180px] shrink-0 items-center justify-center rounded-full border-2 border-primary/35 bg-card shadow-[0_0_0_12px_hsl(var(--primary)/0.06),0_0_0_24px_hsl(var(--primary)/0.03),0_12px_40px_hsl(var(--primary)/0.25)]">
              <span className="font-headline text-[38px] font-black tracking-[-0.04em] text-accent-foreground">
                bold
                <span className="text-primary">fy</span>
              </span>
            </div>

            {/* ── RIGHT: Solutions ── */}
            <div className="relative z-[1] flex flex-col gap-3.5">
              {virada.solutions.map((text, i) => (
                <div
                  key={i}
                  data-fluxo={i + 5}
                  className="virada-chip virada-chip-right flex items-center gap-3 rounded-full border-[1.5px] border-emerald-500/30 bg-card px-5 py-3 text-[13px] font-semibold text-emerald-700 shadow-sm"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
