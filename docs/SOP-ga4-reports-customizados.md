# SOP — Reports customizados no GA4 pra analisar o site Boldfy

> Tempo estimado: **~45 min** (15min reports básicos + 30min customizados)
> Quando fazer: depois que os eventos customizados (cta_click, form_open, form_submit_*) tiverem pelo menos **24-48h coletando dados** em produção.
> Sem isso, os reports customizados vão aparecer vazios — os relatórios padrão (page_view, device, etc) funcionam desde já.

## Contexto

Com o tracking de eventos já implementado, o GA4 tá coletando:

| Evento | O que mede |
|---|---|
| `page_view` (automático) | Cada carregamento de página |
| `scroll` (automático) | Scroll >90% da página |
| `cta_click` (customizado) | Clique nos botões "Agendar Demo" / "Montar proposta" / "Quero ser beta" |
| `form_open` (customizado) | Popup de form aberto |
| `form_submit_start` (customizado) | User começou submit |
| `form_submit_success` (customizado) | Lead criado com sucesso no AC |
| `form_submit_error` (customizado) | Submit deu erro |

Com isso dá pra montar funis de conversão completos e medir performance por origem.

---

## PARTE 1 — Reports nativos (que já existem, só precisa saber onde achar)

Esses não exigem criação — são dashboards padrão do GA4 que você pode começar a usar imediatamente.

### 1.1 "Quem entrou no site e de onde"

**Acesso:** `Relatórios` → `Aquisição` → `Aquisição de tráfego`

**O que mostra:**
- Canais que trouxeram tráfego (Organic Search, Direct, Social, Email, Referral, Paid)
- Fonte/meio específico (ex: `linkedin / social`, `google / organic`, `(direct) / (none)`)
- Quantidade de usuários, sessões, taxa de engajamento por canal

**Filtro útil:** clica no `+` no topo e adiciona comparação "Tipo de tráfego exclui Internal" pra limpar teu próprio tráfego (depois que você ativar o filtro do SOP de IPs).

### 1.2 "Páginas mais visitadas"

**Acesso:** `Relatórios` → `Engajamento` → `Páginas e telas`

**O que mostra:**
- Ranking de páginas por views
- Tempo médio de engajamento por página
- Contagem de eventos totais por página

**Leitura prática:**
- Se `/precos` tem muito view mas pouco tempo de engajamento → problema de conteúdo ou carregamento
- Se `/blog/[post]` converte proporcionalmente mais que `/` → dobra a aposta em blog

### 1.3 "Mobile vs Desktop"

**Acesso:** `Relatórios` → `Usuário` → `Tecnologia` → `Visão geral`

**O que mostra:**
- Divisão device category (mobile / desktop / tablet)
- Sistema operacional
- Browser
- Resolução de tela

**Leitura prática:** pra B2B, espera-se 60-70% desktop. Se mobile estiver muito alto (>50%), vale revisitar UX mobile dos forms e CTAs.

### 1.4 "Localização geográfica"

**Acesso:** `Relatórios` → `Usuário` → `Dados demográficos` → `Visão geral`

**O que mostra:**
- País, cidade, idioma
- Útil pra confirmar que tua audiência é BR (e se tem cluster em SP/RJ/etc)

---

## PARTE 2 — Reports customizados (precisa criar)

### 2.1 Criar um "Evento-chave" pro form_submit_success

**Por que isso importa:** marcar um evento como "evento-chave" (antigo "conversão") faz com que:
- Ele apareça destacado em vários reports
- O LinkedIn Ads possa usar ele como sinal de conversão (quando você rodar ads)
- O GA4 Attribution calcule qual canal trouxe as conversões

**Passos:**

1. Admin (engrenagem canto inferior) → Propriedade → **Eventos-chave** (antes "Conversões")
2. Botão **`+ Novo evento-chave`** no canto superior direito
3. Nome do evento: `form_submit_success`
4. Salva

**Repete pros outros que você considera conversão importante:**
- `form_submit_success` ✅ (já criou acima — é O big one)
- `cta_click` (opcional — pra medir "intenção de conversão", mesmo que não submeta o form)

> **Observação:** eventos-chave levam **até 24h** pra começar a aparecer nos reports como conversão. Paciência no primeiro dia.

---

### 2.2 Funil de conversão — "Onde perco meu lead"

**Por que isso importa:** você vai ver em números exatos onde as pessoas desistem.

Exemplo real do que o funil vai te mostrar:

```
1.000 pessoas viram /precos
  ↓
  300 clicaram em "Montar proposta"   (30% CTR)
  ↓
  290 popup abriu                     (quase 100%)
  ↓
  180 começaram a preencher          (62% engagement)
  ↓
  95 submeteram com sucesso          (52% complete rate)

Conversão final: 9,5% (95/1000)
```

Se o drop maior for entre "começar a preencher" e "submeter", o form tá muito longo. Se for entre "clique no CTA" e "popup aberto", tem bug.

