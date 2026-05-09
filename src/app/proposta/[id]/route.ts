/**
 * Route handler that serves a standalone HTML proposal page.
 *
 * GET /proposta/[id] → returns full HTML (no Next.js layout, no header/footer)
 *
 * The HTML is self-contained with inline CSS — can be viewed in a browser
 * or used as the basis for an email template.
 *
 * Data is fetched from the Notion Interações database by page ID.
 * The proposal JSON is stored as a code block inside the Interação page.
 */

import { NextResponse } from 'next/server';
import {
  getInteracaoById,
  getInteracaoBlocks,
  parseProposalFromBlocks,
} from '@/lib/notion-crm';
import { generateProposalHTML } from '@/components/proposal-html';
import { verifyProposalToken } from '@/lib/proposal-token';

export const revalidate = 3600; // ISR: cache for 1 hour

// Valida formato do id antes de qualquer outra coisa.
// Aceita 32-char hex puro ou UUID com hifens (8-4-4-4-12).
const ID_HEX_32 = /^[a-f0-9]{32}$/i;
const ID_UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // 1. Valida formato do ID — descarta lixo antes de qualquer fetch
  if (!ID_HEX_32.test(id) && !ID_UUID.test(id)) {
    return new NextResponse(notFoundHTML(), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // 2. Valida token HMAC (anti-enumeracao). Comportamento depende de
  //    PROPOSAL_TOKEN_SECRET / PROPOSAL_REQUIRE_TOKEN — ver lib/proposal-token.
  const url = new URL(request.url);
  const providedToken = url.searchParams.get('t');
  const tokenCheck = verifyProposalToken(id, providedToken);
  if (!tokenCheck.ok) {
    return new NextResponse(notFoundHTML(), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Normalize: 32-char hex (no dashes) → UUID with dashes for Notion API
  const normalizedId =
    id.length === 32 && !id.includes('-')
      ? `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`
      : id;

  const meta = await getInteracaoById(normalizedId);
  if (!meta) {
    return new NextResponse(notFoundHTML(), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const blocks = await getInteracaoBlocks(normalizedId);
  const proposal = parseProposalFromBlocks(blocks);

  if (!proposal) {
    return new NextResponse(notFoundHTML(), {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://boldfy.com.br';
  // Reconstroi URL preservando o token (se veio na request original) — usada
  // no HTML pra botoes de "copiar link" e "compartilhar".
  const proposalUrl = providedToken
    ? `${siteUrl}/proposta/${id}?t=${providedToken}`
    : `${siteUrl}/proposta/${id}`;
  const html = generateProposalHTML(proposal, proposalUrl);

  // Shorter cache when proposal is close to expiring (or already expired)
  const VALIDITY_DAYS = 15;
  const createdDate = new Date(proposal.createdAt);
  const daysElapsed = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
  const isNearExpiry = daysElapsed >= VALIDITY_DAYS - 1;
  const cacheSeconds = isNearExpiry ? 300 : 3600; // 5 min near expiry, 1h otherwise

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': `public, s-maxage=${cacheSeconds}, stale-while-revalidate=86400`,
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

function notFoundHTML(): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Proposta não encontrada — Boldfy</title>
  <style>
    body { margin:0; padding:0; background:#FAFAFA; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; color:#171717; display:flex; align-items:center; justify-content:center; min-height:100vh; }
    .box { text-align:center; padding:40px; }
    h1 { font-size:24px; font-weight:800; margin:0 0 8px; }
    p { font-size:14px; color:#737373; margin:0 0 24px; }
    a { display:inline-block; background:#8B6CDB; color:#fff; padding:12px 28px; border-radius:8px; font-size:14px; font-weight:700; text-decoration:none; }
  </style>
</head>
<body>
  <div class="box">
    <h1>Proposta não encontrada</h1>
    <p>O link pode ter expirado ou o ID está incorreto.</p>
    <a href="https://boldfy.com.br">Ir para boldfy.com.br</a>
  </div>
</body>
</html>`;
}
