'use client';

import { useT } from '@/lib/i18n/context';
import { Settings, Sparkles, Target, Trophy, TrendingUp } from 'lucide-react';

const stepIcons = [Settings, Sparkles, Target, Trophy, TrendingUp];

interface StepProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  stepNumber: number;
  isLast: boolean;
}

function Step({ icon: Icon, label, description, stepNumber, isLast }: StepProps) {
  return (
    <div className="flex flex-col items-center text-center relative flex-1">
      {/* Step circle */}
      <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/30 mb-4 transition-transform hover:scale-110">
        <Icon className="h-6 w-6 text-primary" />
      </div>

      {/* Connector line (horizontal, desktop only) */}
      {!isLast && (
        <div className="hidden md:block absolute top-7 left-[calc(50%+28px)] w-[calc(100%-56px)] h-0.5 bg-primary/20" />
      )}

      {/* Step number */}
      <span className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1.5">
        {stepNumber}
      </span>

      {/* Label */}
      <h3 className="text-sm font-bold text-foreground mb-1">
        {label}
      </h3>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
        {description}
      </p>
    </div>
  );
}

export function HowItWorksSection() {
  const t = useT();

  const steps = [
    { label: t.home.step1Label, description: t.home.step1Desc },
    { label: t.home.step2Label, description: t.home.step2Desc },
    { label: t.home.step3Label, description: t.home.step3Desc },
    { label: t.home.step4Label, description: t.home.step4Desc },
    { label: t.home.step5Label, description: t.home.step5Desc },
  ];

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* Tag */}
        <span className="block text-center text-[11px] font-bold uppercase tracking-[.14em] text-primary mb-4">
          {t.home.howItWorks}
        </span>

        {/* Steps */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-4 mt-10">
          {steps.map((step, idx) => (
            <Step
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
