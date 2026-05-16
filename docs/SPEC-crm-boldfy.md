# SPEC: CRM Boldfy — sistema próprio + extensão Chrome

**Status:** aprovado em escopo, aguardando go pra implementação
**Owner:** Clara
**Acesso:** restrito (Clara, v1)
**Deadline-âncora:** Web Summit Rio em 8 de junho de 2026 (CRM core + extensão sideload entram na entrega da feira; migração do Folk e publicação na Chrome Web Store ficam pra pós-feira)
**Criado em:** 15 de maio de 2026
**Última atualização:** 15 de maio de 2026
**Relacionado:** [SPEC-dashboard-metricas-organicas.md](./SPEC-dashboard-metricas-organicas.md) — o bloco "Funil B2B" do dashboard lê deste CRM.

---

## 1. TL;DR

CRM próprio em Postgres (Vercel) embutido no `boldfy-site`, com kanbans separados de Pessoas e Empresas conectadas por FK, lead score automático event-based, log de atividades, integração read-only com Cal.com, sync bidirecional com ActiveCampaign (mudança de status disparam tags/automations), e extensão Chrome MVP que captura perfis do LinkedIn com one-click. Substitui Folk, economiza ~US$ 480/ano, elimina o bug atual de Folk integration broken, e dá controle total sobre o pipeline B2B.

## 2. Contexto e motivação

Clara paga ~US$ 40/mês pelo Folk, mas a feature que justifica o gasto é uma só: a extensão Chrome que captura perfis do LinkedIn em um clique. Fora isso, Folk é "uma tabela bonita" — não tem nada que o `boldfy-site` (já em produção, com infra madura) não pudesse oferecer.

Pior: a integração ActiveCampaign → Folk está **silenciosamente quebrada hoje**. O código em `src/app/actions/beta-leads.ts` e `demo-leads.ts` envolve a chamada pro Folk em `try/catch` com `console.error('non-blocking')`. Resultado: leads recentes não estão chegando no Folk, ninguém é notificado, o pipeline B2B no Folk está desatualizado. Esse bug precisa ser endereçado de qualquer jeito.

Em vez de corrigir e continuar pagando, a oportunidade é: construir o CRM dentro do produto, com a feature crítica (extensão) replicada, design adaptado pro contexto real da Boldfy (sem replicar campos do Folk que viraram redundantes com UTMs + AC + dashboard).

## 3. Goals

- **G1.** Substituir Folk completamente — kanban Person + kanban Company + extensão LinkedIn.
- **G2.** Eliminar o silent failure da integração atual — sistema próprio, sem dependência de API externa pra pipeline.
- **G3.** Lead score automático que vira sinal acionável (lead vira "Quente" sozinho quando passa de threshold).
- **G4.** AC continua como sistema de email/automation, mas nosso CRM vira fonte de verdade dos dados de pessoa/empresa.
- **G5.** Extensão Chrome MVP funcionando em sideload até o Web Summit (8 de junho).

## 4. Non-goals

- **NG1.** Não replicar todas as features do Folk (custom fields infinitos, multi-workspace, white-label, etc). Foco no que Clara realmente usa.
- **NG2.** Não construir cliente de email dentro do CRM — disparos continuam via AC.
- **NG3.** Não construir agenda própria — Cal.com continua agendando, CRM só lê.
- **NG4.** Não fazer extensão pra outros navegadores (Firefox, Safari) na v1. Chrome only.
- **NG5.** Sem multi-usuário, roles, ou permissões granulares na v1. Acesso = Clara.
- **NG6.** Sem mobile-first design — desktop primeiro, mobile responsivo bom o suficiente pra consulta rápida.
- **NG7.** **CRM é só pra leads B2B qualificados.** Profissionais individuais (criadores) e parceiros (agências) ficam só no ActiveCampaign pra cadência editorial — não poluem o CRM de vendas. Gate aplicado: (a) Form Report só vai pro CRM se `intencaoUso === 'marca-empresa'`; (b) Forms Demo/Beta/Proposta são 100% B2B então vão sem gate; (c) Importação do AC só puxa contatos com tag `Segmento: Líderes B2B`; (d) Leads adicionados manualmente ou via extensão Chrome são considerados B2B (Clara escolhe).

## 5. Success metrics

- **M1.** Folk cancelado até 31 de agosto de 2026.
- **M2.** Clara abre o CRM ≥ 5x por semana após launch (substitui o hábito de abrir Folk).
- **M3.** Extensão Chrome usada em ≥ 80% das adições de novos leads (vs adição manual via form).
- **M4.** Lead score acertando: ≥ 70% dos leads marcados como "Quente" pelo score realmente se convertem em "Reunião marcada" ou "Em andamento" dentro de 14 dias.
- **M5.** Zero data loss durante migração Folk → nosso DB.
- **M6.** Pipeline visual carregando em < 1 segundo (vs Folk que demora 3-5s).

## 6. User stories

