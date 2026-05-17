/**
 * Helper pra "agora" em Server Components.
 *
 * `Date.now()` direto em render é "impuro" pro React 19 Compiler — gera
 * warning em todo arquivo. Centralizar aqui evita poluir as pages com
 * `eslint-disable react-hooks/purity`.
 *
 * As pages que usam isso já são `force-dynamic`, então o "now" muda a cada
 * request — comportamento esperado.
 */

// eslint-disable-next-line react-hooks/purity -- chamado só em Server Components force-dynamic
export function nowMs(): number {
  return Date.now();
}

export function nowDate(): Date {
  // eslint-disable-next-line react-hooks/purity
  return new Date();
}

/** Retorna Date que representa N dias atrás de agora. */
export function daysAgo(n: number): Date {
  return new Date(nowMs() - n * 24 * 60 * 60 * 1000);
}
