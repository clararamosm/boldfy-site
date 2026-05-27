# Cadência de email — Tag `Form: Case Semrush ELG`

Cadência de 4 emails pra disparar no AC quando o lead recebe a tag `Form: Case Semrush ELG` (aplicada automaticamente pela LP `/case-semrush`).

## Gate de segmentação

Mesmo padrão do report `Algoritmo LinkedIn 2026`:

- **E1** (entrega do PDF) vai pra TODO mundo que baixou o case, independente do `tipo_de_lead`. Email transacional, é o que a pessoa pediu ao preencher o form.
- **E2, E3, E4** (narrativa + CTA pro playbook) vão SÓ pra `tipo_de_lead = "Líder B2B"`. Parceiros e profissionais individuais ficam fora dessa parte da cadência pra não poluir a base — eles entram em cadências editoriais próprias quando existirem.

No AC, monta a automation assim:

1. Trigger: tag `Form: Case Semrush ELG` aplicada
2. E1 (envio imediato, sem gate)
3. Wait + If/Else: campo `tipo_de_lead` = "Líder B2B"
4. Se SIM: segue pra E2, E3, E4 com waits
5. Se NÃO: sai da cadência

## Timing

| Email | Quando dispara | Quem recebe |
|-------|---------------|-------------|
| E1    | Imediato (na hora do submit) | Todos os leads |
| E2    | D+2 às 9h (horário do lead, se possível) | Só `Líder B2B` |
| E3    | D+5 às 9h | Só `Líder B2B` |
| E4    | D+8 às 9h | Só `Líder B2B` |

## Variáveis usadas

- `%FIRSTNAME%` — primeiro nome do lead
- `%COMPANYNAME%` — nome da empresa (custom field `empresa`, só presente em Líder B2B)
- Link do PDF: `https://boldfy.com.br/reports/Case-Semrush-Employee-Led-Growth-Boldfy.pdf`
- Link do playbook (com UTM): `https://boldfy.com.br/ferramentas/playbook-employee-led-growth?utm_source=email&utm_medium=email&utm_campaign=case-semrush`

---

## E1 — Entrega (D+0, todos os leads)

**Assunto:** `%FIRSTNAME%, aqui tá o case da Semrush em PDF`

**Pré-header:** `Link direto, mais o que esperar dele.`

**Corpo:**

Oi %FIRSTNAME%,

Obrigada por baixar o case. O PDF tá aqui:

