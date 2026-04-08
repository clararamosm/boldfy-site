'use client';

import type { NotionBlock } from '@/lib/notion';

/**
 * Renders Notion blocks to React elements.
 * Supports: paragraph, heading_1/2/3, bulleted_list_item, numbered_list_item,
 * quote, callout, code, image, divider, toggle.
 */

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
    case 'paragraph':
      return (
        <p className="text-base text-foreground leading-relaxed mb-4">
          {renderRichText(block.paragraph.rich_text)}
        </p>
      );
    case 'heading_1':
      return (
        <h2 className="font-headline text-2xl font-bold text-accent-foreground mt-8 mb-4">
          {renderRichText(block.heading_1.rich_text)}
        </h2>
      );
    case 'heading_2':
      return (
        <h3 className="font-headline text-xl font-bold text-accent-foreground mt-6 mb-3">
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
