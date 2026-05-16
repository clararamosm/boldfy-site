import { NextRequest } from 'next/server';
import { redirect } from 'next/navigation';
import { kv } from '@vercel/kv';

/**
 * GET /l/<code>
 *
 * Redireciona um codigo curto pra URL longa salva no KV.
 * Status 307 (default do redirect() do next/navigation) — temporary redirect,
 * evita cache eterno e deixa a gente trocar destino se precisar.
 *
 * - Codigo invalido (regex falha) → /?l=invalid
 * - Codigo nao encontrado no KV  → /?l=notfound
 * - Codigo ok                    → URL longa
 *
 * IMPORTANTE: redirect() do next/navigation lanca internamente um erro
 * NEXT_REDIRECT que o Next captura. Por isso NAO pode estar dentro de
 * try/catch — a doc oficial avisa explicitamente.
 */

export const dynamic = 'force-dynamic';

// Mesmo alfabeto da rota /api/shorten (sem 0/O/o/1/I/l).
// Aqui usamos a regex generica [a-zA-Z0-9]{6} pra simplicidade —
// se o codigo passar nesse filtro mas nao existir no KV, cai no notfound.
const CODE_REGEX = /^[a-zA-Z0-9]{6}$/;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;

  if (!CODE_REGEX.test(code)) {
    redirect('/?l=invalid');
  }

  const url = await kv.get<string>(`link:${code}`);

  if (!url) {
    console.warn(`[l-redirect] Codigo nao encontrado: ${code}`);
    redirect('/?l=notfound');
  }

  // Incrementa contador de cliques (fire-and-forget — não bloqueia redirect)
  // Sprint 3 do Dashboard: usado pelo bloco Shortlinks.
  kv.incr(`link-clicks:${code}`).catch((err) =>
    console.warn(`[l-redirect] Falha incrementando contador de ${code}:`, err),
  );
  // Salva também último clique pro UI mostrar "ativo recentemente"
  kv.set(`link-last:${code}`, Date.now()).catch(() => {});

  redirect(url);
}
