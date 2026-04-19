# SOP — Excluir teu tráfego do GA4 (IPs + query param)

> Tempo estimado: **~10 min**
> Quando fazer: qualquer dia dessa semana, antes de começar a analisar relatórios reais

## Por que fazer isso?

Sem esse filtro, cada vez que você (Clara) abrir o site pra testar algo, o GA4 conta como visitante real — distorcendo métricas de aquisição, conversão, páginas populares, etc. Você vai analisar teu próprio tráfego achando que é do mercado.

## Como funciona a solução combinada

Dois mecanismos rodam em paralelo:

### Mecanismo 1 — Query param `?internal=1` (JÁ IMPLEMENTADO no código)

- Funciona em qualquer rede (casa, café, 4G, avião)
- Persiste por dispositivo/browser (cookie de 1 ano)
- **Como usar:** acessa `https://www.boldfy.com.br/?internal=1` uma vez no celular e no computador. Pronto — a partir desse momento, esses dois browsers ficam marcados como tráfego interno.
- Bônus: usa `?internal=1` sempre que alguém da equipe Boldfy for testar o site
- **Como desativar:** `https://www.boldfy.com.br/?internal=0`

### Mecanismo 2 — Filtro de IP no GA4 (PRECISA CONFIGURAR — esse SOP)

- Backup caso você esqueça de usar `?internal=1` em algum dispositivo novo
- Filtra eventos vindos dos IPs específicos que você passou:
  - Celular: `181.77.165.247`
  - Computador: `177.137.27.115`
- Limitação: se você trocar de rede (ir pra outro café, por exemplo), o IP muda e o filtro não pega
- **Por isso o query param é o primário, o IP é o backup**

---

## PARTE 1 — Ativar o query param no teu celular e computador

### Passo 1 — Deploy já foi feito

Eu já adicionei o código do `?internal=1`. Assim que você fizer `git push` do meu commit mais recente, vai estar funcionando em produção.

### Passo 2 — Ativa no celular

1. No celular, abre: `https://www.boldfy.com.br/?internal=1`
2. Espera carregar (2 segundos)
3. Pronto — o cookie foi salvo. A query vai sumir da URL automaticamente.

Pra confirmar que funcionou:
- Navega pra outra página do site (ex: `/precos`)
- Abre dev tools do browser → Application → Cookies
- Deve aparecer cookie `boldfy_internal=1`

### Passo 3 — Ativa no computador

Mesma coisa: abre `https://www.boldfy.com.br/?internal=1` uma vez, pronto.

### Passo 4 — Ativa em qualquer outro dispositivo onde você testa o site

Exemplo: computador do trabalho, tablet, celular antigo — sempre que for abrir o site pra testar, passa `?internal=1` uma vez nele.

---

## PARTE 2 — Configurar o filtro de IP no GA4 (backup)

### Passo 1 — Acessa o admin do GA4

1. Vai em `https://analytics.google.com`
2. Canto inferior esquerdo → ícone de engrenagem (**Administrador**)
3. Confirma no seletor do topo que você tá na property certa (a que recebe dados do site Boldfy, com ID `G-W6X9WW5GL8`)

### Passo 2 — Abre Data Streams (Fluxos de dados)

1. Coluna "Propriedade" → **Fluxos de dados**
2. Clica na aba **Web**
3. Clica no stream do site (deve ter URL `www.boldfy.com.br`)

### Passo 3 — Configura Internal Traffic

1. Na tela do stream, rola até o final
2. Clica em **Configurar configurações de tag** (Configure tag settings)
3. Clica em **Mostrar tudo** (se estiver em modo compacto)
4. Procura o card **"Definir tráfego interno"** (Define internal traffic)
5. Clica nele

### Passo 4 — Cria a regra de tráfego interno

1. Clica **Criar** (Create)
2. Preenche:
   - **Nome da regra:** `Clara - dispositivos pessoais`
   - **Valor do traffic_type:** `internal` (este é o padrão, mantém)
   - **Tipo de correspondência de endereço IP:** `Endereço IP é igual a`
   - **Valor:** `181.77.165.247`
3. Clica em **Adicionar condição** (+ Add condition)
4. Adiciona a segunda:
   - Tipo: `Endereço IP é igual a`
   - Valor: `177.137.27.115`
5. Salva

### Passo 5 — Ativa o filtro em Data Filters

> **CRÍTICO:** configurar a regra acima **não basta** — por padrão, o filtro fica em modo "Testar" (não aplicado). Precisa ativar.

1. Volta pro Admin
2. Coluna "Propriedade" → **Filtros de dados** (Data filters)
3. Deve aparecer um filtro pré-criado chamado **"Internal Traffic"** com status **Testando**
4. Clica nele
5. Muda o estado de **Testando** (Testing) para **Ativo** (Active)
6. Salva

**Pronto! Dali pra frente o GA4 vai excluir automaticamente eventos vindos desses IPs.**

---

## PARTE 3 — Validar que funcionou

### Passo 1 — Envia um pageview de teste

1. No celular (conectado no mesmo IP que você cadastrou), abre `www.boldfy.com.br`
2. Navega por 2-3 páginas

### Passo 2 — Confere no GA4 Realtime

1. GA4 → Relatórios → **Tempo real**
2. No filtro de cima, adiciona uma comparação:
   - Dimensão: `Tipo de tráfego` (Traffic type)
   - Valor: `Internal`
3. Se você aparecer na comparação "Internal", **funcionou** ✅

### Passo 3 — Desativa o filtro SÓ PRA esse teste específico, se quiser ver em "Everyone"

O filtro Data Filter deixa os eventos chegarem no GA4 Realtime (só exclui dos relatórios padrão). Então pra ver se você tá sendo pego, é só usar a comparação acima.

---

## Troubleshooting

### "Não encontrei 'Configurar configurações de tag'"

Pode estar em outro idioma (Configure tag settings). Se não achar, é porque o stream que você abriu não é um stream web, é outro tipo. Volta pra Data Streams e confirma que clicou em um stream com URL `www.boldfy.com.br`.

### "Meu IP mudou, preciso refazer?"

Os IPs de rede residencial **mudam periodicamente** (ISP redistribui). Solução:
- Confia no `?internal=1` (esse é primário)
- Uma vez por mês, confere o IP atual em `https://ipinfo.io/ip` e atualiza a regra no GA4

### "Estou em rede móvel/café/avião — o filtro IP funciona?"

**Não**, IP é diferente. Por isso o `?internal=1` é o mecanismo principal. Se esqueceu de passar `?internal=1` naquele dispositivo, pode passar em qualquer momento da sessão (o cookie é persistente).

---

## Checklist final

- [ ] `git push` do commit do `InternalTrafficMarker` feito
- [ ] Acessei `www.boldfy.com.br/?internal=1` no celular ✅
- [ ] Acessei `www.boldfy.com.br/?internal=1` no computador ✅
- [ ] GA4 Admin → Data Streams → Web → stream do Boldfy → Configure tag settings → Define internal traffic → regra criada com os 2 IPs
- [ ] GA4 Admin → Data Filters → "Internal Traffic" → mudado de "Testando" pra "Ativo"
- [ ] Teste no Realtime: consegui ver meu próprio tráfego como "Internal"
