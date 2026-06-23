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
  '/algoritmo-linkedin',
  '/agendar-demo',
  '/case-semrush',
  // Playbook ELG (mai/2026): LP + página de output personalizada — ambas
  // standalone (sem chrome global). Cada uma traz seu próprio logo no header.
  '/ferramentas/playbook-employee-led-growth',
  '/playbook',
  // Eventos BH (jun/2026): LP de pré-inscrição standalone, traz seu próprio logo.
  '/eventosbh',
];

/**
 * Lista de rotas que são totalmente internas (CRM, dashboard, login interno).
 * Têm seu próprio chrome (InternalTopbar) e não devem mostrar o do site público.
 */
const INTERNAL_ROUTES = ['/internal'];

function isLpRoute(pathname: string): boolean {
  return LP_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));
}

function isInternalRoute(pathname: string): boolean {
  return INTERNAL_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));
}

function shouldHideChrome(pathname: string): boolean {
  return isLpRoute(pathname) || isInternalRoute(pathname);
}

export function ConditionalHeader() {
  const pathname = usePathname();
  if (shouldHideChrome(pathname)) return null;
  return <Header />;
}

export function ConditionalFooter() {
  const pathname = usePathname();
  if (shouldHideChrome(pathname)) return null;
  return <Footer />;
}
