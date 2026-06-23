-- ============================================================================
-- 0008_form_eventosbh.sql
-- Pré-inscrição Eventos BH (jun/2026)
-- ============================================================================
--
-- O QUE FAZ:
--   Adiciona 'form_eventosbh' ao enum source_method — pra leads vindos da LP
--   de pré-inscrição /eventosbh (eventos B2B presenciais em BH) ficarem
--   rastreáveis separados dos outros nos analytics do CRM (gráficos por
--   origem, filtros do kanban, aba Formulários).
--
-- CONTEXTO:
--   LP standalone de demonstração de interesse. 100% Líder B2B — o campo
--   `empresa` (obrigatório no form) é o gate. Sem cadência de email montada
--   ainda (eventos sem data/local definidos); o contato fica acessível via
--   tag 'Form: Pré-inscrição Eventos BH' + lista de segmento 'Líderes B2B'.
--
-- ORDEM IMPORTA:
--   ALTER TYPE ADD VALUE não pode rodar dentro do mesmo bloco transacional
--   onde o valor é usado (validação do Postgres). Por isso roda SOZINHA,
--   fora de transação. IF NOT EXISTS garante idempotência.
--
-- COMO RODAR (Neon):
--   1. Abre o SQL editor do projeto Neon
--   2. Cola e roda a Query 1 abaixo (sozinha)
--   3. Valida com o SELECT comentado
--
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- Query 1 — Adiciona 'form_eventosbh' ao enum source_method
-- ────────────────────────────────────────────────────────────────────────────

ALTER TYPE source_method ADD VALUE IF NOT EXISTS 'form_eventosbh';

-- Validação: deve listar 'form_eventosbh' entre os valores do enum
-- SELECT enumlabel FROM pg_enum
-- WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'source_method')
-- ORDER BY enumsortorder;
