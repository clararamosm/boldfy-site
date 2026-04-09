'use client';

import { useT } from '@/lib/i18n/context';
import { User, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function ManifestoSection() {
  const t = useT();

  return (
    <>
      {/* Part A — Manifesto */}
      <section id="manifesto" className="py-20 md:py-28 bg-primary/5">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-headline text-2xl md:text-4xl font-black text-accent-foreground text-center mb-10 max-w-2xl mx-auto">
            {t.home.manifestoTitle}
          </h2>

          <div className="mx-auto max-w-3xl space-y-6">
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              {t.home.manifestoBody1}
            </p>

            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              {t.home.manifestoBody2}
            </p>

            {/* Pull-quote / emphasis */}
            <p className="font-headline text-xl md:text-2xl font-black text-primary text-center leading-snug pt-4">
              {t.home.manifestoBody3}
            </p>
          </div>
        </div>
      </section>

      {/* Part B — Founder */}
      <section id="fundadora" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-10 md:gap-14 items-center">
            {/* Photo placeholder */}
            <div className="flex justify-center md:justify-start">
              <div className="flex h-[200px] w-[200px] items-center justify-center rounded-full bg-secondary/30">
                <User className="h-16 w-16 text-muted-foreground/40" />
              </div>
            </div>

            {/* Text */}
            <div className="text-center md:text-left">
              <h3 className="font-headline text-xl md:text-2xl font-black text-accent-foreground mb-1">
                {t.home.founderName}
              </h3>

              <p className="text-sm font-semibold text-primary mb-4">
                {t.home.founderRole}
              </p>

              <p className="text-base text-muted-foreground leading-relaxed mb-6 max-w-xl">
                {t.home.founderBio}
              </p>

              <Button asChild variant="outline" size="sm">
                <Link
                  href="https://www.linkedin.com/in/clararamos"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.home.founderLinkedin}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
