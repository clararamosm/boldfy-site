'use client';

import { useT } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Monitor } from 'lucide-react';
import Link from 'next/link';
import { useDemoPopup } from '@/components/forms/demo-popup';

export function HeroSection() {
  const t = useT();
  const { openPopup } = useDemoPopup();

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6 text-center">
        {/* Beta badge */}
        <div className="mb-6 flex justify-center">
          <Badge
            variant="secondary"
            className="px-4 py-1.5 text-xs font-semibold tracking-wide"
          >
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            {t.home.heroBadge}
          </Badge>
        </div>

        {/* Tag line */}
        <span className="inline-flex text-[11px] font-bold uppercase tracking-[.14em] text-primary mb-4">
          {t.home.heroTag}
        </span>

        {/* Main title */}
        <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-accent-foreground leading-tight mb-6 max-w-4xl mx-auto">
          {t.home.heroTitle}{' '}
          <span className="text-primary">{t.home.heroTitleHighlight}</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          {t.home.heroSubtitle}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
          <Button asChild size="lg" className="font-bold w-full sm:w-auto">
            <Link href="/precos">
              {t.home.heroCta1}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={openPopup}>
            {t.home.heroCta2}
          </Button>
        </div>

        {/* Honesty line */}
        <p className="text-xs text-muted-foreground">
          {t.home.heroHonesty}
        </p>

        {/* Platform mockup */}
        <div className="mt-16 mx-auto max-w-4xl">
          <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-primary/10 to-primary/5 p-1 shadow-lg shadow-primary/5">
            <div className="rounded-xl bg-white/80 backdrop-blur overflow-hidden">
              {/* Browser top bar */}
              <div className="flex items-center gap-2 border-b border-border/30 px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
                </div>
                <div className="mx-auto rounded-md bg-secondary/50 px-4 py-1 text-[10px] text-muted-foreground">
                  app.boldfy.com.br
                </div>
              </div>
              {/* Screenshot placeholder */}
              <div className="relative aspect-[16/9] flex items-center justify-center bg-secondary/20">
                <div className="text-center">
                  <Monitor className="h-12 w-12 text-primary/25 mx-auto mb-3" />
                  <p className="text-sm font-medium text-muted-foreground/50">
                    Screenshot da plataforma
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
