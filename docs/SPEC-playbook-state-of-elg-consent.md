# SPEC — Consent State of ELG + Report subscription no form do Playbook

> **Status:** rascunho pra revisão. Pronto pra virar PRs sequenciais quando aprovado.
> **Autor:** Clara + Claude, 2026-05-29.
> **Repos envolvidos:** `boldfy-site` (todo o trabalho mora aqui).
> **Relacionados:** `docs/cadencia-playbook-elg.md` · spec de produto: `source-of-truth/specs/playbook-employee-led-growth.md`

---

## 1. Por que essa mudança

Hoje o form do Playbook tem só **1 checkbox LGPD** (obrigatório) que faz dupla função: consentimento legal genérico **e** opt-in pra uso anonimizado das respostas no relatório "State of Employee-Led Growth no Brasil". Isso confunde a pessoa (parece consent legal forçado, não opt-in editorial) e tira da gente uma chance de captar interesse no relatório enquanto ele ainda tá em construção.

A proposta separa essas duas coisas e adiciona um terceiro opt-in:

1. **LGPD continua** — checkbox obrigatório, wording mais genérico (tratamento de dados conforme política).
2. **Consent State of ELG** — toggle separado **default ON**, opt-out style, com wording transparente sobre uso anonimizado.
3. **Inscrição no relatório** — checkbox **default OFF**, opt-in pra entrar na lista de "primeira mão" quando o relatório sair.

UI: o bloco (2) + (3) fica num box destacado com **borda em gradiente animado** (efeito "brilho rodando"), separado visualmente do bloco LGPD pra deixar claro que é uma oferta extra, não burocracia.

---

## 2. Listas no AC (já criadas pela Clara em 2026-05-29)

Conferi no painel do AC e as duas listas já existem com esses nomes exatos:

- `[Cadência] Playbook ELG` — recebe TODO mundo que completa o quiz (dispara a cadência documentada em `cadencia-playbook-elg.md`).
- `[Lista] Report: Panorama ELG no Brasil` — recebe SÓ quem marcou o opt-in de "quero receber em primeira mão". Cadência dessa lista é manual, dispara quando o relatório for publicado.

**Importante sobre como as listas são populadas:** a Boldfy faz isso **por código**, não por automation do AC. A função `buildAcListNames` em `src/lib/crm.ts` decide as listas no momento do `syncContact` (mai/2026 a gente migrou pra esse padrão pra evitar automations frágeis no AC que ficavam inativas sem ninguém perceber). Então pra adicionar essas duas listas, a mudança vive no código (ver §5).

---

## 3. Schema dos campos novos

### 3.1 No Zod schema (`src/app/actions/_schemas.ts`)

```ts
// Em PlaybookEmployeeLedGrowthLeadSchema, junto com lgpdConsent/newsletterOptIn:

stateElgConsent: z.boolean().default(true),
// ↑ Default true. Opt-out — a pessoa precisa DESmarcar pra não consentir.
//   Validação Zod permite false (não é obrigatório), só registra a escolha.

stateElgReportSubscribe: z.boolean().default(false),
// ↑ Default false. Opt-in — a pessoa precisa marcar pra entrar na lista
//   [Lista] Report: Panorama ELG no Brasil.
```

### 3.2 No tipo `ClassifiedLead` (`src/lib/form-adapters/types.ts`)

```ts
// Adicionar campo opcional pra adapters poderem incluir listas extras:
extraAcListNames?: string[];

// E flags de consent pra ficarem rastreáveis no CRM:
stateElgConsent?: boolean;
stateElgReportSubscribe?: boolean;
```

### 3.3 No banco (`people` ou metadata)

Duas opções:

**Opção A (recomendada):** salvar dentro de `metadata.form_data.playbook_employee_led_growth` (igual já é feito hoje com `lgpd_consent` e `newsletter_opt_in`). Zero migration, suficiente pra auditoria.

**Opção B:** adicionar colunas dedicadas em `people` (`state_elg_consent BOOLEAN`, `state_elg_report_subscribe BOOLEAN`). Só vale a pena se outros forms futuros forem capturar os mesmos opt-ins.

Pra V1, vou de **Opção A**. Quando o segundo form aparecer pedindo os mesmos consents, migra-se pra B.

---

## 4. Patch no adapter (`src/lib/form-adapters/playbook-employee-led-growth.ts`)

Trechos relevantes pra incluir:

