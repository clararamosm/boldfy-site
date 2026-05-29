/**
 * <BoldfyIcon />
 *
 * Quadradinho da marca Boldfy (B em creme dentro de fundo roxo arredondado).
 * Reutilizado em vários pontos do playbook output pra sinalizar visualmente
 * "isso é da Boldfy", em vez de usar o ✦ Sparkles genérico do Lucide.
 *
 * O SVG do ícone vive em `public/images/boldfy-icon.svg` (mesma marca usada
 * no header / favicon do site).
 *
 * Quando inserido em `<a>` ou `<button>` com hover invert (bg roxo → branco),
 * o ícone fica visualmente estático (marca não inverte). Apenas o container
 * troca background/texto no hover.
 */

import Image from 'next/image';

export function BoldfyIcon({
  size = 16,
  className,
}: {
  /** Lado do quadrado em px. Default 16 (cabe inline em botão de label pequeno). */
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/images/boldfy-icon.svg"
      alt=""
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      // Imagem decorativa — `alt=""` + `aria-hidden` deixam screen readers ignorarem.
      // Caller pode passar `className` pra controlar rounded extra, shadow, etc.
    />
  );
}
