/**
 * i18n simplificado — funciona em Server E Client Components.
 *
 * `useT()` é uma função síncrona pura que retorna o dicionário importado
 * estaticamente. NÃO é um React Hook (apesar do prefixo `use`) — funciona
 * em qualquer contexto: RSC, Client Component, route handler, server action.
 *
 * Quando virar multi-locale, trocar por uma função que aceita locale como
 * parâmetro (ex: `useT(locale)`) e usar lookup baseado em URL/cookie.
 *
 * NOTA: o nome do arquivo `context.tsx` é histórico — não tem mais Context.
 * Mantido pra evitar churn de imports em ~34 callsites.
 */

import { getDictionary, type Dictionary } from './dictionaries';

/**
 * Retorna o dicionário ativo. Funciona em Server e Client Components.
 */
export function useT(): Dictionary {
  return getDictionary();
}
