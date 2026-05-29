# Cadência de email — Tag `Form: Case Semrush ELG`

Cadência de 4 emails pra disparar no AC quando o lead recebe a tag `Form: Case Semrush ELG` (aplicada automaticamente pela LP `/case-semrush`).

## Gate de segmentação

Dois gates encadeados:

**1) Gate de público** (mesmo padrão do report `Algoritmo LinkedIn 2026`)

- **E1** (entrega do PDF) vai pra TODO mundo que baixou o case, independente do `tipo_de_lead`. Email transacional, é o que a pessoa pediu ao preencher o form.
- **E2, E3, E4** vão SÓ pra `tipo_de_lead = "Líder B2B"`. Parceiros e profissionais individuais ficam fora pra não poluir a base. Eles entram em cadências editoriais próprias quando existirem.

**2) Gate de comportamento** (preenchimento do playbook)

Quem preencher o playbook em qualquer momento da cadência pula o nurture restante e vai direto pro E4 (com 3 dias de delay pra digestão do diagnóstico). Quem não preencher recebe E2 → E3 → E4 na cadência normal.

- **E4 vira pivot pra demo, independente da rota.** Se a pessoa preencheu o playbook, ela já tem o diagnóstico e tá pronta pra conversa de execução. Se não preencheu, o playbook não engatou e a próxima oferta natural é uma conversa direta em vez de mais uma ferramenta.

**Fluxo no AC:**

1. Trigger: tag `Form: Case Semrush ELG` aplicada
2. **E1** (envio imediato, sem gate)
3. If/Else: `tipo_de_lead` = "Líder B2B"?
   - Se NÃO: sai da cadência
   - Se SIM: segue pro passo 4
4. Wait 2 dias → envia **E2**
5. Wait 3 dias → If/Else: tem tag `Form: Playbook ELG`?
   - Se SIM: pula direto pro passo 7
   - Se NÃO: envia **E3** e segue pro passo 6
6. Wait 3 dias → segue pro passo 7
7. **E4** (último toque, ask de demo)
8. Sai da cadência

## Timing

| Email | Quando dispara | Quem recebe |
|-------|---------------|-------------|
| E1    | Imediato (na hora do submit) | Todos os leads |
| E2    | D+2 às 9h (horário do lead, se possível) | Só `Líder B2B` |
| E3    | D+5 às 9h | Só `Líder B2B` que **não preencheu** o playbook |
| E4    | D+8 às 9h (rota normal) **ou** D+3 a partir do preenchimento do playbook (rota antecipada) | Todo `Líder B2B`, último toque antes do exit |

## Variáveis usadas

- `%FIRSTNAME%`, primeiro nome do lead
- `%COMPANYNAME%`, nome da empresa (custom field `empresa`, só presente em Líder B2B)
- Link do PDF: `https://boldfy.com.br/reports/Case-Semrush-Employee-Led-Growth-Boldfy.pdf`
- Link do playbook (com UTM): `https://boldfy.com.br/ferramentas/playbook-employee-led-growth?utm_source=email&utm_medium=email&utm_campaign=case-semrush`

---

## E1 — Entrega (D+0, todos os leads)

**Assunto:** `%FIRSTNAME%, aqui tá o case da Semrush em PDF`

**Pré-header:** `Link direto, mais o que esperar dele.`

