'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Menu, X, ChevronDown, ArrowRight } from 'lucide-react';
import { LogoFull } from '@/components/logo';
import { Button } from '@/components/ui/button';

import { useT } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';
import { useDemoPopup } from '@/components/forms/demo-popup';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

/* -------------------------------------------------------------------------- */
/*  Hook: scroll state                                                         */
/* -------------------------------------------------------------------------- */

function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > threshold);
    handle();
    window.addEventListener('scroll', handle, { passive: true });
    return () => window.removeEventListener('scroll', handle);
  }, [threshold]);

  return scrolled;
}

/* -------------------------------------------------------------------------- */
/*  Desktop dropdown                                                           */
/* -------------------------------------------------------------------------- */

function DesktopDropdown({
  item,
}: {
  item: NavItem;
}) {
  const [open, setOpen] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enter = () => {
    if (timeout.current) clearTimeout(timeout.current);
    setOpen(true);
  };

  const leave = () => {
    timeout.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <div
      className="relative"
      onMouseEnter={enter}
      onMouseLeave={leave}
    >
      <button
        type="button"
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium',
          'text-foreground/70 hover:text-foreground',
          'transition-colors duration-200',
        )}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {item.label}
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      {/* Dropdown panel */}
      <div
        className={cn(
          'absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2',
          'min-w-[220px] rounded-lg border border-border/50 bg-white/95 p-2 shadow-lg shadow-primary/5 backdrop-blur-xl',
          'origin-top transition-all duration-200',
          open
            ? 'pointer-events-auto scale-100 opacity-100'
            : 'pointer-events-none scale-95 opacity-0',
        )}
      >
        {item.children?.map((child) => (
          <Link
            key={child.href}
            href={child.href}
            className={cn(
              'flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium',
              'text-foreground/70 hover:bg-accent hover:text-foreground',
              'transition-colors duration-150',
            )}
          >
            {child.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Mobile menu                                                                */
/* -------------------------------------------------------------------------- */

function MobileMenu({
  items,
  ctaLabel,
  open,
  onClose,
}: {
  items: NavItem[];
  ctaLabel: string;
  open: boolean;
  onClose: () => void;
  onOpenDemo: () => void;
}) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm transition-opacity duration-300',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in panel */}
      <nav
        className={cn(
          'fixed right-0 top-0 z-50 flex h-full w-[300px] max-w-[85vw] flex-col bg-white shadow-2xl',
          'transition-transform duration-300 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        aria-label="Mobile navigation"
      >
        {/* Close button row */}
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <LogoFull height={24} />
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-foreground/60 hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <ul className="space-y-1">
            {items.map((item, idx) => (
              <li key={item.href + item.label}>
                {item.children ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedIdx(expandedIdx === idx ? null : idx)
                      }
                      className={cn(
                        'flex w-full items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium',
                        'text-foreground/70 hover:bg-accent hover:text-foreground',
                        'transition-colors duration-150',
                      )}
                    >
                      {item.label}
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform duration-200',
                          expandedIdx === idx && 'rotate-180',
                        )}
                      />
                    </button>

                    <ul
                      className={cn(
                        'overflow-hidden transition-all duration-200',
                        expandedIdx === idx
                          ? 'max-h-60 opacity-100'
                          : 'max-h-0 opacity-0',
                      )}
                    >
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={onClose}
                            className={cn(
                              'block rounded-md py-2 pl-7 pr-3 text-sm',
                              'text-foreground/60 hover:bg-accent hover:text-foreground',
                              'transition-colors duration-150',
                            )}
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'block rounded-md px-3 py-2.5 text-sm font-medium',
                      'text-foreground/70 hover:bg-accent hover:text-foreground',
                      'transition-colors duration-150',
                    )}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer CTA */}
        <div className="border-t border-border/50 p-4 space-y-3">
          <Button onClick={() => { onClose(); onOpenDemo(); }} className="w-full gap-2">
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </nav>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Header                                                                     */
/* -------------------------------------------------------------------------- */

export function Header() {
  const t = useT();
  const scrolled = useScrolled();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openPopup } = useDemoPopup();

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Build nav items from i18n dictionary
  const navItems: NavItem[] = [
    {
      label: t.nav.solucoes,
      href: '/solucoes',
      children: [
        { label: t.nav.plataforma, href: '/solucoes/software-as-a-service' },
        { label: t.nav.servico, href: '/solucoes/content-as-a-service' },
      ],
    },
    {
      label: t.nav.casosDeUso,
      href: '/para',
      children: [
        { label: t.nav.marketing, href: '/para/marketing' },
        { label: t.nav.vendas, href: '/para/vendas' },
        { label: t.nav.rh, href: '/para/rh' },
      ],
    },
    {
      label: t.nav.recursos,
      href: '/recursos',
      children: [
        { label: t.nav.blog, href: '/blog' },
        { label: t.nav.materiais, href: '/materiais' },
        { label: t.nav.ferramentas, href: '/ferramentas' },
      ],
    },
    { label: t.nav.precos, href: '/precos' },
  ];

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-300',
          scrolled
            ? 'border-b border-border/40 bg-white/80 shadow-sm shadow-primary/5 backdrop-blur-xl'
            : 'bg-transparent',
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <LogoFull height={26} className="shrink-0" />

          {/* Desktop nav — hidden below lg */}
          <nav className="hidden lg:flex lg:items-center lg:gap-1" aria-label="Main navigation">
            {navItems.map((item) =>
              item.children ? (
                <DesktopDropdown key={item.label} item={item} />
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm font-medium',
                    'text-foreground/70 hover:text-foreground',
                    'transition-colors duration-200',
                  )}
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          {/* Right side: CTA (desktop) + hamburger (mobile) */}
          <div className="flex items-center gap-2">
            {/* CTA — desktop only */}
            <div className="hidden lg:block">
              <Button onClick={openPopup} size="sm" className="gap-1.5">
                {t.nav.agendarDemo}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Hamburger — mobile only */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className={cn(
                'inline-flex items-center justify-center rounded-md p-2 lg:hidden',
                'text-foreground/70 hover:bg-accent hover:text-foreground',
                'transition-colors duration-200',
              )}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <MobileMenu
        items={navItems}
        ctaLabel={t.nav.agendarDemo}
        open={mobileOpen}
        onClose={closeMobile}
        onOpenDemo={openPopup}
      />

      {/* Spacer so content is not hidden behind the fixed header */}
      <div className="h-16" aria-hidden="true" />
    </>
  );
}
