'use client';

/**
 * Box State of TLG — opt-in editorial no fim do quiz do Playbook.
 *
 * Renderiza dentro do step de identificação do wizard, depois do checkbox
 * de newsletter e antes do botão "Gerar Playbook". Oferta dupla:
 *   1. Toggle (default ON, opt-out): consent pra uso anonimizado das
 *      respostas no relatório "Panorama Employee-Led Growth no Brasil".
 *   2. Checkbox (default OFF, opt-in, subordinado ao toggle): inscrição
 *      pra receber o relatório em primeira mão quando ele for publicado.
 *
 * Visual: borda fixa roxa com ponto de brilho viajando ao redor (efeito
 * shimmer). CSS em globals.css (`.state-tlg-box-wrapper` + companhia).
 *
 * Acessibilidade:
 *   - Toggle usa `role="switch"` e responde a Space/Enter.
 *   - Quando consent off, o checkbox de inscrição fica `aria-disabled`.
 *
 * Spec: docs/SPEC-playbook-state-of-elg-consent.md §6.
 */

import { Sparkles } from 'lucide-react';

export function StateTlgOptinBox({
  consent,
  onConsentChange,
  subscribe,
  onSubscribeChange,
}: {
  consent: boolean;
  onConsentChange: (value: boolean) => void;
  subscribe: boolean;
  onSubscribeChange: (value: boolean) => void;
}) {
  const handleSubscribeChange = (value: boolean) => {
    // Defesa em profundidade: quando consent desliga, força subscribe off.
    if (!consent && value) return;
    onSubscribeChange(value);
  };

  // Quando consent desliga, força subscribe off via efeito controlado
  // pelo pai. Aqui só evitamos checkbox ficar marcado se consent off.
  const subscribeChecked = consent && subscribe;

  return (
    <div className="state-tlg-box-wrapper">
      <div className="state-tlg-box-inner">
        <div className="mb-2.5 flex items-center gap-2">
          <span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-3 w-3" />
          </span>
          <span className="font-bold uppercase tracking-[0.08em] text-[11.5px] text-primary">
            Panorama TLG no Brasil
          </span>
        </div>

        <p className="mb-3.5 text-[13px] leading-[1.55] text-muted-foreground">
          A gente tá montando o primeiro panorama de Employee-Led Growth do
          Brasil, baseado em respostas anônimas de quem preenche esse
          playbook.{' '}
          <strong className="text-foreground">
            Nenhum dado sensível (nome, email, empresa) sai
          </strong>
          . Só os agregados das respostas do quiz entram no panorama.{' '}
          <a
            href="/legal#state-of-elg"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-2"
          >
            Como funciona
          </a>
          .
        </p>

        {/* Toggle principal (consent) */}
        <label className="mb-3 flex cursor-pointer select-none items-center gap-3 text-[13.5px] font-semibold text-foreground">
          <input
            type="checkbox"
            role="switch"
            checked={consent}
            onChange={(e) => onConsentChange(e.target.checked)}
            className="state-tlg-toggle-input hidden"
          />
          <span className="state-tlg-toggle-track">
            <span className="state-tlg-toggle-thumb" />
          </span>
          <span>Permito o uso anônimo das minhas respostas no panorama</span>
        </label>

        {/* Checkbox subordinado (subscribe) */}
        <label
          className={`flex items-start gap-2.5 pl-1 text-[12.5px] leading-[1.5] transition-opacity ${
            consent
              ? 'cursor-pointer text-muted-foreground'
              : 'cursor-not-allowed text-muted-foreground/50'
          }`}
          aria-disabled={!consent}
        >
          <input
            type="checkbox"
            checked={subscribeChecked}
            disabled={!consent}
            onChange={(e) => handleSubscribeChange(e.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 accent-primary"
          />
          <span>Quero receber o panorama em primeira mão quando ele sair</span>
        </label>
      </div>
    </div>
  );
}
