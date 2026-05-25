-- Retrofit: popular short_code dos 3 UTMs importados do gerador legado.
-- Os shortcodes HAXaCN, 9c4Hx5 e j8QkmZ já existem no Vercel KV apontando
-- pros mesmos destinos — só estamos linkando a referência no Postgres.
--
-- Rodar manualmente no Neon (SQL editor) — uma query por vez.

UPDATE utm_links SET short_code = 'HAXaCN'
WHERE full_url = 'https://boldfy.com.br/algoritmo-linkedin?utm_source=linkedin&utm_medium=organic&utm_campaign=lead-magnet-2'
  AND short_code IS NULL;

UPDATE utm_links SET short_code = '9c4Hx5'
WHERE full_url = 'https://boldfy.com.br/para/marketing?utm_source=linkedin&utm_medium=organic&utm_campaign=destaque'
  AND short_code IS NULL;

UPDATE utm_links SET short_code = 'j8QkmZ'
WHERE full_url = 'https://boldfy.com.br/algoritmo-linkedin?utm_source=linkedin&utm_medium=organic&utm_campaign=lead-magnet-1'
  AND short_code IS NULL;
