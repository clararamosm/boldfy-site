'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n/context';

/* ------------------------------------------------------------------ */
/*  White variant of the logo for the dark footer background          */
/* ------------------------------------------------------------------ */
function LogoFullWhite({ height = 28 }: { height?: number }) {
  return (
    <Link href="/" aria-label="Boldfy - Home">
      <svg
        height={height}
        viewBox="0 0 120 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <text
          x="0"
          y="26"
          fontFamily="Inter, system-ui, sans-serif"
          fontSize="28"
          fontWeight="800"
          letterSpacing="-0.02em"
        >
          <tspan fill="white">bold</tspan>
          <tspan fill="hsl(279 71% 75%)">fy</tspan>
        </text>
      </svg>
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  LinkedIn icon                                                      */
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
/*  Footer column                                                      */
/* ------------------------------------------------------------------ */
interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

function FooterColumnBlock({ title, links }: FooterColumn) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60 mb-4">
        {title}
      </h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-white/80 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */
export function Footer() {
  const t = useT();

  const columns: FooterColumn[] = [
    {
      title: t.footer.solucoesTitle,
      links: [
        { label: t.nav.plataforma, href: '/solucoes/software-as-a-service' },
        { label: t.nav.servico, href: '/solucoes/content-as-a-service' },
        { label: t.nav.precos, href: '/precos' },
        { label: t.nav.agendarDemo, href: '/demo' },
      ],
    },
    {
      title: t.footer.casosDeUsoTitle,
      links: [
        { label: t.nav.marketing, href: '/para/marketing' },
        { label: t.nav.vendas, href: '/para/vendas' },
        { label: t.nav.rh, href: '/para/rh' },
      ],
    },
    {
      title: t.footer.recursosTitle,
      links: [
        { label: t.nav.blog, href: '/blog' },
        { label: t.nav.materiais, href: '/materiais' },
        { label: t.nav.ferramentas, href: '/ferramentas' },
      ],
    },
    {
      title: t.footer.legalTitle,
      links: [
        { label: t.footer.privacidade, href: '/privacidade' },
        { label: t.footer.termos, href: '/termos' },
        { label: t.footer.cookies, href: '/cookies' },
      ],
    },
  ];

  return (
    <footer className="bg-accent-foreground text-white">
      {/* ---- Main footer content ---- */}
      <div className="mx-auto max-w-6xl px-6 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-12 lg:gap-8">
          {/* Brand block - spans 2 cols on large screens */}
          <div className="lg:col-span-2">
            <LogoFullWhite height={32} />
            <p className="mt-4 text-sm leading-relaxed text-white/70 max-w-xs">
              {t.footer.description}
            </p>

            {/* Social links */}
            <div className="mt-6 flex items-center gap-4">
              <a
                href="https://www.linkedin.com/company/boldfy-branding"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-white/60 hover:text-white transition-colors"
              >
                <LinkedInIcon className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Navigation columns - 4 cols share remaining 4 grid cols on lg */}
          {columns.map((col) => (
            <FooterColumnBlock
              key={col.title}
              title={col.title}
              links={col.links}
            />
          ))}
        </div>
      </div>

      {/* ---- Copyright bar ---- */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-white/50">
            &copy; {new Date().getFullYear()} Boldfy. {t.footer.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
