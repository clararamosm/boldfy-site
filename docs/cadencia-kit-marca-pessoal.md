# Cadência de email — Kit de Marca Pessoal (report Algoritmo LinkedIn → Parceiro + Profissional Individual)

Cadência de 4 emails pra divulgar o **Kit de Marca Pessoal** (físico, ~20 unidades restantes) pra quem preencheu o report `Algoritmo LinkedIn 2026` e foi classificado como **Parceiro** ou **Profissional Individual**.

Líderes B2B NÃO entram aqui — seguem na cadência B2B (demo/playbook). Esta é o destino editorial dos outros dois segmentos, que antes ficavam sem nurture próprio.

## Duas versões de cada email

Mesma estrutura, com 1–2 blocos trocados por segmento:

- **Profissional Individual** → usa o kit na **própria marca pessoal**.
- **Parceiro** (agência/consultor) → usa o método **nos clientes** + na própria marca.

Cada email vem nas **duas versões completas** (HTML pronto pra colar). Sobe a versão certa em cada braço do If/Else por `tipo_de_lead`.

## Gate de segmentação (AC)

1. Trigger: tag `Form: Algoritmo LinkedIn 2026` **E** `tipo_de_lead` ∈ {Parceiro, Profissional Individual}.
2. If/Else por `tipo_de_lead` decide a versão de cada email.
3. Quem responder pedindo o kit sai do nurture e vira atendimento manual (link de pagamento + frete).

## Timing

| Email | Quando dispara | Assunto |
|-------|---------------|---------|
| E1 | D+0 | o algoritmo do LinkedIn tá sendo cruel (e bem seletivo) |
| E2 | D+2 às 9h | por que umas marcas grudam e outras somem no feed |
| E3 | D+4 às 9h | o kit que eu fiz pra uma mentoria que não rolou |
| E4 | D+7 às 9h | sobraram poucos e eu não vou reimprimir |

## Variáveis e assets

- `%FIRSTNAME%` — primeiro nome. (Não use `%COMPANYNAME%`: Parceiro/Profissional não têm `empresa` preenchido.)
- **Visuais do kit (já hospedados no site, versionados em `public/images/`):**
  - E2 → `https://boldfy.com.br/images/kit-flip.gif` — **GIF** de você folheando o workbook (~4s, 1.9MB, exibido a 400px). Teaser de movimento. O 1º frame é a capa, então em clientes que não animam GIF (ex: Outlook) aparece a capa parada.
  - E3 → `https://boldfy.com.br/images/kit-flatlay.jpg` — flat-lay roxo com a caixa inteira + a sacotinha "seu kit acabou de chegar".
  - E4 → `https://boldfy.com.br/images/kit-clara.jpg` — Clara segurando o kit; rosto e calor no fechamento.
  - As URLs reais já estão no HTML dos emails — não precisa trocar nada. Só lembrar que carregam **depois do deploy** (a campanha precisa sair com o site já no ar com os assets).
  - Pra hospedar no AC em vez do site (pra ter no acervo de lá), sobe em *Campaigns → imagens* e troca as URLs.

## Oferta / mecânica

- Kit físico: workbook 100+ páginas, 6 cheat sheets (A5), 4 frameworks (A3), bloquinho, adesivos, post-its.
- Preço: lançou a R$ 320 em 2025; agora **R$ 220** + frete.
- CTA da cadência = **responder o email** (botão `mailto:`). A Clara devolve link de pagamento + frete pelo CEP.

---

## E1 — A tese do algoritmo (D+0)

**Assunto:** `o algoritmo do LinkedIn tá sendo cruel (e bem seletivo)`

**Pré-header:** `ele separou quem trabalha marca de quem só posta.`

