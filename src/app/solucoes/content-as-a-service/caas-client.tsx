'use client';

import { useT } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { useDemoPopup } from '@/components/forms/demo-popup';
import Link from 'next/link';
import {
  ArrowRight,
  Palette,
  UserCog,
  LayoutGrid,
  BarChart3,
  Layers,
  Megaphone,
  RefreshCw,
  Mic,
  FileText,
  CalendarCheck,
  LineChart,
  Quote,
} from 'lucide-react';

export function CaasClient() {
  const t = useT();
  const { openPopup } = useDemoPopup();
  const c = t
  const { openPopup } = useDemoPopup();.solucoesCaas;

  const designItems = [
    { icon: LayoutGrid, text: c.designItem1 },
    { icon: BarChart3, text: c.designItem2 },
    { icon: Layers, text: c.designItem3 },
    { icon: Megaphone, text: c.designItem4 },
    { icon: RefreshCw, text: c.designItem5 },
  ];

  const execSteps = [
    { label: c.execStep1Label, desc: c.execStep1Desc, icon: Mic },
    { label: c.execStep2Label, desc: c.execStep2Desc, icon: FileText },
    { label: c.execStep3Label, desc: c.execStep3Desc, icon: Palette },
    { label: c.execStep4Label, desc: c.execStep4Desc, icon: CalendarCheck },
    { label: c.execStep5Label, desc: c.execStep5Desc, icon: LineChart },
  ];

  return (
    <>
      {/* Section 1 — Hero */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <span className="inline-flex text-[11px] font-bold uppercase tracking-[.14em] text-orange-500 mb-4">
            {c.heroTag}
          </span>
          <h1 className="font-headline text-3xl md:text-5xl font-black text-accent-foreground leading-tight mb-6 max-w-3xl mx-auto">
            {c.heroTitle}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            {c.heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button  size="lg" className="font-bold" onClick={openPopup}>
              
                {c.heroCta1}
                <ArrowRight className="w-4 h-4 ml-2" />
              
            </Button>
            <Button  variant="outline" size="lg" onClick={openPopup}>
              {c.heroCta2}
            </Button>
          </div>
        </div>
      </section>

      {/* Section 2 — Dois modos */}
      <section className="py-20 md:py-28 bg-secondary/30">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center mb-12">
            <h2 className="font-headline text-2xl md:text-3xl font-black text-accent-foreground mb-3">
              {c.modesTitle}
            </h2>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              {c.modesSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Card 1 — Design */}
            <div className="rounded-xl border border-border bg-card p-8 transition-shadow hover:shadow-md hover:border-primary/20">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-5">
                <Palette className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-accent-foreground mb-4">
                {c.mode1Title}
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">{c.mode1For}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.mode1Includes}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.mode1Deliverables}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.mode1Who}</p>
              </div>
            </div>

            {/* Card 2 — Executiva */}
            <div className="rounded-xl border border-border bg-card p-8 transition-shadow hover:shadow-md hover:border-orange-500/20">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10 mb-5">
                <UserCog className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-bold text-accent-foreground mb-4">
                {c.mode2Title}
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground leading-relaxed">{c.mode2For}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.mode2Includes}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.mode2Deliverables}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.mode2Who}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 — Design detail */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl">
            <h2 className="font-headline text-2xl md:text-3xl font-black text-accent-foreground mb-4">
              {c.designDetailTitle}
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-10">
              {c.designDetailBody}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {designItems.map((item) => (
              <div
                key={item.text}
                className="flex items-start gap-4 rounded-lg border border-border bg-card p-5"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm text-foreground leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 — Executiva detail (5-step process) */}
      <section className="py-20 md:py-28 bg-secondary/30">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl mb-12">
            <h2 className="font-headline text-2xl md:text-3xl font-black text-accent-foreground mb-4">
              {c.execDetailTitle}
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              {c.execDetailBody}
            </p>
          </div>

          <div className="space-y-6">
            {execSteps.map((step, idx) => (
              <div
                key={step.label}
                className="flex items-start gap-6 rounded-xl border border-border bg-card p-6"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-500/10 text-orange-500 font-bold text-lg">
                  {idx + 1}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-accent-foreground mb-1">
                    {step.label}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5 — Autenticidade */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-500/10 mb-6">
              <Quote className="h-6 w-6 text-orange-500" />
            </div>
            <h2 className="font-headline text-2xl md:text-3xl font-black text-accent-foreground mb-4">
              {c.authenticityTitle}
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-6">
              {c.authenticityBody}
            </p>
            <p className="text-base text-muted-foreground leading-relaxed mb-6">
              {c.authenticityDetail}
            </p>
            <p className="text-base font-semibold text-accent-foreground leading-relaxed">
              {c.authenticityConclusion}
            </p>
          </div>
        </div>
      </section>

      {/* Section 6 — CTA Final */}
      <section className="py-20 md:py-28 bg-secondary/30">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="font-headline text-2xl md:text-3xl font-black text-accent-foreground mb-4">
            {c.ctaTitle}
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            {c.ctaBody}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button  size="lg" className="font-bold" onClick={openPopup}>
              
                {c.ctaCta1}
                <ArrowRight className="w-4 h-4 ml-2" />
              
            </Button>
            <Button  variant="outline" size="lg" onClick={openPopup}>
              {c.ctaCta2}
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
