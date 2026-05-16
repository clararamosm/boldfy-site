# SPEC: Dashboard interno de métricas orgânicas

**Status:** aprovado em escopo, aguardando go pra implementação
**Owner:** Clara
**Acesso:** restrito (Clara, v1)
**Deadline-âncora:** Web Summit Rio — 8 de junho de 2026
**Criado em:** 15 de maio de 2026
**Última atualização:** 15 de maio de 2026

---

## 1. TL;DR

Página interna em `/internal/dashboard` que centraliza métricas orgânicas de tráfego, conversão e pipeline, puxando dados de GA4, Search Console, ActiveCampaign, Folk e Vercel KV via Server Components do Next 16. Auth simples por senha (cookie httpOnly). Cada bloco é independente — falha de uma API não derruba os outros. Entrega completa em 24 dias pra estar 100% operacional no Web Summit Rio.

## 2. Problema

A infraestrutura de captura de dados da Boldfy é madura — GA4, GTM, LinkedIn Insight Tag, AC, Folk, shortlinks via KV, todos plugados, com `utm_source_first`, `utm_medium_first`, `utm_campaign_first` capturados como custom fields nos 4 formulários (Beta, Demo, Proposta, Report). Mas pra responder perguntas básicas hoje — "quantos leads vieram do LinkedIn essa semana?", "qual conteúdo converteu mais?", "qual canal tá performando?" — é preciso abrir 3-4 ferramentas e cruzar manual.

Sem uma visão consolidada, decisões de canal e conteúdo ficam baseadas em sensação, não dado. E pós-Web Summit, sem dashboard, vai ser impossível medir ROI do evento com precisão.

## 3. Goals

- **G1.** Centralizar visualização de métricas de 6 fontes (GA4, AC, Folk, Search Console, shortlinks, LinkedIn-via-UTM) numa única página.
- **G2.** Fechar o loop visita → lead → oportunidade → cliente, com origem rastreada do início ao fim.
- **G3.** Permitir filtrar tudo por campanha UTM (especialmente Web Summit Rio).
- **G4.** Ficar 100% operacional até 7 de junho de 2026 (1 dia antes do Web Summit).

## 4. Non-goals

- **NG1.** Não substitui dashboards nativos de cada ferramenta (GA4, Folk, AC continuam sendo fonte primária pra deep-dive).
- **NG2.** Não automatiza ações (não envia email, não move lead de status). Read-only.
- **NG3.** Não inclui multi-usuário, SSO, ou roles diferenciadas na v1. Auth = 1 senha.
- **NG4.** Não inclui LinkedIn Website Demographics na v1 (site tem ~90 visitas de LinkedIn em <1 mês, threshold de 300/90d ainda não atingido).
- **NG5.** Não inclui dados de Ads (campanhas pagas não rodam ainda).

## 5. Success metrics

- **M1.** Clara abre o dashboard ≥ 3x por semana pós-launch.
- **M2.** Tempo pra responder "quantos leads de origem X essa semana?" cai de ~10 min pra <30 segundos.
- **M3.** Durante Web Summit, view do evento mostra dados em tempo real (latência máxima de 15 min entre lead chegar no AC e aparecer no dashboard).
- **M4.** Nenhum bloco quebra a página inteira — se 1 API falha, os outros 5 continuam funcionando.

## 6. User stories

- **U1.** Como Clara, quero abrir uma página e ver tráfego, leads e pipeline numa visão só, pra entender performance sem abrir 4 ferramentas.
- **U2.** Como Clara, quero filtrar tudo por `utm_campaign=web-summit-rio-2026`, pra avaliar ROI do evento durante e depois.
- **U3.** Como Clara, quero saber quais peças de conteúdo de LinkedIn geraram leads que viraram clientes, pra dobrar a aposta no que funciona.
- **U4.** Como Clara, quero ver quais queries de SEO trouxeram tráfego pra cada página, pra priorizar otimização.
- **U5.** Como Clara, quero ver o funil completo Folk (Lead → Reunião → Fechado) com origem de cada deal, pra atribuir receita ao canal correto.

## 7. Solução — Arquitetura

### 7.1 Localização e roteamento

Rota: `/internal/dashboard` no próprio `boldfy-site`. Reusa o padrão de `/internal/catalogo` já estabelecido (noindex/nofollow + bloqueio em `robots.ts`). Tudo no mesmo deploy, mesmas envs, mesma stack.

### 7.2 Auth