### E1 — versão PROFISSIONAL INDIVIDUAL

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>o algoritmo do LinkedIn tá sendo cruel (e bem seletivo)</title>
</head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td align="center" style="padding: 40px 20px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="580" style="max-width: 580px;">
        <tr>
          <td style="color: #1a1a1a; font-size: 16px; line-height: 1.6;">
            <p style="margin: 0 0 16px;">Oi %FIRSTNAME%,</p>
            <p style="margin: 0 0 16px;">Você baixou o report do algoritmo, então já sabe que o jogo mudou.</p>
            <p style="margin: 0 0 16px;">Tem uma parte que o report não falou em voz alta. É a que mais me incomoda:</p>
            <p style="margin: 0 0 16px; font-size: 18px; line-height: 1.45;"><strong style="background: linear-gradient(180deg, transparent 60%, #f3d9fa 60%);">o algoritmo novo separa quem é lembrado por uma marca pessoal de quem some no feed.</strong></p>
            <p style="margin: 0 0 16px;">Consistência e um post bom de vez em quando já não seguram ninguém. A "receitinha de bolo" (postar todo dia, regrinha de horário, gancho visual) parou de funcionar sozinha.</p>
            <p style="margin: 0 0 16px;">O detalhe que pega: o algoritmo não te pune por postar pouco. Ele te ignora quando não consegue te associar a nada.</p>
            <p style="margin: 0 0 16px;">Se quem bate o olho no seu perfil não sabe na hora pelo que você é conhecido, o post vira ruído, por mais bonito que seja.</p>
            <p style="margin: 0 0 16px;">Tem uma janela boa nisso tudo, e eu te conto nos próximos dias. Por ora, fica com isto: o que decide quem aparece é o quanto a sua marca é clara o suficiente pra ser lembrada.</p>
            <p style="margin: 0 0 18px;">Qualquer coisa, responde esse email. <strong>Eu leio pessoalmente.</strong></p>
            <p style="margin: 0 0 4px;">Abraço,</p>
            <p style="margin: 0;">Clara</p>
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

### E1 — versão PARCEIRO

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>o algoritmo do LinkedIn tá sendo cruel (e bem seletivo)</title>
</head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td align="center" style="padding: 40px 20px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="580" style="max-width: 580px;">
        <tr>
          <td style="color: #1a1a1a; font-size: 16px; line-height: 1.6;">
            <p style="margin: 0 0 16px;">Oi %FIRSTNAME%,</p>
            <p style="margin: 0 0 16px;">Você baixou o report do algoritmo, então já sabe que o jogo mudou.</p>
            <p style="margin: 0 0 16px;">Tem uma parte que o report não falou em voz alta. É a que mais me incomoda:</p>
            <p style="margin: 0 0 16px; font-size: 18px; line-height: 1.45;"><strong style="background: linear-gradient(180deg, transparent 60%, #f3d9fa 60%);">o algoritmo novo separa quem é lembrado por uma marca pessoal de quem some no feed.</strong></p>
            <p style="margin: 0 0 16px;">Consistência e um post bom de vez em quando já não seguram ninguém. A "receitinha de bolo" parou de funcionar sozinha.</p>
            <p style="margin: 0 0 16px;">E pra quem trabalha marca dos outros, isso pesa em dobro. Seus clientes estão sentindo agora: o que entregava no calendário deles parou de entregar, e a cobrança vem pra você.</p>
            <p style="margin: 0 0 16px;">O algoritmo segue ignorando quem ele não consegue associar a um posicionamento claro, seja a sua marca ou a do cliente.</p>
            <p style="margin: 0 0 16px;">Tem uma janela boa nisso tudo, e eu te conto nos próximos dias. Por ora, fica com isto: o que decide quem aparece é o quanto a marca é clara o suficiente pra ser lembrada.</p>
            <p style="margin: 0 0 18px;">Qualquer coisa, responde esse email. <strong>Eu leio pessoalmente.</strong></p>
            <p style="margin: 0 0 4px;">Abraço,</p>
            <p style="margin: 0;">Clara</p>
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

## E2 — O método por trás de quem é lembrado (D+2)

**Assunto:** `por que umas marcas grudam e outras somem no feed`

**Pré-header:** `não é sorte, é método. e eu coloquei o meu inteiro no papel.`

