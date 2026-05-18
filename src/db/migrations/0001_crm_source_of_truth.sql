-- ============================================================================
-- 0001_crm_source_of_truth.sql
-- Spec: docs/specs/crm-source-of-truth-fluxo-form.md (Task 1, mai/2026)
-- ============================================================================
--
-- O QUE FAZ:
--   1. Adiciona 9 colunas em `people` pra suportar source-of-truth do CRM
--      (segment, newsletter_opt_in, unsubscribed*, forms_submitted,
--      proposal_url, last_touch_*).
--   2. Remove `people.internal_notes` (vazio hoje, substituído por activity
--      `interaction_manual`). NOTA: `companies.internal_notes` permanece.
--   3. Cria tabela `form_definitions` + seed dos 5 forms (report, beta, demo,
--      proposta, linkedin_extension).
--   4. Índices: segment, unsubscribed (parcial), GIN em forms_submitted.
--
-- COMO RODEI:
--   Rodada via Chrome MCP no SQL editor do Neon em 2026-05-18 (decisão
--   arquitetural — evitar drizzle-kit push, que tinha quebrado antes com
--   USING/cast em jsonb). Query-por-query, com SELECT de validação.
--
-- POR QUE ESTÁ NO REPO MESMO ASSIM:
--   - Reprodutibilidade: ambientes novos (staging, novos devs, fork) precisam
--     dessa estrutura.
--   - Rollback: documenta o que foi feito caso precise reverter.
--   - Audit: pareceria/code review puxa a migration junto do código.
--   - drizzle-kit generate: pode usar isso como referência se um dia
--     formalizarmos pipeline de migrations versionadas.
--
-- COMO RODAR EM AMBIENTE NOVO (Neon):
--   1. Abre o SQL editor do projeto Neon
--   2. Cola Query 1, Run, valida com SELECT
--   3. Cola Query 2, Run, valida
--   4. Cola Query 3, Run, valida
--   5. Cola Query 4, Run, valida
--
-- IDEMPOTENTE: usa IF NOT EXISTS / DROP IF EXISTS / ON CONFLICT em todas as
-- statements. Rodar de novo não duplica/quebra.
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- Query 1 — Adiciona 9 colunas novas em `people`
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE people
  ADD COLUMN IF NOT EXISTS segment              TEXT,
  ADD COLUMN IF NOT EXISTS newsletter_opt_in    BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS unsubscribed         BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS unsubscribed_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resubscribed_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS forms_submitted      TEXT[]      NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS proposal_url         TEXT,
  ADD COLUMN IF NOT EXISTS last_touch_source    TEXT,
  ADD COLUMN IF NOT EXISTS last_touch_campaign  TEXT;

-- Validação: deve retornar 9 linhas
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'people'
--   AND column_name IN ('segment','newsletter_opt_in','unsubscribed','unsubscribed_at',
--                       'resubscribed_at','forms_submitted','proposal_url',
--                       'last_touch_source','last_touch_campaign')
-- ORDER BY column_name;


-- ────────────────────────────────────────────────────────────────────────────
-- Query 2 — Remove `people.internal_notes` (companies fica intacto)
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE people DROP COLUMN IF EXISTS internal_notes;

-- Validação: deve retornar 0 linhas
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'people' AND column_name = 'internal_notes';


-- ────────────────────────────────────────────────────────────────────────────
-- Query 3 — Cria `form_definitions` + seed dos 5 forms
-- ────────────────────────────────────────────────────────────────────────────
-- NAMING DAS TAGS AC: MANTIDO específico por slug (`Form: Algoritmo LinkedIn
-- 2026` etc) pra não quebrar cadência atual no AC. Forms futuros (ex:
-- Algoritmo TikTok 2027) entram com tag própria.
--
-- `fields_schema` é DESCRITIVO (catálogo de campos pra UI/admin futura).
-- Validação real continua via Zod hardcoded em src/app/actions/_schemas.ts.

