# SOP — Montar automações do fluxo de Demo no ActiveCampaign

> Criado em Abr/2026 | Autora: Clara (com apoio técnico do Claude)
> Tempo estimado total: **~60 min** (15min templates + 30min automações + 15min teste)

## Contexto rápido

O site da Boldfy já está integrado com o AC. Quando alguém preenche o **form de demo** em `boldfy.com.br`:

1. O código cria o contato no AC e adiciona a tag **`Demo: Aguardando agendamento`**
2. A pessoa vê o embed do Cal.com no popup pra escolher horário
3. Quando ela agenda → webhook do Cal.com dispara → código remove `Demo: Aguardando agendamento` e adiciona **`Demo: Agendada`**
4. Se cancela → código remove `Demo: Agendada` e adiciona **`Demo: Cancelada`**

**Seu trabalho aqui** é montar 3 automações no AC que reagem a essas mudanças de tag.

---

## PARTE 1 — Pré-requisitos

Antes de começar, confere que tem tudo no AC:

### 1.1 Tags que DEVEM existir na conta (já foram criadas pelos testes)

Acessa `Contatos` → `Tags` e confirma que essas 3 tags aparecem:

- ✅ `Demo: Aguardando agendamento`
- ✅ `Demo: Agendada`
- ✅ `Demo: Cancelada`

**Se alguma não aparecer:** precisa submeter 1 formulário de teste no site pra criar. Submete lead com email `test-tags@boldfy-debug.dev` no popup de Demo que o código cria as tags.

### 1.2 Abrir 2 abas no browser pra trabalhar

- Aba 1: `https://boldfy.activehosted.com/app/automations`
- Aba 2: esse SOP aqui aberto pra consultar enquanto monta

---

## PARTE 2 — Criar os 5 email templates

Vamos começar criando os emails antes das automações (na automação a gente só referencia os templates já prontos).

### 2.1 Acessa a tela de emails

1. Sidebar esquerda → **Email** (ou **Campanhas**)
2. Menu interno → **Templates** (ou **Designs**)
3. Botão **`+ Novo template`** (canto superior direito)

### 2.2 Para cada um dos 5 emails abaixo, repete o fluxo:

1. Escolhe **"Em branco"** (ou "Start from scratch")
2. Nome do template: copia do campo **Nome** abaixo
3. Cola o **Assunto** no campo correspondente
4. No corpo do email, escolhe o layout mais simples (1 coluna)
5. Substitui o conteúdo padrão pelo bloco de texto do **Corpo**
6. Adiciona a **assinatura da Fai** no rodapé (copiar do ANEXO A no final desse doc)
7. Clica **Salvar template**

**Configurações gerais pra todos os 5 emails:**
- **De**: `admin@boldfy.com.br`
- **Nome do remetente**: `Fai da Boldfy`
- **Responder para**: `admin@boldfy.com.br`

---

### 📧 Template 1.1 — `[Demo Recovery] 1.1 - vc ainda ta por ai`

**Assunto:**
```
você ainda tá por aí, %FIRSTNAME%? 👀
```

**Corpo:**
```
Oi, %FIRSTNAME%! 👋

Notei aqui que você começou a marcar uma demo com a gente mas não escolheu o horário ainda.

Se ficou alguma dúvida antes de agendar, pode me responder por aqui mesmo que eu ajudo.

Ou, se for mais fácil, é só escolher o horário direto:

→ Agendar minha demo
```

**Configuração do link:**
- Texto: `Agendar minha demo`
- URL: `https://cal.com/clara-boldfy/demo`
- Estilo: botão ou link destacado em roxo `#6d28d9` (cor da marca)

---

### 📧 Template 1.2 — `[Demo Recovery] 1.2 - como funciona`

**Assunto:**
```
como funciona nossa conversa de 20min
```

**Corpo:**
```
Oi, %FIRSTNAME%!

Preparei um resuminho rapidinho do que geralmente acontece na primeira demo, pra você já chegar com contexto:

→ Mostro a plataforma rodando por dentro, com uma empresa de teste pra você ver os módulos em uso
→ Te guio no simulador pra você ver o ROI estimado pro porte da %EMPRESA%
→ Respondo qualquer coisa específica que você queira saber

A conversa toda dura uns 20 minutos. Se não fizer sentido pra %EMPRESA%, tudo bem. A gente encerra sem enrolação.

→ Ver horários disponíveis
```

