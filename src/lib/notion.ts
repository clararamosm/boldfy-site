/**
 * Notion API integration for the Blog.
 *
 * Requires env vars:
 *  - NOTION_TOKEN: Internal integration token
 *  - NOTION_BLOG_DATABASE_ID: Database ID for blog posts
 *
 * Caching:
 *  - fetch() ja tem cache nativo via { next: { revalidate: 300 } } (Data Cache)
 *  - unstable_cache adiciona memoization in-memory dentro de um request +
 *    cache do resultado MAPEADO (evita re-mapear pageToPost na revalidacao)
 *  - Tags permitem invalidacao manual via revalidateTag() se precisar
 */

import { unstable_cache } from 'next/cache';

const NOTION_TOKEN = process.env.NOTION_API_KEY ?? process.env.NOTION_TOKEN ?? '';
const NOTION_DATABASE_ID = process.env.NOTION_BLOG_DATABASE_ID ?? '';

const CACHE_TTL = 300; // 5 minutos — alinhado com revalidate do fetch

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  status: string;
  publishedAt: string;
  readTime: number;
  coverUrl: string | null;
  author: string;
  authorBio: string;
  authorLinkedIn: string;
  authorPhoto: string | null;
  tags: string[];
  /* SEO fields */
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  canonicalUrl: string;
  keywordPrincipal: string;
  keywordsSecundarias: string;
  schemaType: string;
  indexar: boolean;
}

/**
 * Tipos minimos do Notion API. Sao "shapes parciais" — apenas os campos
 * que de fato lemos. Notion tem dezenas de tipos de bloco/property; o
 * indexador genérico abaixo cobre o resto sem precisar exhaustive typing.
 */

interface RichTextItem {
  plain_text: string;
}

interface NotionFile {
  file?: { url: string };
  external?: { url: string };
}

interface NotionPage {
  id: string;
  cover?: NotionFile | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties: Record<string, any>;
}

export interface NotionBlock {
  id: string;
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function headers() {
  return {
    Authorization: `Bearer ${NOTION_TOKEN}`,
    'Content-Type': 'application/json',
    'Notion-Version': NOTION_VERSION,
  };
}

function extractPlainText(richTextArr: RichTextItem[] | undefined): string {
  if (!richTextArr) return '';
  return richTextArr.map((rt) => rt.plain_text).join('');
}

function extractFileUrl(files: NotionFile[] | undefined): string | null {
  if (!files || files.length === 0) return null;
  const file = files[0];
  // Notion Files & media: pode ser "file" (upload) ou "external" (URL)
  return file?.file?.url ?? file?.external?.url ?? null;
}

function pageToPost(page: NotionPage): BlogPost {
  const props = page.properties;

  // Campo "Indexar" vem como checkbox (__YES__ / vazio) ou checkbox real
  const indexarRaw = props.Indexar?.checkbox ?? props.Indexar?.select?.name;
  const indexar =
    indexarRaw === true || indexarRaw === '__YES__' || indexarRaw === 'Yes';

  return {
    id: page.id,
    slug: extractPlainText(props.Slug?.rich_text) || page.id,
    title: extractPlainText(props.Title?.title ?? props.Name?.title ?? props.Nome?.title),
    summary: extractPlainText(props.Resumo?.rich_text),
    category: props.Categoria?.select?.name ?? '',
    status: props.Status?.select?.name ?? 'Rascunho',
    publishedAt: props['Data de Publicação']?.date?.start ?? '',
    readTime: props['Tempo de Leitura']?.number ?? 5,
    coverUrl: page.cover?.external?.url ?? page.cover?.file?.url ?? null,
    author: extractPlainText(props.Autor?.rich_text) || 'Boldfy',
    authorBio: extractPlainText(props['Bio do Autor']?.rich_text) || '',
    authorLinkedIn: props['LinkedIn do Autor']?.url ?? '',
    authorPhoto: extractFileUrl(props['Foto Autor']?.files),
    tags: (props.Tags?.multi_select ?? []).map((t: { name: string }) => t.name),
    /* SEO fields */
    metaTitle: extractPlainText(props['Meta Title']?.rich_text) || '',
    metaDescription: extractPlainText(props['Meta Description']?.rich_text) || '',
    ogTitle: extractPlainText(props['OG Title']?.rich_text) || '',
    ogDescription: extractPlainText(props['OG Description']?.rich_text) || '',
    canonicalUrl: props['Canonical URL']?.url ?? (extractPlainText(props['Canonical URL']?.rich_text) || ''),
    keywordPrincipal: extractPlainText(props['Keyword Principal']?.rich_text) || '',
    keywordsSecundarias: extractPlainText(props['Keywords Secundárias']?.rich_text) || '',
    schemaType: props['Schema Type']?.select?.name ?? 'Article',
    indexar,
  };
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Implementacao raw — NAO chamar diretamente, use getPublishedPosts.
 */
async function _fetchPublishedPosts(): Promise<BlogPost[]> {
  if (!NOTION_TOKEN || !NOTION_DATABASE_ID) {
    console.warn('[notion] Missing NOTION_TOKEN or NOTION_BLOG_DATABASE_ID');
    return [];
  }

  const res = await fetch(`${NOTION_API}/databases/${NOTION_DATABASE_ID}/query`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      filter: {
        property: 'Status',
        select: { equals: 'Publicado' },
      },
      sorts: [
        { property: 'Data de Publicação', direction: 'descending' },
      ],
    }),
    next: { revalidate: CACHE_TTL, tags: ['blog-posts'] },
  });

  if (!res.ok) {
    console.error('[notion] Failed to query database', res.status, await res.text());
    return [];
  }

  const data = await res.json();
  return data.results.map(pageToPost);
}