Middleware do Next.js (`middleware.ts`) intercepta requisições a `/internal/dashboard/*`. Se cookie `dashboard_session` ausente ou inválido, redireciona pra `/internal/dashboard/login`. Página de login tem input de senha; comparação contra `DASHBOARD_PASSWORD` em env var; se bater, set cookie httpOnly + secure + sameSite=lax, expiração 30 dias.

Decisão: senha única (não magic link, não OAuth) porque (a) só Clara acessa na v1, (b) zero dependência externa, (c) trivial trocar pra magic link via Resend depois se o time crescer.

### 7.3 Renderização

Server Components do Next 16. Cada bloco busca seus dados no server via `fetch` com `next: { revalidate: N }` — cache de 5-30 min variando por fonte. Vantagens: API keys nunca expostas ao client, página carrega rápida mesmo com 6 APIs, e o cache nativo do Next reduz pressão sobre as APIs.

### 7.4 Resiliência

Cada bloco é um componente isolado com error boundary próprio. Se API do Folk falha, bloco do Folk mostra estado "indisponível, tente novamente" e os outros 5 renderizam normal. Sem cascata de erro.

### 7.5 Stack

Reusa:

- `next` 16.2.6 + React 19 + TypeScript
- shadcn/ui (tabs, badge, separator, button já instalados)
- Tailwind + identidade visual Boldfy
- Zod (validação de respostas de API)

Adiciona:

- `recharts` — biblioteca de charts (linha, barra, funil)

## 8. Solução — Blocos

### 8.1 Visão geral

Aba inicial. KPIs do mês corrente em cards grandes: visitas únicas, leads totais, oportunidades em pipeline, deals fechados. Alertas: queda >20% semana-a-semana, formulário sem leads há 7+ dias, oportunidades paradas em "Em andamento" há 14+ dias.

### 8.2 Tráfego (GA4)

**Fonte:** Google Analytics Data API.
**Cache:** 15 min.
**Métricas:** visitas/sessões/usuários únicos com comparação mês-a-mês; breakdown por canal (Organic Search, Direct, Social, Referral, Email); top 10 páginas; top 10 sources; chart de linha de visitas/dia (últimos 30 dias); filtro de período (hoje, 7d, 30d, 90d, custom).
**UI:** 4 KPIs no topo, 1 chart de linha grande, 2 tabelas lado-a-lado.

### 8.3 Formulários (ActiveCampaign)

**Fonte:** AC API (estende `src/lib/activecampaign.ts`).
**Cache:** 5 min.
**Métricas:** leads totais por formulário (Beta, Demo, Proposta, Report) no mês corrente; taxa de conversão visita→lead por formulário (cruza com GA4); breakdown por `utm_source_first` e `utm_campaign_first`; lista dos últimos 20 leads com nome, email, empresa, form, UTM, data; funil de Demo (lead → agendou Cal.com → reuniu).
**UI:** 4 cards (1 por form), tabela ordenável por origem, lista paginada de leads recentes.

### 8.4 Funil B2B (CRM Boldfy)

**Fonte:** Postgres do CRM Boldfy (ver [SPEC-crm-boldfy.md](./SPEC-crm-boldfy.md)). Substitui Folk após migração.
**Cache:** 1 min (dado é nosso, baixa latência).
**Métricas:** funil de Person (Ativo → Lead → Quente, com thresholds de lead score); funil de Company (No status → Quero prospectar → Reunião marcada → Em andamento → Fechado / Perdido); conversão entre etapas; tempo médio por etapa; lista de oportunidades quentes (Reunião marcada + Em andamento); cruzamento origem × resultado; média de lead score por etapa.
**UI:** funil horizontal com contagens, tabela de oportunidades quentes ordenada por lead score, gráfico de barras de conversão por origem.

**Nota arquitetural:** durante a migração (Sprint 4 do CRM), esse bloco lê do nosso DB em vez do Folk. Pré-migração, lê do Folk como fallback. Implementação: helper `fetchPipeline()` que detecta env var `CRM_MIGRATED=true` e faz routing.

### 8.5 SEO (Search Console)

**Fonte:** Google Search Console API.
**Cache:** 30 min (dado tem delay nativo de 2-3 dias).
**Métricas:** cliques, impressões, CTR médio, posição média (últimos 28 dias vs 28 anteriores); top 20 queries com tendência; top 20 páginas; queries na página 2-3 (oportunidades); chart de cliques/dia.
**UI:** 4 KPIs comparativos, 2 tabelas ordenáveis, 1 chart de tendência.

### 8.6 LinkedIn (UTM-based)

