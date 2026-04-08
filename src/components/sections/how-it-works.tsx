'use client';

import { useEffect, useRef, useState } from 'react';
import { useT } from '@/lib/i18n/context';
import { Settings, PenTool, Trophy, BarChart3 } from 'lucide-react';

const stepIcons = [Settings, PenTool, Trophy, BarChart3];

interface StepProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  stepNumber: number;
}

function Step({ icon: Icon, label, description, stepNumber }: StepProps) {
  return (
    <div className="flex flex-col items-center text-center relative flex-1">
      {/* Step circle */}
      <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/30 mb-4 transition-transform hover:scale-110">
        <Icon className="h-6 w-6 text-primary" />
      </div>

      {/* Step number */}
      <span className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1.5">
        {String(stepNumber).padStart(2, '0')}
      </span>

      {/* Label */}
      <h3 className="font-headline text-sm font-bold text-foreground mb-1">
        {label}
      </h3>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
        {description}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile step — vertical layout with connector on the left          */
/* ------------------------------------------------------------------ */

interface MobileStepProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  stepNumber: number;
  isLast: boolean;
}

function MobileStep({ icon: Icon, label, description, stepNumber, isLast }: MobileStepProps) {
  return (
    <div className="flex gap-5">
      {/* Left rail: circle + connector line */}
      <div className="flex flex-col items-center">
        <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/30">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-primary/15 my-1" />
        )}
      </div>

      {/* Content */}
      <div className="pb-8">
        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
          {String(stepNumber).padStart(2, '0')}
        </span>
        <h3 className="font-headline text-sm font-bold text-foreground mt-0.5 mb-1">
          {label}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main section                                                      */
/* ------------------------------------------------------------------ */

export function HowItWorksSection() {
  const t = useT();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  const steps = [
    { label: t.home.howStep1Label, description: t.home.howStep1Desc },
    { label: t.home.howStep2Label, description: t.home.howStep2Desc },
    { label: t.home.howStep3Label, description: t.home.howStep3Desc },
    { label: t.home.howStep4Label, description: t.home.howStep4Desc },
  ];

  return (
    <section ref={sectionRef} className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center mb-14">
          <h2 className="font-headline text-2xl md:text-3xl font-bold text-accent-foreground mb-4">
            {t.home.howTitle}{' '}
            <span className="text-primary">{t.home.howTitleHighlight}</span>
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            {t.home.howSubtitle}
          </p>
        </div>

        {/* ---- Desktop: horizontal steps with animated SVG connector ---- */}
        <div className="hidden md:block">
          <div className="relative flex gap-4">
            {/* SVG connector — background track */}
            <svg
              className="absolute top-7 left-0 w-full h-[2px] pointer-events-none overflow-visible"
              preserveAspectRatio="none"
            >
              <line
                x1="12%"
                y1="0"
                x2="88%"
                y2="0"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeDasharray="600"
                strokeDashoffset={isVisible ? '0' : '600'}
                strokeLinecap="round"
                opacity="0.15"
                style={{
                  transition: 'stroke-dashoffset 1.5s ease-out',
                }}
              />
              {/* Animated progress line */}
              <line
                x1="12%"
                y1="0"
                x2="88%"
                y2="0"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeDasharray="600"
                strokeDashoffset={isVisible ? '0' : '600'}
                strokeLinecap="round"
                opacity="0.5"
                style={{
                  transition: 'stroke-dashoffset 2s ease-out 0.3s',
                }}
              />
            </svg>

            {steps.map((step, idx) => (
              <Step
                key={step.label}
                icon={stepIcons[idx]}
                label={step.label}
                description={step.description}
                stepNumber={idx + 1}
              />
            ))}
          </div>
        </div>

        {/* ---- Mobile: vertical layout with left-side connector ---- */}
        <div className="md:hidden">
          {steps.map((step, idx) => (
            <MobileStep
              key={step.label}
              icon={stepIcons[idx]}
              label={step.label}
              description={step.description}
              stepNumber={idx + 1}
              isLast={idx === steps.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
