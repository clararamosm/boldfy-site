import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock, Lock, Map, Sparkles, Wrench } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Ferramentas',
  description:
    'Ferramentas gratuitas da Boldfy pra diagnosticar e planejar Employee-Led Growth: quizzes, calculadoras e playbooks personalizados.',
  openGraph: {
    title: 'Boldfy · Ferramentas',
    description:
      'Ferramentas gratuitas da Boldfy pra diagnosticar e planejar Employee-Led Growth.',
    url: 'https://boldfy.com.br/ferramentas',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Boldfy · Ferramentas',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Boldfy · Ferramentas',
    description:
      'Ferramentas gratuitas da Boldfy pra diagnosticar e planejar Employee-Led Growth.',
    images: ['/images/og-default.jpg'],
  },
  alternates: {
    canonical: 'https://boldfy.com.br/ferramentas',
  },
};

type FerramentaCard = {
  slug: string;
  href: string;
  pretitle: string;
  title: string;
  description: string;
  icon: 'map' | 'sparkles' | 'wrench';
  metaItems: Array<{ icon: 'clock' | 'lock'; label: string }>;
  cta: string;
  highlight?: boolean;
};

const FERRAMENTAS: FerramentaCard[] = [
  {
    slug: 'playbook-employee-led-growth',
    href: '/ferramentas/playbook-employee-led-growth',
    pretitle: 'Diagnóstico interativo',
    title: 'Playbook de Employee-Led Growth',
    description:
      'Conta o cenário da sua empresa pra Fai (nossa estrategista) e ela gera um playbook acionável personalizado: diagnóstico, plano em 3 fases, dicas com a Boldfy embutida, checklist pra começar e cálculo de earned media. Pessoa preenche em 5 min e leva o link pra reunião com o time.',
    icon: 'map',
    metaItems: [
      { icon: 'clock', label: '~5 min pra completar' },
      { icon: 'lock', label: 'Página exclusiva sua, compartilhável' },
    ],
    cta: 'Fazer meu playbook',
    highlight: true,
  },
];

const ICONS = {
  map: Map,
  sparkles: Sparkles,
  wrench: Wrench,
  clock: Clock,
  lock: Lock,
} as const;

export default function FerramentasPage() {
  return (
    <>
      {/* Glow de atmosfera Boldfy */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-48 -top-48 h-[600px] w-[600px] rounded-full bg-primary opacity-[0.06] blur-[120px]" />
        <div className="absolute -bottom-48 -right-48 h-[600px] w-[600px] rounded-full bg-primary opacity-[0.05] blur-[120px]" />
      </div>

      <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        {/* Header */}
        <div className="mb-12 max-w-2xl">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-primary">
            <Wrench className="h-3 w-3" />
            Ferramentas gratuitas
          </span>
          <h1 className="mb-4 font-headline text-[clamp(2rem,4.4vw,3.25rem)] font-black leading-[1.05] tracking-[-0.035em] text-foreground">
            Ferramentas pra{' '}
            <span className="bg-gradient-to-br from-[#CD50F1] to-[#E875FF] bg-clip-text text-transparent">
              destravar Employee-Led Growth
            </span>{' '}
            na sua empresa
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Diagnósticos, calculadoras e planejadores gratuitos pra você entender onde sua empresa
            tá e o que mudar. Sem cadastro até o fim, link compartilhável, 100% gratuito.
          </p>
        </div>

        {/* Grid de cards */}
        <div className="grid gap-5 sm:grid-cols-2">
          {FERRAMENTAS.map((f) => (
            <FerramentaCardLink key={f.slug} ferramenta={f} />
          ))}

          {/* Placeholder "mais ferramentas em breve" — segue padrão visual mas mais sutil */}
          <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-6 sm:p-7">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted/30 text-muted-foreground">
              <Sparkles className="h-[18px] w-[18px]" />
            </div>
            <h3 className="mb-2 font-headline text-base font-black text-foreground">
              Mais ferramentas em breve
            </h3>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Calculadora standalone de earned media, diagnóstico de Brand Context, gerador de
              missões. Em construção.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function FerramentaCardLink({ ferramenta }: { ferramenta: FerramentaCard }) {
  const Icon = ICONS[ferramenta.icon];
  return (
    <Link
      href={ferramenta.href}
      className={`group flex flex-col rounded-2xl border bg-card p-6 shadow-[0_8px_32px_rgba(93,42,103,.06)] transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_16px_40px_rgba(205,80,241,.12)] sm:p-7 ${
        ferramenta.highlight ? 'border-primary/30 ring-1 ring-primary/10' : 'border-border'
      }`}
    >
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#CD50F1]/15 to-[#E875FF]/10 text-primary">
        <Icon className="h-5 w-5" strokeWidth={2.2} />
      </div>
      <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-primary">
        {ferramenta.pretitle}
      </div>
      <h3 className="mb-3 font-headline text-xl font-black leading-tight tracking-tight text-foreground">
        {ferramenta.title}
      </h3>
      <p className="mb-5 flex-1 text-[14px] leading-relaxed text-muted-foreground">
        {ferramenta.description}
      </p>

      <ul className="mb-5 space-y-1.5">
        {ferramenta.metaItems.map((m, i) => {
          const MetaIcon = ICONS[m.icon];
          return (
            <li key={i} className="flex items-center gap-2 text-[12px] text-muted-foreground">
              <MetaIcon className="h-3.5 w-3.5 text-primary" />
              {m.label}
            </li>
          );
        })}
      </ul>

      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary transition-transform group-hover:translate-x-1">
        {ferramenta.cta}
        <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
      </span>
    </Link>
  );
}
