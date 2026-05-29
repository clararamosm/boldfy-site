# Boldfy CRM — Extensão Chrome

Extensão MV3 que captura perfis e empresas do LinkedIn direto pro CRM da Boldfy em 1 clique.

Spec: [`source-of-truth/specs/SPEC-extension-linkedin.md`](../../source-of-truth/specs/SPEC-extension-linkedin.md).

---

## Como instalar (Load unpacked)

1. **Build a primeira vez:**
   ```bash
   cd boldfy-extension
   npm install
   npm run build
   ```
   Isso gera a pasta `dist/`.

2. **Carregar no Chrome:**
   - Abre `chrome://extensions`
   - Liga "Modo desenvolvedor" no canto superior direito
   - Clica em "Carregar sem compactação"
   - Aponta pra pasta `boldfy-extension/dist/`
   - O ícone da Boldfy aparece na toolbar do Chrome

3. **Parear pela primeira vez:**
   - Clica no ícone da extensão → popup abre
   - Clica no link `extension-auth` (ou abre direto: `https://www.boldfy.com.br/internal/crm/extension-auth`)
   - Faz login no CRM se ainda não tiver
   - Digita uma label pro dispositivo (ex: "Macbook trabalho")
   - Copia o token que aparece (mostrado UMA vez)
   - Volta no popup, cola o token, clica "Salvar"

4. **Capturar leads:**
   - Abre `linkedin.com/in/<qualquer-pessoa>` ou `linkedin.com/company/<qualquer-empresa>`
   - Botão flutuante "⚡ Salvar no Boldfy" aparece no canto superior direito
   - Clica → captura → toast confirma

---

## Como atualizar (depois de mudanças no código)

```bash
npm run build
```

Depois em `chrome://extensions`, clica no ícone de recarregar da extensão Boldfy (ou clica em "Atualizar" no topo da página). Não precisa reinstalar.

Pra desenvolver com auto-rebuild:

```bash
npm run dev
```

E recarrega manualmente no `chrome://extensions` quando quiser ver mudança no Chrome.

---

## Estrutura

```
boldfy-extension/
├── manifest.config.ts        # MV3 manifest (define content scripts, permissions)
├── vite.config.ts            # build via @crxjs/vite-plugin
├── src/
│   ├── config.ts             # API_BASE, limites, versão
│   ├── api/client.ts         # fetch wrapper com Bearer auth
│   ├── storage/index.ts      # chrome.storage.local typed
│   ├── selectors/
│   │   ├── utils.ts          # trySelectors + telemetria
│   │   ├── person.ts         # seletores /in/<slug>
│   │   └── company.ts        # seletores /company/<slug>
│   ├── ui/
│   │   ├── button.ts         # botão flutuante na página LinkedIn
│   │   └── toast.ts          # toast de feedback
│   ├── content/
│   │   ├── person.ts         # content script /in/
│   │   └── company.ts        # content script /company/
│   ├── popup/
│   │   ├── index.html
│   │   ├── popup.css
│   │   └── popup.ts          # popup vanilla DOM
│   └── background/
│       └── service-worker.ts # MV3 service worker (placeholder)
└── public/
    └── icon-*.png            # 16, 48, 128
```

---

## Troubleshooting

- **Botão não aparece na página LinkedIn:**
  Recarrega a página (Cmd+R). LinkedIn é SPA — content script entra no primeiro load mas a SPA pode trocar de rota. O MutationObserver remontea quando URL muda, mas pode ter race em alguns casos.

- **Erro 401 "unauthorized":**
  Token foi revogado ou expirou. Abre o popup, clica "Desconectar", repete o pareamento.

- **"Falhou extrair dados" no toast:**
  LinkedIn mudou DOM. Confere `https://www.boldfy.com.br/internal/crm/settings/extension-telemetry` — vai mostrar quais campos estão falhando, e qual versão dos seletores precisa atualizar.

- **Limite diário 50 atingido:**
  Reset acontece à meia-noite local (relógio do dispositivo). Pra reset manual: `chrome.storage.local.clear()` no DevTools do popup.

---

## Permissions justificadas (pra Chrome Web Store futura)

- `storage`: armazena token de auth e contador de uso diário em `chrome.storage.local` (sem dados de usuários do LinkedIn)
- `activeTab`: permite ler URL atual no popup pra mostrar status do botão
- Host `*.linkedin.com`: content scripts injetam botão de captura em perfis públicos de LinkedIn
- Host `boldfy.com.br`: backend da Boldfy onde os capturas são salvos

Nenhum dado é coletado fora do uso intencional do usuário (clique no botão).
