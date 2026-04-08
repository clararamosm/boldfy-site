'use client';

import { Globe } from 'lucide-react';
import { useLocale, useSetLocale } from '@/lib/i18n/context';
import type { Locale } from '@/lib/i18n/types';
import { cn } from '@/lib/utils';

const localeLabels: Record<Locale, string> = {
  'pt-BR': 'PT',
  en: 'EN',
};

export function LanguageToggle({ className }: { className?: string }) {
  const locale = useLocale();
  const setLocale = useSetLocale();

  const nextLocale: Locale = locale === 'pt-BR' ? 'en' : 'pt-BR';

  return (
    <button
      type="button"
      onClick={() => setLocale(nextLocale)}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium',
        'text-foreground/70 hover:text-foreground',
        'transition-colors duration-200',
        'hover:bg-accent/60',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      aria-label={locale === 'pt-BR' ? 'Switch to English' : 'Mudar para Portugues'}
    >
      <Globe className="h-4 w-4" />
      <span>{localeLabels[locale]}</span>
    </button>
  );
}
