<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Convenção de nomes para forms / materiais (CRM)

Toda vez que um novo form ou material entrar no site, o **slug interno é
SEMPRE igual ao slug da URL pública**, em kebab-case. Termos genéricos como
`report`, `case`, `ebook`, `whitepaper`, `webinar` são proibidos como slug —
no dia que o segundo material chegar, deixa de ser identificável qual é.

| Camada                                            | Regra                                                                                  | Exemplo                                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `FormSlug` (TS, `src/lib/form-definitions.ts`)    | kebab-case espelhando a URL                                                            | `'algoritmo-linkedin'`, `'case-semrush'`                                               |
| Nome de arquivo do adapter                        | kebab-case igual ao slug                                                               | `src/lib/form-adapters/algoritmo-linkedin.ts`                                          |
| Função do adapter                                 | `adapt<PascalDoSlug>`                                                                  | `adaptAlgoritmoLinkedin`, `adaptCaseSemrush`                                           |
| Nome de arquivo da server action                  | `<slug>-leads.ts`                                                                      | `src/app/actions/algoritmo-linkedin-leads.ts`                                          |
| Função da server action                           | `submit<PascalDoSlug>Lead` (não `send`, não `ToNotion`)                                | `submitAlgoritmoLinkedinLead`                                                          |
| Schema Zod                                        | `<PascalDoSlug>LeadSchema`                                                             | `AlgoritmoLinkedinLeadSchema`                                                          |
| Enum Postgres `source_method`                     | snake_case derivado do slug, prefixo `form_`                                           | `'form_algoritmo_linkedin'`, `'form_case_semrush'`                                     |
| `activities.type` (form submit)                   | snake_case derivado, prefixo `form_submit_`                                            | `'form_submit_algoritmo_linkedin'`                                                     |
| Tag `Form: …` no AC                               | label legível com nome do material (não genérico)                                      | `'Form: Algoritmo LinkedIn 2026'`, `'Form: Case Semrush ELG'`                          |

**Exceções intencionais.** Slugs genéricos podem permanecer SE o nome do
form já for atomicamente único e mapear pra produto, não material:

- `beta` → produto Beta Test (não vira `boldfy-beta` porque só existe um beta).
- `demo` → marcação de demo (idem).
- `proposta` → simulador de proposta (idem).
- `linkedin_extension` → extensão Chrome (não tem URL pública pra espelhar).

**Checklist ao adicionar um material novo:**

1. Definir slug = slug da URL pública (kebab-case).
2. Adicionar entrada em `FORM_DEFS_SEED` (`src/lib/form-definitions.ts`)
   com `acTag` legível (`Form: <Nome do material>`).
3. Adicionar valor ao enum `sourceMethodEnum` (`src/db/schema.ts`) e a migration
   SQL correspondente (`ALTER TYPE ... ADD VALUE 'form_<slug_snake>'`).
4. Adicionar branches em `formSlugToSourceMethod`, `formSlugToActivityType`,
   `crm.ts` ACTIVITY_WEIGHTS, `statuses.ts` METHOD_TO_LADDER, e
   `crm-format.ts` (label + ícone do activity).
5. Criar adapter em `src/lib/form-adapters/<slug>.ts` + função
   `adapt<PascalDoSlug>` + export no `index.ts`.
6. Criar server action em `src/app/actions/<slug>-leads.ts` + função
   `submit<PascalDoSlug>Lead`.
7. Adicionar à lista de chips na Forms tab (`forms-filters.tsx`,
   `forms-list.tsx`, `shared.ts`, `page.tsx`) e ao mapping de `formLabelMap`
   no lead detail.
