/**
 * @deprecated 2026-05-29 — arquivo virou no-op.
 *
 * Plano original era usar endpoint dedicado `/api/webhooks/ac/cadence-completed`
 * com slug na query string, validado por `AC_WEBHOOK_SECRET`. Decisão revertida
 * pra simplificar a config no AC: agora usa **tag com prefixo "Concluiu: "**
 * detectada pelo webhook principal (`/api/webhooks/ac`).
 *
 * Por que: pra cadência nova, a configuração no AC vira só "aplica tag", sem
 * precisar de URL com secret. Resolve o problema de não dar pra ver o secret
 * no Vercel sem permissão certa, e elimina ponto de fricção operacional.
 *
 * Lógica nova: ver `lib/ac-tag-mapping.ts` (helper `cadenceFromCompletedTag`)
 * e `/api/webhooks/ac/route.ts` (case 'contact_tag').
 *
 * Esse arquivo pode ser deletado no próximo PR de cleanup.
 */

export {};