**HTML:**

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>%FIRSTNAME%, aqui tá o case da Semrush em PDF</title>
</head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td align="center" style="padding: 40px 20px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="580" style="max-width: 580px;">
        <tr>
          <td style="color: #1a1a1a; font-size: 16px; line-height: 1.65;">
            <p style="margin: 0 0 18px;">Oi %FIRSTNAME%,</p>
            <p style="margin: 0 0 18px;">Obrigada por baixar o case. O PDF tá aqui:</p>
            <p style="margin: 0 0 22px;"><a href="https://boldfy.com.br/reports/Case-Semrush-Employee-Led-Growth-Boldfy.pdf" style="color: #CD50F1; text-decoration: none; font-weight: 600;">Baixar o Case Semrush ELG (PDF)</a></p>
            <p style="margin: 0 0 18px;">São <strong>12 minutos de leitura</strong>, divididos em duas partes:</p>
            <p style="margin: 0 0 18px;"><strong>1. Os três pilares do programa.</strong></p>
            <p style="margin: 0 0 18px;">Conteúdo, apoio direto e amplificação, com prints dos posts originais publicados pelos colaboradores.</p>
            <p style="margin: 0 0 18px;"><strong>2. Os números.</strong></p>
            <p style="margin: 0 0 18px;"><strong style="background: linear-gradient(180deg, transparent 60%, #f3d9fa 60%);">+500k de alcance em 2 meses</strong>, <strong>R$ 360 mil em earned media</strong> calculado pelo CPM real do LinkedIn no Brasil, e a projeção anual.</p>
            <p style="margin: 0 0 18px;">Sugestão de uso: lê uma vez pra absorver, depois salva na pasta de referência. Rende bem como ponto de partida pra discussão de planejamento, principalmente quando alguém pergunta por que a página da empresa parou de performar.</p>
            <p style="margin: 0 0 18px;">Nos próximos dias mando mais <strong>três emails curtos</strong> com pedaços que ficaram de fora do PDF, recortes do método, e uma ferramenta que ajuda a aplicar isso na prática.</p>
            <p style="margin: 0 0 18px;">Até lá,</p>
            <p style="margin: 0 0 18px;">Clara</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 36px 0 0;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td valign="top" width="80" style="padding-right: 16px;">
                  <img src="https://boldfy.activehosted.com/content/rpZeyj/2026/05/07/6c58848c-db64-4b05-b9cd-fe40c8178dbc.png" width="64" height="64" alt="Clara Ramos" style="display: block; border-radius: 50%; width: 64px; height: 64px;">
                </td>
                <td valign="top">
                  <p style="margin: 0 0 2px; font-size: 15px; font-weight: 700; color: #1a1a1a; line-height: 1.3;">Clara Ramos</p>
                  <p style="margin: 0 0 2px; font-size: 13px; color: #5a5a5a; line-height: 1.4;">Founder @ Boldfy</p>
                  <p style="margin: 0 0 8px; font-size: 13px; line-height: 1.4;">
                    <a href="https://boldfy.com.br" style="color: #CD50F1; text-decoration: none;">www.boldfy.com.br</a>
                  </p>
                  <p style="margin: 0 0 16px; font-size: 12px; color: #8a8a8a; line-height: 1.5;">Transformamos colaboradores em influencers corporativos</p>
                  <p style="margin: 0;">
                    <a href="https://www.linkedin.com/in/clararamosm/" style="display: inline-block; width: 32px; height: 32px; background-color: #0A66C2; color: #ffffff; text-align: center; line-height: 32px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 4px; vertical-align: middle; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">in</a>
                    <a href="https://boldfy.com.br/agendar-demo?utm_source=email&utm_medium=email&utm_campaign=case-semrush" style="display: inline-block; padding: 9px 16px; background-color: #CD50F1; color: #ffffff; font-size: 12px; font-weight: 600; text-decoration: none; border-radius: 6px; vertical-align: middle; margin-left: 8px;">Marque um diagnóstico</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
