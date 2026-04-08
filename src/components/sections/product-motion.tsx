'use client';

import { useT } from '@/lib/i18n/context';
import { Brain, Trophy, GraduationCap, Monitor } from 'lucide-react';

interface PillarProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function Pillar({ icon: Icon, title, description }: PillarProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-5">
        <Icon className="h-7 w-7 text-primary" />
      </div>
      <h3 className="font-headline text-lg font-bold text-accent-foreground mb-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
        {description}
      </p>
    </div>
  );
}

export function ProductMotionSection() {
  const t = useT();

  const pillars: PillarProps[] = [
    {
      icon: Brain,
      title: t.home.productPillar1Title,
      description: t.home.productPillar1Desc,
    },
    {
      icon: Trophy,
      title: t.home.productPillar2Title,
      description: t.home.productPillar2Desc,
    },
    {
      icon: GraduationCap,
      title: t.home.productPillar3Title,
      description: t.home.productPillar3Desc,
    },
  ];

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section header */}
        <div className="text-center mb-14">
          <h2 className="font-headline text-2xl md:text-3xl font-bold text-accent-foreground mb-4">
            {t.home.productTitle}{' '}
            <span className="text-primary">{t.home.productTitleHighlight}</span>
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t.home.productSubtitle}
          </p>
        </div>

        {/* Pillars grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 mb-16">
          {pillars.map((pillar) => (
            <Pillar key={pillar.title} {...pillar} />
          ))}
        </div>

        {/* Product screenshot mockup */}
        <div className="mx-auto max-w-4xl">
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