- **U1.** Como Clara, quando abro um perfil no LinkedIn, quero clicar em um botão e salvar a pessoa como Lead no meu CRM com nome, foto, headline e empresa detectada automaticamente, sem digitar nada.
- **U2.** Como Clara, quero ver meu pipeline visual de Pessoas (kanban Ativo/Lead/Quente) e Empresas (kanban com 6 etapas) lado a lado.
- **U3.** Como Clara, quero arrastar um card de coluna ou clicar pra mudar status, e isso disparar automação no AC (tag, lista, email).
- **U4.** Como Clara, quero ver um lead score automático em cada Pessoa, calculado pelas ações que ela tomou (visitou /precos, baixou material, abriu email, agendou Cal.com), e ela ser promovida de "Lead" pra "Quente" automaticamente quando passa do threshold.
- **U5.** Como Clara, quero ver no perfil de cada Pessoa o histórico cronológico de tudo que ela fez (timeline de activities).
- **U6.** Como Clara, quero ver as próximas reuniões agendadas no Cal.com associadas a cada Lead direto na ficha dele.
- **U7.** Como Clara, quero buscar Pessoas e Empresas por nome, email, ou empresa (busca rápida tipo Cmd+K).
- **U8.** Como Clara, quero migrar todos os dados que tenho hoje no Folk pro novo CRM sem perder histórico.

## 7. Decisões de arquitetura

### 7.1 Storage

**Vercel Postgres (powered by Neon).** Free tier de 256MB cobre escala da Boldfy por anos (CRM com ~10k pessoas e 5k empresas ocupa <50MB). Free tier vem com 100h/mês de compute, suficiente. Mesma conta Vercel já em uso.

**Por que não Firestore (GCP):** NoSQL fica ruim pra joins Person↔Company. CRM é caso clássico de dado relacional.
**Por que não Cloud SQL (GCP):** sem free tier de produção (~US$10/mês mínimo). Vercel Postgres mais barato e melhor integrado ao stack atual.

### 7.2 Conexão e ORM

**Drizzle ORM** — type-safe, performático, footprint pequeno, funciona bem com Vercel Postgres edge runtime. Alternativa considerada: Prisma (mais features, mais bundle, problemas conhecidos em edge).

### 7.3 Renderização

Server Components do Next 16 pra views pesadas (kanbans, listas), Client Components pra interações (drag-drop, formulários, busca). Optimistic updates no kanban pra UX fluida (UI atualiza antes da resposta da API).

### 7.4 Auth

Reusa o mesmo middleware do dashboard (cookie `dashboard_session`). Sem login separado.

### 7.5 Sync com ActiveCampaign

**Bidirecional, mas com fonte de verdade clara:**

- **AC → Nosso CRM (read):** quando lead novo entra via form, server action escreve em ambos (já é assim hoje, vamos só adicionar nosso DB ao destino).
- **Nosso CRM → AC (write):** quando mudança de status acontece no CRM, chamamos AC API pra adicionar/remover tag. Tag dispara automation no AC (email, lista, etc).

Conflito de fonte de verdade resolvido por: **dados de pessoa/empresa vivem no nosso DB. AC tem cópia denormalizada pra trigar automations, mas qualquer edit acontece no nosso CRM, nunca direto no AC.**

### 7.6 Resiliência

Operações de write são atômicas via transactions. Sync com AC é assíncrono e tem retry queue (se AC API falha, tenta de novo em 1, 5, 30 min). UI nunca trava esperando AC.

## 8. Data model (Postgres schema)

### 8.1 Tabela `people`

```sql
CREATE TABLE people (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  email           TEXT UNIQUE NOT NULL,
  phone           TEXT,
  linkedin_url    TEXT UNIQUE,
  photo_url       TEXT,                       -- vem do LinkedIn (extensão); fallback = iniciais coloridas
  job_title       TEXT,                       -- cargo (do form OU parsed do headline LinkedIn); pode ser NULL
  headline        TEXT,                       -- raw do LinkedIn ("CMO at Nuvini") — backup/referência
  location        TEXT,                       -- "São Paulo, Brasil"
  company_id      UUID REFERENCES companies(id),
  status          TEXT NOT NULL CHECK (status IN ('Ativo', 'Lead', 'Quente')),
  lead_score      INTEGER NOT NULL DEFAULT 0,

  -- Origem do lead (dois níveis)
  source_channel  TEXT,        -- canal: 'linkedin' | 'organic' | 'direct' | 'email' | 'indicacao' | 'manual'
  source_page     TEXT,        -- página específica: '/agendar-demo' | '/beta-test' | '/materiais' | etc
  source_method   TEXT,        -- como entrou: 'form_demo' | 'form_beta' | 'form_report' | 'form_proposta' | 'extension_linkedin' | 'manual'

  -- First touch attribution
  first_touch_at  TIMESTAMPTZ,
  first_touch_source TEXT,    -- utm_source_first (mesmo que source_channel, mas immutable)
  first_touch_campaign TEXT,  -- utm_campaign_first

  last_touch_at   TIMESTAMPTZ,
  ac_contact_id   TEXT,       -- ID no ActiveCampaign pra sync
  ac_tags         TEXT[],     -- array de tags do AC denormalizado (pra busca rápida)
  internal_notes  TEXT,       -- notas livres da Clara
  archived        BOOLEAN NOT NULL DEFAULT FALSE,
  merged_into_id  UUID REFERENCES people(id), -- se foi mergeado em outro, aponta pro principal
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_people_status ON people(status) WHERE archived = FALSE AND merged_into_id IS NULL;
CREATE INDEX idx_people_company ON people(company_id);
CREATE INDEX idx_people_score ON people(lead_score DESC) WHERE archived = FALSE AND merged_into_id IS NULL;
CREATE INDEX idx_people_source ON people(source_channel, source_page);
CREATE INDEX idx_people_search ON people USING GIN (to_tsvector('portuguese', name || ' ' || email || ' ' || COALESCE(job_title, '') || ' ' || COALESCE(headline, '')));
```