```

---

## Card do Playbook (embed reutilizável em E2 e E3)

Versão horizontal/compacta do card da LP do playbook, adaptado pra rodar em email (HTML inline, sem Google Fonts externas, sem CSS vars, sem `filter: blur`, com `bgcolor` de fallback no botão pra renderizar bem no Outlook). É a peça que serve de gancho visual no meio dos emails 2 e 3.

**Por que HTML e não JPEG:** o botão "Começar o quiz" continua clicável de verdade, não vira link de imagem inteira; não quebra se o cliente bloquear imagens; o texto fica selecionável e acessível. JPEG só compensaria se algum cliente crítico do ICP renderizasse mal HTML estilizado, o que não é o caso.

```html
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 22px 0;">
  <tr>
    <td bgcolor="#ffffff" style="background-color: #ffffff; border: 1px solid #efd6fa; border-radius: 16px; padding: 24px 26px;">
      <p style="margin: 0 0 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
        <span style="display: inline-block; padding: 5px 11px; background-color: #faecff; color: #CD50F1; font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; border-radius: 999px;">Ferramenta gratuita Boldfy</span>
      </p>
      <p style="margin: 0 0 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 21px; line-height: 1.22; font-weight: 800; color: #2A1639; letter-spacing: -0.02em;">
        Sua estratégia de <span style="color: #CD50F1;">Employee-Led Growth</span> em 5 minutos
      </p>
      <p style="margin: 0 0 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 13.5px; line-height: 1.55; color: #5a4768;">
        Conta o cenário da %COMPANYNAME% pra Fai. Ela devolve um playbook acionável, personalizado pro seu time.
      </p>
      <p style="margin: 0 0 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 12.5px; color: #5a4768; line-height: 1.6;">
        <span style="color: #CD50F1; font-weight: 700;">✓</span> Plano em 3 fases &nbsp;&nbsp;
        <span style="color: #CD50F1; font-weight: 700;">✓</span> Calculadora de earned media &nbsp;&nbsp;
        <span style="color: #CD50F1; font-weight: 700;">✓</span> Link compartilhável
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td bgcolor="#CD50F1" style="background-color: #CD50F1; border-radius: 10px;">
            <a href="https://boldfy.com.br/ferramentas/playbook-employee-led-growth?utm_source=email&utm_medium=email&utm_campaign=case-semrush" style="display: inline-block; padding: 11px 22px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 10px;">Começar o quiz →</a>
          </td>
          <td style="padding-left: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 12px; color: #6F5B7A;">
            ~5 min &nbsp;·&nbsp; R$ 0
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

---

## E2 — A virada estrutural (D+2, só Líder B2B)

**Assunto:** `o que matou a página da empresa`

**Pré-header:** `O algoritmo explica só metade da queda.`

