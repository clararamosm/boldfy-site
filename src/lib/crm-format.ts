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
      return { icon: '🎯', text: 'Submeteu Form Demo', category: 'form' };
    case 'form_submit_beta':
      return { icon: '🧪', text: 'Submeteu Form Beta', category: 'form' };
    case 'form_submit_report':
      return { icon: '📥', text: 'Baixou Report B2B', category: 'form' };
    case 'form_submit_proposta':
      return { icon: '💼', text: 'Submeteu Simulador de Proposta', category: 'form' };
    case 'material_download':
      return { icon: '📦', text: `Baixou material ${(data?.material as string) ?? ''}`.trim(), category: 'form' };

    case 'email_open':
      return { icon: '✉', text: `Abriu email${data?.subject ? ': ' + (data.subject as string) : ''}`, category: 'email' };
    case 'email_click':
      return { icon: '🔗', text: `Clicou link em email${data?.url ? ': ' + (data.url as string) : ''}`, category: 'email' };

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
      const from = (data?.from as string) ?? '?';
      const to = (data?.to as string) ?? '?';
      const reason = data?.reason === 'auto_score_threshold' ? ' (auto)' : '';
      return { icon: '→', text: `Status: ${from} → ${to}${reason}`, category: 'system' };
    }

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
    case 'imported_folk': return { label: 'importado do Folk', classKey: 'imported' };
    default: return null;
  }
}