**Passos:**

1. Sidebar esquerda → **Explorar** (ícone de "Explorer" / bússola)
2. Botão **`+ Nova exploração em branco`** ou **`+ Criar uma nova exploração`**
3. Tipo de exploração: **`Exploração de funil`**
4. Nome: `Funil de conversão - Demo`

**Configuração das etapas do funil:**

Na aba "Etapas" do lado direito, configure 4 etapas:

| Etapa | Condição |
|---|---|
| 1. Visitou o site | Event name = `page_view` |
| 2. Clicou em CTA | Event name = `cta_click` |
| 3. Abriu o form | Event name = `form_open` |
| 4. Submeteu com sucesso | Event name = `form_submit_success` |

**Como configurar cada etapa:**

1. Clica em "Etapa 1" → Edita o nome pra "Visitou o site"
2. Em "Condição", seleciona `Nome do evento` → valor `page_view` → adiciona
3. Clica `+ Adicionar etapa` → nomeia "Clicou em CTA" → condição `Nome do evento = cta_click`
4. Repete pra etapa 3 e 4

**Filtros opcionais (canto superior direito):**

Adiciona filtros pra segmentar por:
- `cta_type` = `demo` (só funil de demo) ou `proposal` (só funil de proposta)
- `source` contém `precos` (só quem veio da página de preços)
- `Device category` = `mobile` / `desktop` (compara drop-off por device)

**Salva a exploração** com nome `Funil de conversão - Demo` pra ter fácil acesso.

---

### 2.3 Report "Qual CTA converte mais"

**Por que isso importa:** você tem 27 CTAs espalhados pelo site. Alguns devem converter 5% e outros 0.2%. Esse report mostra qual trazer mais leads por clique.

**Passos:**

1. Explorar → Nova exploração em branco
2. Tipo: **`Exploração de forma livre`** (free form)
3. Nome: `Performance por CTA`

**Configuração:**

**Dimensões** (lado esquerdo, clica no `+`):
- Importa: `Event name` (já disponível)
- Importa: `source` (parâmetro customizado do nosso código)
- Importa: `cta_type` (parâmetro customizado)

**Métricas:**
- `Contagem de eventos`
- `Usuários ativos`

**Configura a visualização:**

Na aba "Configurações de aba" ao centro, arrasta:
- **Linhas:** `source`, `cta_type`
- **Valores:** `Contagem de eventos`
- **Filtros (Configurações > Filtros):** `Event name = cta_click` (só CTAs)

**Resultado esperado** (depois de alguns dias de dados):

| source | cta_type | Cliques |
|---|---|---|
| home:hero | demo | 450 |
| home:hero | proposal | 380 |
| precos:saas | proposal | 210 |
| header:desktop | demo | 180 |
| caas:cta-final | proposal | 95 |
| ... | ... | ... |

**Salva a exploração.**

---

### 2.4 Report "Conversão por canal de aquisição"

**Por que isso importa:** saber se vale gastar mais em Ads (pago) ou em SEO/conteúdo (orgânico), comparado com tráfego direto (pessoas que já te conhecem).

**Passos:**

1. Explorar → Nova exploração em branco
2. Tipo: **`Exploração de forma livre`**
3. Nome: `Conversão por canal`

**Configuração:**

**Dimensões:**
- `Grupo de canais padrão` (Default Channel Grouping)
- `Fonte/meio do usuário`

**Métricas:**
- `Usuários ativos`
- `Sessões`
- `Eventos-chave` (precisa ter configurado no passo 2.1)
- `Taxa de eventos-chave da sessão`

**Arrasta:**
- Linhas: `Grupo de canais padrão`
- Valores: `Usuários ativos`, `Eventos-chave`, `Taxa de eventos-chave da sessão`

**Resultado esperado:**

| Canal | Usuários | Leads | Taxa conv |
|---|---|---|---|
| Organic Search | 1.200 | 28 | 2.3% |
| Direct | 800 | 48 | 6.0% |
| Social | 600 | 15 | 2.5% |
| Referral | 180 | 8 | 4.4% |

**Leitura prática:**
- **Direct > Social > Organic:** pessoas que já te conhecem convertem melhor — continuar trabalhando marca
- **Organic baixo:** o blog/SEO traz gente, mas eles ainda não estão prontos pra converter. OK pra começo
- **Social médio:** LinkedIn pessoal + posts Boldfy trazendo gente qualificada

---

### 2.5 Report "Jornada do lead até converter"

**Por que isso importa:** entende o caminho das pessoas que acabam virando lead. Se a maioria passa por `/blog/[post]` → `/precos` → submit, sabe o valor de investir em conteúdo.

**Passos:**

1. Explorar → Nova exploração em branco
2. Tipo: **`Exploração de caminho`** (path exploration)
3. Nome: `Jornada até converter`

**Configuração:**