**Link:** mesmo do Template 1.1 — `https://cal.com/clara-boldfy/demo`

---

### 📧 Template 1.3 — `[Demo Recovery] 1.3 - ultimo toque`

**Assunto:**
```
último toque antes de eu te deixar em paz 😅
```

**Corpo:**
```
Oi, %FIRSTNAME%!

Prometo que esse é o último email dessa série. Não quero encher tua caixa de entrada sem ter algo relevante pra te dizer.

Se mudou de ideia sobre a demo, sem problema nenhum. Mas se foi só questão de timing (entendo, a semana passa voando), o link continua aqui:

→ Escolher um horário

Se não rolar agora, tudo bem por aqui. Qualquer dia que você quiser olhar pra Boldfy de novo, é só voltar pro site.
```

**Link:** mesmo — `https://cal.com/clara-boldfy/demo`

---

### 📧 Template 2 — `[Demo] Confirmacao de agendamento`

**Assunto:**
```
tá marcada nossa conversa, %FIRSTNAME%! ✨
```

**Corpo:**
```
Oi, %FIRSTNAME%! 👋

Vi aqui que você agendou nossa demo. Que bom!

O link da reunião já deve ter caído na sua agenda do Google. Se por acaso não encontrar, me avisa que a gente dá uma olhada pra ver o que aconteceu.

Até breve!
```

**Sem link externo.** Email bem curto.

---

### 📧 Template 3 — `[Demo] Cancelamento - tudo bem acontece`

**Assunto:**
```
tudo bem, acontece 🙂
```

**Corpo:**
```
Oi, %FIRSTNAME%!

Vi que você cancelou nossa demo. Tudo bem, acontece. Mas não desisto de você tão fácil.

Me conta: você desistiu da ideia mesmo, ou ainda faz sentido pra você tentar remarcar?

Se quiser tentar um novo horário, é só clicar aqui:

→ Escolher novo horário

Se não for mais o momento, pode ignorar esse email que eu entendo. Qualquer dia a gente se fala.
```

**Link:** `https://cal.com/clara-boldfy/demo`

---

## PARTE 3 — Criar as 3 automações

### 3.1 Acessa a tela de automações

Sidebar esquerda → **Automações** (ou `/app/automations`)

### 3.2 Pattern geral pra cada automação

1. Clica **`+ Nova Automação`** (canto superior direito)
2. Escolhe **"Começar do Zero"** (pula templates prontos)
3. Nomeia a automação conforme indicado
4. Adiciona os nodes na ordem mostrada abaixo
5. Ativa a automação ao final (toggle `Status: Ativo`)

---

## 🤖 AUTOMAÇÃO 1 — Cadência de recuperação

**Nome:** `Demo - Cadencia de recuperacao`

**Objetivo:** Enviar 3 emails pra lead que pediu demo mas não agendou horário no Cal.com. Para automaticamente se a tag `Demo: Aguardando agendamento` sumir (porque ela agendou).

### Estrutura visual

```
[START] Trigger: Tag "Demo: Aguardando agendamento" adicionada
   ↓
[WAIT] 24 horas
   ↓
[IF/ELSE] Tem tag "Demo: Aguardando agendamento"?
   ├── SIM → [SEND EMAIL] Template 1.1
   │         ↓
   │        [WAIT] 3 dias
   │         ↓
   │        [IF/ELSE] Ainda tem tag "Demo: Aguardando agendamento"?
   │         ├── SIM → [SEND EMAIL] Template 1.2
   │         │         ↓
   │         │        [WAIT] 6 dias
   │         │         ↓
   │         │        [IF/ELSE] Ainda tem tag "Demo: Aguardando agendamento"?
   │         │         ├── SIM → [SEND EMAIL] Template 1.3
   │         │         │         ↓
   │         │         │        [WAIT] 5 dias
   │         │         │         ↓
   │         │         │        [REMOVE TAG] Remove "Demo: Aguardando agendamento"
   │         │         │         ↓
   │         │         │        [END]
   │         │         │
   │         │         └── NÃO → [END] (pessoa agendou, para tudo)
   │         │
   │         └── NÃO → [END]
   │
   └── NÃO → [END] (pessoa agendou nas primeiras 24h, para tudo)
```

### Passo-a-passo detalhado

#### Node 1 — Trigger

1. Clica em **`+ Adicionar um gatilho`**
2. Escolhe **`Tag é adicionada`**
3. Tag: digita e seleciona `Demo: Aguardando agendamento`
4. "Executar uma vez" ou "Múltiplas vezes": escolhe **Múltiplas vezes**
5. Salva

