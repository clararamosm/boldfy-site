/**
 * Token HMAC pra URLs de proposta.
 *
 * Antes: /proposta/<id> era publicamente enumeravel — qualquer um que
 * adivinhasse um page-id da database conseguia ver pricing de outras
 * propostas. Como Notion gera IDs sequenciais por DB, isso era trivial.
 *
 * Agora: /proposta/<id>?t=<token>, onde token = HMAC-SHA256(id) truncado.
 * Sem o secret PROPOSAL_TOKEN_SECRET, atacante nao consegue forjar token
 * mesmo que enumere o id.
 *
 * Modo de operacao (definido por env vars):
 *
 *   PROPOSAL_TOKEN_SECRET ausente:
 *     -> modo LEGADO (sem auth). Aceita qualquer URL. Util pra rollback.
 *
 *   PROPOSAL_TOKEN_SECRET presente, PROPOSAL_REQUIRE_TOKEN nao = "true":
 *     -> modo COMPAT (default apos a migracao). Tokens novos sao gerados
 *        e validados. URLs sem token ainda passam (warning logado) pra
 *        nao quebrar links antigos ja distribuidos.
 *
 *   PROPOSAL_TOKEN_SECRET presente, PROPOSAL_REQUIRE_TOKEN = "true":
 *     -> modo STRICT. URL sem token ou com token invalido retorna 404.
 *        Habilitar APOS confirmar que todos os links antigos ja foram
 *        substituidos pelos novos com token.
 */

import crypto from 'crypto';

const TOKEN_LENGTH = 24; // 96 bits — anti-enumeracao com folga
const PROPOSAL_TOKEN_SECRET = process.env.PROPOSAL_TOKEN_SECRET;
const REQUIRE_TOKEN = process.env.PROPOSAL_REQUIRE_TOKEN === 'true';

/**
 * Gera token HMAC-SHA256 pro id da proposta. Retorna null se secret
 * nao estiver configurado (modo legado — URL fica sem token).
 */
export function generateProposalToken(id: string): string | null {
  if (!PROPOSAL_TOKEN_SECRET) return null;
  return crypto
    .createHmac('sha256', PROPOSAL_TOKEN_SECRET)
    .update(id)
    .digest('hex')
    .slice(0, TOKEN_LENGTH);
}

/**
 * Constroi a URL completa da proposta, incluindo token se possivel.
 *
 * Exemplos:
 *   buildProposalUrl('https://boldfy.com.br', '<id>')
 *     -> /proposta/<id>?t=<token>  (se secret configurado)
 *     -> /proposta/<id>            (modo legado, sem secret)
 */
export function buildProposalUrl(siteUrl: string, id: string): string {
  const token = generateProposalToken(id);
  const base = `${siteUrl}/proposta/${id}`;
  return token ? `${base}?t=${token}` : base;
}

type VerifyResult =
  | { ok: true; mode: 'legacy' | 'compat' | 'strict' }
  | { ok: false; reason: 'missing_token' | 'invalid_token' };

/**
 * Verifica token. Comportamento depende das envs (ver doc do arquivo).
 *
 * Retorna { ok: true } se a request deve ser processada, ou
 * { ok: false } com motivo se deve retornar 404.
 */
export function verifyProposalToken(
  id: string,
  providedToken: string | null,
): VerifyResult {
  // Modo legado: sem secret, aceita qualquer coisa
  if (!PROPOSAL_TOKEN_SECRET) {
    return { ok: true, mode: 'legacy' };
  }

  // Modo strict ou compat: tem secret
  if (!providedToken) {
    if (REQUIRE_TOKEN) {
      return { ok: false, reason: 'missing_token' };
    }
    // Compat: deixa passar, mas loga
    console.warn(
      '[proposal-token] URL sem token — modo compat ativo. Em producao, garanta que todos os links novos tem token.',
    );
    return { ok: true, mode: 'compat' };
  }

  const expected = generateProposalToken(id);
  if (!expected) {
    // Defensive: nao deveria chegar aqui (ja checamos secret acima)
    return { ok: true, mode: 'legacy' };
  }

  // Comparacao timing-safe — previne ataque de timing
  try {
    const a = Buffer.from(providedToken);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return { ok: false, reason: 'invalid_token' };
    if (!crypto.timingSafeEqual(a, b)) {
      return { ok: false, reason: 'invalid_token' };
    }
  } catch {
    return { ok: false, reason: 'invalid_token' };
  }

  return { ok: true, mode: REQUIRE_TOKEN ? 'strict' : 'compat' };
}