**Campos importantes (desenho do zero, não copia do Folk):**

- `job_title` e `company_id` **separados** — porque vêm separados dos formulários. Tem caso onde lead chega com empresa mas sem cargo (ex: chegou só por blog post + form de Report) — cargo fica NULL até a gente enriquecer via extensão LinkedIn.
- `headline` é **raw do LinkedIn** ("CMO at Nuvini") — fica como backup quando parsing falha (ex: "Senior Director, Marketing & Growth at Nuvini, Inc.").
- `source_channel` / `source_page` / `source_method` — 3 dimensões de origem que viram **3 tags visuais** no card:
  - Channel: de onde veio (linkedin/organic/etc) — pill colorida
  - Method: como entrou (form demo / extensão LinkedIn / manual) — badge "via X" no topo
  - Page: qual página converteu (/agendar-demo, /materiais) — pill pequena
- `ac_tags` denormalizado pra busca rápida (kanban filter "tem tag X") sem chamar AC API.
- `merged_into_id` — quando lead A é mergeado em lead B, lead A não é deletado, só marcado como `merged_into_id = B.id`. Permite auditoria + recuperação.

**Campos NÃO incluídos** (vem por outras vias):

- `cargo` agora é `job_title` (separado de `headline`)
- `setor` — vem da Company linkada
- `colaboradores` / `porte` — vem da Company linkada
- `objetivo_principal`, `como_conheceu` — info de form, vive em `activities` com a data do submit (não atrapalha view do CRM)

### 8.2 Tabela `companies`

```sql
CREATE TABLE companies (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  industry        TEXT,        -- "Saúde", "Fintech", etc
  size            TEXT,        -- "11-50", "51-200", etc
  website         TEXT,
  linkedin_url    TEXT,
  status          TEXT NOT NULL CHECK (status IN (
    'No status', 'Quero prospectar', 'Reunião marcada',
    'Em andamento', 'Fechado', 'Perdido'
  )),
  estimated_value DECIMAL(10, 2),  -- valor estimado do deal (opcional)
  next_action_at  TIMESTAMPTZ,     -- próximo passo (opcional, manual)
  next_action     TEXT,            -- descrição do próximo passo
  first_touch_at  TIMESTAMPTZ,
  first_touch_source TEXT,
  first_touch_campaign TEXT,
  internal_notes  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_companies_status ON companies(status);
CREATE INDEX idx_companies_next_action ON companies(next_action_at) WHERE next_action_at IS NOT NULL;
CREATE UNIQUE INDEX idx_companies_name ON companies(LOWER(name));
```

### 8.3 Tabela `activities` (event log)

```sql
CREATE TABLE activities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id   UUID REFERENCES people(id) ON DELETE CASCADE,
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,  -- ver lista abaixo
  weight      INTEGER NOT NULL DEFAULT 0,  -- pontos somados ao lead_score
  source      TEXT,           -- 'web' / 'email' / 'cal' / 'linkedin' / 'manual'
  data        JSONB,          -- payload livre (ex: { page: '/precos', referrer: '...' })
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activities_person ON activities(person_id, created_at DESC);
CREATE INDEX idx_activities_company ON activities(company_id, created_at DESC);
CREATE INDEX idx_activities_type ON activities(type, created_at DESC);
```

**Tipos de activity:**

```
# Automáticos (vem de webhooks / tracking)
'page_view'             — visitou página do site
'form_submit'           — submeteu form (data.form_type: 'demo' | 'beta' | ...)
'material_download'     — baixou report/material
'email_open'            — abriu email AC (webhook AC)
'email_click'           — clicou link em email AC
'cal_scheduled'         — agendou no Cal.com
'cal_attended'          — reuniu
'cal_noshow'            — não compareceu
'cal_cancelled'         — cancelou
'status_change'         — mudança de status (sistema)
'tag_added'             — tag adicionada (sync from AC)
'extension_save'        — salvo via extensão Chrome do LinkedIn

# Manuais (Clara loga pelo CRM)
'manual_interaction'    — interação manual com sub-tipo em data.subtype:
                          'linkedin_message'  → Clara mandou DM no LinkedIn
                          'linkedin_engagement' → Lead engajou em post Boldfy (Clara viu e logou)
                          'whatsapp'          → conversa por WhatsApp
                          'email_manual'      → email manual (fora do AC)
                          'phone_call'        → ligação telefônica
                          'meeting_extra'     → reunião fora do Cal.com (café, evento, etc)
                          'other'             → outro tipo
                          + obrigatório campo data.observation com texto livre
'manual_note'           — nota livre sem categoria (não conta lead score)
```

### 8.4 Tabela `meetings` (Cal.com)