### E2 — versão PROFISSIONAL INDIVIDUAL

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>por que umas marcas grudam e outras somem no feed</title>
</head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td align="center" style="padding: 40px 20px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="580" style="max-width: 580px;">
        <tr>
          <td style="color: #1a1a1a; font-size: 16px; line-height: 1.6;">
            <p style="margin: 0 0 16px;">Oi %FIRSTNAME%,</p>
            <p style="margin: 0 0 16px;">Ontem te falei que o algoritmo virou um filtro de quem é lembrado.</p>
            <p style="margin: 0 0 16px;">Hoje: o que tá por trás de quem gruda na cabeça das pessoas.</p>
            <p style="margin: 0 0 16px;">Quando alguém te descreve numa frase, sem hesitar, não foi sorte. Tem método ali.</p>
            <p style="margin: 0 0 16px;">No meu começo eu era "a menina do roxo que fala de branding". Simples, mas era uma <strong style="background: linear-gradient(180deg, transparent 60%, #f3d9fa 60%);">âncora de memória</strong>, o tipo de coisa que o algoritmo e as pessoas usam pra te lembrar.</p>
            <p style="margin: 0 0 14px;">Construir isso de propósito segue um caminho que eu refino há anos e uso até hoje:</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 18px;">
              <tr><td valign="top" width="22" style="font-size: 16px; line-height: 1.5; color: #CD50F1; font-weight: 700;">1.</td><td style="font-size: 15px; line-height: 1.5; color: #1a1a1a; padding-bottom: 9px;"><strong>Propósito.</strong> Seu porquê, a bússola do resto.</td></tr>
              <tr><td valign="top" width="22" style="font-size: 16px; line-height: 1.5; color: #CD50F1; font-weight: 700;">2.</td><td style="font-size: 15px; line-height: 1.5; color: #1a1a1a; padding-bottom: 9px;"><strong>Audiência.</strong> Pra quem você fala e o que essa galera quer de você.</td></tr>
              <tr><td valign="top" width="22" style="font-size: 16px; line-height: 1.5; color: #CD50F1; font-weight: 700;">3.</td><td style="font-size: 15px; line-height: 1.5; color: #1a1a1a; padding-bottom: 9px;"><strong>Personalidade e tom de voz.</strong> O que faz o conteúdo soar como você.</td></tr>
              <tr><td valign="top" width="22" style="font-size: 16px; line-height: 1.5; color: #CD50F1; font-weight: 700;">4.</td><td style="font-size: 15px; line-height: 1.5; color: #1a1a1a; padding-bottom: 9px;"><strong>OKR de marca.</strong> Objetivo e resultados-chave, pra não postar no escuro.</td></tr>
              <tr><td valign="top" width="22" style="font-size: 16px; line-height: 1.5; color: #CD50F1; font-weight: 700;">5.</td><td style="font-size: 15px; line-height: 1.5; color: #1a1a1a;"><strong>Conteúdo e perfil.</strong> Como tudo isso vira post, bio e interação.</td></tr>
            </table>
            <p style="margin: 0 0 16px;">É o processo que eu faria com você pra tirar a sua marca do "posto e torço" e botar num lugar onde as pessoas sabem pelo que te procurar.</p>
            <p style="margin: 0 0 14px;">Organizei ele inteiro num material físico. É esse aqui:</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 18px;">
              <tr><td align="center"><img src="https://boldfy.com.br/images/kit-flip.gif" width="400" alt="Folheando o workbook do Kit de Marca Pessoal" style="display: block; width: 100%; max-width: 400px; height: auto; border-radius: 14px;"></td></tr>
            </table>
            <p style="margin: 0 0 18px;">No próximo email te conto a história (meio torta) dele e como garantir o seu.</p>
            <p style="margin: 0 0 18px;">Se quiser que eu adiante algo, é só responder.</p>
            <p style="margin: 0 0 4px;">Abraço,</p>
            <p style="margin: 0;">Clara</p>
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

