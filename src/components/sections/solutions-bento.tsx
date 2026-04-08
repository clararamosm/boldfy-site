'use client';

import { useT } from '@/lib/i18n/context';
import { ArrowRight, Layers, Palette } from 'lucide-react';
import Link from 'next/link';

interface SolutionCardProps {
  tag: string;
  tagColor: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

function SolutionCard({
  tag,
  tagColor,
  title,
  description,
  ctaLabel,
  href,
  icon: Icon,
}: SolutionCardProps) {
  return (
    <div className="group relative flex min-h-[320px] flex-col justify-between rounded-xl border border-border bg-card p-8 transition-shadow hover:shadow-md hover:border-primary/20">
      {/* Icon watermark */}
      <div className="pointer-events-none absolute right-6 top-6 opacity-[0.06]">
        <Icon className="h-24 w-24" />
      </div>

      <div className="relative z-10">
        {/* Tag */}
        <span
          className={`inline-block text-[11px] font-bold uppercase tracking-[.14em] ${tagColor} mb-4`}
        >
          {tag}
        </span>

        {/* Title */}
        <h3 className="font-headline text-xl md:text-2xl font-bold text-accent-foreground mb-3">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
          {description}
        </p>
      </div>

      {/* CTA */}
      <div className="relative z-10 mt-8">
        <Link
          href={href}
          className="inline-flex items-center text-sm font-semibold text-primary group-hover:underline"
        >
          {ctaLabel}
          <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}

export function SolutionsBentoSection() {
  const t = useT();

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center mb-14">
          <h2 className="font-headline text-2xl md:text-3xl font-bold text-accent-foreground mb-4">
            {t.home.solutionsTitle}{' '}
            <span className="text-primary">{t.home.solutionsTitleHighlight}</span>
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            {t.home.solutionsSubtitle}
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SaaS card */}
          <SolutionCard
            tag={t.home.solSaasTag}
            tagColor="text-primary"
            title={t.home.solSaasTitle}
            description={t.home.solSaasDesc}
            ctaLabel={t.home.solSaasCta}
            href="/solucoes/software-as-a-service"
            icon={Layers}
          />

          {/* CaaS card */}
          <SolutionCard
            tag={t.home.solCaasTag}
            tagColor="text-orange-500"
            title={t.home.solCaasTitle}
            description={t.home.solCaasDesc}
            ctaLabel={t.home.solCaasCta}
            href="/solucoes/content-as-a-service"
            icon={Palette}
          />
        </div>
      </div>
    </section>
  );
}