```ts
const stateElgConsent = input.stateElgConsent !== false; // default true
const stateElgReportSubscribe = input.stateElgReportSubscribe === true; // default false

// Listas extras condicionais (apenas se opt-in explícito):
const extraAcListNames: string[] = [];
if (stateElgReportSubscribe) {
  extraAcListNames.push('[Lista] Report: Panorama ELG no Brasil');
}

// AC custom fields novos (entram em acFields):
const acFields: ClassifiedLead['acFields'] = {
  // ...campos existentes...
  state_elg_consent: stateElgConsent ? 'SIM' : 'NAO',
  state_elg_report_subscribe: stateElgReportSubscribe ? 'SIM' : 'NAO',
};

// Activity data (vai pra timeline + metadata):
const activityData = {
  // ...campos existentes...
  state_elg_consent: stateElgConsent,
  state_elg_report_subscribe: stateElgReportSubscribe,
};

return {
  // ...campos existentes...
  extraAcListNames,
  stateElgConsent,
  stateElgReportSubscribe,
};
```

E precisa adicionar `acListName` no `form-definitions.ts` (que hoje tá faltando):

```ts
'playbook-employee-led-growth': {
  slug: 'playbook-employee-led-growth',
  name: 'Playbook de Employee-Led Growth',
  kind: 'lider_b2b_only',
  acTag: 'Form: Playbook Employee-Led Growth',
  acListName: '[Cadência] Playbook ELG', // ← novo
},
```

---

## 5. Patch em `buildAcListNames` (`src/lib/crm.ts`)

Estender a função pra concatenar `lead.extraAcListNames` (genérico, serve pra qualquer form futuro):

```ts
function buildAcListNames(lead: ClassifiedLead): string[] {
  const names: string[] = [];

  // 1. Lista de segmento (igual antes)
  // ...

  // 2. Lista de cadência do form (igual antes, agora popula [Cadência] Playbook ELG)
  const formDef = FORM_DEFS_SEED[lead.formSlug as FormSlug];
  if (formDef?.acListName) {
    names.push(formDef.acListName);
  }

  // 3. Newsletter (igual antes)
  if (lead.newsletterOptIn) {
    names.push('Newsletter Boldfy');
  }

  // 4. NOVO: listas extras decididas pelo adapter
  if (lead.extraAcListNames && lead.extraAcListNames.length > 0) {
    names.push(...lead.extraAcListNames);
  }

  return names;
}
```

---

## 6. UI/UX no wizard

### 6.1 Posicionamento

Tela final do quiz, **abaixo dos campos de identificação** (nome/email/empresa/telefone), **acima do botão "Gerar Playbook ✨"**.

Ordem:
1. Campos de identificação
2. Checkbox LGPD (obrigatório) — wording revisado pra ser genérico (ver §6.4)
3. Checkbox Newsletter (opcional, default OFF) — igual hoje
4. **NOVO: Box destacado com borda em gradiente animado** contendo:
   - Header curto + ícone
   - Toggle State of ELG (default ON)
   - Checkbox "receber em primeira mão" (default OFF, indentado/visualmente subordinado)
   - Link pra trecho da privacy policy
5. Botão Gerar Playbook

### 6.2 Design do box com borda animada

A pessoa precisa perceber visualmente que essa é uma **oferta especial**, não burocracia. O efeito final é:

- **Borda roxa visível o tempo todo** (camada base, sempre lá).
- **Ponto de brilho mais saturado viajando por cima dela** em loop, tipo as luzes do Nothing OS ou os botões com shimmer animado que aparecem em landing pages modernas.
- **Halo de glow** seguindo o ponto de brilho, dando a sensação de luz emanando.

Técnica: duas camadas de `background` no mesmo pseudo-elemento. Embaixo, `linear-gradient` sólido (borda base). Em cima, `conic-gradient(from var(--shimmer-angle))` com transparência fora do peak — o `@property` registra `--shimmer-angle` como interpolável e o `@keyframes` anima de 0 a 360deg. Resultado: o gradiente gira DENTRO do conic, mas o elemento não rotaciona. Adiciono `filter: drop-shadow` no ::before pra criar o halo seguindo o ponto.