```sql
CREATE TABLE meetings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id     UUID REFERENCES people(id) ON DELETE CASCADE,
  cal_event_id  TEXT UNIQUE,  -- ID vindo do Cal.com
  title         TEXT NOT NULL,
  scheduled_at  TIMESTAMPTZ NOT NULL,
  duration_min  INTEGER NOT NULL DEFAULT 30,
  meeting_url   TEXT,         -- link Google Meet / Zoom / etc
  status        TEXT NOT NULL CHECK (status IN ('scheduled', 'attended', 'noshow', 'cancelled')),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_meetings_person ON meetings(person_id, scheduled_at DESC);
CREATE INDEX idx_meetings_upcoming ON meetings(scheduled_at) WHERE status = 'scheduled' AND scheduled_at > NOW();
```

### 8.5 Tabela `extension_tokens` (auth da extensão Chrome)

```sql
CREATE TABLE extension_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash  TEXT UNIQUE NOT NULL,  -- bcrypt do token; nunca armazena plain text
  label       TEXT,                  -- "Chrome Clara MacBook"
  last_used_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at  TIMESTAMPTZ
);
```

## 9. Funcionalidades do CRM

### 9.1 Kanban de Pessoas

3 colunas: Ativo / Lead / Quente. Cards mostram (estrutura visual da v1):

**Topo do card:**
- Badge "via {origem}" pequeno (ex: "via LinkedIn", "via Form Demo", "via Manual") — sinaliza método de entrada e ajuda identificar leads pra merge

**Header:**
- Avatar (foto LinkedIn quando tem, fallback = iniciais coloridas) — 36px
- Nome (negrito) + Cargo (job_title · Empresa abaixo, se preenchido)
- **Score badge** no canto superior direito — pill compacto com número e cor por tier (cinza/azul/âmbar)

**Middle:**
- Última ação em destaque (ex: "💬 WhatsApp · 12 min") — visual proeminente, fica em background sutil

**Bottom (2 tags de origem):**
- Tag 1: **canal de origem** (LinkedIn / Organic / Direct / Email / Indicação) — colorida por canal
- Tag 2: **página/método de conversão** (/agendar-demo, /materiais, /beta-test ou "via extensão" se veio da Chrome)

**Ícones contextuais** (canto, opcionais):
- 📅 se tem reunião agendada nos próximos 7 dias
- 🔥 se score subiu >20 nos últimos 3 dias (lead esquentando)
- ⚠️ se sem atividade há 14+ dias

**Interações:**
- Click no card → abre Lead Detail completo (página `/internal/crm/people/[id]`)
- Drag-drop entre colunas → atualiza status + dispara `status_change` activity + sync com AC (tag automático)
- Long press / menu de 3 pontos → opções rápidas: Editar, Mesclar com..., Arquivar

**Filtros disponíveis:**
- Por canal de origem (LinkedIn, Organic, etc)
- Por empresa
- Por lead score range (0-20 / 21-50 / 51+)
- Por tem-reunião-agendada
- Por sem-atividade-N-dias
- Por tag AC específica
- Por método de entrada (via extensão / via form / manual)

### 9.2 Kanban de Empresas

6 colunas: No status / Quero prospectar / Reunião marcada / Em andamento / Fechado / Perdido.

Cards mostram:

- Nome + indústria
- Quantidade de pessoas linkadas (ex: "3 contatos")
- Lead score agregado (max dos people)
- Estimated value (se preenchido)
- Próxima ação + data (se preenchida)
- Ícone de alerta se parada > 14 dias sem mudança

Drag-drop entre colunas com confirmação pra mudanças irreversíveis (Fechado / Perdido).

### 9.3 Lista alternativa (table view)

Tab pra alternar com kanban. Tabela com sort por qualquer coluna, filter, busca, paginação. Útil pra ações em lote (selecionar N, adicionar tag, exportar CSV).

### 9.4 Lead detail (perfil completo)

Click em card abre página `/internal/crm/people/[id]` com:

- Header: foto, nome, headline, links (LinkedIn, email, phone, company)
- Status atual + lead score + tier (Ativo/Lead/Quente)
- Timeline cronológica de activities (com ícones por tipo, observações visíveis inline, scroll infinito)
- Próximas reuniões agendadas (Cal.com)
- Botões: editar, mover de status, **+ Log interação manual** (ver 9.7), adicionar nota, arquivar
- Tags do AC (read-only, sincronizadas)
- Histórico de mudanças de status (sub-timeline)

Equivalente pra Company em `/internal/crm/companies/[id]`.

### 9.5 Busca rápida (Cmd+K)

Modal global ativado por Cmd+K (Mac) ou Ctrl+K (Win). Busca em tempo real:

- Pessoas por nome, email, headline
- Empresas por nome, website, indústria
- Atalhos: "Lead score > 50", "Reunião amanhã", "Sem atividade há 7 dias"

Resultado abre direto o lead detail.

### 9.6 Activity feed global

Página `/internal/crm/feed` com timeline cronológica de todas as activities do CRM. Filtros por tipo, pessoa, empresa, período. Útil pra revisar "o que rolou hoje".

### 9.8 Merge de duplicatas (manual + auto-suggest)

**O problema:** mesma pessoa pode chegar no CRM por dois caminhos diferentes — preencheu form Demo há 3 semanas (entrou com nome+email+empresa, sem foto, sem LinkedIn URL), e agora Clara abre o perfil dela no LinkedIn e clica em "Salvar via extensão" (cria novo lead com nome+headline+foto+LinkedIn URL). Sem merge, viram 2 leads duplicados.

