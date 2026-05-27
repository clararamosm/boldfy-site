/**
 * Formatadores e helpers de display do CRM.
 *
 * Tudo puro/sem side effects — pode ser chamado em Server e Client Components.
 */

/* -------------------------------------------------------------------------- */
/*  Tempo relativo (pt-BR)                                                     */
/* -------------------------------------------------------------------------- */

export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = date instanceof Date ? date : new Date(date);
  const diff = Date.now() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'agora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ontem';
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} sem`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mês`;
  return `${Math.floor(days / 365)} ano`;
}

/**
 * Timezone canônico do app — toda renderização de data/hora em prosa usa SP.
 * Sem isso, SSR no Vercel (Node em UTC) mostraria datas 3h adiantadas pra
 * quem está no Brasil. Datas continuam armazenadas em UTC no DB; só o display
 * é em SP.
 */
const BR_TZ = 'America/Sao_Paulo';

export function formatScheduledAt(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: BR_TZ,
  });
}

/**
 * Data + hora absoluto pt-BR (DD/MM/YYYY HH:MM) em horário de SP. Pedido
 * Clara 2026-05-18: preferir timestamp explícito ao relativo ("há 28 min")
 * em timeline, cards de pessoas/empresas, e tabelas. timeAgo() segue
 * disponível pra contextos onde "agora" / "ontem" são mais legíveis.
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: BR_TZ,
  });
}

/**
 * Data sem hora (DD de mês de YYYY) em horário de SP. Use pra primeiro toque,
 * datas de cadastro, etc — qualquer lugar que mostre só dia.
 */
export function formatDateBR(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: BR_TZ,
  });
}

/* -------------------------------------------------------------------------- */
/*  Avatar — hue determinístico por string (mesma pessoa = mesma cor)         */
/* -------------------------------------------------------------------------- */

