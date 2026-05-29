# Checklist — Criar form novo com cadência de email

Toda vez que criar um form novo que dispara uma cadência (entrega de material rico + nurture), seguir este checklist. Garante que CRM, AC, código e source-of-truth ficam alinhados.

> **Inspirado nos forms já existentes:** `algoritmo-linkedin`, `case-semrush`, `playbook-employee-led-growth`. Espelhar a estrutura deles quando faz sentido.

---

## 1. Setup no ActiveCampaign (UI manual)

### 1.1 Tags pra criar

Cada form precisa de pelo menos **3 tags** no AC:

- [ ] **Tag de tipo de lead** — `Líder B2B` *(provavelmente já existe)*
- [ ] **Tag-mãe do form** — `Form: <Nome do form>` *(ex: `Form: Playbook Employee-Led Growth`)*
- [ ] **Tag de conclusão da cadência** — `Cadência: <Nome curto> concluída` *(ex: `Cadência: Playbook ELG concluída`)*

Se o form aceita opt-in de newsletter, adiciona também:

- [ ] **Tag Newsletter** — `Newsletter` *(provavelmente já existe)*

### 1.2 Listas pra criar

- [ ] **Lista de cadência** — `[Cadência] <Nome curto>` *(ex: `[Cadência] Playbook ELG`)*
- [ ] Se houver opt-in editorial extra (tipo Panorama ELG), também a lista correspondente

### 1.3 Custom fields pra criar

Conferir se já existem (forms novos costumam reutilizar campos antigos):

- [ ] `tipo_de_lead` *(já existe)*
- [ ] `empresa`, `porte`, `cargo_senioridade`, `cargo_area` *(já existem)*
- [ ] `utm_source_first`, `utm_medium_first`, `utm_campaign_first` *(já existem)*
- [ ] **Campos específicos do form novo** *(criar conforme spec do form)*

### 1.4 Automation da cadência

Estrutura padrão:

1. **Trigger:** `Subscribes to list [Cadência] <Nome>`
2. **Email 1, Email 2, Email N** com waits entre eles
3. **Penúltimo passo:** `Add tag` → `Cadência: <Nome curto> concluída`
4. **Último passo:** `Unsubscribe from list [Cadência] <Nome>`

Sem automation tag→lista no início (código já adiciona direto via `buildAcListNames`).

---

## 2. Código — boldfy-site

### 2.1 Form definitions e adapter

- [ ] **`src/lib/form-definitions.ts`** — adicionar entrada no `FORM_DEFS_SEED`:
  - `slug`, `name`, `kind`, `acTag`, `acListName`
  - Adicionar slug em `FormSlug` (union type)
  - Adicionar mapping em `SLUG_TO_SOURCE_METHOD` e `formSlugToActivityType`

- [ ] **`src/app/actions/_schemas.ts`** — criar Zod schema `<NomeDoForm>LeadSchema`

- [ ] **`src/lib/form-adapters/<slug>.ts`** — criar adapter retornando `ClassifiedLead`
  - Popular `acFields`, `activityData`, `acTags`, `extraAcListNames` (se aplicável)
  - Setar `formSlug`, `sourceMethod`, `segment`, `firstTouch*`, `lastTouch*`

- [ ] **`src/app/actions/<slug>-leads.ts`** — server action
  - Valida via Zod schema
  - Chama adapter → `recordLeadFromForm`
  - Retorna `{ success, ...payload }` pro client

- [ ] **`src/db/migrations/...`** — se schema do DB mudar:
  - Adicionar enum value ao `sourceMethodEnum` (`form_<slug>`)
  - Rodar migration via Chrome MCP no Neon SQL editor

### 2.2 Mapeamento AC ↔ CRM

- [ ] **`src/lib/ac-tag-mapping.ts`** — adicionar entrada em `AC_TAG_TO_AUTOMATION`:
  ```ts
  'Form: <Nome do form>': 'Cadência <Nome curto>',
  ```
  Esse mapa controla o nome legível que aparece na timeline quando a pessoa **entra** na cadência.

  *Não precisa adicionar nada pra a tag `Concluiu: X` — o webhook detecta o prefixo automaticamente.*

### 2.3 UI da landing page