**Detecção automática de duplicatas (na hora de salvar):**

Quando extensão tenta salvar nova Pessoa, backend roda dedupe checks em ordem:

1. **Match exato** por `linkedin_url` → atualiza Person existente (não cria nova), enriquece campos vazios (ex: adiciona foto se não tinha).
2. **Match exato** por `email` (se a extensão conseguiu capturar) → mesma coisa.
3. **Match aproximado** por `name` + `company.name` (case-insensitive, normalizado):
   - Se acha 1 candidato → cria Person nova MAS dispara notificação na UI: "Possível duplicata: João Silva da Nuvini já existe. [Ver] [Mesclar agora]"
   - Se acha múltiplos → cria nova + lista todos na UI pra Clara escolher
   - Se não acha nada → cria nova normalmente

**Merge manual (Clara inicia):**

UI: na página `/internal/crm/people`, botão "Selecionar pra mesclar" (modo seleção). Clara clica em 2-N cards → toolbar aparece: "2 selecionados [Mesclar]".

Modal de merge:
- Mostra side-by-side os campos de cada Person
- Pra cada campo conflitante (ex: email1 vs email2, headline diferente), Clara escolhe qual mantém (radio button por campo)
- Campos não conflitantes (um tem, outro não) → merge automático
- Activities, meetings, tags → **sempre acumulam** (não conflita, junta tudo)
- Lead score → recalculado do zero somando todas as activities
- Status final = mais avançado dos dois (ex: Lead + Quente = Quente)
- Notes → concatenadas com separador

Botão "Mesclar" → cria activity `merge` em ambas, marca uma como `merged_into_id = outra.id`, redireciona pra Person principal.

**Rollback:** se Clara perceber que mergeou errado, botão "Desfazer merge" disponível por 24h (cria activity reverse, restaura).

### 9.9 Tag manager AC bidirecional

UI no Lead Detail e Company Detail, seção "Tags ActiveCampaign":

- Lista de tags atuais da Person no AC (sincronizada de hora em hora + on-demand refresh button)
- Cada tag = chip com nome + X pequeno pra remover
- Campo de input com autocomplete → puxa todas as tags disponíveis no AC (cached na nossa DB) → click pra adicionar
- Remoção/adição **escreve imediatamente no AC** via API call assíncrona (retry queue se falhar)
- Tag adicionada → dispara automation no AC que tava esperando essa tag (cadência de outreach, lista, email)

**Exemplo do workflow Clara:**

1. Clara abre Lead Detail de Renata Oliveira (Nuvini).
2. Quer começar cadência de outreach pós-demo.
3. Click no tag manager → digita "Cadência" → autocomplete sugere "Cadência: Pós-demo D+3"
4. Click → tag aparece como chip + sincroniza no AC em 1-2s
5. AC tem automation: "se tag 'Cadência: Pós-demo D+3' adicionada → enviar email 1 da sequência em 3 dias"
6. Funciona idem se Clara remover a tag.

**Sync inversa (AC → CRM):** quando AC adiciona tag automaticamente (ex: lead abriu 5 emails → tag "Engajada" auto), nosso CRM puxa via webhook e atualiza `ac_tags` denormalizado pra busca rápida.



Botão "+ Log interação" no lead detail (e na ação rápida do kanban). Click abre modal compacto:

- **Tipo:** dropdown com pré-definidos (LinkedIn message, LinkedIn engagement, WhatsApp, Email manual, Ligação, Reunião extra, Outro)
- **Observação:** textarea (obrigatório, máx 2000 chars). Placeholder muda conforme tipo:
  - LinkedIn message: "Sobre o que você falou?"
  - Reunião extra: "Resumo da conversa, próximos passos..."
  - etc
- **Data/hora:** default = agora, editável (pra logar interação retroativa)
- **Salvar** → cria activity tipo `manual_interaction` com `data.subtype` + `data.observation` + weight automático conforme tabela 10.1.

Pós-save: aparece na timeline com ícone do tipo, observação visível inline, lead score atualiza em real-time.

**Atalho via extensão Chrome:** estando no perfil LinkedIn do lead, click direito no botão da extensão abre menu rápido pra logar interação (LinkedIn message, LinkedIn engagement) sem precisar abrir o CRM. Mesma activity cai no histórico.

## 10. Lead score engine

### 10.1 Eventos com pesos

**Web behavior (vindo do GA4 → webhook):**

| Evento | Peso | Cap |
|---|---|---|
| Page view (qualquer página) | +1 | 20 |
| View `/precos` | +5 | sem cap |
| View `/solucoes/*` | +3 | 15 |
| View `/agendar-demo` (sem submit) | +5 | sem cap |
| Read blog post (>30s na página) | +2 | 20 |
| Tempo total no site >5 min em 1 sessão | +5 | sem cap |
| Returned visit (2ª+ sessão) | +5 | sem cap |
| Returned visit 5+ dias | +10 | sem cap |

**Forms / Materiais:**

| Evento | Peso |
|---|---|
| Submit Report | +10 |
| Submit Beta | +25 |
| Submit Demo | +50 |
| Submit Proposta | +50 |
| Download material adicional | +5 |

