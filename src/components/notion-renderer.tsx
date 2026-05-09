import type { NotionBlock } from '@/lib/notion';
import { MaterialCallout } from '@/components/embed/material-callout';
import { InfograficoEmbed } from '@/components/embed/infografico-embed';
import { PostTags, parseTagsLine } from '@/components/embed/post-tags';

/**
 * Renders Notion blocks to React elements.
 *
 * Tipos suportados:
 *   - paragraph (com deteccao de [TAGS: ...] -> chips)
 *   - heading_1/2/3
 *   - bulleted_list_item / numbered_list_item
 *   - quote, callout, code, image, divider
 *   - embed (com deteccao de URLs internas -> componentes inline)
 *
 * Embed URLs reconhecidas:
 *   /embed/material/<slug>?source=<post-slug>  -> <MaterialCallout>
 *   /embed/grafico/<slug>?source=<post-slug>   -> <InfograficoEmbed>
 *
 * Server Component — renderiza tudo no HTML do post, totalmente indexavel
 * por Google + LLMs. Sem hidratacao desnecessaria.
 */

/**
 * Detecta URL de embed interna do dominio Boldfy. Retorna o tipo + slug
 * + source se for, ou null se for embed externo (renderizado como link).
 */
function parseInternalEmbedUrl(url: string): {
  kind: 'material' | 'grafico';
  slug: string;
  source: string | null;
} | null {
  try {
    const parsed = new URL(url);
    // Aceita boldfy.com.br, www.boldfy.com.br e localhost (dev)
    const isBoldfy =
      parsed.hostname === 'boldfy.com.br' ||
      parsed.hostname === 'www.boldfy.com.br' ||
      parsed.hostname === 'localhost';
    if (!isBoldfy) return null;

    // /embed/material/<slug> ou /embed/grafico/<slug>
    const match = parsed.pathname.match(/^\/embed\/(material|grafico)\/([\w-]+)\/?$/);
    if (!match) return null;

    return {
      kind: match[1] as 'material' | 'grafico',
      slug: match[2],
      source: parsed.searchParams.get('source'),
    };
  } catch {
    return null;
  }
}

/**
 * Concatena rich_text num plain string. Util pra detectar patterns
 * tipo [TAGS: ...] que podem vir fragmentados em multiplos rich_text
 * items por causa de formatacao no Notion.
 */
function richTextToPlain(richText: Array<{ plain_text?: string }> | undefined): string {
  if (!richText) return '';
  return richText.map((rt) => rt.plain_text ?? '').join('');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderRichText(richText: any[]) {
  if (!richText) return null;
  return richText.map((rt: { plain_text: string; annotations: { bold: boolean; italic: boolean; code: boolean; underline: boolean; strikethrough: boolean }; href: string | null }, idx: number) => {
    let el: React.ReactNode = rt.plain_text;
    if (rt.annotations.bold) el = <strong key={idx}>{el}</strong>;
    if (rt.annotations.italic) el = <em key={idx}>{el}</em>;
    if (rt.annotations.code) el = <code key={idx} className="bg-secondary px-1.5 py-0.5 rounded text-sm">{el}</code>;
    if (rt.annotations.underline) el = <u key={idx}>{el}</u>;
    if (rt.annotations.strikethrough) el = <s key={idx}>{el}</s>;
    if (rt.href) el = <a key={idx} href={rt.href} className="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">{el}</a>;
    return <span key={idx}>{el}</span>;
  });
}

function Block({ block }: { block: NotionBlock }) {
  switch (block.type) {
    case 'paragraph': {
      // Detecta [TAGS: a, b, c] -> renderiza chips em vez de paragrafo
      const plain = richTextToPlain(block.paragraph.rich_text);
      const tags = parseTagsLine(plain);
      if (tags) {
        return <PostTags tags={tags} />;
      }
      return (
        <p className="text-base text-foreground leading-relaxed mb-4">
          {renderRichText(block.paragraph.rich_text)}
        </p>
      );
    }
    case 'heading_1':
      return (
        <h2 className="font-headline text-2xl font-black text-accent-foreground mt-8 mb-4">
          {renderRichText(block.heading_1.rich_text)}
        </h2>
      );
    case 'heading_2':
      return (
        <h3 className="font-headline text-xl font-black text-accent-foreground mt-6 mb-3">
          {renderRichText(block.heading_2.rich_text)}
        </h3>
      );
    case 'heading_3':
      return (
        <h4 className="text-lg font-semibold text-accent-foreground mt-4 mb-2">
          {renderRichText(block.heading_3.rich_text)}
        </h4>
      );
    case 'bulleted_list_item':
      return (
        <li className="text-base text-foreground mb-1 ml-4 list-disc">
          {renderRichText(block.bulleted_list_item.rich_text)}
        </li>
      );
    case 'numbered_list_item':
      return (
        <li className="text-base text-foreground mb-1 ml-4 list-decimal">
          {renderRichText(block.numbered_list_item.rich_text)}
        </li>
      );
    case 'quote':
      return (
        <blockquote className="border-l-4 border-primary pl-4 py-2 my-4 text-muted-foreground italic">
          {renderRichText(block.quote.rich_text)}
        </blockquote>
      );
    case 'callout':
      return (
        <div className="rounded-lg bg-secondary/50 border border-border p-4 my-4 flex gap-3">
          {block.callout.icon?.emoji && <span className="text-xl">{block.callout.icon.emoji}</span>}
          <div>{renderRichText(block.callout.rich_text)}</div>
        </div>
      );
    case 'code':
      return (
        <pre className="bg-accent-foreground text-white rounded-lg p-4 my-4 overflow-x-auto text-sm">
          <code>{renderRichText(block.code.rich_text)}</code>
        </pre>
      );
    case 'image': {
      const url = block.image.file?.url || block.image.external?.url;
      const caption = block.image.caption?.[0]?.plain_text;
      return (
        <figure className="my-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={caption || ''} className="rounded-lg w-full" loading="lazy" />
          {caption && <figcaption className="text-sm text-muted-foreground text-center mt-2">{caption}</figcaption>}
        </figure>
      );
    }
    case 'divider':
      return <hr className="my-8 border-border" />;
    case 'embed': {
      // Embed interno do dominio -> renderiza componente inline (indexavel)
      const url: string | undefined = block.embed?.url;
      if (!url) return null;

      const internal = parseInternalEmbedUrl(url);
      if (internal?.kind === 'material') {
        return <MaterialCallout slug={internal.slug} source={internal.source} />;
      }
      if (internal?.kind === 'grafico') {
        return <InfograficoEmbed slug={internal.slug} />;
      }

      // Embed externo desconhecido — renderiza como link discreto
      // (em vez de tentar fazer iframe, que cai no problema de SEO).
      return (
        <p className="text-base text-foreground leading-relaxed mb-4">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:no-underline break-all"
          >
            {url}
          </a>
        </p>
      );
    }
    default:
      return null;
  }
}

export function NotionRenderer({ blocks }: { blocks: NotionBlock[] }) {
  return (
    <div className="prose-boldfy">
      {blocks.map((block) => (
        <Block key={block.id} block={block} />
      ))}
    </div>
  );
}