### E2 — versão PARCEIRO

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>por que umas marcas grudam e outras somem no feed</title>
</head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td align="center" style="padding: 40px 20px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="580" style="max-width: 580px;">
        <tr>
          <td style="color: #1a1a1a; font-size: 16px; line-height: 1.6;">
            <p style="margin: 0 0 16px;">Oi %FIRSTNAME%,</p>
            <p style="margin: 0 0 16px;">Ontem te falei que o algoritmo virou um filtro de quem é lembrado.</p>
            <p style="margin: 0 0 16px;">Hoje: o que tá por trás de quem gruda na cabeça das pessoas. É o que você precisa entregar pros seus clientes.</p>
            <p style="margin: 0 0 16px;">Quando alguém descreve uma marca numa frase, sem hesitar, não foi sorte. Tem método ali.</p>
            <p style="margin: 0 0 16px;">No meu começo eu era "a menina do roxo que fala de branding". Simples, mas era uma <strong style="background: linear-gradient(180deg, transparent 60%, #f3d9fa 60%);">âncora de memória</strong>, o tipo de coisa que o algoritmo e as pessoas usam pra lembrar de alguém.</p>
            <p style="margin: 0 0 14px;">Construir isso de propósito segue um caminho que eu refino há anos e uso até hoje nos meus clientes:</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 18px;">
              <tr><td valign="top" width="22" style="font-size: 16px; line-height: 1.5; color: #CD50F1; font-weight: 700;">1.</td><td style="font-size: 15px; line-height: 1.5; color: #1a1a1a; padding-bottom: 9px;"><strong>Propósito.</strong> O porquê, a bússola do resto.</td></tr>
              <tr><td valign="top" width="22" style="font-size: 16px; line-height: 1.5; color: #CD50F1; font-weight: 700;">2.</td><td style="font-size: 15px; line-height: 1.5; color: #1a1a1a; padding-bottom: 9px;"><strong>Audiência.</strong> Pra quem a marca fala e o que essa galera quer receber.</td></tr>
              <tr><td valign="top" width="22" style="font-size: 16px; line-height: 1.5; color: #CD50F1; font-weight: 700;">3.</td><td style="font-size: 15px; line-height: 1.5; color: #1a1a1a; padding-bottom: 9px;"><strong>Personalidade e tom de voz.</strong> O que faz o conteúdo soar como aquela pessoa.</td></tr>
              <tr><td valign="top" width="22" style="font-size: 16px; line-height: 1.5; color: #CD50F1; font-weight: 700;">4.</td><td style="font-size: 15px; line-height: 1.5; color: #1a1a1a; padding-bottom: 9px;"><strong>OKR de marca.</strong> Objetivo e resultados-chave pra medir.</td></tr>
              <tr><td valign="top" width="22" style="font-size: 16px; line-height: 1.5; color: #CD50F1; font-weight: 700;">5.</td><td style="font-size: 15px; line-height: 1.5; color: #1a1a1a;"><strong>Conteúdo e perfil.</strong> Como tudo isso vira post, bio e interação.</td></tr>
            </table>
            <p style="margin: 0 0 16px;">É o processo que eu rodo pra construir marca pessoal de cliente. Dá pra usar tanto na sua marca quanto nas que você atende, sem reinventar a roda a cada projeto.</p>
            <p style="margin: 0 0 14px;">Organizei ele inteiro num material físico. É esse aqui:</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 18px;">
              <tr><td align="center"><img src="https://boldfy.com.br/images/kit-flip.gif" width="400" alt="Folheando o workbook do Kit de Marca Pessoal" style="display: block; width: 100%; max-width: 400px; height: auto; border-radius: 14px;"></td></tr>
            </table>
            <p style="margin: 0 0 18px;">No próximo email te conto a história (meio torta) dele e como garantir o seu.</p>
            <p style="margin: 0 0 18px;">Se quiser que eu adiante algo, é só responder.</p>
            <p style="margin: 0 0 4px;">Abraço,</p>
            <p style="margin: 0;">Clara</p>
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

## E3 — O kit + a oferta (D+4)

**Assunto:** `o kit que eu fiz pra uma mentoria que não rolou`

**Pré-header:** `fiz 50, vendi a maioria, sobraram uns 20. quero dar vazão.`

> **Imagem:** troque `%KIT_IMG_FLATLAY_URL%` pela URL do flat-lay do kit (o do fundo roxo com tudo espalhado).

