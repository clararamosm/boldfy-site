'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { BarChart3, Bot, Trophy, CalendarDays, GraduationCap } from 'lucide-react';
import Image from 'next/image';

const tabIcons = [BarChart3, Bot, Trophy, CalendarDays, GraduationCap];

// Quando tiver os screenshots, substitua null pelo path: '/images/showcase-dashboard.webp'
const tabImages: (string | null)[] = [null, null, null, null, null];

const tabColors = [
  'from-primary/20 to-primary/5',
  'from-blue-500/20 to-blue-500/5',
  'from-amber-500/20 to-amber-500/5',
  'from-green-500/20 to-green-500/5',
  'from-violet-500/20 to-violet-500/5',
];

export function ShowcaseSection() {
  const t = useT();
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    { label: t.home.dashboard, icon: tabIcons[0] },
    { label: t.home.aiAssistant, icon: tabIcons[1] },
    { label: t.home.rankings, icon: tabIcons[2] },
    { label: t.home.calendar, icon: tabIcons[3] },
    { label: t.home.trails, icon: tabIcons[4] },
  ];

  return (
    <section className="py-20 bg-secondary/30">
      <div className="mx-auto max-w-6xl px-6">
        {/* Tag */}
        <span className="block text-center text-[11px] font-bold uppercase tracking-[.14em] text-primary mb-4">
          {t.home.showcaseTag}
        </span>

        {/* Title */}
        <h2 className="font-headline text-2xl md:text-3xl font-bold text-center text-accent-foreground mb-2">
          {t.home.showcaseTitle}
        </h2>
        <p className="text-center text-muted-foreground mb-10 max-w-xl mx-auto">
          {t.home.showcaseSubtitle}
        </p>

        {/* Tab navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => setActiveTab(idx)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                  activeTab === idx
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'bg-white text-foreground/70 hover:bg-white/80 hover:text-foreground border border-border/50',
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Screenshot / placeholder area */}
        <div className="relative mx-auto max-w-4xl">
          <div
            className={cn(
              'rounded-2xl border border-border/50 bg-gradient-to-br p-1 shadow-lg',
              tabColors[activeTab],
            )}
          >
            <div className="rounded-xl bg-white/80 backdrop-blur overflow-hidden">
              {/* Browser-style top bar */}
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

              {/* Screenshot or placeholder */}
              <div className="aspect-[16/9] relative">
                {tabImages[activeTab] ? (
                  <Image
                    src={tabImages[activeTab]!}
                    alt={tabs[activeTab].label}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-secondary/20">
                    <div className="text-center">
                      {(() => {
                        const Icon = tabs[activeTab].icon;
                        return <Icon className="h-16 w-16 text-primary/25 mx-auto mb-4" />;
                      })()}
                      <p className="text-lg font-semibold text-foreground/40">
                        {tabs[activeTab].label}
                      </p>
                      <p className="text-sm text-muted-foreground/50 mt-1">
                        Screenshot em breve
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
