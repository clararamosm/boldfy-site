# Cadência de email — Tag `Form: Playbook Employee-Led Growth`

Cadência de 4 emails pra disparar no AC quando o lead recebe a tag `Form: Playbook Employee-Led Growth` (aplicada automaticamente quando o quiz da LP `/ferramentas/playbook-employee-led-growth` é completado).

## Status do doc

- **E1** — pronto pra implementar no AC. HTML formatado, copy validada.
- **E2, E3, E4** — outline draft. Direção e CTA definidos. Copy final fica em backlog pra depois da decisão sobre os campos novos do form (State of ELG consent + report subscription, ver `SPEC-playbook-state-of-elg-consent.md`).

## Pré-requisitos no AC antes de subir o E1

Dois custom fields novos precisam existir no AC e ser populados pelo adapter:

1. **`playbook_url`** (texto) → recebe a URL completa da página personalizada (`https://boldfy.com.br/playbook/[slug]`). Tag de personalização: `%PLAYBOOK_URL%`.
2. **`playbook_dor_principal_pretty`** (texto, opcional pra E3) → rótulo legível da primeira dor selecionada na P8, pra puxar no copy do E3. Tag de personalização: `%PLAYBOOK_DOR_PRINCIPAL%`.

Mudança no adapter `src/lib/form-adapters/playbook-employee-led-growth.ts` documentada na spec linkada acima.

## Gate de segmentação

**1) Gate de público (implícito)** — o quiz já filtra na UI antes do submit:
- Empresas com < 5 colaboradores caem na tela de não-elegibilidade (não geram lead).
- Autônomos/freelas/consultores idem.
- Todo lead que entra nessa cadência é **Líder B2B por construção**, então não precisa de If/Else por `tipo_de_lead` (diferente da cadência Case Semrush).

**2) Gate de comportamento (durante a cadência)** — quem marcar demo no E4 sai do nurture e entra no fluxo de pré-venda. Quem responder qualquer email com sinal forte (pergunta direta sobre demo, pedido de proposta) também sai manualmente.

**Fluxo no AC:**

1. Trigger: tag `Form: Playbook Employee-Led Growth` aplicada
2. **E1** (envio imediato, sem gate)
3. Wait 2 dias → envia **E2**
4. Wait 3 dias → If/Else: tem tag `Demo agendada`?
   - Se SIM: sai da cadência (vai pro fluxo de pré-venda)
   - Se NÃO: envia **E3**
5. Wait 3 dias → If/Else: tem tag `Demo agendada`?
   - Se SIM: sai da cadência
   - Se NÃO: envia **E4**
6. Sai da cadência

## Timing

| Email | Quando dispara | Quem recebe |
|-------|---------------|-------------|
| E1    | Imediato (após submit do quiz) | Todos |
| E2    | D+2 às 9h (horário do lead, se possível) | Todos |
| E3    | D+5 às 9h | Quem não marcou demo |
| E4    | D+8 às 9h | Quem não marcou demo |

## Variáveis usadas

- `%FIRSTNAME%` — primeiro nome
- `%COMPANYNAME%` — nome da empresa (campo `empresa`)
- `%PLAYBOOK_URL%` — URL da página `/playbook/[slug]` (custom field novo)
- `%PLAYBOOK_DOR_PRINCIPAL%` — rótulo da dor #1 selecionada (custom field novo, só usado no E3)

---

## E1 — Entrega do playbook (D+0, todos)

**Assunto:** `%FIRSTNAME%, o playbook da %COMPANYNAME% tá pronto`

**Pré-header:** `Link da página personalizada e o que fazer com ela agora.`

