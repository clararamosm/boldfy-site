/**
 * i18n simplificado — funciona em Server E Client Components.
 *
 * Antes: `useT()` era um React Hook que dependia de I18nContext (Client only).
 * Isso forcava qualquer componente que usasse i18n a virar `'use client'`,
 * mesmo seções 100% estáticas. Custo: hidratação desnecessária.
 *
 * Agora: `useT()` é uma função síncrona pura que retorna o dicionário
 * importado estaticamente. Funciona em RSC (sem hidratação) ou em Client
 * Components (igual antes).
 *
 * Quando virar multi-locale: trocar `useT` por uma função que aceita locale
 * como parâmetro (ex: `useT(locale)`) e use a Server lookup baseada em URL.
 *
 * `I18nProvider` virou passthrough — mantido pra compat com providers.tsx.
 * Pode ser removido quando garantirmos que ninguem mais depende de Context.
 */

import type { ReactNode } from 'react';
import { getDictionary, type Dictionary } from './dictionaries';

export function I18nProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

/**
 * Retorna o dicionário ativo. Funciona em Server Components e Client
 * Components. Mantém o nome `useT` pra evitar refator em todos os
 * callsites.
 */
export function useT(): Dictionary {
  return getDictionary();
}