**Email (vindo de webhook AC):**

| Evento | Peso | Cap |
|---|---|---|
| Email aberto | +1 | 10 |
| Email clicado | +3 | 15 |
| Reply manual | +20 | sem cap |

**Cal.com:**

| Evento | Peso |
|---|---|
| Demo agendada | +30 |
| Demo attended | +30 |
| Demo no-show | -10 |
| Re-agendou no-show | +5 |

**Interações manuais (Clara loga pelo CRM via botão "+ Log interação"):**

| Sub-tipo | Peso | Quando usar |
|---|---|---|
| `linkedin_message` | +10 | Clara mandou DM/mensagem no LinkedIn pro lead |
| `linkedin_engagement` | +5 | Lead curtiu/comentou em post da Boldfy ou da Clara (Clara viu e loga) |
| `whatsapp` | +15 | Conversa por WhatsApp |
| `email_manual` | +20 | Email manual fora do AC (resposta direta, follow-up pessoal) |
| `phone_call` | +20 | Ligação telefônica |
| `meeting_extra` | +25 | Reunião fora do Cal.com (café, evento, encontro casual) |
| `other` | +5 | Outro tipo de interação |

Cada log obriga campo `observation` (texto livre, máx 2000 chars) — vira nota no histórico do lead. Clara pode editar a observação depois.

**Por que sem engajamento automático no LinkedIn:** LinkedIn não tem API pública pra detectar quem curtiu, comentou ou interagiu com posts. Sales Navigator pago tem algo limitado mas frágil. Solução: Clara loga manualmente o que percebe (~30 seg por log via botão rápido). A extensão Chrome facilita: estando no perfil do lead, dois cliques pra registrar interação.

### 10.2 Promoção automática de status

Quando `lead_score` cruza threshold, status é promovido automaticamente:

- 0-20 → Ativo
- 21-50 → Lead
- 51+ → Quente

**Demotion não acontece automático** — uma vez "Quente", só Clara move de volta manual (evita yo-yo de status conforme score flutua).

### 10.3 Decay

A cada 7 dias sem nenhuma activity, `lead_score` perde 1 ponto (mas mínimo 0). Roda em cron job diário.

### 10.4 Calibração pós-launch

Os pesos são chutes iniciais. Plano: depois de 30 dias de dados, comparar score com resultados reais (quem virou cliente teve qual score?) e ajustar. Implementar com env var `LEAD_SCORE_VERSION=v1` pra permitir A/B se quisermos.

## 11. Integração Cal.com

**Read-only.** Webhook `/api/webhooks/cal/route.ts` já existe; vamos estender pra escrever na tabela `meetings`. Quando webhook chega:

1. Identifica `person_id` por email (cria Person se não existe).
2. Cria/atualiza row em `meetings`.
3. Cria activity `cal_scheduled` ou `cal_cancelled`.
4. Se for nova reunião marcada de B2B, status da Company sobe pra "Reunião marcada" (se ainda não estiver mais avançado).

Display no CRM: cada lead detail mostra "Próximas reuniões" em card no topo. Click abre o link da reunião (Google Meet/Zoom). Status manual pós-reunião (attended/noshow) — Clara marca no card.

## 12. Integração ActiveCampaign (bidirecional)

### 12.1 AC → Nosso CRM (input)

Cada vez que form submit acontece (server actions atuais), além de escrever no AC, **também escreve no nosso DB**. É só extender as funções `sendBetaLeadToNotion`, `sendDemoLeadToNotion`, etc, pra fazer dupla escrita.

Webhooks de AC pra registrar email_open, email_click — adicionar handler em `/api/webhooks/ac/route.ts` (não existe ainda) que cria activities.

### 12.2 Nosso CRM → AC (output)

Quando Clara muda status de Person ou Company:

- Person `Ativo → Lead`: adiciona tag `Status: Lead` no AC.
- Person `Lead → Quente`: adiciona tag `Status: Quente` no AC. Dispara automation "Sequência de prospecção".
- Company `* → Fechado`: adiciona tag `Cliente: True` no AC.
- Etc.

Tags são configuradas no AC pra triggar as automations apropriadas (já existe SOP em `docs/SOP-activecampaign-demo-automations.md`).

### 12.3 Retry queue

Chamadas pro AC vão pra fila assíncrona (Vercel KV). Se AC falha, retry em 1, 5, 30 min, depois marca como falha permanente e alerta no dashboard. UI nunca espera AC.

## 13. Extensão Chrome (MVP)

### 13.1 Comportamento

Usuária abre `linkedin.com/in/qualquer-pessoa`. Extensão injeta um botão flutuante no canto superior direito do perfil: "Salvar no Boldfy CRM" com logo Boldfy.

**One-click flow:**

1. Click → extensão faz scraping do DOM da página:
   - Nome completo
   - Headline raw (ex: "CMO at Nuvini")
   - Job title parseado (ex: "CMO") — tenta extrair antes do "at/na/@"
   - Foto de perfil (URL da imagem do CDN do LinkedIn — salva no nosso DB como `photo_url`)
   - URL do perfil canonical (`linkedin.com/in/slug`)
   - Location
   - Empresa atual (parsing do headline ou seção Experience)