export function avatarHue(seed: string): 1 | 2 | 3 | 4 | 5 | 6 {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  const hue = (Math.abs(h) % 6) + 1;
  return hue as 1 | 2 | 3 | 4 | 5 | 6;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* -------------------------------------------------------------------------- */
/*  Activity → texto legível + ícone (emoji compacto)                          */
/* -------------------------------------------------------------------------- */

export type ActivityDisplay = {
  icon: string;
  text: string;
  category: 'web' | 'form' | 'email' | 'cal' | 'manual' | 'system';
};

export function describeActivity(
  type: string,
  data: Record<string, unknown> | null | undefined,
): ActivityDisplay {
  const subtype = (data?.subtype as string | undefined) ?? undefined;

  switch (type) {
    case 'page_view':
      return { icon: '👁', text: `Visitou ${(data?.page as string) ?? 'página'}`, category: 'web' };
    case 'page_view_precos':
      return { icon: '💰', text: 'Visitou /precos', category: 'web' };
    case 'page_view_solucoes':
      return { icon: '🧩', text: `Visitou ${(data?.page as string) ?? '/solucoes'}`, category: 'web' };
    case 'page_view_agendar_demo':
      return { icon: '🎯', text: 'Visitou /agendar-demo (não submeteu)', category: 'web' };
    case 'blog_read':
      return { icon: '📖', text: `Leu ${(data?.page as string) ?? 'blog post'}`, category: 'web' };

    case 'form_submit_demo':
    case 'form_submit_beta':
    case 'form_submit_algoritmo_linkedin':
    case 'form_submit_case_semrush':
    case 'form_submit_proposta': {
      const labelMap: Record<string, { icon: string; label: string }> = {
        form_submit_demo: { icon: '🎯', label: 'Demo' },
        form_submit_beta: { icon: '🧪', label: 'Beta' },
        form_submit_algoritmo_linkedin: { icon: '📥', label: 'Report Algoritmo LinkedIn 2026' },
        form_submit_case_semrush: { icon: '📑', label: 'Case Semrush ELG' },
        form_submit_proposta: { icon: '💼', label: 'Simulador de Proposta' },
      };
      const m = labelMap[type];
      // Contexto opcional vindo do data: utm_source, sourceChannel, campaign
      const channel = (data?.sourceChannel as string | undefined)
        ?? (data?.utm_source as string | undefined)
        ?? (data?.utm_source_first as string | undefined);
      const page = (data?.origem as string | undefined) ?? (data?.sourcePage as string | undefined);
      const campaign = (data?.utm_campaign as string | undefined) ?? (data?.utm_campaign_first as string | undefined);
      const contextParts: string[] = [];
      if (channel && channel !== 'unknown') contextParts.push(`via ${channel}`);
      if (page) contextParts.push(`em ${page}`);
      if (campaign) contextParts.push(`campanha: ${campaign}`);
      const context = contextParts.length > 0 ? ` · ${contextParts.join(' · ')}` : '';
      return { icon: m.icon, text: `Submeteu ${m.label}${context}`, category: 'form' };
    }
    case 'material_download':
      return { icon: '📦', text: `Baixou material ${(data?.material as string) ?? ''}`.trim(), category: 'form' };

    case 'email_sent': {
      const campaign = data?.campaign_name as string | undefined;
      const subject = data?.message_subject as string | undefined;
      const labelParts = [campaign, subject].filter(Boolean).join(' · ');
      return { icon: '📤', text: `Email enviado${labelParts ? ': ' + labelParts : ''}`, category: 'email' };
    }
    case 'email_open': {
      const campaign = data?.campaign_name as string | undefined;
      const subject = (data?.message_subject as string | undefined) ?? (data?.subject as string | undefined);
      const labelParts = [campaign, subject].filter(Boolean).join(' · ');
      return { icon: '👀', text: `Abriu email${labelParts ? ': ' + labelParts : ''}`, category: 'email' };
    }
    case 'email_click': {
      const url = data?.url as string | undefined;
      const campaign = data?.campaign_name as string | undefined;
      const label = url ?? campaign ?? '';
      return { icon: '🔗', text: `Clicou link${label ? ': ' + label : ''}`, category: 'email' };
    }
    case 'email_forwarded': {
      const campaign = data?.campaign_name as string | undefined;
      return { icon: '📨', text: `Encaminhou email${campaign ? ': ' + campaign : ''}`, category: 'email' };
    }
    case 'email_reply': {
      const campaign = data?.campaign_name as string | undefined;
      const subject = data?.message_subject as string | undefined;
      const labelParts = [campaign, subject].filter(Boolean).join(' · ');
      return { icon: '💬', text: `Respondeu email${labelParts ? ': ' + labelParts : ''}`, category: 'email' };
    }
    case 'email_bounce':
      return { icon: '⚠', text: `Email bounce (${(data?.bounce_type as string) ?? 'soft'})`, category: 'email' };
    case 'email_unsubscribed':
      return { icon: '🚫', text: `Descadastrou da cadência${data?.campaign_name ? ': ' + (data.campaign_name as string) : ''}`, category: 'email' };

    /* ---------------- Task 1: lifecycle events ---------------- */
    case 'lead_unsubscribed':
      return { icon: '❌', text: 'Saiu da lista (unsubscribed)', category: 'email' };
    case 'lead_resubscribed': {
      const formSlug = data?.form_slug as string | undefined;
      return { icon: '✓', text: `Voltou pra base${formSlug ? ` (preencheu form ${formSlug})` : ''}`, category: 'email' };
    }
    case 'field_changed': {
      const field = (data?.field as string) ?? 'campo';
      const oldV = (data?.old_value as string | null) ?? null;
      const newV = (data?.new_value as string | null) ?? null;
      const src = data?.source_form as string | undefined;
      const FIELD_LABELS: Record<string, string> = {
        jobTitle: 'Cargo',
        segment: 'Segmento',
        phone: 'Telefone',
        linkedinUrl: 'LinkedIn',
        location: 'Localização',
      };
      const fieldLabel = FIELD_LABELS[field] ?? field;
      // Renderiza segmento internal slug pra label legível
      const SEGMENT_LABELS: Record<string, string> = {
        lider_b2b: 'Líder B2B',
        parceiro: 'Parceiro estratégico',
        profissional_individual: 'Profissional individual',
      };
      const fmtVal = (v: string | null): string => {
        if (v === null || v === undefined) return 'vazio';
        if (field === 'segment') return SEGMENT_LABELS[v] ?? v;
        return v;
      };
      const direction = `${fmtVal(oldV)} → ${fmtVal(newV)}`;
      const suffix = src ? ` (via form ${src})` : '';
      return { icon: '✏', text: `${fieldLabel}: ${direction}${suffix}`, category: 'system' };
    }
    case 'automation_started': {
      const name = (data?.automation_name as string) ?? (data?.tag_that_triggered as string) ?? 'cadência';
      return { icon: '🔄', text: `Entrou na cadência: ${name}`, category: 'email' };
    }

    case 'cal_scheduled':
      return { icon: '📅', text: 'Agendou no Cal.com', category: 'cal' };
    case 'cal_attended':
      return { icon: '✅', text: 'Reuniu', category: 'cal' };
    case 'cal_noshow':
      return { icon: '⚠', text: 'No-show', category: 'cal' };
    case 'cal_cancelled':
      return { icon: '✖', text: 'Reunião cancelada', category: 'cal' };

    case 'extension_save':
      return { icon: '➕', text: 'Adicionada via extensão Chrome', category: 'system' };

    case 'status_change': {
      // Tentar várias chaves pra resolver labels — o schema do data evoluiu:
      //   Antigo: { from, to }
      //   Novo:   { fromId, toId, fromLabel, toLabel, reason, sourceMethod }
      // Cai pra "?" só se nenhuma forma tiver label resolvível.
      const fromLabel = (data?.fromLabel as string) ?? (data?.from as string) ?? null;
      const toLabel = (data?.toLabel as string) ?? (data?.to as string) ?? null;
      const reasonRaw = data?.reason as string | undefined;
      const reasonText = reasonRaw === 'auto_score_threshold' ? ' (auto)'
        : reasonRaw === 'classify_by_method' ? ' (por form)'
        : reasonRaw === 'sync_from_people' ? ' (sync pessoa)'
        : reasonRaw === 'propagated_from_company_terminal' ? ' (sync empresa)'
        : '';
      if (toLabel && fromLabel) {
        return { icon: '→', text: `Status: ${fromLabel} → ${toLabel}${reasonText}`, category: 'system' };
      }
      if (toLabel) {
        return { icon: '→', text: `Status alterado pra: ${toLabel}${reasonText}`, category: 'system' };
      }
      return { icon: '→', text: `Status alterado${reasonText}`, category: 'system' };
    }
    case 'classification_skipped': {
      const reason = data?.reason as string | undefined;
      const sourceMethod = data?.sourceMethod as string | undefined;
      if (reason === 'no_classification_by_design') {
        return { icon: '·', text: `Form ${sourceMethod ?? ''} — sem mudança de status (cadência cuida)`.trim(), category: 'system' };
      }
      if (reason === 'no_regression') {
        const cur = data?.currentStatus as string | undefined;
        return { icon: '·', text: `Form ${sourceMethod ?? ''} — mantido em ${cur ?? 'status atual'}`.trim(), category: 'system' };
      }
      if (reason === 'is_terminal') {
        return { icon: '·', text: `Form ${sourceMethod ?? ''} — pessoa em status terminal, ignorado`.trim(), category: 'system' };
      }
      return { icon: '·', text: `Classificação ignorada`, category: 'system' };
    }
    case 'ac_sync_ok': {
      const newTag = data?.newTag as string | undefined;
      return { icon: '🔄', text: `Tag AC sincronizada: ${newTag ?? '(sem tag)'}`, category: 'system' };
    }
    case 'ac_sync_failed': {
      const reason = data?.reason as string | undefined;
      return { icon: '⚠', text: `Sync AC falhou: ${reason ?? 'erro'}`, category: 'system' };
    }
    case 'imported_from_ac':
      return { icon: '📦', text: 'Importado do ActiveCampaign', category: 'system' };

    case 'tag_added':
      return { icon: '🏷', text: `Tag adicionada: ${(data?.tag as string) ?? ''}`, category: 'system' };

    case 'manual_note':
      return { icon: '📝', text: 'Nota livre', category: 'manual' };

    case 'manual_interaction': {
      const subtypeMap: Record<string, string> = {
        linkedin_message: 'Mensagem no LinkedIn',
        linkedin_engagement: 'Engagement no LinkedIn',
        whatsapp: 'WhatsApp',
        email_manual: 'Email manual',
        phone_call: 'Ligação',
        meeting_extra: 'Reunião extra',
        other: 'Interação',
      };
      const iconMap: Record<string, string> = {
        linkedin_message: '💬',
        linkedin_engagement: '👍',
        whatsapp: '📱',
        email_manual: '✉',
        phone_call: '📞',
        meeting_extra: '☕',
        other: '🔗',
      };
      return {
        icon: iconMap[subtype ?? 'other'] ?? '🔗',
        text: subtypeMap[subtype ?? 'other'] ?? 'Interação manual',
        category: 'manual',
      };
    }

    default:
      return { icon: '•', text: type, category: 'system' };
  }
}

export function timelineDotClass(category: ActivityDisplay['category']): string {
  switch (category) {
    case 'web': return 'amber';
    case 'form': return '';
    case 'email': return 'gray';
    case 'cal': return 'green';
    case 'manual': return 'pink';
    case 'system': return 'blue';
  }
}

/* -------------------------------------------------------------------------- */
/*  Activity kind — hierarquia visual da timeline (Clara 2026-05-26)          */
/* -------------------------------------------------------------------------- */

/**
 * Distinção visual entre o que o LEAD fez e o que o SISTEMA/usuário fez:
 *
 *  - 'lead'   → ação direta da pessoa (submeteu form, agendou reunião,
 *               clicou email, visitou página). Renderiza com bolinha cheia
 *               roxa + ícone Lucide branco + título grande/forte.
 *
 *  - 'system' → ação automática (mudança de status, sync AC, classification)
 *               ou ação interna (nota livre, log de interação). Renderiza
 *               com bolinha pequena sólida na linha (sem ícone) + texto
 *               menor e mais leve em cinza.
 *
 * Critério: "se o lead não estivesse ali, isso teria acontecido?" — se não,
 * é ação dele (lead). Se sim (sistema disparou sozinho ou Clara registrou),
 * é system.
 */
export function activityKind(type: string): 'lead' | 'system' {
  // Ações diretas do lead
  if (type.startsWith('form_submit_')) return 'lead';
  if (type.startsWith('page_view')) return 'lead';
  switch (type) {
    case 'blog_read':
    case 'material_download':
    case 'cal_scheduled':
    case 'cal_attended':
    case 'cal_noshow':
    case 'cal_cancelled':
    case 'email_open':
    case 'email_click':
    case 'email_reply':
    case 'email_forwarded':
    case 'lead_unsubscribed':
    case 'lead_resubscribed':
    case 'email_unsubscribed':
      return 'lead';
    default:
      // status_change, field_changed, classification_skipped, automation_started,
      // ac_sync_*, imported_from_ac, tag_added, manual_note, manual_interaction,
      // email_sent, email_bounce, extension_save → sistema/usuário
      return 'system';
  }
}

/**
 * Nome do ícone Lucide pra cada tipo de activity. Só usado em ações 'lead'
 * (sistema não mostra ícone). Retorna null pra system pra forçar erro se
 * tentar renderizar (defesa). String em vez de import direto pra manter
 * essa lib sem dependência do React.
 *
 * O caller (people/[id]/page.tsx) tem um mapeamento string → componente
 * Lucide pra renderizar. Adicionar tipo novo: adiciona aqui + lá.
 */
export type LucideIconName =
  | 'Target' | 'FlaskConical' | 'Download' | 'FileSearch' | 'Briefcase' | 'BookOpen'
  | 'Calendar' | 'CalendarCheck' | 'CalendarX' | 'CalendarMinus'
  | 'Eye' | 'DollarSign' | 'Puzzle' | 'CalendarPlus'
  | 'MailOpen' | 'MousePointerClick' | 'Reply' | 'Forward'
  | 'UserMinus' | 'UserPlus' | 'Ban'
  | 'CircleDot'; // fallback genérico

export function activityIconName(type: string): LucideIconName {
  switch (type) {
    case 'form_submit_demo': return 'Target';
    case 'form_submit_beta': return 'FlaskConical';
    case 'form_submit_algoritmo_linkedin': return 'Download';
    case 'form_submit_case_semrush': return 'FileSearch';
    case 'form_submit_proposta': return 'Briefcase';
    case 'form_submit_playbook_employee_led_growth': return 'BookOpen';
    case 'cal_scheduled': return 'Calendar';
    case 'cal_attended': return 'CalendarCheck';
    case 'cal_noshow': return 'CalendarX';
    case 'cal_cancelled': return 'CalendarMinus';
    case 'page_view': return 'Eye';
    case 'page_view_precos': return 'DollarSign';
    case 'page_view_solucoes': return 'Puzzle';
    case 'page_view_agendar_demo': return 'CalendarPlus';
    case 'blog_read': return 'BookOpen';
    case 'material_download': return 'Download';
    case 'email_open': return 'MailOpen';
    case 'email_click': return 'MousePointerClick';
    case 'email_reply': return 'Reply';
    case 'email_forwarded': return 'Forward';
    case 'lead_unsubscribed':
    case 'email_unsubscribed': return 'UserMinus';
    case 'lead_resubscribed': return 'UserPlus';
    default: return 'CircleDot';
  }
}

/* -------------------------------------------------------------------------- */
/*  Source channel display                                                     */
/* -------------------------------------------------------------------------- */

export function channelLabel(channel: string | null | undefined): string {
  switch (channel) {
    case 'linkedin': return 'LinkedIn';
    case 'organic': return 'Organic';
    case 'direct': return 'Direct';
    case 'email': return 'Email';
    case 'indicacao': return 'Indicação';
    case 'pr': return 'PR';
    case 'manual': return 'Manual';
    default: return '—';
  }
}

export function methodVia(method: string | null | undefined): { label: string; classKey: 'linkedin' | 'form' | 'manual' | 'imported' } | null {
  switch (method) {
    case 'extension_linkedin': return { label: 'via LinkedIn', classKey: 'linkedin' };
    case 'form_demo': return { label: 'via Form Demo', classKey: 'form' };
    case 'form_beta': return { label: 'via Form Beta', classKey: 'form' };
    case 'form_algoritmo_linkedin': return { label: 'via Form Algoritmo LinkedIn', classKey: 'form' };
    case 'form_case_semrush': return { label: 'via Form Case Semrush', classKey: 'form' };
    case 'form_proposta': return { label: 'via Form Proposta', classKey: 'form' };
    case 'manual': return { label: 'via Manual', classKey: 'manual' };
    // Equivalente histórico de extension_linkedin (Folk era usado pra capturar
    // contatos do LinkedIn antes da extensão Boldfy existir). Rendizado como
    // "via LinkedIn (legado)" pra refletir o uso real, não a fonte técnica.
    case 'imported_folk': return { label: 'via LinkedIn (legado)', classKey: 'linkedin' };
    default: return null;
  }
}