### E3 — versão PROFISSIONAL INDIVIDUAL

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>o kit que eu fiz pra uma mentoria que não rolou</title>
</head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td align="center" style="padding: 40px 20px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="580" style="max-width: 580px;">
        <tr>
          <td style="color: #1a1a1a; font-size: 16px; line-height: 1.6;">
            <p style="margin: 0 0 16px;">Oi %FIRSTNAME%,</p>
            <p style="margin: 0 0 16px;">Prometido: o material.</p>
            <p style="margin: 0 0 16px;">Ano passado eu montei uma mentoria de marca pessoal e produzi um kit físico pra acompanhar. A mentoria não rolou (agenda), mas o kit ficou pronto.</p>
            <p style="margin: 0 0 20px;"><strong style="background: linear-gradient(180deg, transparent 60%, #f3d9fa 60%);">Fiz 50, vendi a maioria, sobraram uns 20 aqui em casa.</strong></p>

            <!-- FOTO DO KIT -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 22px;">
              <tr><td><img src="https://boldfy.com.br/images/kit-flatlay.jpg" width="580" alt="Kit de Marca Pessoal da Clara Ramos" style="display: block; width: 100%; max-width: 580px; height: auto; border-radius: 14px;"></td></tr>
            </table>

            <!-- CARD DO KIT -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 22px;">
              <tr>
                <td bgcolor="#ffffff" style="background-color: #ffffff; border: 1px solid #efd6fa; border-radius: 16px; padding: 22px 24px;">
                  <p style="margin: 0 0 10px;">
                    <span style="display: inline-block; padding: 5px 11px; background-color: #faecff; color: #CD50F1; font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; border-radius: 999px;">Kit físico · sobraram ~20</span>
                  </p>
                  <p style="margin: 0 0 8px; font-size: 21px; line-height: 1.2; font-weight: 800; color: #2A1639; letter-spacing: -0.02em;">Kit de <span style="color: #CD50F1;">Marca Pessoal</span></p>
                  <p style="margin: 0 0 16px; font-size: 13.5px; line-height: 1.5; color: #5a4768;">Todo o método que eu uso pra construir marca pessoal do zero, em papel, pra você aplicar na sua.</p>
                  <p style="margin: 0 0 16px; font-size: 15px; color: #2A1639;"><span style="text-decoration: line-through; color: #9a89a8;">R$ 320</span> &nbsp; <strong style="color: #CD50F1; font-size: 22px;">R$ 220</strong> &nbsp;<span style="font-size: 12px; color: #6F5B7A;">+ frete</span></p>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td bgcolor="#CD50F1" style="background-color: #CD50F1; border-radius: 10px;">
                        <a href="mailto:clara@boldfy.com.br?subject=Quero%20o%20kit%20de%20marca%20pessoal" style="display: inline-block; padding: 12px 24px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 10px;">Quero o meu kit →</a>
                      </td>
                      <td style="padding-left: 14px; font-size: 12px; color: #6F5B7A;">envio pra sua casa</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <!-- FIM DO CARD -->

            <p style="margin: 0 0 12px; font-weight: 700;">O que vem na caixa:</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 18px;">
              <tr><td valign="top" width="22" style="color: #CD50F1; font-weight: 700; font-size: 15px; line-height: 1.5;">✓</td><td style="font-size: 15px; line-height: 1.5; color: #1a1a1a; padding-bottom: 8px;"><strong>Workbook de 100+ páginas</strong> com o método completo.</td></tr>
              <tr><td valign="top" width="22" style="color: #CD50F1; font-weight: 700; font-size: 15px; line-height: 1.5;">✓</td><td style="font-size: 15px; line-height: 1.5; color: #1a1a1a; padding-bottom: 8px;"><strong>6 cheat sheets (A5)</strong> pra consulta rápida.</td></tr>
              <tr><td valign="top" width="22" style="color: #CD50F1; font-weight: 700; font-size: 15px; line-height: 1.5;">✓</td><td style="font-size: 15px; line-height: 1.5; color: #1a1a1a; padding-bottom: 8px;"><strong>4 frameworks em A3</strong> pra preencher na parede ou na mesa.</td></tr>
              <tr><td valign="top" width="22" style="color: #CD50F1; font-weight: 700; font-size: 15px; line-height: 1.5;">✓</td><td style="font-size: 15px; line-height: 1.5; color: #1a1a1a; padding-bottom: 8px;"><strong>Bloquinho, adesivos e post-its</strong> pra usar com os frameworks.</td></tr>
              <tr><td valign="top" width="22" style="color: #CD50F1; font-weight: 700; font-size: 15px; line-height: 1.5;">✓</td><td style="font-size: 15px; line-height: 1.5; color: #1a1a1a;"><strong>Módulo de dicas de LinkedIn</strong>, onde a marca encontra a prática do feed.</td></tr>
            </table>
            <p style="margin: 0 0 16px;">É tudo que eu uso pra construir uma marca pessoal do zero, na mão. Você preenche, risca, anota, e sai com um plano em vez de mais um curso parado na aba.</p>
            <p style="margin: 0 0 18px;">Lancei a R$ 320 ano passado. Como agora é pra esvaziar o estoque, tô fazendo por <strong>R$ 220</strong> + frete.</p>
            <p style="margin: 0 0 18px;">Quer o seu? Responde esse email que eu te mando o link de pagamento e a estimativa de frete pro seu CEP. <strong>Eu leio pessoalmente.</strong></p>
            <p style="margin: 0 0 4px;">Abraço,</p>
            <p style="margin: 0;">Clara</p>
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

