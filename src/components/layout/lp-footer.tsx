'use client';

/**
 * Footer minimalista pra Landing Pages (LPs) standalone.
 *
 * Diferente do <Footer /> global, esse aqui mostra só:
 * - Copyright
 * - Logo Boldfy linkando pra home
 * - Link de Privacidade
 *
 * Use em rotas que têm seu próprio <layout.tsx> e querem se isolar
 * do header/footer globais.
 */

import Link from 'next/link';
import { LogoFull } from '@/components/logo';
import { useT } from '@/lib/i18n/context';

export function LpFooter() {
  const t = useT();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t mt-8">
      <div className="mx-auto max-w-6xl px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Voltar para a home Boldfy" className="opacity-70 hover:opacity-100 transition-opacity">
            <LogoFull height={18} />
          </Link>
          <span>&copy; {currentYear} Boldfy. {t.betaTest.footerRights}</span>
        </div>
        <Link href="/privacidade" className="hover:text-foreground transition-colors">
          {t.betaTest.footerPrivacy}
        </Link>
      </div>
    </footer>
  );
}