**HTML:**

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>o que matou a página da empresa</title>
</head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td align="center" style="padding: 40px 20px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="580" style="max-width: 580px;">
        <tr>
          <td style="color: #1a1a1a; font-size: 16px; line-height: 1.65;">
            <p style="margin: 0 0 18px;">Oi %FIRSTNAME%,</p>
            <p style="margin: 0 0 18px;">Tem um número no case da Semrush que choca mais que os outros: páginas de empresa caíram <strong style="background: linear-gradient(180deg, transparent 60%, #f3d9fa 60%);">66% de alcance no LinkedIn entre 2024 e 2026</strong>.</p>
            <p style="margin: 0 0 18px;">O algoritmo explica <strong>metade dessa queda</strong>. A outra metade tá no comportamento do leitor.</p>
            <p style="margin: 0 0 18px;">Hoje, quando alguém abre o feed e vê um post saindo de um logo, o cérebro processa como institucional, anúncio, alguém querendo vender. O mesmo conteúdo, saindo de uma pessoa, lê como reflexão de alguém que pensou aquilo e quis dividir. Dado idêntico, percepção completamente diferente.</p>
            <p style="margin: 0 0 18px;">A Semrush mudou o ponto de partida. Em vez de brigar com o algoritmo, colocou <strong>cerca de 30 colaboradores</strong> pra publicar pelos próprios ângulos, cada um com voz própria. O feed devolveu em multiplicador de alcance.</p>
            <p style="margin: 0 0 18px;">Se a curva da página de empresa da %COMPANYNAME% tá caindo e você ainda não decidiu o que fazer, esse é o momento de testar a hipótese: <strong style="background: linear-gradient(180deg, transparent 60%, #f3d9fa 60%);">o que muda quando o time vira o canal?</strong></p>
            <p style="margin: 0 0 8px;">A Fai (nossa estrategista de IA) montou um diagnóstico interativo pra ajudar com essa pergunta:</p>
            <!-- ↓ CARD DO PLAYBOOK (snippet reutilizável, ver topo do doc) -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 22px 0;">
              <tr>
                <td bgcolor="#ffffff" style="background-color: #ffffff; border: 1px solid #efd6fa; border-radius: 16px; padding: 24px 26px;">
                  <p style="margin: 0 0 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
                    <span style="display: inline-block; padding: 5px 11px; background-color: #faecff; color: #CD50F1; font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; border-radius: 999px;">Ferramenta gratuita Boldfy</span>
                  </p>
                  <p style="margin: 0 0 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 21px; line-height: 1.22; font-weight: 800; color: #2A1639; letter-spacing: -0.02em;">
                    Sua estratégia de <span style="color: #CD50F1;">Employee-Led Growth</span> em 5 minutos
                  </p>
                  <p style="margin: 0 0 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 13.5px; line-height: 1.55; color: #5a4768;">
                    Conta o cenário da %COMPANYNAME% pra Fai. Ela devolve um playbook acionável, personalizado pro seu time.
                  </p>
                  <p style="margin: 0 0 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 12.5px; color: #5a4768; line-height: 1.6;">
                    <span style="color: #CD50F1; font-weight: 700;">✓</span> Plano em 3 fases &nbsp;&nbsp;
                    <span style="color: #CD50F1; font-weight: 700;">✓</span> Calculadora de earned media &nbsp;&nbsp;
                    <span style="color: #CD50F1; font-weight: 700;">✓</span> Link compartilhável
                  </p>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td bgcolor="#CD50F1" style="background-color: #CD50F1; border-radius: 10px;">
                        <a href="https://boldfy.com.br/ferramentas/playbook-employee-led-growth?utm_source=email&utm_medium=email&utm_campaign=case-semrush" style="display: inline-block; padding: 11px 22px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 10px;">Começar o quiz →</a>
                      </td>
                      <td style="padding-left: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 12px; color: #6F5B7A;">
                        ~5 min &nbsp;·&nbsp; R$ 0
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <!-- ↑ FIM DO CARD -->
            <p style="margin: 0 0 18px;">Abraço,</p>
            <p style="margin: 0 0 18px;">Clara</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 36px 0 0;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td valign="top" width="80" style="padding-right: 16px;">
                  <img src="https://boldfy.activehosted.com/content/rpZeyj/2026/05/07/6c58848c-db64-4b05-b9cd-fe40c8178dbc.png" width="64" height="64" alt="Clara Ramos" style="display: block; border-radius: 50%; width: 64px; height: 64px;">
                </td>
                <td valign="top">
                  <p style="margin: 0 0 2px; font-size: 15px; font-weight: 700; color: #1a1a1a; line-height: 1.3;">Clara Ramos</p>
                  <p style="margin: 0 0 2px; font-size: 13px; color: #5a5a5a; line-height: 1.4;">Founder @ Boldfy</p>
                  <p style="margin: 0 0 8px; font-size: 13px; line-height: 1.4;">
                    <a href="https://boldfy.com.br" style="color: #CD50F1; text-decoration: none;">www.boldfy.com.br</a>
                  </p>
                  <p style="margin: 0 0 16px; font-size: 12px; color: #8a8a8a; line-height: 1.5;">Transformamos colaboradores em influencers corporativos</p>
                  <p style="margin: 0;">
                    <a href="https://www.linkedin.com/in/clararamosm/" style="display: inline-block; width: 32px; height: 32px; background-color: #0A66C2; color: #ffffff; text-align: center; line-height: 32px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 4px; vertical-align: middle; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">in</a>
                    <a href="https://boldfy.com.br/agendar-demo?utm_source=email&utm_medium=email&utm_campaign=case-semrush" style="display: inline-block; padding: 9px 16px; background-color: #CD50F1; color: #ffffff; font-size: 12px; font-weight: 600; text-decoration: none; border-radius: 6px; vertical-align: middle; margin-left: 8px;">Marque um diagnóstico</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
