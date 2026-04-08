'use client';

import { useT } from '@/lib/i18n/context';

interface TimelineItemProps {
  label: string;
  title: string;
  description: string;
  variant: 'negative' | 'positive';
}

function TimelineItem({ label, title, description, variant }: TimelineItemProps) {
  const isNegative = variant === 'negative';

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`h-3 w-3 rounded-full mt-1.5 shrink-0 ${
            isNegative ? 'bg-destructive' : 'bg-green-500'
          }`}
        />
        <div
          className={`w-0.5 flex-1 ${
            isNegative ? 'bg-destructive/20' : 'bg-green-500/20'
          }`}
        />
      </div>
      <div className="pb-6">
        <span
          className={`text-[11px] font-bold uppercase tracking-wide ${
            isNegative ? 'text-destructive' : 'text-green-600'
          }`}
        >
          {label}
        </span>
        <p className="text-sm font-semibold text-foreground mt-0.5">{title}</p>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

export function TwoJourneysSection() {
  const t = useT();

  const withoutItems = [
    { label: t.common.week1, title: t.home.withoutWeek1, description: t.home.withoutWeek1Desc },
    { label: t.common.month1, title: t.home.withoutMonth1, description: t.home.withoutMonth1Desc },
    { label: t.common.month23, title: t.home.withoutMonth23, description: t.home.withoutMonth23Desc },
    { label: t.common.month4, title: t.home.withoutMonth4, description: '' },
  ];

  const withItems = [
    { label: t.common.week1, title: t.home.withWeek1, description: t.home.withWeek1Desc },
    { label: t.common.month1, title: t.home.withMonth1, description: t.home.withMonth1Desc },
    { label: t.common.month23, title: t.home.withMonth23, description: t.home.withMonth23Desc },
    { label: t.common.month4, title: t.home.withMonth4, description: '' },
  ];

  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section title */}
        <h2 className="text-2xl md:text-3xl font-bold text-center text-accent-foreground mb-12">
          {t.home.twoJourneysTitle}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Without Boldfy */}
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 md:p-8">
            <h3 className="text-sm font-bold uppercase tracking-wide text-destructive mb-6">
              {t.home.withoutBoldfy}
            </h3>
            <div>
              {withoutItems.map((item) => (
                <TimelineItem
                  key={item.label + item.title}
                  label={item.label}
                  title={item.title}
                  description={item.description}
                  variant="negative"
                />
              ))}
            </div>
          </div>

          {/* With Boldfy */}
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-6 md:p-8">
            <h3 className="text-sm font-bold uppercase tracking-wide text-green-600 mb-6">
              {t.home.withBoldfy}
            </h3>
            <div>
              {withItems.map((item) => (
                <TimelineItem
                  key={item.label + item.title}
                  label={item.label}
                  title={item.title}
                  description={item.description}
                  variant="positive"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
