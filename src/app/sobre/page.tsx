'use client';

import { useT } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Crosshair, Eye, Rocket, Swords, Heart, Award, BarChart3, Sparkles, UserCircle } from 'lucide-react';
import Image from 'next/image';

export default function SobrePage() {
  const t = useT();

  const mvp = [
    { icon: Rocket, title: t.sobre.purposeTitle, text: t.sobre.purposeText },
    { icon: Eye, title: t.sobre.visionTitle, text: t.sobre.visionText },
    { icon: Crosshair, title: t.sobre.missionTitle, text: t.sobre.missionText },
  ];

  const attrs = [
    { icon: Sparkles, name: t.sobre.attr1Name, desc: t.sobre.attr1Desc },
    { icon: Heart, name: t.sobre.attr2Name, desc: t.sobre.attr2Desc },
    { icon: BarChart3, name: t.sobre.attr3Name, desc: t.sobre.attr3Desc },
  ];

  return (
    <>
      {/* Manifesto */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <span className="inline-flex text-[11px] font-bold uppercase tracking-[.14em] text-primary mb-6">
            {t.sobre.manifestoTag}
          </span>
          <h1 className="font-headline text-2xl md:text-4xl font-bold text-accent-foreground leading-tight mb-6 max-w-3xl mx-auto">
            {t.sobre.manifestoText}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t.sobre.manifestoSubtext}
          </p>
        </div>
      </section>

      {/* Purpose / Vision / Mission */}
      <section className="py-16 bg-secondary/30">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mvp.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-xl border border-border bg-card p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-primary mb-3">{item.title}</h3>
                  <p className="text-sm text-foreground leading-relaxed">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* The Enemy */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8">
              <div className="flex items-center gap-3 mb-4">
                <Swords className="h-5 w-5 text-destructive" />
                <h3 className="text-lg font-bold text-accent-foreground">{t.sobre.enemyTitle}</h3>
              </div>
              <p className="text-sm font-semibold text-destructive mb-2">{t.sobre.enemyName}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{t.sobre.enemyDesc}</p>
            </div>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-8">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-accent-foreground">{t.sobre.existForTitle}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{t.sobre.existForDesc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Attributes */}
      <section className="py-16 bg-secondary/30">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-headline text-xl md:text-2xl font-bold text-accent-foreground mb-10 text-center">
            {t.sobre.attributesTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {attrs.map((attr) => {
              const Icon = attr.icon;
              return (
                <div key={attr.name} className="rounded-xl border border-border bg-card p-6 text-center">
                  <Icon className="h-6 w-6 text-primary mx-auto mb-3" />
                  <h3 className="text-base font-bold text-foreground mb-2">{attr.name}</h3>
                  <p className="text-sm text-muted-foreground">{attr.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-headline text-xl md:text-2xl font-bold text-accent-foreground mb-6">
            {t.sobre.teamTitle}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">{t.sobre.foundedBy}</p>
          <div className="inline-flex flex-col items-center">
            <div className="relative h-32 w-32 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center mb-4 ring-4 ring-primary/20">
              {/* Substituir por: <Image src="/images/founder.webp" alt="Clara Ramos" fill className="object-cover" /> */}
              <UserCircle className="h-16 w-16 text-primary/25" />
            </div>
            <p className="text-lg font-bold text-foreground">Clara Ramos</p>
            <p className="text-sm text-muted-foreground">Founder & CEO</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary/5">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="font-headline text-2xl md:text-3xl font-bold text-accent-foreground mb-4">
            {t.sobre.ctaTitle} <span className="text-primary">{t.sobre.ctaTitleHighlight}</span>
          </h2>
          <Button asChild size="lg" className="font-bold">
            <Link href="/plataforma">
              {t.sobre.ctaButton}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