```

---

## E3 — Por que tantos programas morrem em 3 semanas (D+5, só Líder B2B)

**Assunto:** `90% dos programas de advocacy morrem na praia`

**Pré-header:** `Três engrenagens. Quase ninguém roda as três.`

**HTML:**

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>90% dos programas de advocacy morrem na praia</title>
</head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td align="center" style="padding: 40px 20px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="580" style="max-width: 580px;">
        <tr>
          <td style="color: #1a1a1a; font-size: 16px; line-height: 1.65;">
            <p style="margin: 0 0 18px;">Oi %FIRSTNAME%,</p>
            <p style="margin: 0 0 18px;">Quase toda empresa B2B brasileira já tentou advocacy em algum momento.</p>
            <p style="margin: 0 0 18px;">Um RH animado mandando "vamos repostar os posts da página". Um CMO criando canal no Slack chamado #amplificação. Alguém da liderança batendo cabeça com colaborador que não engaja.</p>
            <p style="margin: 0 0 18px;"><strong style="background: linear-gradient(180deg, transparent 60%, #f3d9fa 60%);">Em 2 ou 3 semanas, morre.</strong></p>
            <p style="margin: 0 0 18px;">Boa intenção sobra. O que falta é entender que advocacy de verdade tem <strong>três engrenagens</strong>, e a maioria dos programas tenta rodar só com uma.</p>
            <p style="margin: 0 0 18px;"><strong>1. Conteúdo que vale salvar.</strong></p>
            <p style="margin: 0 0 18px;">Esquece post de marca disfarçado. O que funciona em perfil pessoal é denso, prático, salvável: cheat sheet, framework, leitura crítica de uma decisão real.</p>
            <p style="margin: 0 0 18px;"><strong>2. Apoio direto, perfil a perfil.</strong></p>
            <p style="margin: 0 0 18px;">A líder do programa da Semrush sentou com cada um dos ~30 colaboradores pra calibrar tom de voz e construir confiança pra publicar.</p>
            <p style="margin: 0 0 18px;"><strong>3. Amplificação contextual.</strong></p>
            <p style="margin: 0 0 18px;">O mesmo ativo aparece com hooks e tratamentos visuais diferentes pra cada pessoa, então o feed não percebe como repetição.</p>
            <p style="margin: 0 0 18px;"><strong style="background: linear-gradient(180deg, transparent 60%, #f3d9fa 60%);">Tira qualquer uma e o sistema desaba.</strong> Sem conteúdo bom vira spam corporativo, sem apoio direto ninguém publica, sem variação visual o algoritmo achata o alcance porque enxerga redundância.</p>
            <p style="margin: 0 0 8px;">O playbook que a Fai monta entrega exatamente esse diagnóstico: qual engrenagem tá faltando, qual ordem priorizar, e como medir se tá funcionando.</p>
            <!-- ↓ CARD DO PLAYBOOK (snippet reutilizável, ver topo do doc) -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 22px 0;">
              <tr>
                <td bgcolor="#ffffff" style="background-color: #ffffff; border: 1px solid #efd6fa; border-radius: 16px; padding: 24px 26px;">
                  <p style="margin: 0 0 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
                    <span style="display: inline-block; padding: 5px 11px; background-color: #faecff; color: #CD50F1; font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; border-radius: 999px;">Ferramenta gratuita Boldfy</span>
                  </p>
                  <p style="margin: 0 0 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 21px; line-height: 1.22; font-weight: 800; color: #2A1639; letter-spacing: -0.02em;">
                    Sua estratégia de <span style="color: #CD50F1;">Employee-Led Growth</span> em 5 minutos
                  </p>
                  <p style="margin: 0 0 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 13.5px; line-height: 1.55; color: #5a4768;">
                    Conta o cenário da %COMPANYNAME% pra Fai. Ela devolve um playbook acionável, personalizado pro seu time.
                  </p>
                  <p style="margin: 0 0 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 12.5px; color: #5a4768; line-height: 1.6;">
                    <span style="color: #CD50F1; font-weight: 700;">✓</span> Plano em 3 fases &nbsp;&nbsp;
                    <span style="color: #CD50F1; font-weight: 700;">✓</span> Calculadora de earned media &nbsp;&nbsp;
                    <span style="color: #CD50F1; font-weight: 700;">✓</span> Link compartilhável
                  </p>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td bgcolor="#CD50F1" style="background-color: #CD50F1; border-radius: 10px;">
                        <a href="https://boldfy.com.br/ferramentas/playbook-employee-led-growth?utm_source=email&utm_medium=email&utm_campaign=case-semrush" style="display: inline-block; padding: 11px 22px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 10px;">Começar o quiz →</a>
                      </td>
                      <td style="padding-left: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 12px; color: #6F5B7A;">
                        ~5 min &nbsp;·&nbsp; R$ 0
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <!-- ↑ FIM DO CARD -->
            <p style="margin: 0 0 18px;">Abraço,</p>
            <p style="margin: 0 0 18px;">Clara</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 36px 0 0;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td valign="top" width="80" style="padding-right: 16px;">
                  <img src="https://boldfy.activehosted.com/content/rpZeyj/2026/05/07/6c58848c-db64-4b05-b9cd-fe40c8178dbc.png" width="64" height="64" alt="Clara Ramos" style="display: block; border-radius: 50%; width: 64px; height: 64px;">
                </td>
                <td valign="top">
                  <p style="margin: 0 0 2px; font-size: 15px; font-weight: 700; color: #1a1a1a; line-height: 1.3;">Clara Ramos</p>
                  <p style="margin: 0 0 2px; font-size: 13px; color: #5a5a5a; line-height: 1.4;">Founder @ Boldfy</p>
                  <p style="margin: 0 0 8px; font-size: 13px; line-height: 1.4;">
                    <a href="https://boldfy.com.br" style="color: #CD50F1; text-decoration: none;">www.boldfy.com.br</a>
                  </p>
                  <p style="margin: 0 0 16px; font-size: 12px; color: #8a8a8a; line-height: 1.5;">Transformamos colaboradores em influencers corporativos</p>
                  <p style="margin: 0;">
                    <a href="https://www.linkedin.com/in/clararamosm/" style="display: inline-block; width: 32px; height: 32px; background-color: #0A66C2; color: #ffffff; text-align: center; line-height: 32px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 4px; vertical-align: middle; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">in</a>
                    <a href="https://boldfy.com.br/agendar-demo?utm_source=email&utm_medium=email&utm_campaign=case-semrush" style="display: inline-block; padding: 9px 16px; background-color: #CD50F1; color: #ffffff; font-size: 12px; font-weight: 600; text-decoration: none; border-radius: 6px; vertical-align: middle; margin-left: 8px;">Marque um diagnóstico</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
```

