-- Migration 0003b — Tabela proposals (substitui Notion como storage do JSON).
--
-- Motivação: até mai/2026, propostas geradas pelo Simulador (/proposta) eram
-- armazenadas como page no Notion (DB "Propostas"), e a rota /proposta/[id]
-- lia de lá pra renderizar o HTML compartilhável. Isso duplicava dados que
-- já vivem no CRM Boldfy (people.metadata.proposal_data) e ainda criava
-- dependência externa (NOTION_API_KEY, NOTION_PROPOSTAS_DB_ID).
--
-- Decisão (Clara, mai/2026): consolidar tudo no nosso DB.
--   - Tabela dedicada `proposals` (1 lead → N propostas, preserva histórico
--     se cliente reabrir simulador).
--   - URL /proposta/[uuid] resolve pra row na tabela proposals.
--   - Propostas antigas migradas do Notion via INSERT manual (apenas 1 real;
--     resto era teste da Clara).
--
-- Schema:
--   id            UUID PK (URL-facing — público mas com token HMAC opcional)
--   person_id     UUID FK people (cascade on delete — proposta morre com pessoa)
--   proposal_data JSONB (estrutura completa: platform, design, fullService, totals)
--   total_current INT (cache pra ORDER BY e sumários sem precisar fazer parse)
--   total_full    INT (idem)
--   beta_active   BOOL (gate da página HTML — exibe "30% off" só quando true)
--   created_at    TIMESTAMPTZ DEFAULT NOW()
--   updated_at    TIMESTAMPTZ DEFAULT NOW()
--
-- Rodar no Neon SQL editor via Chrome MCP.

BEGIN;

CREATE TABLE IF NOT EXISTS proposals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id     UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  proposal_data JSONB NOT NULL,
  total_current INTEGER NOT NULL,
  total_full    INTEGER NOT NULL,
  beta_active   BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lookup por pessoa pra mostrar todas as propostas dela no perfil
CREATE INDEX IF NOT EXISTS idx_proposals_person ON proposals(person_id);

-- Ordenação cronológica pra listagens / "última proposta gerada"
CREATE INDEX IF NOT EXISTS idx_proposals_created ON proposals(created_at DESC);

COMMIT;

-- Validação (rodar separado):
--   \d proposals
--     → deve mostrar 8 colunas + 2 índices