```tsx
// src/components/playbook/wizard/state-elg-optin-box.tsx (novo arquivo)
'use client';

import { Sparkles } from 'lucide-react';

export function StateElgOptinBox({
  consent,
  onConsentChange,
  subscribe,
  onSubscribeChange,
}: {
  consent: boolean;
  onConsentChange: (v: boolean) => void;
  subscribe: boolean;
  onSubscribeChange: (v: boolean) => void;
}) {
  return (
    <div className="state-elg-box-wrapper">
      <div className="state-elg-box-inner">
        <div className="state-elg-header">
          <span className="state-elg-icon">
            <Sparkles size={14} />
          </span>
          <span className="state-elg-badge">Contribua com o Panorama ELG no Brasil</span>
        </div>

        <p className="state-elg-description">
          A gente tá montando o primeiro panorama de Employee-Led Growth do Brasil,
          baseado em respostas anônimas de quem preenche esse playbook. <strong>Nenhum
          dado sensível (nome, email, empresa) sai</strong>. Só os agregados das respostas
          do quiz entram no panorama.{' '}
          <a href="/legal#state-of-elg" target="_blank" rel="noopener noreferrer">
            Como funciona
          </a>.
        </p>

        {/* Toggle principal */}
        <label className="state-elg-toggle-row">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => onConsentChange(e.target.checked)}
            role="switch"
          />
          <span className="state-elg-toggle-track">
            <span className="state-elg-toggle-thumb" />
          </span>
          <span className="state-elg-toggle-label">
            Permito o uso anônimo das minhas respostas no relatório
          </span>
        </label>

        {/* Checkbox subordinado (só faz sentido se consent=true) */}
        <label
          className="state-elg-subscribe-row"
          data-disabled={!consent}
        >
          <input
            type="checkbox"
            checked={subscribe}
            disabled={!consent}
            onChange={(e) => onSubscribeChange(e.target.checked)}
          />
          <span>Quero receber o relatório em primeira mão quando ele sair</span>
        </label>
      </div>
    </div>
  );
}
```

CSS:

```css
/* 1. Registra a propriedade pra ela ficar interpolável pelo CSS animation.
   Sem isso o navegador trataria --shimmer-angle como string e não animaria.
   Suporte: Chrome/Edge 85+, Safari 16.4+, Firefox 128+. */
@property --shimmer-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

/* 2. Wrapper tem PADDING de 2px (= espessura da borda) e BACKGROUND com
   duas camadas:
   - Layer de baixo (linear-gradient roxo sólido): borda SEMPRE visível.
   - Layer de cima (conic-gradient): ponto de brilho que viaja por cima.
   O `padding: 2px` cria o espaço onde o background aparece como "anel" de
   borda. O `.state-elg-box-inner` por dentro tem bg branco + border-radius
   menor (12px contra 14px do wrapper), cortando o miolo e deixando só os
   2px de borda visíveis no entorno.

   Essa técnica (gradient-border via padding + inner box) é mais confiável
   que o truque de `-webkit-mask` em pseudo-elemento. Tinha tentado mask
   antes mas o inner ficava por cima do ::before e cobria a borda. */
.state-elg-box-wrapper {
  position: relative;
  border-radius: 14px;
  padding: 2px;
  background:
    /* TOPO: ponto de brilho viajando (transparente fora do peak) */
    conic-gradient(
      from var(--shimmer-angle),
      transparent 0deg,
      transparent 45deg,
      rgba(232, 117, 255, 0.55) 65deg,
      #CD50F1 78deg,
      #E875FF 90deg,
      #CD50F1 102deg,
      rgba(232, 117, 255, 0.55) 115deg,
      transparent 135deg,
      transparent 360deg
    ),
    /* BASE: borda roxa fixa, sempre visível */
    linear-gradient(rgba(205, 80, 241, 0.45), rgba(205, 80, 241, 0.45));
  animation: state-elg-shimmer 3s linear infinite;
  isolation: isolate;
}

@keyframes state-elg-shimmer {
  to { --shimmer-angle: 360deg; }
}

/* Inner box (sólido, conteúdo fica aqui).
   border-radius MENOR que o wrapper (14 - 2 = 12px) pra acompanhar o offset
   do padding e a borda ficar uniforme nos cantos. */
.state-elg-box-inner {
  position: relative;
  background: #ffffff;
  border-radius: 12px;
  padding: 16px 18px;
}

/* Halo externo suave (não animado, dá profundidade) */
.state-elg-box-wrapper::after {
  content: '';
  position: absolute;
  inset: -10px;
  border-radius: 22px;
  background: radial-gradient(circle, rgba(205, 80, 241, 0.18), transparent 60%);
  z-index: -1;
  pointer-events: none;
}

/* Respeitar usuários com prefers-reduced-motion.
   Fallback: borda gradiente estática (sem brilho viajando). */
@media (prefers-reduced-motion: reduce) {
  .state-elg-box-wrapper::before {
    animation: none;
  }
}

.state-elg-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.state-elg-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #faecff;
  color: #CD50F1;
}

.state-elg-badge {
  font-family: 'Nunito Sans', sans-serif;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #CD50F1;
}

.state-elg-description {
  font-size: 13px;
  line-height: 1.55;
  color: #5a4768;
  margin: 0 0 14px;
}

.state-elg-description a {
  color: #CD50F1;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.state-elg-toggle-row {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 13.5px;
  font-weight: 600;
  color: #2A1639;
  margin-bottom: 10px;
}

.state-elg-toggle-row input { display: none; }

.state-elg-toggle-track {
  position: relative;
  width: 36px;
  height: 20px;
  background: #d0c4dc;
  border-radius: 999px;
  transition: background 200ms;
  flex-shrink: 0;
}

.state-elg-toggle-row input:checked + .state-elg-toggle-track {
  background: linear-gradient(135deg, #CD50F1, #E875FF);
}

.state-elg-toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 200ms;
}

.state-elg-toggle-row input:checked + .state-elg-toggle-track .state-elg-toggle-thumb {
  transform: translateX(16px);
}

.state-elg-subscribe-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 12.5px;
  color: #5a4768;
  cursor: pointer;
  padding-left: 4px;
  transition: opacity 200ms;
}

.state-elg-subscribe-row[data-disabled="true"] {
  opacity: 0.5;
  cursor: not-allowed;
}

.state-elg-subscribe-row input[type="checkbox"] {
  margin-top: 2px;
  accent-color: #CD50F1;
}
```

