'use client';

import * as React from 'react';

/**
 * Embed inline do Cal.com — renderiza o widget de agendamento dentro do site.
 *
 * Usa o snippet vanilla JS oficial do Cal.com (nao usa @calcom/embed-react)
 * pra evitar conflitos de peer-dependency com React 19.
 *
 * Docs: https://cal.com/docs/core-features/embed
 */

type CalComEmbedProps = {
  /** Cal link no formato 'username/event-slug' — ex: 'clara-boldfy/demo' */
  calLink: string;
  /** Prefill do nome (aparece ja preenchido no form do Cal) */
  name?: string;
  /** Prefill do email */
  email?: string;
  /** Altura do embed. Default: 640px (bom tamanho pra calendario) */
  height?: string;
};

/**
 * Tipos minimos do objeto global `window.Cal` injetado pelo script.
 * Nao tem tipagem oficial — reproduzimos o que precisamos aqui.
 */
type CalApi = {
  (action: 'init', namespace: string, options: { origin: string }): void;
  (action: 'inline', options: { elementOrSelector: string | HTMLElement; calLink: string; config?: Record<string, string> }): void;
  (action: 'ui', options: { hideEventTypeDetails?: boolean; layout?: string }): void;
  ns: Record<string, CalApi>;
  loaded?: boolean;
  q?: unknown[];
};

declare global {
  interface Window {
    Cal?: CalApi;
  }
}

const NAMESPACE = 'boldfy-demo';

export function CalComEmbed({
  calLink,
  name,
  email,
  height = '640px',
}: CalComEmbedProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const initialized = React.useRef(false);

  React.useEffect(() => {
    // Guard: evita duplicar inicializacao em StrictMode (React 18+)
    if (initialized.current) return;
    initialized.current = true;

    // 1. Injeta o script oficial do Cal.com se ainda nao estiver no DOM.
    //    O script inicializa window.Cal como proxy que enfileira chamadas
    //    ate o script real carregar (padrao de sdk similar ao GTM/FB Pixel).
    if (!window.Cal) {
      const calScript = `
        (function (C, A, L) {
          let p = function (a, ar) { a.q.push(ar); };
          let d = C.document;
          C.Cal = C.Cal || function () {
            let cal = C.Cal;
            let ar = arguments;
            if (!cal.loaded) {
              cal.ns = {};
              cal.q = cal.q || [];
              d.head.appendChild(d.createElement("script")).src = A;
              cal.loaded = true;
            }
            if (ar[0] === L) {
              const api = function () { p(api, arguments); };
              const namespace = ar[1];
              api.q = api.q || [];
              if(typeof namespace === "string"){
                cal.ns[namespace] = cal.ns[namespace] || api;
                p(cal.ns[namespace], ar);
                p(cal, ["initNamespace", namespace]);
              } else p(cal, ar);
              return;
            }
            p(cal, ar);
          };
        })(window, "https://app.cal.com/embed/embed.js", "init");
      `;
      // Usa eval pra executar o IIFE em um unico statement sem precisar de
      // <script> tag extra. Nao e codigo de usuario — e o loader oficial do
      // Cal.com recomendado na documentacao.
      // eslint-disable-next-line no-eval
      eval(calScript);
    }

    const cal = window.Cal!;

    // 2. Inicializa o namespace especifico pra este embed.
    //    Usar namespace evita conflitos se houver mais de um Cal embed
    //    na mesma pagina no futuro.
    cal('init', NAMESPACE, { origin: 'https://app.cal.com' });

    const nsApi = cal.ns[NAMESPACE];

    // 3. Renderiza o embed inline no container, com prefill de nome/email.
    if (containerRef.current && nsApi) {
      const config: Record<string, string> = {};
      if (name) config.name = name;
      if (email) config.email = email;

      nsApi('inline', {
        elementOrSelector: containerRef.current,
        calLink,
        config,
      });

      // 4. UI config — esconde detalhes do event type (descricao, duracao)
      //    ja que o usuario vem ja contextualizado pelo form.
      nsApi('ui', {
        hideEventTypeDetails: false,
        layout: 'month_view',
      });
    }
  }, [calLink, name, email]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height, overflow: 'auto' }}
      aria-label="Agendador de demonstração Cal.com"
    />
  );
}