2. POST pra `/api/extension/save` com o payload e token de auth.
3. Backend (ver seção 9.8 pra dedupe completo):
   - Match por `linkedin_url` → enriquece Person existente (adiciona foto, atualiza job_title se vazio, etc), retorna "já existia, enriqueci".
   - Match por `email` (se capturável) → mesmo comportamento.
   - Match aproximado por `name` + `company.name` → cria nova MAS retorna flag `possible_duplicate` com link da Person similar.
   - Sem match → cria Person nova (status=Lead, score=0, source_method='extension_linkedin'). Detecta Company pelo headline, cria/linka.
   - Registra activity `extension_save`.
   - Retorna sucesso + link pra ver no CRM + flag de duplicate se aplicável.
4. Extensão mostra toast:
   - Caso normal: "✓ Salvo como Lead [Ver no CRM]"
   - Já existia: "✓ Enriquecido (já tinha esse lead) [Ver no CRM]"
   - Possível duplicata: "⚠ Salvo, mas talvez seja duplicata de João Silva [Ver pra mesclar]"

### 13.2 Foto do lead

**Fonte primária:** scraping da foto do perfil do LinkedIn quando salvo via extensão. URL da imagem do CDN do LinkedIn vai pro campo `photo_url`.

**Fallback:** quando lead não tem `photo_url` (chegou só por form, sem extensão), CRM renderiza **iniciais coloridas em background gradient** baseado no nome (primeira letra do nome + primeira do sobrenome). Cor do gradient é determinística por hash do email (mesmo lead sempre vê mesma cor).

**Decisão:** sem Gravatar, Clearbit ou serviços externos pagos. Foto LinkedIn é "free quando temos" + iniciais é zero-custo, zero-dependência, sempre funciona.



### 13.2 Auth flow

1. Primeira vez que usuária clica no ícone da extensão na toolbar, popup pede "Conectar conta Boldfy".
2. Click → abre nova aba `/internal/crm/extension-auth`.
3. Página requer login normal (cookie de sessão). Se já logada, mostra botão "Gerar token pra extensão".
4. Click → backend cria row em `extension_tokens` (token = `crypto.randomUUID()`, armazena `bcrypt(token)` no DB). Mostra token na tela: "Copia esse token e cola na extensão. Mostrado uma única vez."
5. Usuária copia, volta pra popup da extensão, cola, clica "Salvar".
6. Token vai pra `chrome.storage.local` e é usado em todas as requests.

### 13.3 Distribuição

**Sprint 3 — Sideload:** geramos `.crx` (extensão empacotada). Clara baixa e arrasta no `chrome://extensions` com "Developer mode" ligado. Funciona só pra ela, sem review.

**Sprint 4 — Chrome Web Store:** submeter pra publicação. Review do Google leva 1-3 dias. Pré-requisito: pagar US$ 5 one-time fee da Web Store. Após aprovação, qualquer um (futuros membros da Boldfy) instala normal.

### 13.4 Riscos

- **LinkedIn muda DOM** e quebra o scraping. Mitigação: monitor + atualizar selector dentro de 24h. Testar selectors com data attributes resilientes quando possível.
- **Bot detection do LinkedIn** se uso excessivo. Mitigação: limit ao client side (max 50 saves/dia + rate limiter). Comportamento simula uso humano (uma extensão de produtividade comum).
- **Token vaza** — usuária aparece com perfis salvos que ela não salvou. Mitigação: tela `/internal/crm/extension-auth` lista tokens ativos com botão "Revogar". Audit log de saves.

## 14. Migração do Folk

Sprint 4. Script `scripts/migrate-folk-to-crm.ts` que:

1. Lê todos os Persons do Folk via API (paginado).
2. Lê todos as Companies do Folk via API.
3. Mapeia campos Folk → schema nosso (alguns campos perdem 1-pra-1, mas o essencial fica).
4. Resolve Person → Company linking (já existe `companies` field no Folk).
5. Cria activity sintética `folk_migration` pra cada Person com `data: { folk_id, migrated_at }`.
6. Marca env var `CRM_MIGRATED=true` — bloco Funil do dashboard passa a ler do nosso DB.
7. Período de coexistência de 14 dias: novos leads escrevem em ambos (CRM + Folk) pra a gente verificar se nada quebrou.
8. Após 14 dias sem incidente, remove código de write pro Folk, desativa subscription.

Rollback plan: se algo quebrar nos primeiros 14 dias, é só virar env var `CRM_MIGRATED=false` e voltar a ler do Folk.

## 15. Timeline (4 sprints, 5-6 semanas)

| Sprint | Datas | Foco |
|---|---|---|
| 1 | 15–25 mai (10 dias) | Foundation: Postgres + Drizzle schema + migrations + auth scaffold + AC dual-write + investigação do bug Folk |
| 2 | 25 mai–3 jun (9 dias) | CRM core: kanban Pessoas + kanban Empresas + lead detail + activity log + lead score engine v1 + Cmd+K busca |
| 3 | 3–13 jun (10 dias) | **Web Summit acontece dia 8 nesse sprint.** Extensão Chrome MVP (sideload) + dashboard analytics (Tráfego, Forms, LinkedIn, etc) + view Web Summit. Clara chega na feira com tudo funcionando. |
| 4 | 13 jun–4 jul (~3 sem) | Polish + Cal.com webhook deep + AC bidirecional retry queue + migração Folk → DB (14d coexistência) + Chrome Web Store + cancelar Folk |