[Baixar o Case Semrush ELG (PDF)](https://boldfy.com.br/reports/Case-Semrush-Employee-Led-Growth-Boldfy.pdf)

São 12 minutos de leitura. A primeira metade mostra os três pilares do programa (conteúdo, apoio direto, amplificação) com prints dos posts originais. A segunda traz os números: +500k de alcance em 2 meses, R$ 360 mil em earned media calculado pelo CPM real do LinkedIn no Brasil, e a projeção anual.

Sugestão de uso: lê uma vez pra absorver, depois deixa salvo na pasta de referência. Esse é o tipo de material que rende bem como ponto de partida pra discussão de planejamento, principalmente quando alguém do time pergunta "por que a página da empresa parou de performar".

Nos próximos dias vou te mandar mais três emails curtos com pedaços que ficaram de fora do PDF — recortes do método, e uma ferramenta que ajuda a aplicar tudo isso na prática.

Até lá,
Clara
Fundadora, Boldfy

---

## E2 — A virada estrutural (D+2, só Líder B2B)

**Assunto:** `o que matou a página da empresa`

**Pré-header:** `Não foi o algoritmo. Foi a confiança.`

**Corpo:**

Oi %FIRSTNAME%,

Tem um número no case da Semrush que costuma chocar mais que os outros: páginas de empresa caíram 66% de alcance no LinkedIn entre 2024 e 2026.

Mas o algoritmo é só metade da história.

A outra metade é que o leitor mudou. Quando alguém abre o feed hoje e vê um post saindo de um logo, o cérebro processa como "isso é institucional, é anúncio, é interessado em me vender alguma coisa". Quando o mesmo conteúdo sai de uma pessoa, ele lê como "alguém pensou isso e quis dividir". Mesmo dado, percepção completamente diferente.

A Semrush não bateu o algoritmo. Ela escolheu o caminho da credibilidade — colocou ~30 pessoas pra falar pelos próprios ângulos, cada uma com voz própria, e o feed devolveu em multiplicador de alcance.

Pra quem tá vendo a curva da página de empresa cair na própria %COMPANYNAME% e ainda não decidiu o que fazer, esse é o momento de testar a hipótese: o que muda quando o time vira o canal?

A Fai (nossa estrategista) montou um diagnóstico interativo que recebe o cenário da sua empresa e gera um playbook em 5 minutos. Sai com um plano em 3 fases, checklist pra começar, e o cálculo de earned media projetado pro seu time.

[Fazer meu playbook](https://boldfy.com.br/ferramentas/playbook-employee-led-growth?utm_source=email&utm_medium=email&utm_campaign=case-semrush)

Abraço,
Clara

---

## E3 — Por que tantos programas morrem em 3 semanas (D+5, só Líder B2B)

**Assunto:** `90% dos programas de advocacy morrem na praia`

**Pré-header:** `E o motivo é sempre o mesmo.`

**Corpo:**

Oi %FIRSTNAME%,

Quase toda empresa B2B brasileira já tentou advocacy em algum momento. Um RH animado mandando "vamos repostar os posts da página", um CMO criando um canal no Slack chamado #amplificação, alguém da liderança batendo cabeça com colaborador que não engaja.

Em 2 ou 3 semanas, morre.

Isso não acontece por falta de boa intenção. Acontece porque advocacy de verdade tem três engrenagens, e a maioria dos programas tenta rodar só com uma.

A primeira é conteúdo que vale salvar — não post de marca, conteúdo denso que a pessoa quer guardar e voltar depois (cheat sheets, frameworks, gráficos práticos). A segunda é apoio direto perfil a perfil — a líder do programa da Semrush sentou com cada um dos ~30 colaboradores pra calibrar tom de voz e construir confiança pra postar. A terceira é amplificação contextual — o mesmo ativo aparece com hooks e tratamentos visuais diferentes pra cada pessoa, então o feed não percebe como repetição.

Tira qualquer uma dessas três e o sistema desaba. Tenta sem conteúdo bom, vira spam corporativo. Tenta sem apoio direto, ninguém posta. Tenta sem variação visual, o algoritmo achata o alcance porque vê redundância.

O playbook que a Fai monta entrega exatamente esse diagnóstico pra %COMPANYNAME%: qual das três engrenagens tá faltando, qual ordem priorizar, e como medir se tá funcionando.

[Diagnosticar o programa da %COMPANYNAME%](https://boldfy.com.br/ferramentas/playbook-employee-led-growth?utm_source=email&utm_medium=email&utm_campaign=case-semrush)

Cinco minutos preenchendo, página exclusiva pra compartilhar com o time.

Abraço,
Clara

---

## E4 — A pergunta que fica (D+8, só Líder B2B)

**Assunto:** `última coisa sobre o case Semrush`

**Pré-header:** `Uma pergunta inconveniente.`

**Corpo:**

Oi %FIRSTNAME%,

Tem uma pergunta no fim do case da Semrush que vale repetir aqui porque ela é meio inconveniente:

*Se a sua marca dependesse hoje dos seus colaboradores pra existir no LinkedIn, como ela estaria no mercado?*

A maioria das empresas B2B no Brasil não respondeu essa pergunta ainda. Não porque não querem — porque é muito mais fácil terceirizar pra uma agência postar pela página oficial do que estruturar um sistema interno que faz o time virar canal. A Semrush escolheu o caminho mais difícil e foi adquirida pela Adobe enquanto isso. Os colaboradores continuam postando porque o programa virou estrutura, não dependeu de pessoa.

Esse é o ponto inteiro do método: programa de advocacy decente não é um esforço heroico do CMO da vez. É uma engrenagem que roda sozinha depois de calibrada.

Se a %COMPANYNAME% ainda não tem essa engrenagem, ou tem e tá engasgada, o playbook é o lugar pra começar.

[Montar o playbook em 5 minutos](https://boldfy.com.br/ferramentas/playbook-employee-led-growth?utm_source=email&utm_medium=email&utm_campaign=case-semrush)

E se preferir conversar antes de fazer qualquer ferramenta, é só responder esse email. Eu olho pessoalmente.

Abraço,
Clara
Fundadora, Boldfy

---

## Métricas a acompanhar (primeiros 30 dias)

- **Open rate de cada email** — meta E1 acima de 60% (transacional), E2-E4 acima de 35%
- **CTR pro playbook** — meta acumulada E2+E3+E4 acima de 12% dos Líderes B2B que entraram na cadência
- **Conversão do playbook** — % dos cliques que de fato preenchem o playbook (já medido pelo `playbook-employee-led-growth-leads.ts`)
- **Reply rate do E4** — métrica qualitativa, indica intent quente

## Próximos passos após esta cadência

Lead que clicou no playbook E preencheu vira candidato a reunião — pode entrar em cadência separada de SDR (futuro). Lead que clicou mas não preencheu vira candidato pra retargeting LinkedIn Ads. Lead que abriu E2-E4 mas não clicou em nada vira candidato pra próximo material editorial (newsletter, próximo report).
