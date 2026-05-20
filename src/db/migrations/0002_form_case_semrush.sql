-- ============================================================================
-- 0002_form_case_semrush.sql
-- LP de captura do Case Semrush ELG (mai/2026)
-- ============================================================================
--
-- O QUE FAZ:
--   1. Adiciona 'form_case_semrush' ao enum source_method — pra leads vindos
--      da LP /case-semrush ficarem rastreáveis separadamente do report nos
--      analytics do CRM (gráficos por origem, filtros do kanban).
--   2. Adiciona linha 'case' em form_definitions, com ac_tag 'Form: Case
--      Semrush ELG' e fields_schema descritivo.
--
-- POR QUE form_case_semrush E NÃO form_case:
--   Nomeado específico por material (igual ac_tag) pra que materiais futuros
--   (Case Hubspot, Case ZoomInfo, etc) entrem com source_method próprio sem
--   ter que migrar leads antigos. Mesma filosofia da ac_tag 'Form: Algoritmo
--   LinkedIn 2026' (não vira 'Form: Report').
--
-- ORDEM IMPORTA:
--   ALTER TYPE ADD VALUE não pode rodar dentro do mesmo bloco transacional
--   onde o valor é usado (Postgres validation). Por isso essa migration é
--   2 queries SEPARADAS — rode Query 1, COMMIT, depois Query 2.
--
-- COMO RODAR EM AMBIENTE NOVO (Neon):
--   1. Abre o SQL editor do projeto Neon
--   2. Cola e roda Query 1 (sozinha — não roda junto com Query 2)
--   3. Cola e roda Query 2
--   4. Valida com SELECT abaixo
--
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- Query 1 — Adiciona 'form_case_semrush' ao enum source_method
-- ────────────────────────────────────────────────────────────────────────────
-- IF NOT EXISTS garante idempotência: roda de novo sem erro se já existir.

ALTER TYPE source_method ADD VALUE IF NOT EXISTS 'form_case_semrush';

-- Validação: deve listar 'form_case_semrush' na coluna enumlabel
-- SELECT enumlabel FROM pg_enum
-- WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'source_method')
-- ORDER BY enumsortorder;


-- ────────────────────────────────────────────────────────────────────────────
-- Query 2 — Insere form_definitions row pro case
-- ────────────────────────────────────────────────────────────────────────────
-- fields_schema descritivo: nome/email/intencao sempre obrigatórios; empresa,
-- cargo e tamanho_empresa só quando intencao_uso='marca-empresa' (gate na UI).

INSERT INTO form_definitions (slug, name, kind, ac_tag, fields_schema) VALUES
  ('case', 'Case Semrush ELG', 'topo_funil', 'Form: Case Semrush ELG',
   '{"fields":[{"key":"nome","type":"text","required":true},{"key":"email","type":"email","required":true},{"key":"intencao_uso","type":"select","options":["marca-empresa","marca-clientes","marca-pessoal"],"required":true,"maps_to_segment":true},{"key":"empresa","type":"text","required":false,"required_if":"intencao_uso=marca-empresa"},{"key":"cargo","type":"text","required":false,"required_if":"intencao_uso=marca-empresa"},{"key":"tamanho_empresa","type":"select","options":["ate-10","11-50","51-200","201-500","500+"],"required":false,"required_if":"intencao_uso=marca-empresa","maps_to":"companies.size"},{"key":"newsletter_opt_in","type":"boolean","required":false}]}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- Validação: deve retornar 6 linhas (5 do 0001 + 1 nova)
-- SELECT slug, name, kind, ac_tag, active FROM form_definitions ORDER BY slug;
