-- 0010_loss_reason.sql
-- Motivo da perda no lead (jul/2026). Preenchido quando o lead é movido pra
-- coluna terminal "Perdido". Texto livre (presets em LOSS_REASONS no código +
-- "Outro"). Rodar no Neon SQL editor.

ALTER TABLE people ADD COLUMN IF NOT EXISTS loss_reason text;
ALTER TABLE people ADD COLUMN IF NOT EXISTS loss_reason_at timestamptz;
