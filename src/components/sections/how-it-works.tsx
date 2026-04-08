'use client';

import { useEffect, useRef, useState } from 'react';
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

      {/* Step number */}
      <span className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1.5">
        {stepNumber}
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
    { label: t.home.step1Label, description: t.home.step1Desc },
    { label: t.home.step2Label, description: t.home.step2Desc },
    { label: t.home.step3Label, description: t.home.step3Desc },
    { label: t.home.step4Label, description: t.home.step4Desc },
    { label: t.home.step5Label, description: t.home.step5Desc },
  ];

  return (
    <section ref={sectionRef} className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* Tag */}
        <span className="block text-center text-[11px] font-bold uppercase tracking-[.14em] text-primary mb-4">
          {t.home.howItWorks}
        </span>

        {/* Steps */}
        <div className="relative flex flex-col md:flex-row gap-8 md:gap-4 mt-10">
          {/* SVG connector — desktop only */}
          <svg
            className="hidden md:block absolute top-7 left-0 w-full h-[2px] pointer-events-none overflow-visible"
            preserveAspectRatio="none"
          >
            <line
              x1="10%"
              y1="0"
              x2="90%"
              y2="0"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeDasharray="400"
              strokeDashoffset={isVisible ? '0' : '400'}
              strokeLinecap="round"
              opacity="0.25"
              style={{
                transition: 'stroke-dashoffset 1.5s ease-out',
              }}
            />
            {/* Animated progress line */}
            <line
              x1="10%"
              y1="0"
              x2="90%"
              y2="0"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeDasharray="400"
              strokeDashoffset={isVisible ? '0' : '400'}
              strokeLinecap="round"
              opacity="0.6"
              style={{
                transition: 'stroke-dashoffset 2s ease-out 0.3s',
              }}
            />
          </svg>

          {/* Mobile vertical connector */}
          <div className="md:hidden absolute left-[50%] top-0 bottom-0 w-0.5 -translate-x-1/2">
            <div
              className="w-full bg-primary/20 rounded-full transition-all duration-[2s] ease-out"
              style={{ height: isVisible ? '100%' : '0%' }}
            />
          </div>

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
