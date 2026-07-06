/**
 * Helpers dos usuários do time (owners de lead).
 *
 * NÃO é auth — o login do /internal segue senha compartilhada (lib/auth.ts).
 * Isto só resolve QUEM pode ser dono de um lead. Ver comentário da tabela
 * `users` no schema.
 *
 * O owner default (Clara) é o fallback pra todo lead novo — de form, manual
 * ou extensão — até alguém reatribuir no kanban.
 */

import { db, users } from '@/db';
import type { User } from '@/db';
import { eq, asc } from 'drizzle-orm';

/** Email do owner default. Todo lead novo cai aqui até ser reatribuído. */
export const DEFAULT_OWNER_EMAIL = 'clara@boldfy.com.br';

// Cache em memória do id do owner default — resolvido uma vez por processo.
// Evita um SELECT por submit de form. Invalida naturalmente a cada cold start.
let defaultOwnerIdCache: string | null = null;

/**
 * Id do owner default (Clara). Retorna null se a tabela ainda não foi
 * populada (pré-migration) — nesse caso o lead entra sem dono e o backfill
 * cobre depois. Nunca lança: atribuição de owner não pode quebrar o submit.
 */
export async function getDefaultOwnerId(): Promise<string | null> {
  if (defaultOwnerIdCache) return defaultOwnerIdCache;
  try {
    const [row] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, DEFAULT_OWNER_EMAIL))
      .limit(1);
    defaultOwnerIdCache = row?.id ?? null;
    return defaultOwnerIdCache;
  } catch {
    return null;
  }
}

/** Todos os users ativos, ordenados pro seletor de dono. */
export async function getCrmUsers(): Promise<User[]> {
  try {
    return await db
      .select()
      .from(users)
      .where(eq(users.active, true))
      .orderBy(asc(users.sortOrder), asc(users.name));
  } catch {
    return [];
  }
}