/**
 * Fetch all published blog posts, sorted by published date desc.
 *
 * Cacheado: revalidacao a cada 5 min OU manual via revalidateTag('blog-posts').
 */
export const getPublishedPosts = unstable_cache(
  _fetchPublishedPosts,
  ['notion-blog-posts'],
  { revalidate: CACHE_TTL, tags: ['blog-posts'] },
);

async function _fetchPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!NOTION_TOKEN || !NOTION_DATABASE_ID) return null;

  const res = await fetch(`${NOTION_API}/databases/${NOTION_DATABASE_ID}/query`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      filter: {
        and: [
          { property: 'Slug', rich_text: { equals: slug } },
          { property: 'Status', select: { equals: 'Publicado' } },
        ],
      },
      page_size: 1,
    }),
    next: { revalidate: CACHE_TTL, tags: ['blog-posts', `blog-post-${slug}`] },
  });

  if (!res.ok) return null;
  const data = await res.json();
  if (data.results.length === 0) return null;
  return pageToPost(data.results[0]);
}

/**
 * Fetch a single post by slug. Cacheado por slug — revalidatea via tag
 * `blog-post-<slug>` ou `blog-posts` (purga geral).
 */
export const getPostBySlug = unstable_cache(
  _fetchPostBySlug,
  ['notion-blog-post-by-slug'],
  { revalidate: CACHE_TTL, tags: ['blog-posts'] },
);

async function _fetchPageBlocks(pageId: string): Promise<NotionBlock[]> {
  if (!NOTION_TOKEN) return [];

  const blocks: NotionBlock[] = [];
  let cursor: string | undefined;

  do {
    const url = `${NOTION_API}/blocks/${pageId}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ''}`;
    const res = await fetch(url, {
      headers: headers(),
      next: { revalidate: CACHE_TTL, tags: ['blog-posts', `blog-blocks-${pageId}`] },
    });

    if (!res.ok) break;
    const data = await res.json();
    blocks.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return blocks;
}

/**
 * Fetch the block children of a Notion page (the post content).
 * Cacheado por pageId.
 */
export const getPageBlocks = unstable_cache(
  _fetchPageBlocks,
  ['notion-page-blocks'],
  { revalidate: CACHE_TTL, tags: ['blog-posts'] },
);
