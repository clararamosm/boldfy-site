import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Clock3,
  Library,
  Lock,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Materiais',
  description:
    'Reports, guias e templates gratuitos sobre Employee-Led Growth e Content Intelligence. Direto ao ponto, com dados reais de quem opera o jogo do LinkedIn no Brasil.',
  openGraph: {
    title: 'Materiais · Boldfy',
    description:
      'Reports, guias e templates gratuitos sobre Employee-Led Growth e Content Intelligence.',
    url: 'https://boldfy.com.br/materiais',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Materiais Boldfy',
      },
    ],
  },
  alternates: {
    canonical: 'https://boldfy.com.br/materiais',
  },
};

/**
 * Catálogo de materiais gratuitos. Cada item vira um card no grid.
 * Status:
 *  - 'live'    → card clicável, linka pra `href` (LP de captura)
 *  - 'soon'    → card cinza com aviso "Em breve" (placeholder)
 *
 * Pra adicionar material novo:
 *  1. Suba a foto editorial em /public/images/<slug>-editorial.jpg
 *  2. Crie a LP de captura
 *  3. Adicione objeto aqui com status 'live'
 */
type Material = {
  slug: string;
  status: 'live' | 'soon';
  tag: string;
  title: string;
  description: string;
  href?: string;
  /** Foto editorial 16:10 — só pra status 'live'. */
  cover?: string;
  /** Meta exibida no canto da capa (tempo de leitura, n caps). */
  meta?: { icon: 'clock' | 'chart'; label: string }[];
  /** Ícone Lucide pro placeholder 'soon'. */
  icon?: 'book' | 'library';
};

const MATERIAIS: Material[] = [
  {
    slug: 'algoritmo-linkedin',
    status: 'live',
    tag: 'Report',
    title: 'O Algoritmo do LinkedIn Mudou Tudo',
    description:
      'A atualização 360Brew (março/2026) reescreveu as regras. Páginas de empresa caíram 66%. Perfis pessoais dominam 65% do feed. Saiba o que ainda funciona — e o que parou de funcionar.',
    href: '/algoritmo-linkedin',
    cover: '/images/algoritmo-linkedin-editorial.jpeg',
    meta: [
      { icon: 'clock', label: '20 min' },
      { icon: 'chart', label: '6 caps' },
    ],
  },
  {
    slug: 'playbook-employee-advocacy',
    status: 'soon',
    tag: 'Em breve',
    title: 'Playbook de Employee Advocacy',
    description:
      'O passo-a-passo de como ativar 100 colaboradores no LinkedIn nos primeiros 90 dias — sem template genérico, sem promessa furada.',
    icon: 'book',
  },
];

export default function MateriaisPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative pt-20 md:pt-28 pb-10 md:pb-14 px-6 md:px-12 text-center">
        {/* glows decorativos */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/[.08] blur-[120px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/[.07] blur-[120px]"
        />

        <div className="relative mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-primary bg-primary/10 border border-primary/30 rounded-full px-3.5 py-1.5 mb-5">
            <Library className="w-3.5 h-3.5" />
            Recursos gratuitos
          </span>
          <h1 className="font-headline text-4xl md:text-5xl lg:text-[58px] font-black text-accent-foreground leading-[1.05] tracking-tight mb-4">
            Materiais que{' '}
            <span className="bg-gradient-to-br from-primary to-[#E875FF] bg-clip-text text-transparent">
              a gente também
            </span>{' '}
            usa pra crescer
          </h1>
          <p className="text-base md:text-[17px] text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Reports, guias e templates de Employee-Led Growth. Direto ao ponto,
            com dados reais de quem opera o jogo do LinkedIn no Brasil.
          </p>
        </div>
      </section>

      {/* GRID */}
      <section className="relative px-6 md:px-12 pb-20 md:pb-28">
        <div className="mx-auto max-w-6xl grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {MATERIAIS.map((m) =>
            m.status === 'live' ? (
              <MaterialCardLive key={m.slug} m={m} />
            ) : (
              <MaterialCardSoon key={m.slug} m={m} />
            ),
          )}
        </div>
      </section>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Cards                                                                      */
/* -------------------------------------------------------------------------- */

function MaterialCardLive({ m }: { m: Material }) {
  return (
    <Link
      href={m.href!}
      className="group flex flex-col bg-card border rounded-[20px] overflow-hidden shadow-[0_8px_32px_rgba(93,42,103,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_16px_40px_rgba(205,80,241,0.12)]"
    >
      <div className="relative aspect-[16/10] bg-[#2D1445] overflow-hidden">
        {m.cover && (
          <Image
            src={m.cover}
            alt={m.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        )}
        <span className="absolute top-4 left-4 z-10 text-[10px] font-bold uppercase tracking-[0.15em] text-white bg-primary/85 backdrop-blur-md px-3 py-1.5 rounded-full">
          {m.tag}
        </span>
        {m.meta && (
          <div className="absolute bottom-4 right-4 z-10 flex gap-2">
            {m.meta.map((meta) => (
              <span
                key={meta.label}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/90 bg-[#0F0A18]/50 backdrop-blur-md px-2.5 py-1.5 rounded-full"
              >
                {meta.icon === 'clock' ? (
                  <Clock3 className="w-3 h-3" />
                ) : (
                  <BarChart3 className="w-3 h-3" />
                )}
                {meta.label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col p-6 md:p-7">
        <h3 className="font-headline text-xl md:text-[22px] font-black text-accent-foreground leading-[1.25] tracking-tight mb-2.5">
          {m.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1">
          {m.description}
        </p>
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary transition-all group-hover:gap-2.5">
          Baixar gratuitamente
          <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}

function MaterialCardSoon({ m }: { m: Material }) {
  return (
    <div className="flex flex-col bg-card border rounded-[20px] overflow-hidden shadow-[0_8px_32px_rgba(93,42,103,0.06)] opacity-65">
      <div className="relative aspect-[16/10] bg-gradient-to-br from-[#2D1445] to-[#45336B] overflow-hidden flex items-center justify-center">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'linear-gradient(rgba(205,80,241,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(205,80,241,.08) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            maskImage:
              'radial-gradient(ellipse at center, black 30%, transparent 80%)',
          }}
        />
        <div className="relative w-[72px] h-[72px] rounded-[18px] bg-white/[.08] border border-white/15 flex items-center justify-center text-white/50 backdrop-blur-md">
          {m.icon === 'book' ? (
            <BookOpen className="w-8 h-8" strokeWidth={2} />
          ) : (
            <Library className="w-8 h-8" strokeWidth={2} />
          )}
        </div>
        <span className="absolute top-4 left-4 z-10 text-[10px] font-bold uppercase tracking-[0.15em] text-white bg-muted-foreground/65 backdrop-blur-md px-3 py-1.5 rounded-full">
          {m.tag}
        </span>
        <span className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-1.5 text-[11px] font-semibold text-white/85 bg-[#0F0A18]/50 backdrop-blur-md px-2.5 py-1.5 rounded-full">
          <Lock className="w-3 h-3" />
          Em produção
        </span>
      </div>

      <div className="flex-1 flex flex-col p-6 md:p-7">
        <h3 className="font-headline text-xl md:text-[22px] font-black text-accent-foreground leading-[1.25] tracking-tight mb-2.5">
          {m.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-1">
          {m.description}
        </p>
        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
          Em breve
        </span>
      </div>
    </div>
  );
}