#### Node 2 — Wait 24h

1. Clica no **`+`** depois do trigger
2. Categoria: **`Condições e fluxo do trabalho`** → **`Aguardar`**
3. Tipo: **`Período de tempo`**
4. Valor: `1 dia` (ou `24 horas`)
5. Salva

#### Node 3 — If/Else: tem a tag?

1. Clica **`+`** → **`Condições e fluxo do trabalho`** → **`Se/Senão`**
2. Condição: **`Contato`** → **`Tem a tag`**
3. Tag: `Demo: Aguardando agendamento`
4. Salva — vai aparecer 2 caminhos: **Sim** e **Não**

#### Node 4 — Enviar Email 1.1 (caminho SIM)

1. No caminho **Sim**, clica **`+`** → **`Enviando opções`** → **`Envie um e-mail`**
2. Escolhe o template: `[Demo Recovery] 1.1 - vc ainda ta por ai`
3. Confirma configurações:
   - De: `admin@boldfy.com.br`
   - Nome remetente: `Fai da Boldfy`
4. Salva

#### Node 5 — Wait 3 dias

Mesma lógica do Node 2, só que valor = `3 dias`

#### Node 6 — If/Else: ainda tem a tag?

Mesma do Node 3 — reutiliza a condição.

#### Node 7 — Enviar Email 1.2 (caminho SIM)

Igual Node 4, mas template `[Demo Recovery] 1.2 - como funciona`

#### Node 8 — Wait 6 dias

Igual Node 2, valor = `6 dias`

#### Node 9 — If/Else: ainda tem a tag?

Igual Node 3 e 6.

#### Node 10 — Enviar Email 1.3 (caminho SIM)

Igual Node 4, template `[Demo Recovery] 1.3 - ultimo toque`

#### Node 11 — Wait 5 dias

Igual Node 2, valor = `5 dias`

#### Node 12 — Remove tag

1. **`+`** → **`Contatos`** → **`Remover tag`**
2. Tag: `Demo: Aguardando agendamento`
3. Salva

#### Node 13 — End

Automação termina aqui. AC normalmente coloca `[END]` automático.

#### Nos caminhos NÃO dos If/Else:

Em todos os 3 if/else, o caminho **Não** simplesmente termina (não precisa fazer nada). Pessoa removeu a tag, ou seja, agendou → não precisa mais mandar cadência.

### Ativa a automação

Topo da tela → toggle `Inativo` → `Ativo`. Confirma o modal.

✅ **Automação 1 pronta!**

---

## 🤖 AUTOMAÇÃO 2 — Confirmação de agendamento

**Nome:** `Demo - Confirmacao de agendamento`

**Objetivo:** Quando alguém agenda demo no Cal.com, o webhook adiciona a tag `Demo: Agendada`. Essa automação dispara um email de confirmação caloroso.

### Estrutura visual

```
[START] Trigger: Tag "Demo: Agendada" adicionada
   ↓
[SEND EMAIL] Template "[Demo] Confirmacao de agendamento"
   ↓
[END]
```

### Passo-a-passo

#### Node 1 — Trigger

1. **`+ Adicionar um gatilho`** → **`Tag é adicionada`**
2. Tag: `Demo: Agendada`
3. "Múltiplas vezes" (caso a pessoa remarque e a tag saia e volte)
4. Salva

#### Node 2 — Enviar email de confirmação

1. **`+`** → **`Enviando opções`** → **`Envie um e-mail`**
2. Template: `[Demo] Confirmacao de agendamento`
3. Salva

#### Ativa a automação

Toggle `Ativo`.

✅ **Automação 2 pronta!**

---

## 🤖 AUTOMAÇÃO 3 — Cancelamento com reengajamento

**Nome:** `Demo - Cancelamento com reengajamento`

**Objetivo:** Quando alguém cancela a demo, aguarda 5min (caso já remarque no ato). Se não remarcou, manda email de reengajamento. Se ainda não agendou em 3 dias, volta pra cadência de recuperação.

### Estrutura visual