**Fonte:** dados já fetchados de GA4 + AC + Folk, filtrados onde `source = linkedin`.
**Cache:** segue cache das fontes.
**Por que sem pixel:** Website Demographics precisa ~300 únicos em 90 dias pra desbloquear. Site tem ~90 visitas de LinkedIn em <1 mês. Quando passar do threshold (estimado jul-ago 2026), adiciono bloco de Demographics em release separado.
**Métricas:** funil completo LinkedIn (visita → lead → demo → cliente); top `utm_campaign` por leads gerados; top `utm_content`; taxa de conversão visita→lead específica do canal; lista nominal dos últimos leads de LinkedIn com nome, empresa, cargo, UTM, status no Folk.
**UI:** funil grande no topo, tabela de campanhas, lista de leads recentes.

### 8.7 Shortlinks (Vercel KV)

**Fonte:** Vercel KV (estende `src/app/l/[code]/route.ts` pra incrementar contador).
**Cache:** 1 min.
**Métricas:** total de cliques por link (top 20); cliques por dia; top links da semana; cada link mostra código, URL destino, UTMs embutidos, cliques, criado em.
**UI:** tabela ordenável, chart agregado, busca por código.
**Pré-requisito:** adicionar tracking de cliques no route handler `/l/[code]` (incrementa contador em KV a cada hit — hoje só redireciona).

### 8.8 Mídia & PR

**Fonte:** input manual de artigos por Clara + GA4 (referrer + UTM `utm_source=pr`) + Search Console (queries de marca).
**Cache:** 15 min.
**Contexto:** Clara contrata SaaS de PR (1 artigo/mês, prometem 30+ publicações em veículos). Sem contato direto com jornalistas — toda gestão fica no SaaS. Dashboard só lê resultado.
**Workflow:**

1. Quando SaaS confirma publicação, Clara entra no dashboard e cadastra: data, título do artigo, shortlink usado (ex: `/l/pr-employee-led-growth-mai26`).
2. Shortlink usa UTM padrão: `utm_source=pr`, `utm_medium=earned`, `utm_campaign={slug-do-artigo}`.
3. Dashboard puxa GA4 e mostra: visitas vindas dessa UTM, agrupadas por referrer (= veículos detectados).
4. Cruza com Search Console pra mostrar pico de buscas pela marca após cada publicação.

**Métricas:**

- KPIs do topo: artigos publicados (mês + cumulativo), visitas via PR no mês, leads via PR, crescimento de buscas pela marca vs período anterior.
- Lista de artigos cadastrados com: data, título, shortlink, total de cliques, top 5 veículos que linkaram (via referrer), leads gerados.
- Chart de **branded search** (queries contendo "boldfy" no Search Console) com marcadores verticais nas datas de publicação — mostra se o PR moveu o ponteiro de awareness.
- Chart de **direct traffic** com marcadores idem — captura quem viu a matéria e foi digitar `boldfy.com.br` direto.
- Top veículos por tráfego gerado (cumulativo, ordenado por sessões).

**UI:** input form simples no topo pra cadastrar novo artigo, KPIs, 2 charts com marcadores nas datas de publicação, lista de artigos com expand pra ver veículos detectados.

**Não inclui:** CRM de jornalistas, lista de contatos, status de pitch, one-pager pra distribuição. Tudo isso fica no SaaS de PR. Dashboard só mede resultado.

### 8.9 View "Web Summit Rio"

**Fonte:** todos os blocos acima, filtrados por `utm_campaign=web-summit-rio-2026` (ou padrão final que Clara definir).
**Comportamento:** mesma estrutura visual da Visão geral + abas, mas escopado ao evento.
**Pré-evento:** alertas com os UTMs a usar nos QR codes, posts, materiais distribuídos na feira.
**Pós-evento:** view fica permanente pra análise de ROI (custos × leads × deals fechados).

## 9. Dependências externas (setup)

### 9.1 Google Cloud — GA4 + Search Console

Reusar o project Cloud existente da Plataforma Boldfy.

1. Ativar APIs: Google Analytics Data API e Search Console API.
2. IAM → Service Accounts → criar `boldfy-site-dashboard` (ou reusar uma existente).
3. Baixar JSON da chave.
4. No GA4: Admin → Account access → adicionar email da service account com role Viewer.
5. No Search Console: Settings → Users and permissions → adicionar mesmo email com permissão Full.
6. Passar JSON pra `GOOGLE_SERVICE_ACCOUNT_JSON` em env var no Vercel + GA4 Property ID pra `GA4_PROPERTY_ID`.

Tempo estimado: 15 min.

### 9.2 ActiveCampaign

Já configurado em env (`activecampaign.ts` lê env vars). Sem ação adicional.

### 9.3 Folk