- [ ] Criar página em `src/app/(lp)/<slug>/page.tsx` ou `src/app/ferramentas/<slug>/page.tsx`
- [ ] Componente client com form que chama a server action
- [ ] Tracking: `useUtmParams()`, `captureSubmissionMeta()`, `trackEvent('form_submit_*')`
- [ ] Honeypot field (`name="website"`) hidden via CSS

### 2.4 LP/cadência: UTMs consistentes

Todo link interno da cadência (CTAs nos emails, signature card) deve usar UTM de campanha específica do form:

```
?utm_source=email&utm_medium=email&utm_campaign=<slug-curto>
```

- [ ] `utm_campaign` definido (ex: `playbook-elg`, `case-semrush`, `algoritmo-linkedin`)
- [ ] Aplicado em todos os CTAs de cada email da cadência
- [ ] Aplicado no botão "Marque um diagnóstico" do signature card

---

## 3. Documentação — Source of truth

- [ ] **`source-of-truth/specs/<nome-do-form>.md`** — spec do form/produto
  - Visão e objetivo
  - Tags e listas no AC
  - Schema do banco
  - Fluxo CRM
  - Custom fields novos (se houver)

- [ ] **`boldfy-site/docs/cadencia-<slug>.md`** — copy + HTML da cadência
  - Estrutura: timing, variáveis, gate de segmentação
  - HTML formatado de cada email (formato AC, com signature card)
  - Métricas de acompanhamento

- [ ] **Privacy policy (`src/app/legal/legal-client.tsx`)** — se o form coleta consent novo:
  - Adicionar seção/bullet com `id` próprio (ex: `id="state-of-elg"`)
  - Linkar do form via `/legal#<anchor>`
  - Reforçar quais dados sensíveis NÃO são tratados

- [ ] **AGENTS.md / CLAUDE.md** — atualizar se o padrão de naming mudar

---

## 4. Verificação final (smoke test)

Antes de subir o PR:

- [ ] Preencher o form em dev/staging
- [ ] Conferir no Neon que `people`, `companies`, `activities`, `playbook_outputs` (ou equivalente) foram populados corretamente
- [ ] Conferir no AC que:
  - Contato apareceu com as tags certas
  - Contato foi adicionado às listas certas (sem duplicação)
  - Custom fields foram populados
- [ ] Trigger da automation funcionou: cadência começou a rodar
- [ ] Privacy policy renderiza com anchor funcionando
- [ ] No CRM interno (`/internal/crm/people/[id]`): timeline mostra activity `form_submit_*` e (após automation entrar) `automation_started`

---

## 5. Pós-launch (manutenção)

- [ ] Anotar no CRM Boldfy (Notion) que o form foi lançado e em qual data
- [ ] Configurar dashboard de métricas da cadência (open rate, CTR, conversion)
- [ ] Definir próxima ação: retargeting, próximo nurture, ou exit do funil

---

## Anatomia rápida de um form que segue o padrão

```
Form preenchido
    ↓
Server action → Zod → Adapter (ClassifiedLead)
    ↓
recordLeadFromForm → upsertPerson/Company → logActivity('form_submit_<slug>')
    ↓
syncContact (AC):
   - Adiciona tags: Líder B2B, Form: <Nome>, Newsletter (se opt-in)
   - Adiciona em listas: Líderes B2B, [Cadência] <Nome>, Newsletter Boldfy (se opt-in)
   - Custom fields populados
    ↓
AC automation roda a cadência (Trigger: Subscribes to list [Cadência] <Nome>):
   1. Email 1 (entrega)
   2. Wait
   3. Email 2 (nurture)
   4. Wait
   5. Email N (demo CTA)
   6. Penúltimo: Add tag "Cadência: <Nome curto> concluída"
   7. Último: Unsubscribe from list [Cadência] <Nome>
    ↓
Webhook /api/webhooks/ac recebe contact_tag_added
    ↓
Tag "Concluiu: X" detectada via prefixo → activity 'cadence_completed'
    ↓
Timeline do CRM mostra "✓ Concluiu cadência: Cadência <Nome>"
```

---

**Última atualização:** 2026-05-29
**Aplicação:** todo form novo a partir desta data.
