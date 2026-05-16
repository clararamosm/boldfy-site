/**
 * Cliente Drizzle pro Neon Postgres (via Vercel Storage integration).
 *
 * O Neon do Vercel cria as env vars com nome `DATABASE_URL` (não mais
 * POSTGRES_URL como era o @vercel/postgres antigo). Usamos o driver
 * @neondatabase/serverless direto + Drizzle's neon-http adapter.
 *
 * Env vars criadas automaticamente pelo Vercel quando você adiciona Storage >
 * Neon Postgres:
 *   DATABASE_URL          — connection string pooled (recomendado)
 *   DATABASE_URL_UNPOOLED — sem pooler (pra migrations, queries longas)
 *   PGHOST, PGUSER, etc   — pra construir manualmente se precisar
 *
 * Setup local:
 *   1. No Vercel: Storage > Create Database > Neon Postgres > conectar projeto
 *   2. Vercel CLI: `vercel env pull .env.local`
 *   3. Rodar `npm run db:push` pra criar tabelas no DB
 */

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  // Permitido durante build em ambientes sem env (typecheck, lint). Em runtime,
  // qualquer query vai dar erro descritivo, capturado pelo try/catch nas pages.
  // eslint-disable-next-line no-console
  console.warn('[db] DATABASE_URL ausente. Rodar `vercel env pull .env.local` se for dev local.');
}

const sql = neon(process.env.DATABASE_URL ?? 'postgres://placeholder/placeholder');

export const db = drizzle(sql, { schema });

export * from './schema';
