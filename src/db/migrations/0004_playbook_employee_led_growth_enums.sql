-- ============================================================================
-- 0004_playbook_employee_led_growth_enums.sql
-- Foundation pro Playbook de Employee-Led Growth (mai/2026)
-- ============================================================================
--
-- O QUE FAZ:
--   1. Adiciona 'form_playbook_employee_led_growth' ao enum source_method —
--      pra leads vindos do form Playbook ficarem rastreáveis separados dos
--      outros nos analytics do CRM (gráficos por origem, filtros do kanban).
--   2. Cria dois novos enums recorrentes: job_seniority e job_area.
--      Esses enums começam no Playbook mas devem ser retrofit em forms
--      futuros que coletam cargo (beta, demo, proposta).
--   3. Adiciona colunas job_seniority e job_area em people (ambas nullable
--      — pessoas vindas de forms antigos ficam null; forms novos populam).
--   4. Cria índices idx_people_seniority e idx_people_area pra segmentação
--      no kanban + agregados do State of ELG dashboard.
--
-- POR QUE ENUMS E COLUNAS ESTRUTURADAS (em vez de metadata.form_data):
--   Senioridade e área viram filtro de kanban, regra de lead score
--   (C-Level + budget + sponsorship = lead quente sobe pra "Quente"), e
--   tag bidirecional no AC. Pra tudo isso a coluna indexada vence o JSONB.
--   Decisão registrada na spec /source-of-truth/specs/playbook-employee-led-growth.md.
--
-- ORDEM IMPORTA:
--   ALTER TYPE ADD VALUE não pode rodar dentro do mesmo bloco transacional
--   onde o valor é usado (Postgres validation). Mesma armadilha da migration
--   0002. Por isso essa migration tem 3 QUERIES SEPARADAS — rode Query 1,
--   commit, depois Query 2, commit, depois Query 3.
--
-- COMO RODAR EM AMBIENTE NOVO (Neon):
--   1. Abre o SQL editor do projeto Neon
--   2. Cola e roda Query 1 (sozinha, fora de transação)
--   3. Cola e roda Query 2 (cria os 2 enums novos)
--   4. Cola e roda Query 3 (colunas + índices em people)
--   5. Valida com SELECTs abaixo
--
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- Query 1 — Adiciona 'form_playbook_employee_led_growth' ao enum source_method
-- ────────────────────────────────────────────────────────────────────────────
-- IF NOT EXISTS garante idempotência: roda de novo sem erro se já existir.

ALTER TYPE source_method ADD VALUE IF NOT EXISTS 'form_playbook_employee_led_growth';

-- Validação: deve listar o novo valor na coluna enumlabel
-- SELECT enumlabel FROM pg_enum
-- WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'source_method')
-- ORDER BY enumsortorder;


-- ────────────────────────────────────────────────────────────────────────────
-- Query 2 — Cria os enums job_seniority e job_area
-- ────────────────────────────────────────────────────────────────────────────
-- Postgres não tem CREATE TYPE IF NOT EXISTS nativo pra enums; o DO block
-- abaixo emula isso com checagem em pg_type. Idempotente.

DO $$ BEGIN
  CREATE TYPE job_seniority AS ENUM (
    'analista',
    'coordenador',
    'gerente',
    'diretor',
    'c_level'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE job_area AS ENUM (
    'marketing',
    'growth',
    'vendas',
    'rh',
    'employer_branding',
    'comunicacao',
    'outro'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Validação dos enums novos:
-- SELECT typname, array_agg(enumlabel ORDER BY enumsortorder) AS values
-- FROM pg_enum
-- JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
-- WHERE typname IN ('job_seniority', 'job_area')
-- GROUP BY typname;


-- ────────────────────────────────────────────────────────────────────────────
-- Query 3 — Colunas job_seniority/job_area em people + índices
-- ────────────────────────────────────────────────────────────────────────────
-- Ambas nullable. Pessoas antigas ficam null. Novos forms populam.
-- Rodar dentro de transação (BEGIN/COMMIT) pra consistência caso falhe no meio.

BEGIN;

ALTER TABLE people ADD COLUMN IF NOT EXISTS job_seniority job_seniority;
ALTER TABLE people ADD COLUMN IF NOT EXISTS job_area job_area;

CREATE INDEX IF NOT EXISTS idx_people_seniority ON people(job_seniority);
CREATE INDEX IF NOT EXISTS idx_people_area ON people(job_area);

COMMIT;

-- Validação:
--   \d people
--     → deve ter 2 colunas novas: job_seniority e job_area
--   SELECT indexname FROM pg_indexes WHERE tablename='people' AND
--     indexname IN ('idx_people_seniority', 'idx_people_area');
--     → deve retornar 2 linhas