- **Ponto de partida:** Event name = `form_submit_success`
- **Direção:** "Mostrar caminhos que levaram a" (backward)

Isso te mostra **retroativamente** quais páginas a pessoa visitou antes de submeter o form.

**Resultado esperado:**

```
form_submit_success
  ← /precos (45%)
  ← / (28%)
  ← /solucoes/content-as-a-service (12%)
  ← /blog/[post-X] (8%)
  ← /para/marketing (7%)
```

**Leitura prática:**
- Se muita gente passa por `/blog/[post-X]` → esse post é gerador de leads, vale promover
- Se `/para/marketing` converte desproporcionalmente bem → vale criar `/para/vendas`, `/para/rh` com mesmo padrão

---

## PARTE 3 — Dashboard principal (ver tudo num lugar só)

Em vez de navegar entre 5 exploreções, dá pra montar um **dashboard visual** (GA4 chama de "Coleção customizada") com os principais cards.

### 3.1 Criar coleção customizada

1. No menu esquerdo, clica no ícone de **biblioteca** (canto inferior esquerdo, "Biblioteca")
2. Se não aparecer, vai em **Administrar** → **Exibição de dados** → **Relatórios**
3. Botão **`+ Criar nova coleção`**
4. Nome: `Boldfy - Dashboard Principal`
5. Começa de um template (ex: "Ciclo de vida")
6. Customiza os cards que aparecem (Aquisição, Engajamento, Conversões)
7. Publica

Depois fica acessível no menu lateral como aba nova.

**Nota:** essa parte de coleções varia bastante entre contas GA4 dependendo do nível de acesso. Se não aparecer igual, usa as explorações individuais mesmo — funciona igual.

---

## PARTE 4 — Rotina de análise sugerida

Pra transformar dados em decisão, recomendo essa rotina:

### Diário (1 min)

- Abre GA4 Tempo real de manhã
- Confere se tem algum tráfego diferente do normal (pico súbito, zero absoluto = algo quebrou?)

### Semanal (15 min)

- Toda segunda, abre o report "Aquisição de tráfego" (últimos 7 dias)
- Anota: qual canal cresceu, qual caiu
- Abre "Performance por CTA" — qual CTA do site converteu mais essa semana?
- Se tem algo anormal, investiga na aba de Explorações

### Mensal (30 min)

- Abre o "Funil de conversão - Demo" no mês completo
- Calcula conversão final e compara com o mês anterior
- Olha o "Jornada até converter" pra ver padrões de jornada
- Define 1 experimento pro próximo mês baseado no que viu (ex: "vou melhorar copy do CTA caas:hero pq a conversão dele é abaixo da média")

### Trimestral (1h)

- Revisa todos os reports
- Cruza com dados de AC (quantos leads viraram clientes, ticket médio)
- Ajusta investimento em canais (mais LinkedIn Ads? menos? começar Google?)

---

## Troubleshooting

### "Meus eventos customizados não aparecem nas explorações"

**Causa mais comum:** GA4 leva 24-48h pra processar eventos novos pela primeira vez. Eles aparecem no Tempo Real em minutos, mas os Relatórios têm delay.

**Solução:** se já passaram 48h e ainda não aparecem:
1. Vai em `Admin` → `Eventos` — o evento tá listado?
2. Se sim, é só aguardar mais
3. Se não, volta no Realtime pra confirmar que os eventos tão sendo enviados

### "Minhas métricas estão distorcidas — tem muito tráfego dos meus próprios testes"

**Solução:** ativa o filtro de tráfego interno (SOP `SOP-ga4-excluir-trafego-interno.md`) e usa `?internal=1` nos teus dispositivos.

### "Quero comparar mês a mês"

Em qualquer report padrão, clica na data no canto superior direito → seleciona "Comparar" → escolhe o mês anterior. Aparece side-by-side.

### "Quero exportar pra Excel/Sheets"

Em qualquer report ou exploração → botão de **Download** no canto superior direito → CSV ou Excel.

---

## Checklist final

### Fase 1 — imediato (reports nativos)
- [ ] Consigo ver usuários ativos em tempo real (`Relatórios` → `Tempo real`)
- [ ] Consigo ver canais de aquisição (`Relatórios` → `Aquisição`)
- [ ] Consigo ver páginas top (`Relatórios` → `Engajamento` → `Páginas e telas`)
- [ ] Consigo ver divisão mobile/desktop (`Relatórios` → `Tecnologia`)

### Fase 2 — depois de 24-48h coletando eventos
- [ ] Evento-chave `form_submit_success` configurado
- [ ] Exploração "Funil de conversão - Demo" criada
- [ ] Exploração "Performance por CTA" criada
- [ ] Exploração "Conversão por canal" criada
- [ ] Exploração "Jornada até converter" criada

### Fase 3 — opcional
- [ ] Coleção customizada "Boldfy - Dashboard Principal" criada
- [ ] Rotina semanal de análise estabelecida
