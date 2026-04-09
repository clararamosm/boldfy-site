'use client';

import { useT } from '@/lib/i18n/context';
import { XCircle } from 'lucide-react';

export function ProblemSection() {
  const t = useT();

  const painPoints = [
    t.home.pain1,
    t.home.pain2,
    t.home.pain3,
    t.home.pain4,
    t.home.pain5,
  ];

  return (
    <section className="py-20 md:py-28 bg-secondary/30">
      <div className="mx-auto max-w-6xl px-6">
        {/* Title */}
        <h2 className="font-headline text-2xl sm:text-3xl md:text-4xl font-black text-accent-foreground leading-tight mb-6 max-w-3xl">
          {t.home.problemTitle}{' '}
          <span className="text-primary">{t.home.problemTitleHighlight}</span>
        </h2>

        {/* Body */}
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-3xl mb-8">
          {t.home.problemBody}
        </p>

        {/* Pain points grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {painPoints.map((pain, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-lg border border-destructive/15 bg-destructive/5 px-4 py-3"
            >
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <span className="text-sm text-foreground">{pain}</span>
            </div>
          ))}
        </div>

        {/* Conclusion */}
        <p className="whitespace-pre-line text-base md:text-lg font-semibold text-accent-foreground leading-relaxed max-w-3xl">
          {t.home.problemConclusion}
        </p>
      </div>
    </section>
  );
}
