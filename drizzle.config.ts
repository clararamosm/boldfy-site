/**
 * Config do Drizzle Kit (gera migrations e introspect).
 *
 * Uso:
 *   npm run db:generate  → gera nova migration baseada nas mudanças em src/db/schema.ts
 *   npm run db:migrate   → aplica migrations no Postgres
 *   npm run db:studio    → abre Drizzle Studio (UI web) pra explorar o DB
 */

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // Usa a versão UNPOOLED pra migrations (queries longas/transações precisam
    // bypass do pgbouncer). Em runtime das pages usamos a pooled.
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