**Trade-off explícito:** durante o Web Summit (Sprint 3), Folk e nosso CRM coexistem. Você usa o nosso pra logar novos leads via extensão, e o Folk fica como histórico de referência. Migração formal só pós-feira pra evitar pressão.

## 16. Custos

| Item | Hoje | Pós-projeto |
|---|---|---|
| ActiveCampaign | já paga | já paga |
| Folk | US$ 40/mês | US$ 0 (cancelado em ago/26) |
| Vercel Postgres | — | US$ 0 (free tier 256MB) |
| Vercel KV (já em uso) | já paga | já paga |
| Chrome Web Store fee | — | US$ 5 (one-time) |
| **Total novo** | US$ 40/mês | US$ 0/mês |
| **Economia anual** | — | **~US$ 480** |

## 17. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Extensão quebrar por mudança no DOM do LinkedIn | Média | Alto | Monitor automatizado de scraping; selectors com fallbacks |
| Lead score automático com pesos errados gerando ruído | Alta | Médio | v1 são chutes; reajustar com dados reais em 30 dias |
| Migração do Folk perder dados | Baixa | Alto | Período de coexistência 14d + rollback via env var + backup do Folk antes |
| AC API mudar e quebrar sync bidirecional | Baixa | Médio | Retry queue + alerta no dashboard quando fila acumula |
| Vercel Postgres free tier estourar (256MB) | Baixa | Baixo | Monitor + upgrade pra pago é trivial (US$ 20/mês) |
| Clara não adotar extensão (continua adicionando manual) | Média | Médio | UX da extensão tem que ser MUITO boa; sucesso = M3 (≥ 80% adoção) |
| Próximas 5-6 semanas têm interrupção real | Alta | Médio | Foundation é maior risco (Sprint 1-2); se atrasar, Sprint 3 entrega pelo menos dashboard pro Web Summit |

## 18. Open questions

- ~~**OQ1.** "Inglaterra" = "LinkedIn".~~ **Resolvido:** confirmado por contexto.
- **OQ2.** Thresholds de lead score (0-20 Ativo, 21-50 Lead, 51+ Quente) fazem sentido ou ajustar? Pode ficar pra v2 com dados reais.
- **OQ3.** Estimated value de Company é manual ou queremos algum cálculo (ex: porte × tipo de plano)? Por hora, manual.
- **OQ4.** Como tratar Person que muda de empresa? Mantém histórico (cria nova company link, arquiva antiga) ou só edita? Por hora: edita (sobreescreve).
- **OQ5.** Privacidade/LGPD: armazenar foto e dados de LinkedIn — qual é a posição? Olhar termos do LinkedIn sobre scraping pra uso interno (uso pessoal pra CRM é OK; redistribuição não).
- **OQ6.** Backup/export: queremos botão "exportar CRM como CSV" desde a v1? Útil pra paz de espírito.
- **OQ7.** Quer preview HTML do CRM antes de eu codar (similar ao dashboard-preview.html)? Ajuda a validar UX dos kanbans, lead detail e log manual de interação antes de implementar.

## 19. Changelog

- **2026-05-15** — Versão inicial. Decisões principais: Vercel Postgres + Drizzle ORM, kanbans separados Person/Company, lead score event-based com promoção automática (sem demotion), extensão Chrome MVP em sideload pra Web Summit, AC bidirecional com retry queue, Folk substituído completamente (migração em Sprint 4). Web Summit entra durante Sprint 3 — CRM + dashboard funcionais, migração formal pós-feira.
- **2026-05-15 (update)** — Refinamento de activities e lead score após validação com Clara: log manual de interação como cidadão de primeira classe (seção 9.7), com 7 sub-tipos (LinkedIn message, LinkedIn engagement, WhatsApp, Email manual, Ligação, Reunião extra, Outro) e campo `observation` obrigatório. Removida tentativa de detecção automática de engajamento LinkedIn (API não permite). Timeline unifica touchpoints automáticos do site + interações manuais loggadas — ambos somam no mesmo lead score, ambos aparecem no mesmo histórico.
- **2026-05-15 (update 2)** — Reorganização inspirada no Folk após Clara apontar features ausentes. Schema: separados `job_title` e `company_id` (antes era um campo `headline` combinado) porque os forms já dão separado e tem caso onde só temos um. Card design: score vira badge pequeno top-right (não barra), 2 tags de origem embaixo (canal + página), badge "via X" no topo pra identificar método de entrada. Novas seções 9.8 (merge manual + auto-suggest de duplicatas) e 9.9 (tag manager AC bidirecional). Confirmada captura de foto via extensão LinkedIn + fallback de iniciais coloridas (sem Gravatar/Clearbit). View unificada com switcher top-level CRM | Dashboard no /internal/.
- **2026-05-16** — Gate B2B explícito (NG7). CRM = só leads B2B qualificados; profissionais individuais e agências ficam só no AC. Aplicado em: `report-leads.ts` (só importa se `intencaoUso === 'marca-empresa'`), `import-from-ac` (só pega contatos com tag `Segmento: Líderes B2B`). Forms Demo/Beta/Proposta continuam sem gate (já são 100% B2B por design).
