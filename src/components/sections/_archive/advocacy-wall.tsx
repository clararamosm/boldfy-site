'use client';

import { useEffect, useRef, useState } from 'react';
import { useT } from '@/lib/i18n/context';
import { Eye, Heart, MessageCircle, Share2, BarChart3, Users, TrendingUp, DollarSign } from 'lucide-react';

/* ── Mock post data ─────────────────────────────────────────── */
const mockPosts = [
  {
    name: 'Ana Souza',
    role: 'Product Manager',
    initials: 'AS',
    color: 'bg-violet-500',
    hook: 'Ontem um candidato me disse: "vi o post da sua equipe e quis trabalhar aí." Isso é Employer Branding de verdade.',
    impressions: '12.4K',
    reactions: 89,
    comments: 23,
    shares: 12,
  },
  {
    name: 'Lucas Ferreira',
    role: 'Head de Vendas',
    initials: 'LF',
    color: 'bg-blue-500',
    hook: '3 reuniões agendadas essa semana — todas vieram de um post que levei 10 min pra criar.',
    impressions: '8.7K',
    reactions: 156,
    comments: 41,
    shares: 28,
  },
  {
    name: 'Mariana Costa',
    role: 'Dev Lead',
    initials: 'MC',
    color: 'bg-emerald-500',
    hook: 'Meu time técnico começou a postar no LinkedIn e os recrutadores pararam de ligar — agora os candidatos vêm até nós.',
    impressions: '15.2K',
    reactions: 203,
    comments: 57,
    shares: 34,
  },
  {
    name: 'Pedro Almeida',
    role: 'CMO',
    initials: 'PA',
    color: 'bg-amber-500',
    hook: 'Company Page: 200 impressões. Post do estagiário: 14 mil. A conta não fecha mais com mídia paga.',
    impressions: '22.1K',
    reactions: 312,
    comments: 89,
    shares: 45,
  },
  {
    name: 'Carla Mendes',
    role: 'Customer Success',
    initials: 'CM',
    color: 'bg-rose-500',
    hook: 'Um cliente renovou o contrato depois de ver meus posts sobre nosso produto. Conteúdo vende.',
    impressions: '6.3K',
    reactions: 67,
    comments: 18,
    shares: 8,
  },
  {
    name: 'Rafael Santos',
    role: 'SDR',
    initials: 'RS',
    color: 'bg-cyan-500',
    hook: '"Vi seu post sobre prospecção outbound" — essa frase mudou minha taxa de resposta de 2% pra 11%.',
    impressions: '9.8K',
    reactions: 134,
    comments: 36,
    shares: 19,
  },
];

/* ── Mini Post Card ─────────────────────────────────────────── */
function MiniPostCard({
  post,
  rotation,
  className,
}: {
  post: (typeof mockPosts)[number];
  rotation: number;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border/60 bg-white/90 backdrop-blur-sm p-4 shadow-sm transition-transform duration-500 ${className ?? ''}`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {/* Author */}
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className={`h-8 w-8 rounded-full ${post.color} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}
        >
          {post.initials}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{post.name}</p>
          <p className="text-[10px] text-muted-foreground truncate">{post.role}</p>
        </div>
      </div>

      {/* Hook text */}
      <p className="text-[11px] text-foreground/80 leading-relaxed line-clamp-2 mb-3">
        {post.hook}
      </p>

      {/* Divider */}
      <div className="border-t border-border/40 pt-2.5">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="inline-flex items-center gap-1 text-[10px]">
            <Eye className="h-3 w-3" /> {post.impressions}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px]">
            <Heart className="h-3 w-3" /> {post.reactions}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px]">
            <MessageCircle className="h-3 w-3" /> {post.comments}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px]">
            <Share2 className="h-3 w-3" /> {post.shares}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Dashboard Overlay Card ─────────────────────────────────── */
