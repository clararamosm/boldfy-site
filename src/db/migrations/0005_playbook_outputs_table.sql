-- ============================================================================
-- 0005_playbook_outputs_table.sql
-- Tabela playbook_outputs + view state_elg_aggregates (mai/2026)
-- ============================================================================
--
-- O QUE FAZ:
--   1. Cria tabela playbook_outputs (storage de cada playbook gerado).
--      URL pública /playbook/[slug] resolve pra row aqui.
--   2. Cria 3 índices em playbook_outputs (person, created, template).
--   3. Cria VIEW state_elg_aggregates pra alimentar o dashboard interno
--      /internal/dashboard/state-elg e (futuramente) o relatório público.
--
-- DECISÃO — VIEW vs MATERIALIZED VIEW:
--   Spec original previa MATERIALIZED VIEW + cron de refresh. Decisão (mai/2026):
--   começar com VIEW comum porque (a) volume inicial é baixo (~10-100
--   respostas no primeiro mês), (b) JOIN é simples (2 tabelas), (c) sempre
--   atualizada sem cron. Promove pra MATERIALIZED quando passar de ~5k respostas
--   e o dashboard ficar lento — é só CREATE MATERIALIZED VIEW + agendar
--   REFRESH em /api/cron/refresh-state-elg-aggregates.
--
-- ORDEM IMPORTA:
--   FK person_id depende de people existir (já existe desde 0001).
--   FK company_id idem (companies já existe).
--   View depende de playbook_outputs existir. Tudo numa transação só.
--
-- COMO RODAR EM AMBIENTE NOVO (Neon):
--   1. Abre o SQL editor do projeto neon-bistre-basket
--   2. Cola o bloco inteiro abaixo, clica Run
--   3. Valida com os SELECTs comentados no fim
--
-- ============================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- Tabela playbook_outputs
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS playbook_outputs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Slug URL-facing: [empresa-kebab]-[6char-hash]. Único globalmente.
  slug           TEXT NOT NULL UNIQUE,
  person_id      UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  -- Nullable: company pode ser deletada sem perder histórico do playbook.
  company_id     UUID REFERENCES companies(id) ON DELETE SET NULL,
  -- Snapshot das respostas do quiz (11 perguntas + livre).
  quiz_data      JSONB NOT NULL,
  -- Chave do template renderizado: {area}-{dor}-{tentativas}.
  template_key   TEXT NOT NULL,
  -- Variáveis injetadas no template (hero, parágrafo conector, checklist,
  -- defaults da calculadora). Estrutura em spec §6.2.
  rendered_data  JSONB NOT NULL,
  -- Tracking de revisitas — sinal comercial pro CRM.
  view_count     INTEGER NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  -- IP do visualizador HASHED (sha256 com salt do COOKIE_SECRET) — LGPD.
  last_viewed_ip TEXT,
  -- Marca quando a pessoa clicou em "Exportar PDF" (window.print).
  pdf_exported_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playbook_outputs_person   ON playbook_outputs(person_id);
CREATE INDEX IF NOT EXISTS idx_playbook_outputs_created  ON playbook_outputs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_playbook_outputs_template ON playbook_outputs(template_key);

-- ────────────────────────────────────────────────────────────────────────────
-- View state_elg_aggregates (alimenta /internal/dashboard/state-elg)
-- ────────────────────────────────────────────────────────────────────────────
-- Shape: 1 row por (dimension, value). Dashboard agrupa por dimension e mostra
-- cada uma como gráfico. Adicionar dimensão nova = adicionar UNION ALL aqui.

CREATE OR REPLACE VIEW state_elg_aggregates AS
WITH base AS (
  SELECT
    po.id,
    po.created_at,
    p.job_seniority,
    p.job_area,
    c.industry,
    po.quiz_data->>'dor_principal'         AS dor_principal,
    po.quiz_data->>'tentativas_anteriores' AS tentativas_anteriores,
    po.quiz_data->>'budget_status'         AS budget_status,
    po.quiz_data->>'sponsorship_lideranca' AS sponsorship_lideranca,
    (po.quiz_data->>'porte_colaboradores')::int AS porte
  FROM playbook_outputs po
  JOIN people p    ON p.id = po.person_id
  LEFT JOIN companies c ON c.id = po.company_id
)
-- Total geral (uma linha)
SELECT 'total' AS dimension, 'all' AS value, COUNT(*)::int AS count FROM base
UNION ALL
-- Distribuição por área funcional
SELECT 'area', job_area::text, COUNT(*)::int
  FROM base WHERE job_area IS NOT NULL GROUP BY job_area
UNION ALL
-- Distribuição por senioridade
SELECT 'seniority', job_seniority::text, COUNT(*)::int
  FROM base WHERE job_seniority IS NOT NULL GROUP BY job_seniority
UNION ALL
-- Distribuição por setor (companies.industry — string livre)
SELECT 'industry', industry, COUNT(*)::int
  FROM base WHERE industry IS NOT NULL GROUP BY industry
UNION ALL
-- Distribuição da dor principal #1
SELECT 'dor_principal', dor_principal, COUNT(*)::int
  FROM base WHERE dor_principal IS NOT NULL GROUP BY dor_principal
UNION ALL
-- Distribuição de tentativas anteriores
SELECT 'tentativas_anteriores', tentativas_anteriores, COUNT(*)::int
  FROM base WHERE tentativas_anteriores IS NOT NULL GROUP BY tentativas_anteriores
UNION ALL
-- Distribuição do status do budget
SELECT 'budget_status', budget_status, COUNT(*)::int
  FROM base WHERE budget_status IS NOT NULL GROUP BY budget_status
UNION ALL
-- Distribuição do sponsorship da liderança
SELECT 'sponsorship_lideranca', sponsorship_lideranca, COUNT(*)::int
  FROM base WHERE sponsorship_lideranca IS NOT NULL GROUP BY sponsorship_lideranca
UNION ALL
-- Distribuição de porte em faixas (não revela número exato)
SELECT 'porte_faixa',
  CASE
    WHEN porte BETWEEN 5   AND 10  THEN '5-10'
    WHEN porte BETWEEN 11  AND 30  THEN '11-30'
    WHEN porte BETWEEN 31  AND 100 THEN '31-100'
    WHEN porte BETWEEN 101 AND 500 THEN '101-500'
    WHEN porte > 500              THEN '500+'
    ELSE 'desconhecido'
  END,
  COUNT(*)::int
FROM base WHERE porte IS NOT NULL
GROUP BY 2;

COMMIT;

-- Validação (rodar separado depois):
-- \d playbook_outputs    → 11 colunas + 3 índices + UNIQUE em slug
-- SELECT * FROM state_elg_aggregates;  → vazia ainda (zero playbooks), mas
--                                         deve retornar 0 rows sem erro.