### 6.3 Mobile

No modal fullscreen mobile (viewport < 960px), o box mantém todo o comportamento, só com padding interno reduzido pra 14px e font-size do description em 12.5px. A animação da borda continua (60fps em devices modernos, fallback estático em devices antigos via `prefers-reduced-motion`).

### 6.4 Wording revisado do LGPD checkbox

Hoje:
> "Aceito que minhas respostas sejam usadas anonimamente em pesquisas agregadas da Boldfy"

Proposta nova (genérico, sem misturar com State of ELG):
> "Concordo com o tratamento dos meus dados conforme a [Política de Privacidade](/legal#privacidade) da Boldfy."

Mais limpo legal-wise e libera o State of ELG pra ser oferta editorial separada.

---

## 7. Privacy Policy — anchor + reforço

A seção 1.7 da `/legal` já fala sobre o Playbook e tem um bullet sobre "Uso anônimo em pesquisas agregadas" (linhas 287-294 em `src/app/legal/legal-client.tsx`). Falta:

### 7.1 Adicionar anchor pra linkar do form

Em `legal-client.tsx`, o `<li>` que começa com "Uso anônimo em pesquisas agregadas" não tem id. Adicionar:

```tsx
<li id="state-of-elg">
  <strong>Uso anônimo em pesquisas agregadas (State of ELG)</strong> — você pode
  optar (no fim do quiz, opt-out via toggle) por permitir que suas respostas
  sejam usadas de forma <strong>anônima e agregada</strong> para construir
  benchmarks de mercado no relatório &quot;State of Employee-Led Growth no
  Brasil&quot;. Nesses agregados <strong>não há nome, e-mail nem empresa
  identificáveis</strong>: só contagens (ex.: &quot;42% das empresas de marketing
  relatam CAC subindo&quot;). Você pode optar separadamente por receber o
  relatório quando ele for publicado.
</li>
```

Com `id="state-of-elg"`, o link `/legal#state-of-elg` no form leva direto pro bullet certo.

### 7.2 Reforço sobre dados sensíveis

O wording acima já cobre, mas vale destacar visualmente esse `<strong>não há nome, e-mail nem empresa identificáveis</strong>` pra ficar inequívoco.

---

## 8. Ordem de implementação (PRs sugeridos)

1. **PR 1** — Schema + adapter + form-definitions: campos Zod novos, patch no adapter, `acListName` no form-def, patch genérico em `buildAcListNames` pra suportar `extraAcListNames`. Migrations: zero (Opção A do §3.3).
2. **PR 2** — UI do wizard: componente `StateElgOptinBox`, integração no step de identificação, CSS com gradient animado.
3. **PR 3** — Privacy policy: anchor `#state-of-elg` + wording revisado do LGPD checkbox + bullet ajustado.
4. **PR 4** (opcional, depois de coletar dados) — colunas dedicadas em `people` se Opção B fizer sentido.

PR 1 e 3 podem ir juntos (são mudanças complementares pequenas). PR 2 é o maior dos três, em complexidade visual.

---

## 9. Aberto pra decisão da Clara

- [ ] Wording final do badge ("Contribua com o Panorama ELG no Brasil" vs "Ajude a construir o Panorama ELG" vs outra)
- [ ] Wording final do toggle ("Permito o uso anônimo das minhas respostas no relatório" vs "Aceito que minhas respostas anônimas entrem no relatório")
- [ ] Velocidade da animação (3s tá bom? Mais rápido fica nervoso, mais lento fica sutil demais)
- [ ] Intensidade do halo (drop-shadow blur 4px + opacity 0.45) — pode estourar se quiser mais "glow"
- [ ] Decisão Opção A vs B do §3.3
- [ ] Confirmar nome exato da lista do report (conferi no screenshot: `[Lista] Report: Panorama ELG no Brasil` — espaços, dois-pontos, capitalização)