**HTML:**

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>%FIRSTNAME%, o playbook da %COMPANYNAME% tá pronto</title>
</head>
<body style="margin:0; padding:0; background-color:#ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td align="center" style="padding: 40px 20px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="580" style="max-width: 580px;">
        <tr>
          <td style="color: #1a1a1a; font-size: 16px; line-height: 1.65;">
            <p style="margin: 0 0 18px;">Oi %FIRSTNAME%,</p>
            <p style="margin: 0 0 12px;">A Fai terminou de montar o playbook da %COMPANYNAME%. Fica numa página própria, <strong style="background: linear-gradient(180deg, transparent 60%, #f3d9fa 60%);">personalizada a partir das suas respostas</strong> e compartilhável com o time:</p>

            <!-- CARD DE ENTREGA -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin: 22px 0;">
              <tr>
                <td bgcolor="#ffffff" style="background-color: #ffffff; border: 1px solid #efd6fa; border-radius: 16px; padding: 24px 26px;">
                  <p style="margin: 0 0 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
                    <span style="display: inline-block; padding: 5px 11px; background-color: #faecff; color: #CD50F1; font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; border-radius: 999px;">Seu playbook tá pronto</span>
                  </p>
                  <p style="margin: 0 0 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 21px; line-height: 1.22; font-weight: 800; color: #2A1639; letter-spacing: -0.02em;">
                    Playbook ELG da <span style="color: #CD50F1;">%COMPANYNAME%</span>
                  </p>
                  <p style="margin: 0 0 18px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 13.5px; line-height: 1.55; color: #5a4768;">
                    Diagnóstico, plano em 3 fases, checklist e calculadora de earned media. Tudo gerado a partir do cenário da sua empresa.
                  </p>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td bgcolor="#CD50F1" style="background-color: #CD50F1; border-radius: 10px;">
                        <a href="%PLAYBOOK_URL%" style="display: inline-block; padding: 12px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 10px;">Abrir meu playbook →</a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 14px 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size: 11.5px; color: #8a7595; word-break: break-all;">
                    Ou copia o link direto: %PLAYBOOK_URL%
                  </p>
                </td>
              </tr>
            </table>
            <!-- FIM DO CARD -->

            <p style="margin: 0 0 14px;">O que tem na página, em ordem:</p>
            <p style="margin: 0 0 10px;"><strong>1. Onde a %COMPANYNAME% tá hoje.</strong></p>
            <p style="margin: 0 0 14px;">Snapshot do cenário (porte, área, voz atual no LinkedIn, tentativas anteriores) e o número-soco da sua dor principal.</p>
            <p style="margin: 0 0 10px;"><strong>2. A estratégia em 3 fases.</strong></p>
            <p style="margin: 0 0 14px;">POR QUÊ, COMO, FERRAMENTA. Os 3 pilares que rodam em paralelo. Como destravar cada um.</p>
            <p style="margin: 0 0 10px;"><strong>3. Seu próximo movimento.</strong></p>
            <p style="margin: 0 0 14px;">Checklist com 5 itens internos pra destravar antes da execução, mais 4 itens da operação Boldfy.</p>
            <p style="margin: 0 0 10px;"><strong>4. Calculadora de earned media.</strong></p>
            <p style="margin: 0 0 14px;">Os números da %COMPANYNAME% ajustáveis em sliders. Você simula cenários e vê o ROI projetado.</p>
            <p style="margin: 0 0 10px;"><strong>5. Como a Boldfy se encaixa.</strong></p>
            <p style="margin: 0 0 22px;">Nas 3 frentes acima, com bridge orgânica pras outras áreas que também ganham (vendas, RH).</p>

            <p style="margin: 0 0 18px;">Sugestão prática: <strong style="background: linear-gradient(180deg, transparent 60%, #f3d9fa 60%);">a página é compartilhável</strong>. Manda o link pro C-level que precisa bater o budget, ou pro time que vai operar. Vira um ponto de partida pra reunião de planejamento bem mais sólido do que um slide montado às pressas.</p>

            <p style="margin: 0 0 18px;">Tem botão de exportar PDF dentro da página, caso prefira anexar em email interno.</p>

            <p style="margin: 0 0 18px;">Nos próximos dias mando mais 3 emails curtos. Um sobre compartilhar com o time, um sobre o erro mais comum quando se tenta executar isso, e um convite pra olharmos a sua estratégia juntos.</p>

            <p style="margin: 0 0 18px;">Qualquer dúvida, é só responder esse email. <strong>Eu leio pessoalmente.</strong></p>

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
                    <a href="https://boldfy.com.br/agendar-demo?utm_source=email&utm_medium=email&utm_campaign=playbook-elg" style="display: inline-block; padding: 9px 16px; background-color: #CD50F1; color: #ffffff; font-size: 12px; font-weight: 600; text-decoration: none; border-radius: 6px; vertical-align: middle; margin-left: 8px;">Marque um diagnóstico</a>
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