```
[START] Trigger: Tag "Demo: Cancelada" adicionada
   ↓
[WAIT] 5 minutos
   ↓
[IF/ELSE] Tem tag "Demo: Agendada"? (pessoa já remarcou no ato?)
   ├── SIM → [END] (já remarcou, não precisa fazer nada)
   │
   └── NÃO → [SEND EMAIL] Template "[Demo] Cancelamento - tudo bem acontece"
              ↓
             [WAIT] 3 dias
              ↓
             [IF/ELSE] Tem tag "Demo: Agendada"?
              ├── SIM → [END]
              │
              └── NÃO → [ADD TAG] "Demo: Aguardando agendamento"
                         ↓
                        [END] (volta pra cadência de recuperação)
```

### Passo-a-passo

#### Node 1 — Trigger

1. Gatilho: **`Tag é adicionada`**
2. Tag: `Demo: Cancelada`
3. Múltiplas vezes
4. Salva

#### Node 2 — Wait 5 minutos

1. **`Aguardar`** → **`Período de tempo`** → `5 minutos`

#### Node 3 — If/Else: já remarcou?

1. **`Se/Senão`** → **`Contato`** → **`Tem a tag`**
2. Tag: `Demo: Agendada`

#### Node 4 — Caminho SIM (já remarcou)

**`End`** direto. Nada a fazer.

#### Node 5 — Caminho NÃO → Envia email de cancelamento

1. **`Envie um e-mail`**
2. Template: `[Demo] Cancelamento - tudo bem acontece`

#### Node 6 — Wait 3 dias

`Aguardar` → `3 dias`

#### Node 7 — If/Else 2: já remarcou?

Igual Node 3 — tag `Demo: Agendada`.

#### Node 8 — Caminho SIM: END

#### Node 9 — Caminho NÃO: adiciona tag de aguardando

1. **`+`** → **`Contatos`** → **`Adicionar tag`**
2. Tag: `Demo: Aguardando agendamento`

Isso faz a pessoa cair na Automação 1 automaticamente (porque o trigger dela é essa tag ser adicionada).

#### Ativa a automação

Toggle `Ativo`.

✅ **Automação 3 pronta!**

---

## PARTE 4 — Teste end-to-end

### 4.1 Teste do fluxo "não agendou"

1. No site `boldfy.com.br`, abre um CTA de "Agendar Demo" qualquer
2. Preenche com email de teste (ex: `teste-nao-agendou@boldfy-debug.dev`)
3. **Fecha o popup sem agendar no Cal.com**
4. No AC → Contatos → procura pelo email
5. **Confirma:**
   - [ ] Contato existe
   - [ ] Tag `Demo: Aguardando agendamento` aparece
   - [ ] Na aba "Automações" do contato, aparece `Demo - Cadencia de recuperacao` em execução

Pra testar o email funcionando sem esperar 24h:
- Edita a Automação 1, troca o primeiro wait de `24h` pra `1 minuto`
- Aguarda 1-2 min
- Confere se o email caiu no endereço de teste
- **Depois do teste, volta pra 24h**

### 4.2 Teste do fluxo "agendou"

1. Submete form do site novamente com email `teste-agendou@boldfy-debug.dev`
2. Agenda um horário no Cal.com embed (pode cancelar depois)
3. **Confirma no AC (em até 1-2 min):**
   - [ ] Tag `Demo: Aguardando agendamento` foi REMOVIDA
   - [ ] Tag `Demo: Agendada` foi ADICIONADA
   - [ ] Email de confirmação caiu no endereço de teste

### 4.3 Teste do fluxo "cancelou"

1. No Cal.com, vai na reunião agendada no teste 4.2
2. Cancela a reunião
3. **Confirma no AC (em 5 min):**
   - [ ] Tag `Demo: Agendada` removida
   - [ ] Tag `Demo: Cancelada` adicionada
   - [ ] Após 5min: email de reengajamento chega

### 4.4 Cleanup depois dos testes

1. Deleta os contatos de teste: `teste-nao-agendou@...` e `teste-agendou@...`
2. Cancela a reunião de teste no Cal.com (se não cancelou ainda)

---

## ANEXO A — Assinatura padrão da Fai (pra colar em todos os 5 emails)

**Cola isso no final de TODOS os 5 emails, antes de salvar o template:**

```
—

[imagem da Fai: https://www.boldfy.com.br/images/fai-avatar.jpeg — 60px circular]

Fai da Boldfy
Gerente de Educação e Sucesso do Cliente
admin@boldfy.com.br

[logo Boldfy: https://www.boldfy.com.br/images/boldfy-logo.svg — 80px largura]

---

Você recebeu este e-mail porque começou um agendamento de demo no site da Boldfy.
```

### Como fazer a assinatura visual no AC

