/**
 * Auth da extensão Chrome — gestão de tokens.
 *
 * Spec: /source-of-truth/specs/SPEC-extension-linkedin.md §4.
 *
 * Modelo:
 *   - Token cru = `crypto.randomUUID()` (UUID v4). Mostrado ao usuário UMA VEZ
 *     na página /internal/crm/extension-auth e nunca mais (não persistido).
 *   - DB guarda `bcrypt(token)` em extension_tokens.token_hash.
 *   - Lookup é O(N) sobre tokens ativos (revoked_at IS NULL) — bcrypt.compare
 *     em cada um. OK por enquanto: Clara é a única usuária e tem 1-3 tokens
 *     ativos. Se um dia escalar pra >50, trocar pra HMAC com lookup direto.
 *
 * Requests da extensão: Header `Authorization: Bearer <token-uuid>`.
 */

import { compare, hash } from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { db, extensionTokens } from '@/db';
import type { ExtensionToken } from '@/db';
import { and, eq, isNull } from 'drizzle-orm';

const BCRYPT_COST = 10;

/* -------------------------------------------------------------------------- */
/*  Geração e hash                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Gera um token novo + salva hash no DB. Retorna { token, tokenId }.
 *
 * O `token` cru SÓ é retornado aqui — caller (página de auth) mostra ao
 * usuário com instrução "copie e cole no popup, mostrado uma única vez".
 */
export async function issueExtensionToken(label: string): Promise<{ token: string; tokenId: string }> {
  const token = randomUUID();
  const tokenHash = await hash(token, BCRYPT_COST);

  const [row] = await db
    .insert(extensionTokens)
    .values({
      tokenHash,
      label: label.trim() || 'Dispositivo sem nome',
    })
    .returning({ id: extensionTokens.id });

  return { token, tokenId: row.id };
}

/* -------------------------------------------------------------------------- */
/*  Verificação                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Valida um token Bearer contra a tabela. Se válido:
 *   - Atualiza `last_used_at` da row
 *   - Retorna a row da extensionTokens
 * Se inválido (não encontrado ou revogado), retorna null.
 *
 * Implementação: lista tokens ativos e roda `bcrypt.compare` em cada.
 * Único usuário (Clara) tem 1-3 tokens ativos — O(N) é fine.
 */
export async function verifyExtensionToken(rawToken: string): Promise<ExtensionToken | null> {
  if (!rawToken || rawToken.length < 10) return null;

  const activeTokens = await db
    .select()
    .from(extensionTokens)
    .where(isNull(extensionTokens.revokedAt));

  for (const row of activeTokens) {
    const matches = await compare(rawToken, row.tokenHash);
    if (matches) {
      // Atualiza last_used_at (fire-and-forget — não queremos bloquear request).
      void db
        .update(extensionTokens)
        .set({ lastUsedAt: new Date() })
        .where(eq(extensionTokens.id, row.id))
        .catch((err) => console.error('[extension-auth] failed to update lastUsedAt:', err));
      return row;
    }
  }

  return null;
}

/* -------------------------------------------------------------------------- */
/*  Header parser                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Extrai o token cru do header `Authorization: Bearer <token>`. Retorna null
 * se ausente ou malformado.
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') return null;
  return parts[1];
}

/**
 * Helper wrapper: pega Authorization header de um Request, valida o token,
 * retorna a ExtensionToken se válido ou null. Endpoints chamam essa função
 * direto pra rejeitar com 401 quando vier null.
 */
export async function authenticateExtensionRequest(req: Request): Promise<ExtensionToken | null> {
  const rawToken = extractBearerToken(req.headers.get('authorization'));
  if (!rawToken) return null;
  return verifyExtensionToken(rawToken);
}

/* -------------------------------------------------------------------------- */
/*  Listagem e revogação                                                       */
/* -------------------------------------------------------------------------- */

export async function listActiveTokens(): Promise<ExtensionToken[]> {
  return db
    .select()
    .from(extensionTokens)
    .where(isNull(extensionTokens.revokedAt))
    .orderBy(extensionTokens.createdAt);
}

export async function listAllTokens(): Promise<ExtensionToken[]> {
  return db.select().from(extensionTokens).orderBy(extensionTokens.createdAt);
}

export async function revokeToken(tokenId: string): Promise<{ ok: boolean }> {
  const result = await db
    .update(extensionTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(extensionTokens.id, tokenId), isNull(extensionTokens.revokedAt)))
    .returning({ id: extensionTokens.id });
  return { ok: result.length > 0 };
}