---

## E4 — A pergunta que fica + ask de demo (D+8 normal ou D+3 pós-playbook)

**Assunto:** `última coisa sobre o case Semrush`

**Pré-header:** `Uma pergunta inconveniente, e uma proposta de 30 min.`

**HTML:**

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>última coisa sobre o case Semrush</title>
</head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td align="center" style="padding: 40px 20px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="580" style="max-width: 580px;">
        <tr>
          <td style="color: #1a1a1a; font-size: 16px; line-height: 1.65;">
            <p style="margin: 0 0 18px;">Oi %FIRSTNAME%,</p>
            <p style="margin: 0 0 18px;">Tem uma pergunta no fim do case da Semrush que vale repetir aqui, porque ela é meio inconveniente:</p>
            <p style="margin: 0 0 18px; padding: 14px 18px; background-color: #f7f0fb; border-left: 3px solid #CD50F1; font-style: italic;">Se a sua marca dependesse hoje dos seus colaboradores pra existir no LinkedIn, como ela estaria no mercado?</p>
            <p style="margin: 0 0 18px;">A maioria das empresas B2B no Brasil não respondeu essa pergunta ainda. Não por falta de vontade. É muito mais fácil terceirizar pra uma agência postar pela página oficial do que estruturar um sistema interno que faz o time virar canal.</p>
            <p style="margin: 0 0 18px;">A Semrush escolheu o caminho mais difícil e <strong style="background: linear-gradient(180deg, transparent 60%, #f3d9fa 60%);">foi adquirida pela Adobe enquanto isso</strong>. Os colaboradores continuam publicando, porque <strong>o programa virou estrutura</strong>.</p>
            <p style="margin: 0 0 18px;">Esse é o ponto inteiro do método. Programa de advocacy decente vira <strong>engrenagem que roda sozinha depois de calibrada</strong>, sem depender do CMO da vez segurando heroicamente.</p>
            <p style="margin: 0 0 22px;">Se essa pergunta tá ressoando pra %COMPANYNAME%, o próximo passo mais útil é uma conversa direta. <strong style="background: linear-gradient(180deg, transparent 60%, #f3d9fa 60%);">30 minutos comigo</strong>, sem pitch de slide nem comercial bolado. A gente abre o quadro branco no Figma, olha a sua realidade, eu mostro o que faria diferente, e você decide se faz sentido continuar.</p>
            <p style="margin: 0 0 22px;"><a href="https://boldfy.com.br/agendar-demo?utm_source=email&utm_medium=email&utm_campaign=case-semrush" style="display: inline-block; padding: 12px 22px; background-color: #CD50F1; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 6px;">Marcar 30 min com a Clara →</a></p>
            <p style="margin: 0 0 18px;">Se preferir começar com uma troca de email, é só responder esse mesmo. <strong>Eu leio pessoalmente.</strong></p>
            <p style="margin: 0 0 18px;">Abraço,</p>
            <p style="margin: 0 0 18px;">Clara</p>
          </td>
        </tr>
        <tr>
          <td style="padding: 36px 0 0;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td valign="top" width="80" style="padding-right: 16px;">
                  <img src="https://boldfy.activehosted.com/content/rpZeyj/2026/05/07/6c58848c-db64-4b05-b9cd-fe40c8178dbc.png" width="64" height="64" alt="Clara Ramos" style="display: block; border-radius: 50%; width: 64px; height: 64px;">
                </td>
                <td valign="top">
                  <p style="margin: 0 0 2px; font-size: 15px; font-weight: 700; color: #1a1a1a; line-height: 1.3;">Clara Ramos</p>
                  <p style="margin: 0 0 2px; font-size: 13px; color: #5a5a5a; line-height: 1.4;">Founder @ Boldfy</p>
                  <p style="margin: 0 0 8px; font-size: 13px; line-height: 1.4;">
                    <a href="https://boldfy.com.br" style="color: #CD50F1; text-decoration: none;">www.boldfy.com.br</a>
                  </p>
                  <p style="margin: 0 0 16px; font-size: 12px; color: #8a8a8a; line-height: 1.5;">Transformamos colaboradores em influencers corporativos</p>
                  <p style="margin: 0;">
                    <a href="https://www.linkedin.com/in/clararamosm/" style="display: inline-block; width: 32px; height: 32px; background-color: #0A66C2; color: #ffffff; text-align: center; line-height: 32px; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 4px; vertical-align: middle; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">in</a>
                    <a href="https://boldfy.com.br/agendar-demo?utm_source=email&utm_medium=email&utm_campaign=case-semrush" style="display: inline-block; padding: 9px 16px; background-color: #CD50F1; color: #ffffff; font-size: 12px; font-weight: 600; text-decoration: none; border-radius: 6px; vertical-align: middle; margin-left: 8px;">Marque um diagnóstico</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
```

---

## Métricas a acompanhar (primeiros 30 dias)

- **Open rate de cada email.** Meta E1 acima de 60% (transacional), E2 a E4 acima de 35%.
- **CTR pro playbook.** Meta acumulada E2+E3+E4 acima de 12% dos Líderes B2B que entraram na cadência.
- **Conversão do playbook.** % dos cliques que de fato preenchem o playbook (já medido pelo `playbook-employee-led-growth-leads.ts`).
- **Reply rate do E4.** Métrica qualitativa, indica intent quente.

## Próximos passos após esta cadência

- **Marcou demo no E4** → vira oportunidade comercial, sai do nurture e entra no fluxo de pré-venda.
- **Preencheu o playbook mas não marcou demo no E4** → candidato pra cadência editorial leve (newsletter, próximo report) com toque manual depois de 30 dias.
- **Não preencheu nada, só abriu emails** → candidato pra retargeting LinkedIn Ads do playbook ou do próprio case.
- **Não abriu E3/E4** → cooldown de 60 dias antes de entrar em qualquer cadência editorial nova.
