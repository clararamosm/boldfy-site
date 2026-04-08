'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Locale } from './types';
import { defaultLocale } from './types';
import { getDictionary, type Dictionary } from './dictionaries';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children, initialLocale }: { children: ReactNode; initialLocale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? defaultLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('boldfy-locale', newLocale);
    }
  }, []);

  const t = getDictionary(locale);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useLocale(): Locale {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useLocale must be used within I18nProvider');
  return ctx.locale;
}

export function useSetLocale() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useSetLocale must be used within I18nProvider');
  return ctx.setLocale;
}

export function useT(): Dictionary {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useT must be used within I18nProvider');
  return ctx.t;
}
