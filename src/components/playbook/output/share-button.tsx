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
  onShare,
  children,
}: {
  url: string;
  variant?: 'dark' | 'light';
  /** Callback opcional pra trackear cliques (GA4 event). */
  onShare?: () => void;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    onShare?.();

    // 1. Em mobile com Web Share API (iOS Safari + Chrome Android), abre o
    //    share sheet nativo — UX certa pra ambientes tipo Web Summit onde
    //    a pessoa quer mandar pelo WhatsApp/Mail/Slack direto sem copiar.
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: 'Meu Playbook de Employee-Led Growth',
          text: 'Estratégia personalizada de Employee-Led Growth pra minha empresa.',
          url,
        });
        return; // Sucesso — não mostra "copiado" (já compartilhou)
      } catch (err) {
        // Pessoa cancelou ou erro — cai pro fallback de clipboard
        if ((err as { name?: string })?.name === 'AbortError') return;
      }
    }

    // 2. Fallback: copia pra clipboard com feedback visual
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 3. Fallback final: prompt manual (contextos sem HTTPS, iframes restritos)
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
