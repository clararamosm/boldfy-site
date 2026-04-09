'use client';

import { useT } from '@/lib/i18n/context';
import { ArrowRight, Megaphone, Target, Heart } from 'lucide-react';
import Link from 'next/link';

interface UseCaseCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  cta: string;
  href: string;
  dotColor: string;
  iconBg: string;
  iconColor: string;
}

function UseCaseCard({
  icon: Icon,
  title,
  description,
  cta,
  href,
  dotColor,
  iconBg,
  iconColor,
}: UseCaseCardProps) {
  return (
    <Link href={href} className="group block h-full">
      <div className="rounded-xl border border-border bg-card p-6 md:p-8 h-full transition-shadow hover:shadow-md hover:border-primary/30 flex flex-col">
        {/* Icon circle with colored dot */}
        <div className="relative mb-5">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${iconBg}`}
          >
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <span
            className={`absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full ${dotColor} ring-2 ring-card`}
          />
        </div>

        {/* Title */}
        <h3 className="font-headline text-lg md:text-xl font-black text-accent-foreground mb-3">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
          {description}
        </p>

        {/* CTA link */}
        <span className="inline-flex items-center text-sm font-medium text-primary group-hover:underline">
          {cta}
          <ArrowRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

export function UseCasesSection() {
  const t = useT();

  const cases: UseCaseCardProps[] = [
    {
      icon: Megaphone,
      title: t.home.ucMarketingTitle,
      description: t.home.ucMarketingDesc,
      cta: t.home.ucMarketingCta,
      href: '/para/marketing',
      dotColor: 'bg-emerald-500',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-600',
    },
    {
      icon: Target,
      title: t.home.ucVendasTitle,
      description: t.home.ucVendasDesc,
      cta: t.home.ucVendasCta,
      href: '/para/vendas',
      dotColor: 'bg-blue-500',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-600',
    },
    {
      icon: Heart,
      title: t.home.ucRhTitle,
      description: t.home.ucRhDesc,
      cta: t.home.ucRhCta,
      href: '/para/rh',
      dotColor: 'bg-pink-500',
      iconBg: 'bg-pink-500/10',
      iconColor: 'text-pink-600',
    },
  ];

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="font-headline text-2xl md:text-3xl font-black text-accent-foreground mb-4">
            {t.home.useCasesTitle}{' '}
            <span className="text-primary">{t.home.useCasesTitleHighlight}</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t.home.useCasesSubtitle}
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cases.map((c) => (
            <UseCaseCard key={c.href} {...c} />
          ))}
        </div>
      </div>
    </section>
  );
}
