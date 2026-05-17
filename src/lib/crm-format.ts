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

export function formatScheduledAt(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
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
    case 'form_submit_report':
    case 'form_submit_proposta': {
      const labelMap: Record<string, { icon: string; label: string }> = {
        form_submit_demo: { icon: '🎯', label: 'Demo' },
        form_submit_beta: { icon: '🧪', label: 'Beta' },
        form_submit_report: { icon: '📥', label: 'Report B2B' },
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
    case 'form_report': return { label: 'via Form Report', classKey: 'form' };
    case 'form_proposta': return { label: 'via Form Proposta', classKey: 'form' };
    case 'manual': return { label: 'via Manual', classKey: 'manual' };
    // Equivalente histórico de extension_linkedin (Folk era usado pra capturar
    // contatos do LinkedIn antes da extensão Boldfy existir). Rendizado como
    // "via LinkedIn (legado)" pra refletir o uso real, não a fonte técnica.
    case 'imported_folk': return { label: 'via LinkedIn (legado)', classKey: 'linkedin' };
    default: return null;
  }
}
