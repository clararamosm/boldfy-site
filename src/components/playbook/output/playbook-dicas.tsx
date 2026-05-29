'use client';

/**
 * Bloco 4 — Dicas + Boldfy.
 * Spec §2.3 do copy-final + curadorias mai/2026.
 *
 * Modos de renderização do DicaCard:
 *   1. **Default (universais)**: card normal com accordion "Como a Boldfy
 *      resolve" expandindo embaixo dos bullets.
 *   2. **Imperativa** (dicas de dor reformuladas na 3ª curadoria): card normal
 *      com parágrafo descritivo + menção curta "Boldfy ajuda" no rodapé.
 *      Substitui o accordion. Usado em D_CAC, D_COMPANYPAGE, D_CONCORRENTE,
 *      D_TALENTO, L_PROPRIO, L_FULL_CONTENT.
 *   3. **Destaque** (S_CLEVEL): card de largura total (col-span-full), borda
 *      roxa marcada, pill "essa é a mais importante", layout 2-colunas com
 *      `opcoes` em vez do accordion. Renderiza como primeira dica.
 *
 * Features (palavras-chave da plataforma Boldfy) nos bullets aparecem em
 * `[[...]]` no JSON e são renderizadas como pills rosa com ✦ pelo parser.
 *
 * Callouts no `boldfy.callout` ganharam `style: 'gift'` na 3ª curadoria pra
 * o pacote de design grátis — renderiza com AnimatedGiftBox em vez de pill.
 */

import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  ChevronDown,
  Compass,
  Crown,
  DollarSign,
  Feather,
  FileText,
  Globe,
  Heart,
  Library,
  MessageSquare,
  Network,
  Palette,
  PiggyBank,
  RotateCcw,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { Tip } from '@/lib/playbook/templates/types';
import { trackEvent } from '@/lib/track';
import { AnimatedGiftBox } from '@/components/ui/animated-gift-box';
import { SectionTag } from './playbook-snapshot';

const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  Compass,
  MessageSquare,
  Trophy,
  TrendingUp,
  BarChart3,
  UserCheck,
  Heart,
  DollarSign,
  Globe,
  Target,
  Award,
  RotateCcw,
  Network,
  Crown,
  BookOpen,
  FileText,
  PiggyBank,
  Sparkles,
  Feather,
  // Adicionados em mai/2026 pras dicas U6 (variação visual) e U7 (biblioteca).
  Palette,
  Library,
};