1. No editor de email, arrasta um bloco de **Imagem** pra parte inferior
2. Faz upload ou cola URL: `https://www.boldfy.com.br/images/fai-avatar.jpeg`
3. Redimensiona pra circular ~60px (se AC permitir)
4. Ao lado, adiciona bloco de texto com:
   - **Fai da Boldfy** (bold)
   - Gerente de Educação e Sucesso do Cliente
   - admin@boldfy.com.br (link mailto)
5. Linha separadora (divider)
6. Bloco de imagem pro logo: `https://www.boldfy.com.br/images/boldfy-logo.svg` (largura 80-100px)
7. Disclaimer em fonte pequena cinza: "Você recebeu este e-mail porque começou um agendamento de demo no site da Boldfy."

### Dica pra economizar tempo

Cria a assinatura **uma vez** no editor de template do AC e salva como **"Bloco Salvo"** (feature do AC). Aí nos próximos 4 templates é só arrastar o bloco salvo no rodapé.

---

## ANEXO B — Variáveis dinâmicas do AC

O AC substitui automaticamente essas "tags" por valores reais do contato ao enviar:

| Variável | Exemplo real |
|---|---|
| `%FIRSTNAME%` | `Maria` |
| `%LASTNAME%` | `Silva` |
| `%EMAIL%` | `maria@empresa.com.br` |
| `%EMPRESA%` | `ACME Corp` |
| `%CARGO%` | `CMO` |
| `%PORTE%` | `51 a 200 funcionários` |

**Onde usar:** já estão nos copies dos emails que você vai colar. Não precisa mexer.

**Cuidado:** se o contato não tem um desses campos preenchido, a variável sai vazia no email. Isso já é tratado no copy que usa só `%FIRSTNAME%` e `%EMPRESA%`, que são sempre preenchidos pelo form.

---

## ANEXO C — Troubleshooting

### Problema: tag não aparece na lista ao configurar trigger/condição

**Causa:** tag ainda não foi criada no AC.
**Solução:** submete 1 form de teste no site com a combinação certa pra gerar a tag. Exemplo: pra criar `Demo: Cancelada`, precisa completar o fluxo até cancelar no Cal.com.

### Problema: email de confirmação não chega após agendar

**Causas possíveis:**
1. Webhook do Cal.com falhou → confere em `Cal.com → Settings → Webhooks` se tem erros
2. Tag `Demo: Agendada` não foi adicionada → confere o contato no AC
3. Automação 2 desativada → confere toggle
4. Spam → confere a pasta de spam do email de teste

### Problema: cadência continua mesmo depois da pessoa agendar

**Causa:** webhook do Cal.com não removeu a tag `Demo: Aguardando agendamento`.
**Diagnóstico:** confere os logs do Vercel em `vercel.com/clararamosms-projects/boldfy-site/logs` filtrando por `cal-webhook`.

### Problema: automação dispara múltiplas vezes

**Causa:** trigger configurado como "Múltiplas vezes" quando devia ser "Uma vez".
**Solução:** edita o trigger.

---

## ANEXO D — Checklist final antes de considerar pronto

- [ ] 5 templates criados, com copy correto e assinatura Fai
- [ ] 3 automações criadas e ATIVAS (toggle ligado)
- [ ] Teste 4.1 passou (cadência de recuperação inicia)
- [ ] Teste 4.2 passou (agendou → tag atualiza → email confirmação)
- [ ] Teste 4.3 passou (cancelou → email reengajamento)
- [ ] Contatos de teste deletados
- [ ] Reunião de teste cancelada no Cal.com
- [ ] Waits que foram reduzidos pra testar voltaram pros valores originais (24h, 3d, 6d, 5d)

---

## ANEXO E — Monitoramento contínuo

Depois que estiver tudo rodando, é interessante olhar periodicamente:

- **AC → Automações → (cada uma)** → aba "Reports" → mostra quantos contatos entraram, quantos saíram, quantos ainda estão dentro
- **Taxa de agendamento**: quantos chegaram em `Demo: Aguardando agendamento` vs quantos chegaram em `Demo: Agendada`
- **Taxa de no-show**: quantos `Demo: Agendada` viraram `Demo: Cancelada`
- **Taxa de recovery**: dos que receberam os emails da cadência, quantos acabaram agendando

Essa visão combina com o GA4 (próximo passo) pra ter o funil completo.

---

**Dúvida durante a execução? Me chama.** 🙂