function DashboardCard({ t }: { t: ReturnType<typeof useT> }) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-white shadow-2xl shadow-primary/10 p-6 md:p-8 w-full max-w-md">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <BarChart3 className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">
            {t.home.advocacyDashboardTitle || 'Resultados do time'}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {t.home.advocacyDashboardPeriod || 'Últimos 30 dias'}
          </p>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="rounded-xl bg-secondary/50 p-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Eye className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-medium text-muted-foreground">
              {t.home.advocacyMetricImpressions || 'Impressões'}
            </span>
          </div>
          <p className="font-headline text-2xl font-bold text-foreground">247.8K</p>
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
            <TrendingUp className="h-3 w-3 inline mr-0.5" />+32%
          </p>
        </div>

        <div className="rounded-xl bg-secondary/50 p-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <DollarSign className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-medium text-muted-foreground">
              {t.home.advocacyMetricMediaValue || 'Valor de mídia'}
            </span>
          </div>
          <p className="font-headline text-2xl font-bold text-foreground">R$ 14.8K</p>
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
            <TrendingUp className="h-3 w-3 inline mr-0.5" />+28%
          </p>
        </div>

        <div className="rounded-xl bg-secondary/50 p-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Users className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-medium text-muted-foreground">
              {t.home.advocacyMetricActive || 'Ativos'}
            </span>
          </div>
          <p className="font-headline text-2xl font-bold text-foreground">32</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {t.home.advocacyMetricAdoption || '89% adesão'}
          </p>
        </div>

        <div className="rounded-xl bg-secondary/50 p-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Heart className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-medium text-muted-foreground">
              {t.home.advocacyMetricEngagement || 'Engajamento'}
            </span>
          </div>
          <p className="font-headline text-2xl font-bold text-foreground">4.7%</p>
          <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
            <TrendingUp className="h-3 w-3 inline mr-0.5" />+15%
          </p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="rounded-lg bg-primary/5 border border-primary/10 px-4 py-2.5 flex items-center justify-between">
        <span className="text-[11px] font-medium text-foreground/70">
          {t.home.advocacyRoiLabel || 'ROI do programa'}
        </span>
        <span className="text-sm font-bold text-primary">12.4x</span>
      </div>
    </div>
  );
}

/* ── Main Section ───────────────────────────────────────────── */
const rotations = [-1.5, 1, -0.8, 1.2, -1, 0.7];

export function AdvocacyWallSection() {
  const t = useT();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [offsetY, setOffsetY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );
    observer.observe(section);

    const handleScroll = () => {
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const sectionCenter = rect.top + rect.height / 2;
      const viewportCenter = window.innerHeight / 2;
      const delta = viewportCenter - sectionCenter;
      setOffsetY(delta * 0.08);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-16 md:py-20 bg-secondary/30 overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        {/* Section header */}
        <div className="text-center mb-12">
          <span className="inline-flex text-[11px] font-bold uppercase tracking-[.14em] text-primary mb-4">
            {t.home.advocacyWallTag || 'POR QUE EMPLOYEE ADVOCACY?'}
          </span>
          <h2 className="font-headline text-2xl md:text-3xl font-bold text-accent-foreground leading-tight mb-3 max-w-3xl mx-auto">
            {t.home.advocacyWallTitle || 'Perfis pessoais geram até 10x mais alcance que páginas corporativas'}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {t.home.advocacyWallSubtitle || 'Quando colaboradores compartilham conteúdo autêntico, a marca ganha credibilidade, alcance orgânico e conexões reais.'}
          </p>
        </div>

        {/* Wall: posts grid + dashboard overlay */}
        <div className="relative min-h-[480px] md:min-h-[420px]">
          {/* Background post grid — parallax */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            style={{
              transform: `translateY(${isVisible ? offsetY : 0}px)`,
              transition: 'transform 0.1s linear',
            }}
          >
            {mockPosts.map((post, idx) => (
              <MiniPostCard
                key={post.name}
                post={post}
                rotation={rotations[idx]}
                className={idx >= 4 ? 'hidden sm:block' : ''}
              />
            ))}
          </div>

          {/* Dashboard overlay — centered on desktop, below on mobile */}
          <div className="mt-8 flex justify-center md:absolute md:inset-0 md:mt-0 md:flex md:items-center md:justify-center md:pointer-events-none">
            <div
              className="md:pointer-events-auto"
              style={{
                transform: `translateY(${isVisible ? offsetY * 0.3 : 0}px)`,
                transition: 'transform 0.1s linear',
              }}
            >
              <DashboardCard t={t} />
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-12 mt-12">
          <div className="text-center">
            <p className="font-headline text-3xl font-bold text-primary">10x</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t.home.socialProofStat1Label || 'mais alcance orgânico'}
            </p>
          </div>
          <div className="text-center">
            <p className="font-headline text-3xl font-bold text-primary">8x</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t.home.socialProofStat2Label || 'mais engajamento'}
            </p>
          </div>
          <div className="text-center">
            <p className="font-headline text-3xl font-bold text-primary">5x</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t.home.socialProofStat3Label || 'mais cliques'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
