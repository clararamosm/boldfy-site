'use client';

import { useT } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function CtaFinalSection() {
  const t = useT();

  return (
    <section className="py-20 md:py-28 bg-primary/5">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <h2 className="font-headline text-2xl md:text-4xl font-bold text-accent-foreground mb-4 max-w-2xl mx-auto">
          {t.home.ctaTitle}{' '}
          <span className="text-primary">{t.home.ctaTitleHighlight}</span>
        </h2>

        <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-10">
          {t.home.ctaSubtitle}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Button asChild size="lg" className="font-bold w-full sm:w-auto">
            <Link href="/precos">
              {t.home.ctaCta1}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            <Link href="/demo">{t.home.ctaCta2}</Link>
          </Button>
        </div>

        {/* Closing line */}
        <p className="text-xs md:text-sm text-muted-foreground">
          {t.home.ctaClosing}
        </p>
      </div>
    </section>
  );
}