## E2 — Compartilha com o time (D+2, todos) — DRAFT/OUTLINE

**Assunto candidato:** `já mandou o playbook pro time?`

**Pré-header candidato:** `playbook que ninguém vê não vira plano.`

**Angle:** A maioria dos playbooks fica no bookmark da pessoa que respondeu o quiz. Vira nada. O movimento de baixo esforço e altíssimo retorno é simplesmente mandar o link pro decisor que precisa bater budget ou pro time que vai operar.

**Beats sugeridos:**
- Hook: pergunta direta sobre se abriu/compartilhou o playbook nos últimos 2 dias
- Soft signal de tracking: "eu vejo quem voltou a abrir a página" (não é stalker, é só transparência)
- Quem deveria ver: dependendo da `cargo_area` (custom field do AC), sugerir destinatários específicos
  - Se Marketing/Growth → "manda pro CMO e pro head de vendas, principalmente"
  - Se RH/Employer Branding → "manda pro CMO pra alinhar narrativa"
  - Se Vendas → "manda pro CMO pra evitar conflito de agenda"
  - (Pode virar 4 versões do email com If/Else no AC, ou 1 versão que abre 3 cenários no corpo)
- Concrete prompt: "Em 2 minutos: copia o link, manda pro Slack/email do %X%, escreve 'olha isso aqui e me fala se faz sentido a gente conversar'"
- CTA principal: botão "Abrir o playbook da %COMPANYNAME%" → `%PLAYBOOK_URL%`
- CTA secundário (soft): "Se quiser que eu olhe junto antes de mandar pro time, é só responder"

**Por que esse email funciona:**
A barreira pra ação não é convencimento, é fricção. Resolver a fricção (te lembrando que existe + sugerindo destinatário específico) destrava follow-through.

---

## E3 — O erro #1 na execução (D+5, quem não marcou demo) — DRAFT/OUTLINE

**Assunto candidato:** `o erro #1 quando se executa um playbook de ELG`

**Pré-header candidato:** `acontece em 80% dos casos. Tá no checklist Antes de tudo.`

**Angle:** Os 4 itens "Na Boldfy" do checklist são a parte sexy (ferramenta, IA, dashboards). Os 5 itens "Antes de tudo" são chatos (conversas internas, alinhamento, sponsorship). A maioria pula pra parte sexy. Programa morre em 3 semanas. Reforçar que os 5 internos são pré-requisito.

**Beats sugeridos:**
- Hook: "O playbook da %COMPANYNAME% começou com 5 itens 'Antes de tudo'. Aposto qual é o que tá te incomodando mais."
- Por que esses itens existem: cita o padrão Semrush (a líder do programa sentou perfil a perfil) ou o stat "90% dos programas morrem em 3 semanas"
- Item-âncora condicional pela `cargo_area`:
  - Marketing → "Conversar com RH e Vendas pra alinhar que isso é canal de mídia"
  - Vendas → "Conversar com Marketing pra evitar conflito com a estratégia de demanda"
  - RH → "Conversar com Marketing pra alinhar narrativa e tom de voz"
