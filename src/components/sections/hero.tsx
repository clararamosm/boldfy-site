'use client';

import { useT } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  const t = useT();

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6 text-center">
        {/* Beta badge */}
        <div className="mb-6 flex justify-center">
          <Badge
            variant="secondary"
            className="px-4 py-1.5 text-xs font-semibold tracking-wide"
          >
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
            {t.home.heroBadge}
          </Badge>
        </div>

        {/* Tag line */}
        <span className="inline-flex text-[11px] font-bold uppercase tracking-[.14em] text-primary mb-4">
          {t.home.heroTag}
        </span>

        {/* Main title */}
        <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-accent-foreground leading-tight mb-6 max-w-4xl mx-auto">
          {t.home.heroTitle}{' '}
          <span className="text-primary">{t.home.heroTitleHighlight}</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          {t.home.heroSubtitle}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="font-bold w-full sm:w-auto">
            {t.home.heroCta1}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            {t.home.heroCta2}
          </Button>
        </div>
      </div>
    </section>
  );
}