### E3 — versão PARCEIRO

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>o kit que eu fiz pra uma mentoria que não rolou</title>
</head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td align="center" style="padding: 40px 20px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="580" style="max-width: 580px;">
        <tr>
          <td style="color: #1a1a1a; font-size: 16px; line-height: 1.6;">
            <p style="margin: 0 0 16px;">Oi %FIRSTNAME%,</p>
            <p style="margin: 0 0 16px;">Prometido: o material.</p>
            <p style="margin: 0 0 16px;">Ano passado eu montei uma mentoria de marca pessoal e produzi um kit físico pra acompanhar. A mentoria não rolou (agenda), mas o kit ficou pronto.</p>
            <p style="margin: 0 0 20px;"><strong style="background: linear-gradient(180deg, transparent 60%, #f3d9fa 60%);">Fiz 50, vendi a maioria, sobraram uns 20 aqui em casa.</strong></p>

            <!-- FOTO DO KIT -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 22px;">
              <tr><td><img src="https://boldfy.com.br/images/kit-flatlay.jpg" width="580" alt="Kit de Marca Pessoal da Clara Ramos" style="display: block; width: 100%; max-width: 580px; height: auto; border-radius: 14px;"></td></tr>
            </table>

            <!-- CARD DO KIT -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 22px;">
              <tr>
                <td bgcolor="#ffffff" style="background-color: #ffffff; border: 1px solid #efd6fa; border-radius: 16px; padding: 22px 24px;">
                  <p style="margin: 0 0 10px;">
                    <span style="display: inline-block; padding: 5px 11px; background-color: #faecff; color: #CD50F1; font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; border-radius: 999px;">Kit físico · sobraram ~20</span>
                  </p>
                  <p style="margin: 0 0 8px; font-size: 21px; line-height: 1.2; font-weight: 800; color: #2A1639; letter-spacing: -0.02em;">Kit de <span style="color: #CD50F1;">Marca Pessoal</span></p>
                  <p style="margin: 0 0 16px; font-size: 13.5px; line-height: 1.5; color: #5a4768;">O método que eu rodo pra construir marca pessoal de cliente, em papel. Pra sua marca e como processo pros seus clientes.</p>
                  <p style="margin: 0 0 16px; font-size: 15px; color: #2A1639;"><span style="text-decoration: line-through; color: #9a89a8;">R$ 320</span> &nbsp; <strong style="color: #CD50F1; font-size: 22px;">R$ 220</strong> &nbsp;<span style="font-size: 12px; color: #6F5B7A;">+ frete</span></p>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td bgcolor="#CD50F1" style="background-color: #CD50F1; border-radius: 10px;">
                        <a href="mailto:clara@boldfy.com.br?subject=Quero%20o%20kit%20de%20marca%20pessoal" style="display: inline-block; padding: 12px 24px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 10px;">Quero o meu kit →</a>
                      </td>
                      <td style="padding-left: 14px; font-size: 12px; color: #6F5B7A;">envio pra sua casa</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <!-- FIM DO CARD -->

            <p style="margin: 0 0 12px; font-weight: 700;">O que vem na caixa:</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 18px;">
              <tr><td valign="top" width="22" style="color: #CD50F1; font-weight: 700; font-size: 15px; line-height: 1.5;">✓</td><td style="font-size: 15px; line-height: 1.5; color: #1a1a1a; padding-bottom: 8px;"><strong>Workbook de 100+ páginas</strong> com o método completo.</td></tr>
              <tr><td valign="top" width="22" style="color: #CD50F1; font-weight: 700; font-size: 15px; line-height: 1.5;">✓</td><td style="font-size: 15px; line-height: 1.5; color: #1a1a1a; padding-bottom: 8px;"><strong>6 cheat sheets (A5)</strong> pra consulta rápida (sua e dos clientes).</td></tr>
              <tr><td valign="top" width="22" style="color: #CD50F1; font-weight: 700; font-size: 15px; line-height: 1.5;">✓</td><td style="font-size: 15px; line-height: 1.5; color: #1a1a1a; padding-bottom: 8px;"><strong>4 frameworks em A3</strong> pra workshop, onboarding de cliente ou sua mesa.</td></tr>
              <tr><td valign="top" width="22" style="color: #CD50F1; font-weight: 700; font-size: 15px; line-height: 1.5;">✓</td><td style="font-size: 15px; line-height: 1.5; color: #1a1a1a; padding-bottom: 8px;"><strong>Bloquinho, adesivos e post-its</strong> pra usar com os frameworks.</td></tr>
              <tr><td valign="top" width="22" style="color: #CD50F1; font-weight: 700; font-size: 15px; line-height: 1.5;">✓</td><td style="font-size: 15px; line-height: 1.5; color: #1a1a1a;"><strong>Módulo de dicas de LinkedIn</strong>, onde a marca encontra a prática do feed.</td></tr>
            </table>
            <p style="margin: 0 0 16px;">É literalmente o método que eu rodo com cliente, agora em papel. Dá pra usar na sua marca e virar base de processo pros clientes que você atende: um sistema pronto, em vez de montar do zero a cada conta.</p>
            <p style="margin: 0 0 18px;">Lancei a R$ 320 ano passado. Como agora é pra esvaziar o estoque, tô fazendo por <strong>R$ 220</strong> + frete.</p>
            <p style="margin: 0 0 18px;">Quer o seu? Responde esse email que eu te mando o link de pagamento e a estimativa de frete pro seu CEP. <strong>Eu leio pessoalmente.</strong></p>
            <p style="margin: 0 0 4px;">Abraço,</p>
            <p style="margin: 0;">Clara</p>
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

