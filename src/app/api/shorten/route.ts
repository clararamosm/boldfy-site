import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

/**
 * POST /api/shorten
 *
 * Recebe uma URL longa da boldfy.com.br e retorna um codigo curto +
 * a URL final (https://boldfy.com.br/l/<codigo>).
 *
 * Anti-abuso: aceita SO URLs com hostname boldfy.com.br ou www.boldfy.com.br.
 * Codigo: 6 chars do alfabeto sem ambiguos (sem 0/O/o/1/I/l).
 * Storage: Vercel KV (Upstash Redis) — chaves link:<code> e meta:<code>.
 *
 * CORS: aberto pra que o gerador de UTMs local (file://) consiga chamar.
 * Os security headers globais do next.config.ts (HSTS, X-Frame-Options etc)
 * continuam aplicados — nao conflitam com Access-Control-Allow-*.
 */

export const dynamic = 'force-dynamic';

const ALPHABET =
  'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const ALLOWED_HOSTS = ['boldfy.com.br', 'www.boldfy.com.br'];
const SHORT_DOMAIN = 'https://boldfy.com.br';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function generateCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Body invalido — JSON esperado' },
        { status: 400, headers: corsHeaders },
      );
    }

    const { url } =
      (body as { url?: unknown }) ?? ({} as { url?: unknown });

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL ausente ou invalida' },
        { status: 400, headers: corsHeaders },
      );
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'URL malformada' },
        { status: 400, headers: corsHeaders },
      );
    }

    if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
      return NextResponse.json(
        {
          error:
            'Dominio nao permitido. So encurtamos URLs da boldfy.com.br',
        },
        { status: 403, headers: corsHeaders },
      );
    }

    // Gera codigo unico com retry em caso de colisao
    let code = '';
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateCode();
      const exists = await kv.get(`link:${candidate}`);
      if (!exists) {
        code = candidate;
        break;
      }
    }

    if (!code) {
      console.error(
        '[shorten] Falha ao gerar codigo unico apos 5 tentativas',
      );
      return NextResponse.json(
        { error: 'Falha interna ao gerar codigo' },
        { status: 500, headers: corsHeaders },
      );
    }

    await kv.set(`link:${code}`, url);
    await kv.set(`meta:${code}`, {
      createdAt: Date.now(),
      originalUrl: url,
    });

    return NextResponse.json(
      {
        code,
        shortUrl: `${SHORT_DOMAIN}/l/${code}`,
      },
      { status: 200, headers: corsHeaders },
    );
  } catch (err) {
    console.error('[shorten] Erro interno:', err);
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500, headers: corsHeaders },
    );
  }
}
