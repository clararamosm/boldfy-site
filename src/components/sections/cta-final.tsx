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
        <h2 className="text-2xl md:text-4xl font-bold text-accent-foreground mb-4 max-w-2xl mx-auto">
          {t.home.ctaTitle}{' '}
          <span className="text-primary">{t.home.ctaTitleHighlight}</span>
        </h2>
        <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-8">
          {t.home.ctaSubtitle}
        </p>
        <Button asChild size="lg" className="font-bold">
          <Link href="/contato">
            {t.home.ctaButton}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
