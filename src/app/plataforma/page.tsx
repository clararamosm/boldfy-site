'use client';

import { useT } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Bot, Gamepad2, GraduationCap, Gift, BarChart3, FolderOpen, Shield, Lock, Server, ArrowRightLeft } from 'lucide-react';

const moduleIcons = [Bot, Gamepad2, GraduationCap, Gift, BarChart3, FolderOpen];

interface ModuleCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function ModuleCard({ icon: Icon, title, description }: ModuleCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md hover:border-primary/20">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

export default function PlataformaPage() {
  const t = useT();

  const modules = [
    { icon: moduleIcons[0], title: t.plataforma.module1Title, description: t.plataforma.module1Desc },
    { icon: moduleIcons[1], title: t.plataforma.module2Title, description: t.plataforma.module2Desc },
    { icon: moduleIcons[2], title: t.plataforma.module3Title, description: t.plataforma.module3Desc },
    { icon: moduleIcons[3], title: t.plataforma.module4Title, description: t.plataforma.module4Desc },
    { icon: moduleIcons[4], title: t.plataforma.module5Title, description: t.plataforma.module5Desc },
    { icon: moduleIcons[5], title: t.plataforma.module6Title, description: t.plataforma.module6Desc },
  ];

  return (
    <>
      {/* Hero */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <span className="inline-flex text-[11px] font-bold uppercase tracking-[.14em] text-primary mb-4">
            {t.plataforma.heroTag}
          </span>
          <h1 className="text-3xl md:text-5xl font-bold text-accent-foreground leading-tight mb-6 max-w-3xl mx-auto">
            {t.plataforma.heroTitle}
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            {t.plataforma.heroSubtitle}
          </p>
          <Button asChild size="lg" className="font-bold">
            <Link href="/contato">
              {t.plataforma.heroCta}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Modules grid */}
      <section className="py-20 bg-secondary/30">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod) => (
              <ModuleCard key={mod.title} {...mod} />
            ))}
          </div>
        </div>
      </section>

      {/* Admin vs Collaborator */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center text-accent-foreground mb-12">
            {t.plataforma.adminVsColabTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-accent-foreground mb-2">{t.plataforma.adminLabel}</h3>
              <p className="text-sm text-muted-foreground">
                Configura Brand Context, cria trilhas, define missões, monitora métricas e gerencia recompensas.
              </p>
            </div>
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 mb-4">
                <Gamepad2 className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-accent-foreground mb-2">{t.plataforma.colabLabel}</h3>
              <p className="text-sm text-muted-foreground">
                Completa trilhas, usa IA para criar conteúdo, acumula pontos, sobe no ranking e troca por recompensas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-16 bg-secondary/30">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-xl border border-border bg-card p-8 md:p-12 text-center">
            <div className="flex justify-center gap-4 mb-6">
              <Lock className="h-6 w-6 text-primary" />
              <Server className="h-6 w-6 text-primary" />
              <ArrowRightLeft className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-accent-foreground mb-3">
              {t.plataforma.securityTitle}
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              {t.plataforma.securityDesc}
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-accent-foreground mb-3">
            {t.plataforma.ctaTitle}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            {t.plataforma.ctaSubtitle}
          </p>
          <Button asChild size="lg" className="font-bold">
            <Link href="/contato">
              {t.plataforma.ctaButton}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
