import type { Locale } from '../types';
import type { Dictionary } from './pt-BR';
import ptBR from './pt-BR';
import en from './en';

const dictionaries: Record<Locale, Dictionary> = {
  'pt-BR': ptBR,
  'en': en,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] || ptBR;
}

export type { Dictionary };
