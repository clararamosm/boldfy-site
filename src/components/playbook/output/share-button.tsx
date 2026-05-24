'use client';

/**
 * Botão "Compartilhar link" — copia a URL atual pra clipboard, mostra
 * feedback visual (Check + "Copiado!") por 2s, e volta ao estado original.
 *
 * Usado no Hero (variant=dark — fundo escuro) e no CTA final (variant=light).
 */

import { useState } from 'react';
import { Check } from 'lucide-react';

export function ShareButton({
  url,
  variant = 'light',
  children,
}: {
  url: string;
  variant?: 'dark' | 'light';
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: prompt do navegador (clipboard API pode falhar em iframes
      // ou contextos sem HTTPS — prompt manual cobre o caso raro).
      window.prompt('Copia o link:', url);
    }
  };

  const baseClasses =
    'inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-3 text-sm font-bold transition-all hover:-translate-y-0.5';
  const variantClasses =
    variant === 'dark'
      ? 'border border-white/20 bg-white/5 text-white hover:bg-white/10'
      : 'border border-border bg-card text-foreground hover:border-primary hover:text-primary';

  return (
    <button type="button" onClick={handleClick} className={`${baseClasses} ${variantClasses}`}>
      {copied ? (
        <>
          <Check className="mr-2 h-3.5 w-3.5" />
          Link copiado!
        </>
      ) : (
        children
      )}
    </button>
  );
}
