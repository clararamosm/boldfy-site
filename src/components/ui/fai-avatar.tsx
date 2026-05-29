/**
 * <FaiAvatar />
 *
 * Foto da Fai (estrategista de IA da Boldfy) usada como ícone visual em
 * pontos do playbook onde a "voz da estrategista" está falando — ex:
 *   - "Veja como a Boldfy resolve" no fim dos cards de dica (a Fai vai
 *     contar como a Boldfy ajuda a destravar essa dica)
 *   - "E a Boldfy te ajuda nos três" no Bloco 3.5 (setor aplicação)
 *
 * Mantém continuidade narrativa com o wizard, onde a Fai é a narradora das
 * 11 perguntas. Imagem em `public/images/fai-avatar.jpeg`.
 */

import Image from 'next/image';

export function FaiAvatar({
  size = 18,
  className,
}: {
  /** Lado do círculo em px. Default 18 (cabe inline em botão de label pequeno). */
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/images/fai-avatar.jpeg"
      alt=""
      width={size}
      height={size}
      className={`rounded-full object-cover ${className ?? ''}`}
      aria-hidden="true"
      // Imagem decorativa — `alt=""` + `aria-hidden` deixam screen readers ignorarem.
      // Caller pode passar `className` extra (ex: ring colorido, shadow).
    />
  );
}
