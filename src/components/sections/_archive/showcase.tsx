'use client';

import { useState } from 'react';
import { useT } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Bot,
  Trophy,
  CalendarDays,
  GraduationCap,
  CheckCircle2,
  Lock,
  Sparkles,
  Target,
  Clock,
  Users,
  Zap,
} from 'lucide-react';

const tabIcons = [BarChart3, Bot, Trophy, CalendarDays, GraduationCap];

const tabColors = [
  'from-primary/20 to-primary/5',
  'from-blue-500/20 to-blue-500/5',
  'from-amber-500/20 to-amber-500/5',
  'from-green-500/20 to-green-500/5',
  'from-violet-500/20 to-violet-500/5',
];

/* ── Dashboard Mockup ───────────────────────────────────────── */
function DashboardMockup() {
  return (
    <div className="p-6 space-y-4">
      {/* Top metrics row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Impressões', value: '247.8K', change: '+32%', icon: BarChart3 },
          { label: 'Engajamento', value: '4.7%', change: '+15%', icon: Zap },
          { label: 'Ativos', value: '32/36', change: '89%', icon: Users },
          { label: 'Valor mídia', value: 'R$ 14.8K', change: '+28%', icon: Target },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="rounded-lg bg-secondary/40 p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="h-3 w-3 text-primary" />
                <span className="text-[9px] text-muted-foreground font-medium">{metric.label}</span>
              </div>
              <p className="text-sm font-bold text-foreground">{metric.value}</p>
              <p className="text-[9px] text-emerald-600 font-medium">{metric.change}</p>
            </div>
          );
        })}
      </div>

      {/* Mini chart placeholder */}
      <div className="rounded-lg bg-secondary/30 p-4">
        <p className="text-[10px] font-semibold text-foreground mb-3">Impressões por semana</p>
        <div className="flex items-end gap-1.5 h-16">
          {[35, 42, 38, 55, 48, 62, 58, 72, 68, 85, 78, 92].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-primary/30 transition-all"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-[8px] text-muted-foreground">Sem 1</span>
          <span className="text-[8px] text-muted-foreground">Sem 12</span>
        </div>
      </div>

      {/* Top contributors */}
      <div className="rounded-lg bg-secondary/30 p-3">
        <p className="text-[10px] font-semibold text-foreground mb-2">Top colaboradores</p>
        <div className="space-y-2">
          {[
            { name: 'Ana S.', pts: '2.450', color: 'bg-violet-500' },
            { name: 'Lucas F.', pts: '2.180', color: 'bg-blue-500' },
            { name: 'Mariana C.', pts: '1.960', color: 'bg-emerald-500' },
          ].map((user, i) => (
            <div key={user.name} className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-muted-foreground w-3">{i + 1}</span>
              <div className={`h-5 w-5 rounded-full ${user.color} flex items-center justify-center text-[7px] font-bold text-white`}>
                {user.name.split(' ').map(w => w[0]).join('')}
              </div>
              <span className="text-[10px] font-medium text-foreground flex-1">{user.name}</span>
              <span className="text-[10px] font-bold text-primary">{user.pts} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── AI Assistant Mockup ────────────────────────────────────── */
function AiAssistantMockup() {
  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-blue-500" />
        </div>
        <div>
          <p className="text-xs font-bold text-foreground">Assistente de Conteúdo</p>
          <p className="text-[9px] text-muted-foreground">Brand Context ativo · Voz pessoal configurada</p>
        </div>
      </div>

      {/* Input area */}
      <div className="rounded-lg border border-border bg-secondary/20 p-3">
        <p className="text-[10px] text-muted-foreground mb-2">Sobre o que você quer escrever?</p>
        <div className="rounded-md bg-white border border-border/50 p-2.5">
          <p className="text-[11px] text-foreground/70">
            Como prospecção outbound mudou nos últimos 2 anos e por que social selling é o futuro...
          </p>
        </div>
        <div className="flex gap-2 mt-2">
          <span className="text-[8px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Thought Leadership</span>
          <span className="text-[8px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Social Selling</span>
        </div>
      </div>

      {/* AI suggestions */}
      <div>
        <p className="text-[10px] font-semibold text-foreground mb-2 flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-blue-500" />
          Sugestões de hook
        </p>
        <div className="space-y-2">
          {[
            '"100 cold calls por dia. 99 silêncios. E se existisse outro caminho?"',
            '"Meu pipeline triplicou quando parei de prospectar e comecei a publicar."',
            '"Social Selling não é sobre vender. É sobre ser encontrado."',
          ].map((suggestion, i) => (
            <div
              key={i}
              className={cn(
                'rounded-md border p-2.5 text-[10px] cursor-pointer transition-all',
                i === 0
                  ? 'border-blue-500/30 bg-blue-500/5 text-foreground'
                  : 'border-border/50 bg-white text-foreground/70 hover:border-blue-500/20',
              )}
            >
              {suggestion}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Rankings Mockup ────────────────────────────────────────── */
function RankingsMockup() {
  return (
    <div className="p-6 space-y-4">
      {/* Podium */}
      <div className="flex items-end justify-center gap-3 mb-4 h-28">
        {/* 2nd place */}
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-[9px] font-bold text-white mb-1">LF</div>
          <p className="text-[9px] font-medium text-foreground">Lucas</p>
          <div className="w-16 bg-primary/20 rounded-t-md mt-1 flex items-end justify-center pb-1" style={{ height: '48px' }}>
            <span className="text-[10px] font-bold text-primary">2.180</span>
          </div>
        </div>
        {/* 1st place */}
        <div className="flex flex-col items-center">
          <Trophy className="h-4 w-4 text-amber-500 mb-0.5" />
          <div className="h-9 w-9 rounded-full bg-violet-500 flex items-center justify-center text-[10px] font-bold text-white mb-1 ring-2 ring-amber-400">AS</div>
          <p className="text-[9px] font-bold text-foreground">Ana</p>
          <div className="w-16 bg-primary/30 rounded-t-md mt-1 flex items-end justify-center pb-1" style={{ height: '64px' }}>
            <span className="text-[10px] font-bold text-primary">2.450</span>
          </div>
        </div>
        {/* 3rd place */}
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-[9px] font-bold text-white mb-1">MC</div>
          <p className="text-[9px] font-medium text-foreground">Mariana</p>
          <div className="w-16 bg-primary/15 rounded-t-md mt-1 flex items-end justify-center pb-1" style={{ height: '36px' }}>
            <span className="text-[10px] font-bold text-primary">1.960</span>
          </div>
        </div>
      </div>

      {/* Rewards */}
      <div className="rounded-lg bg-secondary/30 p-3">
        <p className="text-[10px] font-semibold text-foreground mb-2">🏆 Recompensas do mês</p>
        <div className="space-y-1.5">
          {[
            { name: 'Day-off extra', pts: '3.000 pts', emoji: '🏖️' },
            { name: 'Vale iFood R$50', pts: '1.500 pts', emoji: '🍔' },
            { name: 'Mentoria 1:1', pts: '2.000 pts', emoji: '🎓' },
          ].map((reward) => (
            <div key={reward.name} className="flex items-center gap-2 rounded-md bg-white/60 border border-border/30 p-2">
              <span className="text-sm">{reward.emoji}</span>
              <span className="text-[10px] font-medium text-foreground flex-1">{reward.name}</span>
              <span className="text-[9px] font-bold text-primary">{reward.pts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Calendar Mockup ────────────────────────────────────────── */
function CalendarMockup() {
  return (
    <div className="p-6 space-y-4">
      {/* Month header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-foreground">Abril 2025</p>
        <div className="flex gap-1">
          <span className="text-[8px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">3 missões ativas</span>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((d, i) => (
          <div key={i} className="text-center text-[8px] font-medium text-muted-foreground py-1">{d}</div>
        ))}
        {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
          const hasPost = [2, 4, 7, 9, 11, 14, 16, 18, 21, 23, 25, 28].includes(day);
          const isMission = [7, 14, 21, 28].includes(day);
          return (
            <div
              key={day}
              className={cn(
                'text-center text-[9px] py-1.5 rounded-md',
                hasPost && !isMission && 'bg-primary/10 text-primary font-bold',
                isMission && 'bg-amber-500/10 text-amber-600 font-bold ring-1 ring-amber-500/20',
                !hasPost && !isMission && 'text-foreground/50',
              )}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Upcoming missions */}
      <div className="rounded-lg bg-secondary/30 p-3">
        <p className="text-[10px] font-semibold text-foreground mb-2">📅 Próximas missões</p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[10px]">
            <Target className="h-3 w-3 text-amber-500" />
            <span className="text-foreground font-medium flex-1">Post sobre cultura do time</span>
            <span className="text-muted-foreground">+150 XP</span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <Target className="h-3 w-3 text-amber-500" />
            <span className="text-foreground font-medium flex-1">Compartilhar case de sucesso</span>
            <span className="text-muted-foreground">+200 XP</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Trails Mockup ──────────────────────────────────────────── */
function TrailsMockup() {
  return (
    <div className="p-6 space-y-4">
      {/* Active trail */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className="h-4 w-4 text-primary" />
          <p className="text-xs font-bold text-foreground">Trilha: LinkedIn Pro</p>
          <span className="ml-auto text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">67%</span>
        </div>
        {/* Progress bar */}
        <div className="w-full h-2 bg-secondary rounded-full mb-3">
          <div className="h-2 bg-primary rounded-full transition-all" style={{ width: '67%' }} />
        </div>
        {/* Modules */}
        <div className="space-y-2">
          {[
            { name: 'Módulo 1: Perfil matador', done: true },
            { name: 'Módulo 2: Hooks que param o scroll', done: true },
            { name: 'Módulo 3: Storytelling', done: false, current: true },
            { name: 'Módulo 4: CTA e conversão', done: false },
          ].map((mod) => (
            <div key={mod.name} className="flex items-center gap-2">
              {mod.done ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              ) : mod.current ? (
                <div className="h-3.5 w-3.5 rounded-full border-2 border-primary bg-primary/20 shrink-0" />
              ) : (
                <Lock className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
              )}
              <span
                className={cn(
                  'text-[10px]',
                  mod.done && 'text-foreground/60 line-through',
                  mod.current && 'text-foreground font-semibold',
                  !mod.done && !mod.current && 'text-foreground/40',
                )}
              >
                {mod.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Mission card */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-4 w-4 text-amber-500" />
          <p className="text-xs font-bold text-foreground">Missão da Semana</p>
        </div>
        <p className="text-[11px] text-foreground/80 mb-3">
          &quot;Publique um post contando um aprendizado recente do seu trabalho&quot;
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-amber-600">+150 XP</span>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-[9px] text-muted-foreground">3 dias restantes</span>
          </div>
        </div>
        <div className="mt-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-muted-foreground">12/20 completaram</span>
            <span className="text-[9px] font-bold text-amber-600">60%</span>
          </div>
          <div className="w-full h-1.5 bg-secondary rounded-full">
            <div className="h-1.5 bg-amber-500 rounded-full" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Mockup Components Map ──────────────────────────────────── */
const MockupComponents = [
  DashboardMockup,
  AiAssistantMockup,
  RankingsMockup,
  CalendarMockup,
  TrailsMockup,
];

/* ── Main Section ───────────────────────────────────────────── */
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

  const ActiveMockup = MockupComponents[activeTab];

  return (
    <section className="py-20 bg-secondary/30">
      <div className="mx-auto max-w-6xl px-6">
        {/* Tag */}
        <span className="block text-center text-[11px] font-bold uppercase tracking-[.14em] text-primary mb-4">
          {t.home.showcaseTag}
        </span>

        {/* Title */}
        <h2 className="font-headline text-2xl md:text-3xl font-black text-center text-accent-foreground mb-2">
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

        {/* Mockup area */}
        <div className="relative mx-auto max-w-4xl">
          <div
            className={cn(
              'rounded-2xl border border-border/50 bg-gradient-to-br p-1 shadow-lg',
              tabColors[activeTab],
            )}
          >
            <div className="rounded-xl bg-white/90 backdrop-blur overflow-hidden">
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

              {/* Active mockup */}
              <div className="min-h-[400px]">
                <ActiveMockup />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
