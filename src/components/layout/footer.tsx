'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useT } from '@/lib/i18n/context';
import { useDemoPopup } from '@/components/forms/demo-popup';
import { CalendarDays } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  LinkedIn icon (brand SVG)                                          */
/* ------------------------------------------------------------------ */
function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer column title (with hover dot pulse)                         */
/* ------------------------------------------------------------------ */
function ColTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="group-hover/col:[&::before]:scale-100 group-hover/col:[&::before]:opacity-100 relative mb-[18px] inline-block text-[11px] font-bold uppercase tracking-[0.12em] text-white/90 before:absolute before:-left-4 before:top-1/2 before:-translate-y-1/2 before:scale-50 before:rounded-full before:bg-primary before:opacity-0 before:transition-all before:duration-350 before:content-[''] before:h-[7px] before:w-[7px]">
      {children}
    </h3>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */
export function Footer() {
  const t = useT();
  const { openPopup } = useDemoPopup();

  return (
    <footer
      className="relative overflow-hidden px-6 pb-0 pt-20 md:px-12"
      style={{
        background:
          'linear-gradient(180deg, #2D1445 0%, #1A0E2E 50%, #0F0A18 100%)',
      }}
    >
      {/* Glow */}
      <div className="pointer-events-none absolute left-1/2 top-[-20%] h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-primary opacity-[0.12] blur-[150px]" />

      {/* Grid pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(205,80,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(205,80,241,0.05) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage:
            'radial-gradient(ellipse at center top, black 30%, transparent 80%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at center top, black 30%, transparent 80%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-[1280px]">
        {/* ── Main grid: brand + 3 columns ── */}
        <div className="mb-16 grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[2.2fr_0.9fr_0.9fr_0.9fr] lg:gap-10">
          {/* ── Brand column ── */}
          <div className="flex flex-col items-start">
            <Link href="/" aria-label="Boldfy - Home" className="mb-4">
              <Image
                src="/images/boldfy-logo-white.svg"
                alt="Boldfy"
                width={130}
                height={44}
              />
            </Link>

            <span className="mb-4 rounded-full border border-primary/25 bg-primary/[0.12] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-primary">
              Content Intelligence para Employee-Led Growth
            </span>

            <p className="mb-6 max-w-[320px] text-[13px] leading-[1.55] text-white/55">
              O sistema vivo onde times B2B viram criadores de marca no LinkedIn.
            </p>

            {/* Social */}
            <div className="flex gap-2">
              <a
                href="https://www.linkedin.com/company/boldfy-branding"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-white/12 bg-white/[0.06] text-white transition-all duration-250 hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:shadow-[0_6px_16px_rgba(205,80,241,0.35)]"
              >
                <LinkedInIcon className="h-[18px] w-[18px]" />
              </a>
            </div>
          </div>

          {/* ── Col 1: Soluções ── */}
          <div className="group/col">
            <ColTitle>Soluções</ColTitle>
            <ul className="flex flex-col gap-3">
              <li>
                <Link
                  href="/solucoes/software-as-a-service"
                  className="text-[13px] text-white/55 transition-colors hover:text-white"
                >
                  Software as a Service
                </Link>
              </li>
              <li>
                <Link
                  href="/solucoes/content-as-a-service"
                  className="text-[13px] text-white/55 transition-colors hover:text-white"
                >
                  Design on Demand
                </Link>
              </li>
              <li>
                <Link
                  href="/solucoes/content-as-a-service"
                  className="text-[13px] text-white/55 transition-colors hover:text-white"
                >
                  Content Full-Service
                </Link>
              </li>
              <li>
                <Link
                  href="/precos"
                  className="text-[13px] text-white/55 transition-colors hover:text-white"
                >
                  Preços
                </Link>
              </li>
            </ul>
          </div>

          {/* ── Col 2: Casos de Uso + Legal ── */}
          <div className="group/col">
            <ColTitle>Casos de Uso</ColTitle>
            <ul className="flex flex-col gap-3">
              <li>
                <Link
                  href="/para/marketing"
                  className="text-[13px] text-white/55 transition-colors hover:text-white"
                >
                  Para Marketing
                </Link>
              </li>
              <li>
                <Link
                  href="/para/vendas"
                  className="text-[13px] text-white/55 transition-colors hover:text-white"
                >
                  Para Vendas
                </Link>
              </li>
              <li>
                <Link
                  href="/para/rh"
                  className="text-[13px] text-white/55 transition-colors hover:text-white"
                >
                  Para RH
                </Link>
              </li>
            </ul>

            {/* Legal sub-group */}
            <div className="mt-8">
              <ColTitle>Legal</ColTitle>
              <ul className="flex flex-col gap-3">
                <li>
                  <Link
                    href="/privacidade"
                    className="text-[13px] text-white/55 transition-colors hover:text-white"
                  >
                    Privacidade
                  </Link>
                </li>
                <li>
                  <Link
                    href="/termos"
                    className="text-[13px] text-white/55 transition-colors hover:text-white"
                  >
                    Termos de Uso
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* ── Col 3: Recursos + Agendar demo ── */}
          <div className="group/col">
            <ColTitle>Recursos</ColTitle>
            <ul className="flex flex-col gap-3">
              <li>
                <Link
                  href="/blog"
                  className="text-[13px] text-white/55 transition-colors hover:text-white"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/sobre"
                  className="text-[13px] text-white/55 transition-colors hover:text-white"
                >
                  Sobre a Boldfy
                </Link>
              </li>
              <li>
                <Link
                  href="/beta-test"
                  className="text-[13px] text-white/55 transition-colors hover:text-white"
                >
                  Programa Beta
                </Link>
              </li>
            </ul>

            {/* Agendar demo button */}
            <button
              type="button"
              onClick={openPopup}
              className="mt-6 inline-flex items-center gap-[7px] rounded-[10px] border border-primary/40 bg-primary/[0.15] px-3.5 py-[9px] text-xs font-bold text-white transition-all duration-250 hover:-translate-y-0.5 hover:border-primary hover:bg-primary hover:shadow-[0_6px_16px_rgba(205,80,241,0.35)]"
            >
              <CalendarDays className="h-[13px] w-[13px]" />
              Agendar demo
            </button>
          </div>
        </div>

        {/* ── Copyright ── */}
        <div className="flex items-center justify-center border-t border-white/[0.08] py-7 text-xs text-white/40">
          © {new Date().getFullYear()} Boldfy. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
