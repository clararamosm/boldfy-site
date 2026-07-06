-- 0009_crm_users_and_owner.sql
-- Multi-owner no CRM (jul/2026). NÃO é auth: login do /internal segue senha
-- compartilhada única. Isto só cataloga QUEM pode ser dono de um lead e
-- atribui responsabilidade. Rodar no Neon SQL editor (fluxo padrão de migration).
--
-- ATENÇÃO: confirmar o email do José antes de rodar. Placeholder abaixo:
-- jose@boldfy.com.br. Trocar se for outro.

/* -------------------------------------------------------------------------- */
/*  Tabela users                                                              */
/* -------------------------------------------------------------------------- */
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  photo_url text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_active ON users (active);

/* -------------------------------------------------------------------------- */
/*  Seed dos dois membros do time                                             */
/* -------------------------------------------------------------------------- */
INSERT INTO users (name, email, photo_url, sort_order) VALUES
  ('Clara Ramos', 'clara@boldfy.com.br', '/images/founder.jpeg', 0),
  ('José Lucas',  'joselucas@boldfy.com.br',  '/images/ze.png',   1)
ON CONFLICT DO NOTHING;

/* -------------------------------------------------------------------------- */
/*  Coluna owner_id em people                                                 */
/* -------------------------------------------------------------------------- */
ALTER TABLE people ADD COLUMN IF NOT EXISTS owner_id uuid
  REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_people_owner ON people (owner_id);

/* -------------------------------------------------------------------------- */
/*  Backfill: todo lead ativo (não arquivado, não mergeado) vira da Clara     */
/* -------------------------------------------------------------------------- */
UPDATE people
SET owner_id = (SELECT id FROM users WHERE LOWER(email) = 'clara@boldfy.com.br' LIMIT 1),
    updated_at = now()
WHERE archived = false
  AND merged_into_id IS NULL
  AND owner_id IS NULL;
