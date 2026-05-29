-- ============================================================================
-- 0007_extension_linkedin_capture.sql
-- Foundation pra extensão Chrome de captura LinkedIn (mai/2026)
-- ============================================================================
--
-- O QUE FAZ:
--   1. Torna `people.email` NULLABLE — captura LinkedIn não tem email, e
--      Clara não quer placeholder fake poluindo DB. Lead vira email-less até
--      preencher um form do site (decisão registrada em
--      /source-of-truth/specs/SPEC-extension-linkedin.md §5.1).
--   2. Adiciona unique constraint em `companies.linkedin_url` — dedup de
--      empresa por URL canonical do LinkedIn (mesma lógica que já existe
--      em people.linkedin_url via idx_people_linkedin).
--   3. Cria índice em `extension_tokens` pra lookup rápido de tokens ativos
--      (filtra revoked_at IS NULL).
--
-- POR QUE EMAIL NULL EM VEZ DE PLACEHOLDER:
--   Princípio "CRM é índice, não enciclopédia" (Clara, mai/2026): cada lead
--   tem só os campos mínimos pra identificar quem é quem. LinkedIn Lead se
--   identifica por nome + foto + linkedin_url. Email entra quando (e se) a
--   pessoa preencher form do site, e aí o dedup por linkedin_url (constraint
--   já existente em idx_people_linkedin) une os registros automaticamente.
--
-- POR QUE UNIQUE EM companies.linkedin_url:
--   Captura standalone de empresa (/company/<slug>) precisa deduplicar igual
--   pessoa. Sem unique, recapturas geram rows duplicadas com mesmo URL.
--
-- IMPACTO NO CÓDIGO:
--   - `upsertPerson` em lib/crm.ts foi refatorada pra aceitar email opcional
--     e fazer dedup por linkedin_url quando email ausente. Forms existentes
--     (Beta, Demo, Algoritmo LinkedIn, Case Semrush, Proposta, Playbook ELG)
--     continuam exigindo email via Zod schema deles — comportamento inalterado.
--   - `ClassifiedLead.email` virou opcional. Adapters de form do site
--     continuam preenchendo. Só `linkedin-extension.ts` pode omitir.
--   - Renderização de email no CRM UI trata null com fallback "(sem email)".
--
-- COMO RODAR EM AMBIENTE NOVO (Neon):
--   1. Abre o SQL editor do projeto Neon
--   2. Cola e roda Query 1, valida
--   3. Cola e roda Query 2, valida
--   4. Cola e roda Query 3, valida
--   Sempre 1 query por vez (regra Clara — drizzle-kit push proibido).
--
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- Query 1 — people.email vira NULLABLE
-- ────────────────────────────────────────────────────────────────────────────
-- Idempotente: rodar de novo sem efeito se a coluna já estiver NULLABLE.
-- A unique constraint em email (idx_people_email) PERMANECE — Postgres trata
-- múltiplos NULLs como não-conflitantes em unique index por default.

BEGIN;

ALTER TABLE people ALTER COLUMN email DROP NOT NULL;

COMMIT;

-- Validação:
-- SELECT column_name, is_nullable
-- FROM information_schema.columns
-- WHERE table_name='people' AND column_name='email';
--   → is_nullable deve ser 'YES'


-- ────────────────────────────────────────────────────────────────────────────
-- Query 2 — Unique constraint em companies.linkedin_url
-- ────────────────────────────────────────────────────────────────────────────
-- Idempotente via IF NOT EXISTS.
-- Postgres permite múltiplos NULL em unique index → empresas legadas sem
-- linkedin_url continuam coexistindo sem conflito.

BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_linkedin_url
  ON companies(linkedin_url);

COMMIT;

-- Validação:
-- SELECT indexname FROM pg_indexes
-- WHERE tablename='companies' AND indexname='idx_companies_linkedin_url';
--   → deve retornar 1 linha
--
-- Checar se não há duplicatas antes (esperado: 0 rows; se vier > 0, resolver
-- por merge manual ANTES de rodar a Query 2):
-- SELECT linkedin_url, COUNT(*) FROM companies
-- WHERE linkedin_url IS NOT NULL
-- GROUP BY linkedin_url HAVING COUNT(*) > 1;


-- ────────────────────────────────────────────────────────────────────────────
-- Query 3 — Índice de tokens ativos em extension_tokens
-- ────────────────────────────────────────────────────────────────────────────
-- Lookup quente (a cada request da extensão batendo no /api/extension/*)
-- precisa filtrar tokens não-revogados rápido. Partial index economiza
-- espaço — só inclui rows ativas. Idempotente.

BEGIN;

CREATE INDEX IF NOT EXISTS idx_extension_tokens_active
  ON extension_tokens(token_hash)
  WHERE revoked_at IS NULL;

COMMIT;

-- Validação:
-- SELECT indexname FROM pg_indexes
-- WHERE tablename='extension_tokens' AND indexname='idx_extension_tokens_active';
--   → deve retornar 1 linha


-- ────────────────────────────────────────────────────────────────────────────
-- Validação final da migration (rodar separado, opcional)
-- ────────────────────────────────────────────────────────────────────────────
-- Resumo do estado pós-migration:
--
-- SELECT
--   (SELECT is_nullable FROM information_schema.columns
--    WHERE table_name='people' AND column_name='email') AS email_nullable,
--   (SELECT COUNT(*) FROM pg_indexes
--    WHERE indexname='idx_companies_linkedin_url') AS company_linkedin_idx,
--   (SELECT COUNT(*) FROM pg_indexes
--    WHERE indexname='idx_extension_tokens_active') AS active_tokens_idx;
--   → esperado: ('YES', 1, 1)
