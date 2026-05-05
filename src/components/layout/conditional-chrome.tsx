'use client';

/**
 * Wrapper que decide se o Header/Footer global do site devem aparecer.
 *
 * Rotas que querem ser standalone (LPs) não renderizam o chrome global —
 * elas trazem seu próprio <LpHeader />/<LpFooter />.
 *
 * Manter a lista `LP_ROUTES` sincronizada conforme novas LPs forem criadas.
 */

import { usePathname } from 'next/navigation';
import { Footer } from './footer';
import { Header } from './header';

/**
 * Lista de rotas que são LPs standalone (sem header/footer global).
 * Usar prefix matching: '/beta-test' bate em '/beta-test', '/beta-test/x' etc.
 */
const LP_ROUTES = [
  '/beta-test',
];

function isLpRoute(pathname: string): boolean {
  return LP_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));
}

export function ConditionalHeader() {
  const pathname = usePathname();
  if (isLpRoute(pathname)) return null;
  return <Header />;
}

export function ConditionalFooter() {
  const pathname = usePathname();
  if (isLpRoute(pathname)) return null;
  return <Footer />;
}