## E4 — Último toque + estoque acabando (D+7)

**Assunto:** `sobraram poucos e eu não vou reimprimir`

**Pré-header:** `se a sua marca dependesse só do feed hoje, ela estaria de pé?`

### E4 — versão PROFISSIONAL INDIVIDUAL

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>sobraram poucos e eu não vou reimprimir</title>
</head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td align="center" style="padding: 40px 20px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="580" style="max-width: 580px;">
        <tr>
          <td style="color: #1a1a1a; font-size: 16px; line-height: 1.6;">
            <p style="margin: 0 0 16px;">Oi %FIRSTNAME%,</p>
            <p style="margin: 0 0 18px;">Último email sobre o kit, então vou direto.</p>
            <p style="margin: 0 0 18px; padding: 16px 18px; background-color: #f7f0fb; border-left: 3px solid #CD50F1; font-style: italic; font-size: 17px; line-height: 1.5;">Se a sua marca pessoal dependesse só do que você publica hoje, ela estaria sendo lembrada ou sumindo no feed?</p>
            <p style="margin: 0 0 16px;">Essa é a pergunta que o algoritmo novo faz pra todo mundo, querendo ou não. Quem já tem um posicionamento claro responde na hora; pra quem vai no improviso, ela costuma ser bem desconfortável.</p>
            <p style="margin: 0 0 20px;">O kit te tira do improviso. É físico, sobraram uns 20, e <strong style="background: linear-gradient(180deg, transparent 60%, #f3d9fa 60%);">eu não vou reimprimir essa leva</strong>. Quando acabar, acabou.</p>

            <!-- FOTO DO KIT -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 20px;">
              <tr><td><img src="https://boldfy.com.br/images/kit-clara.jpg" width="580" alt="Clara Ramos segurando o Kit de Marca Pessoal" style="display: block; width: 100%; max-width: 580px; height: auto; border-radius: 14px;"></td></tr>
            </table>

            <p style="margin: 0 0 16px;">Se você quer uma marca pessoal que as pessoas reconheçam, e não só mais um perfil ativo, ele te dá o caminho na mão: do propósito até o post.</p>
            <p style="margin: 0 0 10px; font-size: 15px; color: #2A1639;"><span style="text-decoration: line-through; color: #9a89a8;">R$ 320</span> &nbsp; <strong style="color: #CD50F1; font-size: 22px;">R$ 220</strong> &nbsp;<span style="font-size: 12px; color: #6F5B7A;">+ frete, enviado pra sua casa</span></p>
            <p style="margin: 16px 0 22px;"><a href="mailto:clara@boldfy.com.br?subject=Quero%20o%20kit%20de%20marca%20pessoal" style="display: inline-block; padding: 12px 24px; background-color: #CD50F1; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 8px;">Quero o meu kit →</a></p>
            <p style="margin: 0 0 18px;">Pode responder esse email com um "quero" também. Eu mando o link de pagamento e o frete pro seu CEP, e <strong>leio cada resposta pessoalmente.</strong></p>
            <p style="margin: 0 0 4px;">Abraço,</p>
            <p style="margin: 0;">Clara</p>
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

