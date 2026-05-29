/**
 * @deprecated 2026-05-29 — endpoint substituído pelo padrão de tag.
 *
 * Plano original era ter rota dedicada acionada pela ação "Send a webhook"
 * do AC no penúltimo passo da automation, validando por `AC_WEBHOOK_SECRET`.
 * Decisão revertida pra simplificar a config: agora usa **tag com prefixo
 * "Concluiu: "** detectada pelo webhook principal.
 *
 * Nova lógica:
 *   - Penúltimo passo da automation no AC = aplica tag "Concluiu: <Nome>"
 *   - Webhook principal `/api/webhooks/ac` detecta o prefixo e cria activity
 *     `cadence_completed` na timeline.
 *
 * Ver `lib/ac-tag-mapping.ts` (cadenceFromCompletedTag) e o webhook principal.
 *
 * Endpoint mantido como 410 Gone pra deixar explícito que não deve ser usado.
 * Pode ser deletado no próximo PR de cleanup.
 */

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: 'endpoint_deprecated',
      message:
        'Use o padrão de tag em vez deste endpoint. Aplica a tag "Concluiu: <Nome>" no penúltimo passo da automation; o webhook principal /api/webhooks/ac detecta automaticamente.',
    },
    { status: 410 },
  );
}

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      deprecated: true,
      replaced_by: 'tag pattern: "Concluiu: <Nome>"',
      see: '/api/webhooks/ac (route.ts) + lib/ac-tag-mapping.ts',
    },
    { status: 410 },
  );
}
