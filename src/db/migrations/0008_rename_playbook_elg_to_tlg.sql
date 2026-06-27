-- ============================================================================
-- 0008_rename_playbook_elg_to_tlg.sql
-- Renomeia Employee-Led Growth → Team-Led Growth no rastreamento do Playbook (jun/2026)
-- ============================================================================
--
-- O QUE FAZ:
--   1. Renomeia o valor do enum source_method:
--      'form_playbook_employee_led_growth' → 'form_playbook_team_led_growth'.
--      RENAME VALUE atualiza TODAS as linhas existentes em people.source_method
--      automaticamente (o enum guarda por oid; trocar o label reflete em tudo).
--   2. Atualiza o type das activities (texto livre, não enum) que registram o
--      submit do Playbook: 'form_submit_playbook_employee_led_growth' →
--      'form_submit_playbook_team_led_growth'.
--
-- CONTEXTO: o Playbook foi renomeado de Employee-Led Growth pra Team-Led Growth.
-- O volume é mínimo (pouquíssimas respostas), então a migração é segura.
--
-- COMO RODAR (Neon):
--   1. Abre o SQL editor do projeto Neon
--   2. Roda Query 1 (rename do enum)
--   3. Roda Query 2 (update das activities)
--   4. Valida com os SELECTs comentados
--
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- Query 1 — Renomeia o valor do enum source_method
-- ────────────────────────────────────────────────────────────────────────────

ALTER TYPE source_method
  RENAME VALUE 'form_playbook_employee_led_growth' TO 'form_playbook_team_led_growth';

-- Validação: o novo label deve aparecer, o antigo não:
-- SELECT enumlabel FROM pg_enum
-- WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'source_method')
-- ORDER BY enumsortorder;


-- ────────────────────────────────────────────────────────────────────────────
-- Query 2 — Atualiza o type das activities do submit do Playbook
-- ────────────────────────────────────────────────────────────────────────────

UPDATE activities
   SET type = 'form_submit_playbook_team_led_growth'
 WHERE type = 'form_submit_playbook_employee_led_growth';

-- Validação: deve retornar 0 linhas com o type antigo:
-- SELECT count(*) FROM activities WHERE type = 'form_submit_playbook_employee_led_growth';