CREATE TABLE IF NOT EXISTS form_definitions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  kind          TEXT NOT NULL CHECK (kind IN ('topo_funil','lider_b2b_only')),
  ac_tag        TEXT NOT NULL,
  fields_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO form_definitions (slug, name, kind, ac_tag, fields_schema) VALUES
  ('report',             'Report Algoritmo LinkedIn 2026', 'topo_funil',     'Form: Algoritmo LinkedIn 2026',
   '{"fields":[{"key":"nome","type":"text","required":true},{"key":"email","type":"email","required":true},{"key":"empresa","type":"text","required":false},{"key":"intencao_uso","type":"select","options":["marca-empresa","marca-clientes","marca-pessoal"],"required":true,"maps_to_segment":true},{"key":"newsletter_opt_in","type":"boolean","required":false}]}'::jsonb),
  ('beta',               'Beta Test',                       'lider_b2b_only', 'Form: Beta Test',
   '{"fields":[{"key":"nome","type":"text","required":true},{"key":"email","type":"email","required":true},{"key":"telefone","type":"phone","required":true},{"key":"cargo","type":"text","required":true},{"key":"empresa","type":"text","required":true},{"key":"setor","type":"text","required":true},{"key":"colaboradores","type":"text","required":true,"note":"quantos vao pro programa beta (nao tamanho da empresa)"},{"key":"objetivo_principal","type":"textarea","required":true},{"key":"como_conheceu","type":"text","required":true},{"key":"observacoes","type":"textarea","required":false}]}'::jsonb),
  ('demo',               'Demo',                            'lider_b2b_only', 'Form: Demo',
   '{"fields":[{"key":"nome","type":"text","required":true},{"key":"email","type":"email","required":true},{"key":"telefone","type":"phone","required":true},{"key":"cargo","type":"text","required":true},{"key":"empresa","type":"text","required":true},{"key":"funcionarios","type":"text","required":true,"maps_to":"companies.size"}]}'::jsonb),
  ('proposta',           'Simulador de Proposta',           'lider_b2b_only', 'Form: Proposta',
   '{"fields":[{"key":"nome","type":"text","required":true},{"key":"email","type":"email","required":true},{"key":"empresa","type":"text","required":true},{"key":"cargo","type":"text","required":true},{"key":"_calculo","type":"object","note":"campos de calculo da proposta vivem em metadata.proposal_data"}]}'::jsonb),
  ('linkedin_extension', 'Extracao LinkedIn',               'lider_b2b_only', 'Form: LinkedIn',
   '{"fields":[{"key":"nome","type":"text","required":true},{"key":"linkedin_url","type":"url","required":true},{"key":"headline","type":"text","required":false},{"key":"cargo","type":"text","required":false},{"key":"empresa","type":"text","required":false},{"key":"_linkedin_profile","type":"object","note":"payload completo vive em metadata.linkedin_profile"}]}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- Validação: deve retornar 5 linhas
-- SELECT slug, name, kind, ac_tag, active FROM form_definitions ORDER BY slug;


-- ────────────────────────────────────────────────────────────────────────────
-- Query 4 — Índices (performance pra filtros do CRM)
-- ────────────────────────────────────────────────────────────────────────────
-- idx_people_segment       → filtro de segmento na aba Forms
-- idx_people_unsubscribed  → PARCIAL (só rows com unsubscribed=true,
--                             coluna inativos do kanban). Compacto.
-- idx_people_forms_gin     → GIN em forms_submitted (busca por slug específico)

CREATE INDEX IF NOT EXISTS idx_people_segment       ON people(segment);
CREATE INDEX IF NOT EXISTS idx_people_unsubscribed  ON people(unsubscribed) WHERE unsubscribed = TRUE;
CREATE INDEX IF NOT EXISTS idx_people_forms_gin     ON people USING GIN (forms_submitted);

-- Validação: deve retornar 3 linhas
-- SELECT indexname FROM pg_indexes
-- WHERE tablename = 'people'
--   AND indexname IN ('idx_people_segment','idx_people_unsubscribed','idx_people_forms_gin');
