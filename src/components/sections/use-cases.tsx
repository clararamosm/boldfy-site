'use client';

import { useT } from '@/lib/i18n/context';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface UseCaseCardProps {
  title: string;
  pain: string;
  antidoteLabel: string;
  solution: string;
  tags: string[];
  href: string;
}

function UseCaseCard({ title, pain, antidoteLabel, solution, tags, href }: UseCaseCardProps) {
  return (
    <Link href={href} className="group block">
      <div className="rounded-xl border border-border bg-card p-6 md:p-8 h-full transition-shadow hover:shadow-md hover:border-primary/30">
        {/* Title */}
        <h3 className="text-lg md:text-xl font-bold text-foreground mb-3">
          {title}
        </h3>

        {/* Pain */}
        <p className="text-sm font-medium text-destructive mb-4">
          {pain}
        </p>

        {/* Antidote + solution */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-5">
          <span className="font-semibold text-primary">{antidoteLabel}</span>
          {solution}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Link hint */}
        <span className="inline-flex items-center text-sm font-medium text-primary group-hover:underline">
          Saiba mais
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
      title: t.home.marketingTitle,
      pain: t.home.marketingPain,
      antidoteLabel: t.home.antidote,
      solution: t.home.marketingSolution,
      tags: t.home.marketingTags,
      href: '/casos-de-uso/marketing',
    },
    {
      title: t.home.sellingTitle,
      pain: t.home.sellingPain,
      antidoteLabel: t.home.antidote,
      solution: t.home.sellingSolution,
      tags: t.home.sellingTags,
      href: '/casos-de-uso/social-selling',
    },
    {
      title: t.home.brandingTitle,
      pain: t.home.brandingPain,
      antidoteLabel: t.home.antidote,
      solution: t.home.brandingSolution,
      tags: t.home.brandingTags,
      href: '/casos-de-uso/employer-branding',
    },
  ];

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cases.map((c) => (
            <UseCaseCard key={c.title} {...c} />
          ))}
        </div>
      </div>
    </section>
  );
}
