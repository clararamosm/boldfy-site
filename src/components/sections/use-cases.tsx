'use client';

import { useT } from '@/lib/i18n/context';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Megaphone, Target, Heart } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const useCaseIcons = [Megaphone, Target, Heart];
// Quando tiver as fotos, substituir null pelo path: '/images/usecase-marketing.webp'
const useCaseImages: (string | null)[] = [null, null, null];

interface UseCaseCardProps {
  title: string;
  pain: string;
  antidoteLabel: string;
  solution: string;
  tags: string[];
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  image: string | null;
}

function UseCaseCard({ title, pain, antidoteLabel, solution, tags, href, icon: Icon, image }: UseCaseCardProps) {
  return (
    <Link href={href} className="group block">
      <div className="rounded-xl border border-border bg-card overflow-hidden h-full transition-shadow hover:shadow-md hover:border-primary/30">
        {/* Image area */}
        <div className="relative aspect-[16/9] bg-secondary/20">
          {image ? (
            <Image src={image} alt={title} fill className="object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/30">
              <Icon className="h-10 w-10 text-primary/20" />
            </div>
          )}
        </div>

        <div className="p-6 md:p-8">
          {/* Title */}
          <h3 className="font-headline text-lg md:text-xl font-bold text-foreground mb-3">
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
      </div>
    </Link>
  );
}

export function UseCasesSection() {
  const t = useT();

  const cases: Omit<UseCaseCardProps, 'icon' | 'image'>[] = [
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
          {cases.map((c, idx) => (
            <UseCaseCard
              key={c.title}
              {...c}
              icon={useCaseIcons[idx]}
              image={useCaseImages[idx]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
