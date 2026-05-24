-- ============================================================================
-- 0006_drop_pdf_exported_at.sql
-- Remove coluna pdf_exported_at de playbook_outputs (mai/2026)
-- ============================================================================
--
-- O QUE FAZ:
--   Dropa a coluna `pdf_exported_at` que foi criada na migration 0005 prevendo
--   um botão "Exportar PDF" no output do Playbook.
--
-- POR QUE:
--   A sessão de copy editorial (mai/2026) consolidada em
--   /source-of-truth/specs/playbook-employee-led-growth-copy-final.md §4.9
--   removeu a feature de PDF — queremos que o respondente volte na URL
--   /playbook/[slug] como página viva, não baixe um snapshot estático.
--
-   Decisão Clara (mai/2026): não deixar coluna fantasma no schema. Drop limpo.
--   A coluna nunca chegou a receber dado em produção (PR 6 do PDF nunca foi
--   implementado), então não há perda de informação.
--
-- COMO RODAR EM AMBIENTE NOVO (Neon):
--   1. Abre o SQL editor do projeto neon-bistre-basket
--   2. Cola e roda o bloco abaixo
--   3. Valida com SELECT no fim (deve listar 12 colunas em playbook_outputs)
--
-- ============================================================================

BEGIN;

ALTER TABLE playbook_outputs DROP COLUMN IF EXISTS pdf_exported_at;

COMMIT;

-- Validação (rodar separado):
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name='playbook_outputs' ORDER BY ordinal_position;
--   → deve retornar 12 colunas (sem pdf_exported_at):
--     id, slug, person_id, company_id, quiz_data, template_key,
--     rendered_data, view_count, last_viewed_at, last_viewed_ip,
--     created_at, updated_at