- Reforço da tese: programa de advocacy decente vira engrenagem, não esforço heroico do CMO da vez
- CTA principal: botão "Voltar pro checklist do meu playbook" → `%PLAYBOOK_URL%`
- Pode mencionar `%PLAYBOOK_DOR_PRINCIPAL%` no corpo pra mostrar que a gente lembra do contexto específico

**Variante editorial:** se a Clara tiver um case de cliente que executou bem os "Antes de tudo", esse seria o lugar pra puxar como prova.

---

## E4 — 30 min comigo, sem pitch (D+8, quem não marcou demo) — DRAFT/OUTLINE

**Assunto candidato:** `30 min comigo, sem pitch`

**Pré-header candidato:** `seu playbook + minha leitura da %COMPANYNAME% = decisão clara em 30 min.`

**Angle:** Espelha o E4 do Case Semrush (pivot pra demo), mas adaptado ao contexto: a pessoa já tem playbook, já viu diagnóstico, já tem checklist. Próximo passo útil é a conversa de execução.

**Beats sugeridos:**
- Open: "Já passamos 8 dias desde o playbook da %COMPANYNAME%."
- Reconhecer o estado: você tem o diagnóstico, tem o checklist, tem o cálculo de earned media. Falta a decisão de execução.
- Proposta concreta: `30 minutos comigo, sem pitch de slide nem comercial bolado`. A gente abre seu playbook no quadro branco do Figma, eu olho a %COMPANYNAME% pessoalmente, mostro o que faria diferente, e você decide se faz sentido continuar.
- CTA principal: "Marcar 30 min com a Clara →" → `boldfy.com.br/agendar-demo?utm_source=email&utm_medium=email&utm_campaign=playbook-elg`
- Soft fallback: "Se 30 min é muito agora, é só responder esse email com uma linha. Eu leio pessoalmente."

**Reuso:** pode literalmente reciclar o bloco final do E4 do Case Semrush, só ajustando a referência (o playbook em vez do case).

---

## Métricas a acompanhar (primeiros 30 dias)

- **Open rate de cada email.** Meta E1 acima de 65% (alta intent, acabou de preencher quiz). E2-E4 acima de 40%.
- **Click rate pro `%PLAYBOOK_URL%`.** Meta E1+E2+E3 acumulado acima de 35% (queremos que voltem a abrir a página).
- **Views únicas por slug ao longo da cadência.** Sinal de que tão revisitando. Trackeável via `playbook_outputs.view_count` no Postgres.
- **Demo bookings via E4.** Meta inicial: 8% dos leads que entraram na cadência. Iterar a partir do baseline real.
- **Reply rate** (especialmente E1 e E4). Métrica qualitativa de intent.

## Próximos passos após esta cadência

- **Marcou demo em qualquer email** → vira oportunidade comercial, sai do nurture e entra no fluxo de pré-venda.
- **Reabriu o playbook 3+ vezes mas não marcou demo** → candidato pra outreach manual da Clara (sinal quente).
- **Abriu emails mas nunca voltou ao playbook** → cadência editorial leve (newsletter) com toque manual em 30 dias.
- **Não abriu E3/E4** → cooldown de 60 dias antes de entrar em qualquer cadência editorial nova.

## Backlog/aberto

- [ ] Decisão sobre os campos novos do form (consent State of ELG + report subscription) — ver `SPEC-playbook-state-of-elg-consent.md`
- [ ] Implementação dos custom fields novos no AC (`playbook_url`, `playbook_dor_principal_pretty`) e patch no adapter
- [ ] Copy final E2/E3/E4 (depois que decidir o copy do E1 com a Clara)
- [ ] Decidir se E2 vira 1 versão ou 3 versões condicionais por `cargo_area` (se for 3, multiplica setup mas eleva personalização)
- [ ] Cases reais pra puxar no E3 (Semrush é a opção óbvia, mas talvez tenha clientes que aplicaram bem o checklist)
