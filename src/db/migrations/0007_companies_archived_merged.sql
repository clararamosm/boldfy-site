-- Migration 0007 (mai/2026): adiciona archived + merged_into_id em companies
--
-- Por que: bug reportado pela Clara — pessoa que muda de emprego e preenche
-- form com empresa nova faz a empresa Y ser CRIADA, mas pessoa continuava
-- linkada à X (fix em crm.ts:347 resolveu o re-link). Agora as 2 empresas
-- coexistem no DB. Pra Clara conseguir fundir manualmente quando elas forem
-- a mesma coisa ("Acme Ltda" e "Acme SA"), precisamos da mesma estrutura
-- de merge que já existe em people: arquivar a secundária + apontar pra
-- principal via merged_into_id.
--
-- archived: soft-delete, padrão FALSE pra todos os registros existentes.
-- merged_into_id: aponta pra company "principal" quando essa foi mergeada.
--   ON DELETE SET NULL pra resiliência (se a principal sumir, não cascateia).

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS merged_into_id UUID REFERENCES companies(id) ON DELETE SET NULL;

-- Index pra agilizar filtros `WHERE archived = FALSE AND merged_into_id IS NULL`
-- que vão pra TODAS as queries que listam companies daqui pra frente.
CREATE INDEX IF NOT EXISTS idx_companies_archived ON companies(archived);
CREATE INDEX IF NOT EXISTS idx_companies_merged_into ON companies(merged_into_id);
