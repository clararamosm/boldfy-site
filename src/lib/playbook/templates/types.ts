/**
 * Tipos do render engine do Playbook de Employee-Led Growth (spec §6.2).
 *
 * `RenderedData` é o JSON injetado no template visual da página /playbook/[slug].
 * Cada bloco da página (Hero, Snapshot, 3 Fases, Próximo Movimento, Calculadora,
 * Boldfy Resolve, CTA) lê os campos correspondentes daqui.
 *
 * Snapshot é gravado em `playbook_outputs.rendered_data` no momento do submit —
 * mesmo que a gente atualize templates depois, páginas antigas continuam
 * renderizando o que viram. Decisão de spec §11.
 */

export type ChecklistItem = {
  titulo: string;
  descricao: string;
  /** Ex: '1h', '30min', '2 reuniões' — opcional, mostra como pill ao lado do título. */
  prazo?: string;
};

export type RenderedData = {
  /* Bloco 1 — Hero */
  hero: {
    /** Sempre = nome da empresa que o respondente preencheu. */
    headlineEmpresa: string;
    /** Número-soco que cala o leitor. Ex: "R$ 72.000" */
    socoNumero: string;
    /** Legenda do número-soco. Ex: "em earned media na mesa por mês" */
    socoLabel: string;
  };

  /* Bloco 2 — Você está aqui hoje */
  snapshot: {
    /** Valor numérico cru de colaboradores. */
    porte: number;
    /** Display formatado. Ex: "80 colaboradores" */
    portePretty: string;
    /** Área formatada. Ex: "Marketing" */
    areaPretty: string;
    /** Voz atual formatada. Ex: "Founder solo" */
    vozAtualPretty: string;
    /** Tentativas formatada. Ex: "Já tentou e o programa morreu" */
    tentativasPretty: string;
    /** Parágrafo conector de 2-3 linhas gerado a partir do template fixo. */
    paragrafoConector: string;
  };

  /* Bloco 4 — Seu próximo movimento (checklist acionável) */
  /** 5 itens "antes de tudo" — condicionais por área × dor × tentativas. */
  checklistAntes: ChecklistItem[];
  /** 4 itens "na Boldfy" — sempre os mesmos, copy fixa. */
  checklistBoldfy: ChecklistItem[];

  /* Bloco 5 — Calculadora interativa (defaults pré-preenchidos) */
  calculadora: {
    /** Pré-popula o slider de colaboradores no <RoiSimulator />. Clamp 5-70. */
    initialCollaborators: number;
    /** Pré-popula o slider de impressões/mês. Default conservador: 10000. */
    initialImpressions: number;
  };

  /* Bloco 6 — Boldfy ataca os 3 motivos */
  /** As outras 2 áreas mostradas no fim como "e ainda resolve pra...". */
  outrasAreas: Array<{
    slug: 'marketing' | 'vendas' | 'rh';
    pretty: string;
  }>;
};
