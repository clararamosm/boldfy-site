/**
 * Renderiza chips de tags no fim do post.
 *
 * Disparado pelo NotionRenderer quando detecta um paragrafo iniciado com
 * `[TAGS: ` e terminando com `]`. Tags separadas por virgula viram chips.
 */

import { Badge } from '@/components/ui/badge';

interface PostTagsProps {
  tags: string[];
}

export function PostTags({ tags }: PostTagsProps) {
  if (tags.length === 0) return null;

  return (
    <div className="my-8 flex flex-wrap gap-2" aria-label="Tags do artigo">
      {tags.map((tag, idx) => (
        <Badge
          key={`${tag}-${idx}`}
          variant="secondary"
          className="border-primary/15 bg-primary/[0.07] text-primary hover:bg-primary/[0.12]"
        >
          {tag}
        </Badge>
      ))}
    </div>
  );
}

/**
 * Parser: extrai tags de uma string `[TAGS: a, b, c]`.
 * Aceita variacoes: `[Tags: ...]`, `[tags: ...]`, com ou sem espaco.
 * Retorna null se a string nao bate o padrao.
 */
export function parseTagsLine(text: string): string[] | null {
  const trimmed = text.trim();
  const match = trimmed.match(/^\[\s*tags?\s*:\s*(.+?)\s*\]\s*$/i);
  if (!match) return null;

  const tags = match[1]
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  return tags.length > 0 ? tags : null;
}