### E4 — versão PARCEIRO

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>sobraram poucos e eu não vou reimprimir</title>
</head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td align="center" style="padding: 40px 20px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="580" style="max-width: 580px;">
        <tr>
          <td style="color: #1a1a1a; font-size: 16px; line-height: 1.6;">
            <p style="margin: 0 0 16px;">Oi %FIRSTNAME%,</p>
            <p style="margin: 0 0 18px;">Último email sobre o kit, então vou direto.</p>
            <p style="margin: 0 0 18px; padding: 16px 18px; background-color: #f7f0fb; border-left: 3px solid #CD50F1; font-style: italic; font-size: 17px; line-height: 1.5;">Se a marca dos seus clientes dependesse só do que eles publicam hoje, ela estaria sendo lembrada ou sumindo no feed?</p>
            <p style="margin: 0 0 16px;">Essa é a pergunta que o algoritmo novo faz pra todo mundo, querendo ou não. Quem já tem um posicionamento claro responde na hora; pra quem vai no improviso, ela trava, e é aí que a cobrança chega em você.</p>
            <p style="margin: 0 0 20px;">O kit tira do improviso. É físico, sobraram uns 20, e <strong style="background: linear-gradient(180deg, transparent 60%, #f3d9fa 60%);">eu não vou reimprimir essa leva</strong>. Quando acabar, acabou.</p>

            <!-- FOTO DO KIT -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 0 0 20px;">
              <tr><td><img src="https://boldfy.com.br/images/kit-clara.jpg" width="580" alt="Clara Ramos segurando o Kit de Marca Pessoal" style="display: block; width: 100%; max-width: 580px; height: auto; border-radius: 14px;"></td></tr>
            </table>

            <p style="margin: 0 0 16px;">Se você vive de construir marca pra outras pessoas, esse é o método que você roda na sua marca e ainda transforma em processo pros clientes. Um material, dois usos.</p>
            <p style="margin: 0 0 10px; font-size: 15px; color: #2A1639;"><span style="text-decoration: line-through; color: #9a89a8;">R$ 320</span> &nbsp; <strong style="color: #CD50F1; font-size: 22px;">R$ 220</strong> &nbsp;<span style="font-size: 12px; color: #6F5B7A;">+ frete, enviado pra sua casa</span></p>
            <p style="margin: 16px 0 22px;"><a href="mailto:clara@boldfy.com.br?subject=Quero%20o%20kit%20de%20marca%20pessoal" style="display: inline-block; padding: 12px 24px; background-color: #CD50F1; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 8px;">Quero o meu kit →</a></p>
            <p style="margin: 0 0 18px;">Pode responder esse email com um "quero" também. Eu mando o link de pagamento e o frete pro seu CEP, e <strong>leio cada resposta pessoalmente.</strong></p>
            <p style="margin: 0 0 4px;">Abraço,</p>
            <p style="margin: 0;">Clara</p>
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

## Notas de implementação

- **Fotos do kit:** dois placeholders. `%KIT_IMG_FLATLAY_URL%` (E3, 2 lugares) = flat-lay roxo mostrando a caixa inteira. `%KIT_IMG_CLARA_URL%` (E4, 2 lugares) = Clara segurando o kit. Hospeda via AC (*Campaigns → imagens*) ou em `public/images/` do site (ver seção "Variáveis e assets").
- **Vídeo do kit:** se quiser, viro o E2 ou E4 num thumbnail clicável (imagem com play) que linka pro vídeo. Me passa onde ele vai ficar hospedado (LinkedIn/YouTube) que eu monto o bloco.
- **Botão = mailto:** abre o email com assunto pré-preenchido. Quando tiver um link de pagamento fixo, dá pra trocar e vender sem passar pela sua caixa.
- **Reply handling:** todo "quero" sai da cadência e vira atendimento manual.
- **Estoque:** atualize o "~20" se rodar em ondas; pause quando zerar.

## Métricas a acompanhar

- **Open rate** E1 acima de 45% (já conhecem a Clara pelo report). E2–E4 acima de 30%.
- **Reply rate** (o CTA é responder) — a métrica que importa aqui, não clique. Meta inicial: 3–5% de "quero" sobre quem entrou.
- **Vendas / kits enviados** por segmento (parceiro vs profissional), pra ver qual público converte melhor e calibrar a próxima onda.