Já configurado em env (`folk.ts` lê env vars). Sem ação adicional.

### 9.4 LinkedIn

Sem ação na v1 (UTM é suficiente). Pra v1.5, criar Developer App e pedir aprovação de permissões `r_organization_social` + `rw_organization_admin` — só faz sentido depois que Website Demographics destravar.

### 9.5 Senha do dashboard

Clara define e adiciona em `DASHBOARD_PASSWORD` (env var Vercel).

## 10. Timeline

Hoje: 15 de maio. Web Summit: 8 de junho. **24 dias.**

| Semana | Datas | Entregáveis |
|---|---|---|
| 1 | 15–22 mai | Scaffold + auth + bloco Tráfego + bloco Formulários |
| 2 | 22–29 mai | Bloco Funil + bloco SEO + bloco Shortlinks |
| 3 | 29 mai–5 jun | Bloco LinkedIn + bloco Mídia & PR + view Web Summit + polish visual |
| 4 | 5–7 jun | Buffer + smoke test em prod + ajustes finais |

## 11. Divisão de tarefas

**Implementação (eu):** todo o código — rotas, libs de integração novas (`ga4.ts`, `search-console.ts`), extensões das libs existentes (`activecampaign.ts`, `folk.ts`), componentes, charts, middleware de auth, tracking de cliques em `/l/[code]`, identidade visual Boldfy, typecheck e lint.

**Setup (Clara):** Google Cloud (15 min com tutorial passo-a-passo), definir padrão de UTM pro Web Summit, criar senha do dashboard e adicionar no Vercel, revisar cada bloco quando entregue.

## 12. Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Setup Google Cloud trava por políticas restritivas da conta | Baixa | Médio | Tutorial passo-a-passo; se travar, blocos GA4/SC ficam pra v1.5, resto roda normal |
| API Folk/AC muda formato ou rate-limita | Baixa | Médio | Cache 5 min reduz chamadas; error boundary isola falha por bloco |
| Webhook Cal.com perde algum evento de agendamento | Média | Baixo | Dashboard mostra número do AC + número do webhook, dá pra reconciliar visual |
| Volume LinkedIn baixo demais pra plot bonito | Alta | Baixo | Estado "dado insuficiente" claro, sem simular número |
| Mudança no site quebra tracking UTM perto do Web Summit | Baixa | Alto | Smoke test específico de UTM 1 semana antes do evento |
| Próximas 24 dias têm interrupção (feriado, viagem, urgência) | Média | Médio | Buffer de 2 dias no final + blocos independentes priorizáveis |

## 13. Open questions

- **OQ1.** Qual o padrão exato de UTM pro Web Summit? Sugestão: `utm_source=web-summit`, `utm_medium=event`, `utm_campaign=web-summit-rio-2026`, `utm_content={qr-code-banner|qr-code-flyer|qr-code-camiseta|...}`. Confirmar antes de hardcodar a view.
- **OQ2.** A senha do dashboard rotaciona? Se sim, com qual cadência? (Sugestão: trimestral.)
- **OQ3.** Dashboard deve ser acessível em mobile durante a feira? Se sim, é prioridade alta no polish visual.

## 14. Próximos passos

1. Clara revisa o spec e dá go (ou pede ajustes).
2. Em paralelo, Clara pode adiantar o setup do Google Cloud (seção 9.1).
3. Quando topar, retomar no Cowork com "vamos começar" — task list já está pronta com 12 tasks, parto pelo scaffold + auth.

## 15. Changelog

- **2026-05-15** — Versão inicial criada após discovery com Clara. Escopo: 6 blocos + view Web Summit. Auth simples por senha. v1 sem LinkedIn Website Demographics (volume insuficiente).
- **2026-05-15 (update)** — Adicionado bloco Mídia & PR (seção 8.7) após confirmação de que Clara contrata SaaS de PR. Bloco é leve: sem CRM, foco em tracking de artigos e impacto no orgânico (branded search + direct traffic com marcadores). One-pager PDF descartado (dashboard é só pra Clara analisar, não pra pitch). Total agora: 7 blocos + view Web Summit.
- **2026-05-15 (update 2)** — Bloco "Funil B2B" agora lê do CRM Boldfy (Postgres) em vez do Folk. Decisão: construir CRM próprio + extensão Chrome pra substituir Folk (ver [SPEC-crm-boldfy.md](./SPEC-crm-boldfy.md)). Sequenciamento: CRM Sprint 1-2 antes dos blocos analytics do dashboard (Sprint 3 entrega CRM + dashboard juntos). Folk fica como fallback durante migração.
