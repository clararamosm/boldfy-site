/**
 * Notion CRM helpers — reads Interações for the /proposta/[id] route.
 *
 * Separated from `notion.ts` (blog-only) to keep concerns clean.
 */

const NOTION_TOKEN = process.env.NOTION_API_KEY ?? process.env.NOTION_TOKEN ?? '';
const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

function headers() {
  return {
    Authorization: `Bearer ${NOTION_TOKEN}`,
    'Content-Type': 'application/json',
    'Notion-Version': NOTION_VERSION,
  };
}

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface ProposalData {
  version: number;
  createdAt: string;
  lead: {
    nome: string;
    email: string;
    empresa: string;
    cargo: string;
  };
  betaActive: boolean;
  platform: {
    enabled: boolean;
    seats: number;
    perSeatFull: number;
    perSeatBeta: number;
  };
  design: {
    enabled: boolean;
    pack: string;
    price: number;
  };
  fullService: {
    enabled: boolean;
    tls: number;
    freq: number;
    price: number;
  };
  totals: {
    current: number;
    full: number;
    savings: number;
  };
  team: { text: string; dedicated: boolean }[];
}

export interface InteracaoMeta {
  id: string;
  title: string;
  date: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface NotionBlock {
  id: string;
  type: string;
  [key: string]: any;
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Verify that a Notion page (Interação) exists and is accessible.
 * Returns metadata or null if not found / integration lacks access.
 */
export async function getInteracaoById(pageId: string): Promise<InteracaoMeta | null> {
  if (!NOTION_TOKEN) return null;

  try {
    const res = await fetch(`${NOTION_API}/pages/${pageId}`, {
      headers: headers(),
      next: { revalidate: 3600 }, // proposals rarely change
    });

    if (!res.ok) return null;
    const page = await res.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const titleArr = page.properties?.['Interação']?.title as any[];
    const title = titleArr?.map((t: { plain_text: string }) => t.plain_text).join('') ?? '';
    const date = page.properties?.Data?.date?.start ?? '';

    return { id: page.id, title, date };
  } catch {
    return null;
  }
}

/**
 * Fetch block children of an Interação page. We look for a `code` block
 * with language "json" that contains the proposal payload.
 */
export async function getInteracaoBlocks(pageId: string): Promise<NotionBlock[]> {
  if (!NOTION_TOKEN) return [];

  const blocks: NotionBlock[] = [];
  let cursor: string | undefined;

  do {
    const url = `${NOTION_API}/blocks/${pageId}/children?page_size=100${cursor ? `&start_cursor=${cursor}` : ''}`;
    const res = await fetch(url, {
      headers: headers(),
      next: { revalidate: 3600 },
    });

    if (!res.ok) break;
    const data = await res.json();
    blocks.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return blocks;
}

/**
 * Extract ProposalData from the code block inside an Interação page.
 */
export function parseProposalFromBlocks(blocks: NotionBlock[]): ProposalData | null {
  for (const block of blocks) {
    if (block.type === 'code' && block.code?.language === 'json') {
      const text = block.code.rich_text
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ?.map((rt: any) => rt.plain_text)
        .join('');
      if (!text) continue;
      try {
        const parsed = JSON.parse(text) as ProposalData;
        if (parsed.version && parsed.totals) return parsed;
      } catch {
        continue;
      }
    }
  }
  return null;
}
