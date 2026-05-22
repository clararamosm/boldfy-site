-- Migration 0003a — Rename generic slugs to URL-aligned slugs (mai/2026).
--
-- Motivação: 'report' e 'case' são genéricos. Quando o segundo material
-- chegar (ex: outro report sobre TikTok), o slug 'report' deixa de
-- identificar qual material é. Regra nova (AGENTS.md): slug interno
-- SEMPRE espelha o slug da URL pública.
--
--   'report' (do form Algoritmo LinkedIn 2026) → 'algoritmo-linkedin'
--   'case'   (do form Case Semrush ELG)        → 'case-semrush'
--
-- O que essa migration mexe:
--  1. ENUM source_method: renomeia 'form_report' → 'form_algoritmo_linkedin'
--     (form_case_semrush já existia desde 0002, não muda)
--  2. activities.type (TEXT): 'form_submit_report' → 'form_submit_algoritmo_linkedin'
--                              'form_submit_case'   → 'form_submit_case_semrush'
--  3. people.forms_submitted (text[]): array_replace dos slugs antigos
--  4. form_definitions.slug: 'report' → 'algoritmo-linkedin', 'case' → 'case-semrush'
--
-- Tags AC (Form: Algoritmo LinkedIn 2026 / Form: Case Semrush ELG) já são
-- específicas desde a Task 1 — não precisam mudar.
--
-- Rodar no Neon SQL editor via Chrome MCP (transação atômica).

BEGIN;

-- 1. Enum source_method: rename in-place. Postgres 10+ suporta RENAME VALUE,
--    é instantâneo e preserva todos os rows que já usam o valor.
ALTER TYPE source_method RENAME VALUE 'form_report' TO 'form_algoritmo_linkedin';

-- 2. activities.type — coluna text, precisa UPDATE explícito.
UPDATE activities SET type = 'form_submit_algoritmo_linkedin' WHERE type = 'form_submit_report';
UPDATE activities SET type = 'form_submit_case_semrush'       WHERE type = 'form_submit_case';

-- 3. people.forms_submitted — array text, usa array_replace.
UPDATE people
SET forms_submitted = array_replace(forms_submitted, 'report', 'algoritmo-linkedin')
WHERE 'report' = ANY(forms_submitted);

UPDATE people
SET forms_submitted = array_replace(forms_submitted, 'case', 'case-semrush')
WHERE 'case' = ANY(forms_submitted);

-- 4. form_definitions.slug — chave humana usada como source-of-truth da UI.
UPDATE form_definitions SET slug = 'algoritmo-linkedin' WHERE slug = 'report';
UPDATE form_definitions SET slug = 'case-semrush'       WHERE slug = 'case';

COMMIT;

-- Validação pós-migration (rodar separado pra confirmar):
--   SELECT unnest(enum_range(NULL::source_method));
--     → deve listar form_algoritmo_linkedin (não form_report)
--   SELECT DISTINCT type FROM activities WHERE type LIKE 'form_submit_%';
--     → deve listar form_submit_algoritmo_linkedin / form_submit_case_semrush
--   SELECT DISTINCT unnest(forms_submitted) FROM people;
--     → não deve ter 'report' nem 'case' soltos
--   SELECT slug FROM form_definitions ORDER BY slug;
--     → algoritmo-linkedin, beta, case-semrush, demo, linkedin_extension, proposta
