/**
 * Notion API integration for the Blog.
 *
 * Requires env vars:
 *  - NOTION_TOKEN: Internal integration token
 *  - NOTION_BLOG_DATABASE_ID: Database ID for blog posts
 */

const NOTION_TOKEN = process.env.NOTION_API_KEY ?? process.env.NOTION_TOKEN ?? '';
const NOTION_DATABASE_ID = process.env.NOTION_BLOG_DATABASE_ID ?? '';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractPlainText(richTextArr: any[]): string {
  if (!richTextArr) return '';
  return richTextArr.map((rt: { plain_text: string }) => rt.plain_text).join('');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pageToPost(page: any): BlogPost {
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
 * Fetch all published blog posts, sorted by published date desc.
 */
export async function getPublishedPosts(): Promise<BlogPost[]> {
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
    next: { revalidate: 300 }, // ISR: revalidate every 5 minutes
  });

  if (!res.ok) {
    console.error('[notion] Failed to query database', res.status, await res.text());
    return [];
  }

  const data = await res.json();
  return data.results.map(pageToPost);
}

/**
 * Fetch a single post by slug.
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
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
    next: { revalidate: 300 },
  });

  if (!res.ok) return null;
  const data = await res.json();
  if (data.results.length === 0) return null;
  return pageToPost(data.results[0]);
}

/**
 * Fetch the block children of a Notion page (the post content).
 */
export async function getPageBlocks(pageId: string): Promise<NotionBlock[]> {
  if (!NOTION_TOKEN) return [];

  const blocks: NotionBlock[] = [];
  let cursor: string | undefined;

  do {
    const url = `${NOTION_API}/blocks/${pageId}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ''}`;
    const res = await fetch(url, {
      headers: headers(),
      next: { revalidate: 300 },
    });

    if (!res.ok) break;
    const data = await res.json();
    blocks.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return blocks;
}