export function PlaybookDicas({ dicas, slug }: { dicas: Tip[]; slug: string }) {
  const universaisCount = dicas.filter((d) => d.selectors.universal).length;
  const especificas = dicas.filter((d) => !d.selectors.universal);
  const tagsList = especificas.map((d) => d.tagEspecifica).filter(Boolean).join(', ');

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-[1080px] px-6">
        <SectionTag>Bloco 4 · Dicas + Boldfy</SectionTag>
        <h2 className="mb-3 font-headline text-3xl font-black tracking-tight text-foreground sm:text-4xl">
          {dicas.length} dicas pra fazer dar{' '}
          <span className="bg-gradient-to-br from-[#CD50F1] to-[#E875FF] bg-clip-text text-transparent">
            certo no seu caso
          </span>
        </h2>
        <p className="mb-10 max-w-[720px] text-base leading-relaxed text-muted-foreground">
          {universaisCount} universais que aparecem pra todo mundo, mais{' '}
          {dicas.length - universaisCount} selecionadas pelo perfil de vocês
          {tagsList ? ` (${tagsList})` : ''}. Cada dica abre como a Boldfy resolve embaixo.
        </p>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {dicas.map((tip) => (
            <DicaCard key={tip.id} tip={tip} slug={slug} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Feature pill — renderiza [[X]] como pill rosa com ✦                        */
/* -------------------------------------------------------------------------- */

/**
 * Split de string com markup `[[Feature]]` em partes texto + features.
 * Cada feature vira <span> rosa com ícone Sparkles, sinalizando que é uma
 * funcionalidade real da plataforma Boldfy (não dica genérica).
 */
function renderWithFeatures(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\[\[([^\]]+)\]\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <span
        key={`f-${key++}`}
        className="inline-flex items-baseline gap-1 font-semibold text-primary"
      >
        <Sparkles className="h-2.5 w-2.5 self-center" />
        <span>{match[1]}</span>
      </span>,
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : text;
}

function DicaCard({ tip, slug }: { tip: Tip; slug: string }) {
  // Modo destaque: card de largura total com layout 2-colunas de opções
  if (tip.destaque) {
    return <DicaCardDestaque tip={tip} />;
  }
  // Modo imperativa: parágrafo + boldfy ajuda como rodapé curto
  if (tip.imperativa) {
    return <DicaCardImperativa tip={tip} />;
  }
  // Modo default: accordion "Como a Boldfy resolve"
  const Icon = ICON_MAP[tip.icon] ?? Compass;
  return (
    <div
      className="dica-card group relative flex flex-col rounded-2xl border border-border bg-card p-5 shadow-[0_8px_32px_rgba(93,42,103,.06)] transition duration-300 hover:-translate-y-0.5 hover:border-primary/30"
    >
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">{tip.numero}</span>
        {tip.tagEspecifica && (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-secondary-foreground">
            {tip.tagEspecifica}
          </span>
        )}
      </div>
      <h3 className="mb-4 flex-1 font-headline text-base font-black leading-snug tracking-tight text-foreground">
        {tip.titulo}
      </h3>
      <details
        className="group/details rounded-lg"
        onToggle={(e) => {
          if ((e.currentTarget as HTMLDetailsElement).open) {
            trackEvent('playbook_tip_expanded', { tip_id: tip.id, slug });
          }
        }}
      >
        {/*
          Botão "Veja como a Boldfy resolve":
          - Estado padrão: roxo translúcido (sutil, mas presente)
          - group-hover (passa o mouse em qualquer parte do card):
            fundo vira gradient roxo cheio, texto branco, sombra glow,
            ícone Sparkles vira branco. Esse é o destaque visual do card.
          - group-open/details: já aberto — perde o gradient, fica neutro
            (e o accordion abaixo carrega o destaque visual).
        */}
        <summary
          className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-[12px] font-bold text-primary transition-all duration-300 group-hover:border-transparent group-hover:bg-gradient-to-r group-hover:from-[#CD50F1] group-hover:to-[#E875FF] group-hover:text-white group-hover:shadow-[0_8px_20px_rgba(205,80,241,.35)] group-open/details:rounded-b-none group-open/details:border-b-0 group-open/details:bg-primary/10 group-open/details:from-transparent group-open/details:to-transparent group-open/details:text-primary group-open/details:shadow-none"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" />
            Veja como a Boldfy resolve
          </span>
          <ChevronDown className="h-3.5 w-3.5 transition-transform group-open/details:rotate-180" />
        </summary>
        <div className="rounded-b-lg border border-t-0 border-primary/20 bg-primary/[0.03] p-3">
          <div className="mb-2 text-[12px] font-bold text-foreground">{tip.boldfy.titulo}</div>
          <ul className="space-y-1.5 text-[12px] leading-relaxed text-muted-foreground">
            {tip.boldfy.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                <span>{renderWithFeatures(item)}</span>
              </li>
            ))}
          </ul>
          {tip.boldfy.callout && (
            <DicaCallout
              label={tip.boldfy.callout.label}
              href={tip.boldfy.callout.href}
              style={tip.boldfy.callout.style}
              tipId={tip.id}
              slug={slug}
            />
          )}
        </div>
      </details>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  DicaCardImperativa — pra dicas de dor reformuladas (3ª curadoria)          */
/* -------------------------------------------------------------------------- */

function DicaCardImperativa({ tip }: { tip: Tip }) {
  const Icon = ICON_MAP[tip.icon] ?? Compass;
  if (!tip.imperativa) return null;
  return (
    <div className="relative flex flex-col rounded-2xl border border-border border-l-4 border-l-primary bg-card p-5 shadow-[0_8px_32px_rgba(93,42,103,.06)] transition hover:-translate-y-0.5">
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-primary">{tip.numero}</span>
        {tip.tagEspecifica && (
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-secondary-foreground">
            {tip.tagEspecifica}
          </span>
        )}
      </div>
      <h3 className="mb-3 font-headline text-base font-black leading-snug tracking-tight text-foreground">
        {tip.titulo}
      </h3>
      <p className="mb-4 text-[13px] leading-relaxed text-muted-foreground">
        {tip.imperativa.paragrafo}
      </p>
      <div className="mt-auto rounded-lg bg-primary/[0.06] p-3 text-[12px] leading-relaxed text-muted-foreground">
        <span className="mr-1 font-bold text-primary">
          <Sparkles className="mr-0.5 inline h-3 w-3" />
          Boldfy ajuda:
        </span>
        {renderWithFeatures(tip.imperativa.boldfyAjuda)}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  DicaCardDestaque — pra S_CLEVEL (3ª curadoria)                             */
/* -------------------------------------------------------------------------- */

function DicaCardDestaque({ tip }: { tip: Tip }) {
  const Icon = ICON_MAP[tip.icon] ?? Compass;
  if (!tip.opcoes) return null;
  return (
    <div className="relative col-span-full rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/[0.04] to-card p-6 shadow-[0_12px_40px_rgba(205,80,241,.15)] sm:p-7">
      <div className="absolute -top-2.5 left-6 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[9.5px] font-bold uppercase tracking-[0.12em] text-white">
        <Sparkles className="h-2.5 w-2.5" />
        Essa dica é a mais importante pra você
      </div>
      <div className="mt-2 mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        {tip.tagEspecifica && (
          <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-secondary-foreground">
            {tip.tagEspecifica}
          </span>
        )}
      </div>
      <h3 className="mb-3 font-headline text-xl font-black leading-tight tracking-tight text-foreground sm:text-2xl">
        {tip.titulo}
      </h3>
      <div className="mb-5 grid gap-3 sm:grid-cols-2 sm:gap-4">
        {tip.opcoes.map((opcao, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 font-headline text-[15px] font-black leading-tight text-foreground">
              {opcao.titulo}
            </div>
            <p className="text-[12.5px] leading-relaxed text-muted-foreground">
              {renderWithFeatures(opcao.desc)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Callout do accordion da dica — destaque embaixo dos bullets.
 *
 * Quando tem `href` (ex: dica U6 → /case-semrush), renderiza como link clicável
 * com gradient bg e seta. Quando não tem (ex: dica U7 com pacote grátis
 * injetado em runtime), renderiza como pill destacada (sem link).
 */
function DicaCallout({
  label,
  href,
  style,
  tipId,
  slug,
}: {
  label: string;
  href?: string;
  style?: 'default' | 'gift';
  tipId: string;
  slug: string;
}) {
  // Style 'gift' usa o AnimatedGiftBox (caixinha animada da home) — usado
  // pro pacote de design grátis na Dica 04.
  if (style === 'gift') {
    return (
      <div className="mt-3 flex items-center gap-3 rounded-lg border border-primary/30 bg-gradient-to-r from-[#CD50F1]/10 to-[#E875FF]/10 p-3">
        <div className="flex-shrink-0">
          <AnimatedGiftBox size="sm" animateOnMount />
        </div>
        <div className="text-[12px] leading-relaxed text-foreground">{label}</div>
      </div>
    );
  }

  const className =
    'mt-3 inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-gradient-to-r from-[#CD50F1]/10 to-[#E875FF]/10 px-3 py-2 text-[11.5px] font-semibold leading-snug text-primary';

  if (href) {
    return (
      <a
        href={href}
        className={`${className} transition-all hover:border-primary/60 hover:from-[#CD50F1]/20 hover:to-[#E875FF]/20`}
        onClick={() => trackEvent('playbook_tip_callout_click', { tip_id: tipId, slug, href })}
      >
        <span>{label}</span>
        <ArrowRight className="h-3 w-3 shrink-0" />
      </a>
    );
  }

  return <div className={className}>{label}</div>;
}
