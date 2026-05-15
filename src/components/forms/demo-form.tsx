'use client';

/**
 * Conteúdo reutilizável do form de agendamento de demo.
 *
 * Usado em DOIS lugares:
 *   1. `DemoPopupModal` (modal acionado por CTAs no site)
 *   2. LP `/agendar-demo` (página dedicada pra link direto)
 *
 * Renderiza:
 *   - Step 1 (status idle/loading/error): form com nome, email, telefone,
 *     cargo, empresa, funcionários. Submit chama `sendDemoLeadToNotion`,
 *     que sincroniza com AC + Folk.
 *   - Step 2 (status success): título "Tudo certo, {firstName}!" + Cal.com
 *     embed pré-preenchido com nome e email do lead.
 *
 * O título e a descrição visíveis ficam DENTRO do componente — facilita
 * reuso. O caller é responsável apenas por acessibilidade (Dialog.Title
 * sr-only no caso do popup).
 *
 * O caller também pode escutar mudanças de status via `onStatusChange`
 * pra reagir (ex: o popup ajusta max-w do Dialog quando vai pro success).
 */

import * as React from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { sendDemoLeadToNotion, DemoLeadInput } from '@/app/actions/demo-leads';
import { useUtmParams } from '@/hooks/use-utm-params';
import { trackEvent } from '@/lib/track';
import { CalComEmbed } from './cal-com-embed';

const CAL_LINK = 'clara-boldfy/demo';

export type DemoFormStatus = 'idle' | 'loading' | 'success' | 'error';

type FormFields = {
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  empresa: string;
  funcionarios: string;
};

const EMPTY_FIELDS: FormFields = {
  nome: '',
  email: '',
  telefone: '',
  cargo: '',
  empresa: '',
  funcionarios: '',
};

export type DemoFormProps = {
  /**
   * Origem do clique/abertura — vai pro AC/Folk como rastreamento.
   * Ex: 'home:hero', 'header', 'LP Agendar Demo'.
   */
  source: string;
  /**
   * Notifica o caller quando o status muda. Útil pra reagir
   * externamente (ex: popup ajusta max-w quando entra em 'success').
   */
  onStatusChange?: (status: DemoFormStatus) => void;
  /**
   * Quando true, omite o título/descrição internos (caller renderiza
   * seu próprio header). Default: false (renderiza header dentro).
   */
  hideHeader?: boolean;
  /** Altura do Cal embed no step de sucesso. Default '600px'. */
  calHeight?: string;
};

export function DemoForm({
  source,
  onStatusChange,
  hideHeader = false,
  calHeight = '600px',
}: DemoFormProps) {
  const utms = useUtmParams();
  const [status, setStatus] = React.useState<DemoFormStatus>('idle');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [fields, setFields] = React.useState<FormFields>(EMPTY_FIELDS);

  // Notifica caller quando status muda (depois do render pra evitar
  // setState durante render). useEffect dispara após commit.
  React.useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  const updateField = (name: keyof FormFields, value: string) => {
    setFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    trackEvent('form_submit_start', { form_type: 'demo', source });

    const data: DemoLeadInput = {
      ...fields,
      origem: source,
      ...utms,
    };

    const res = await sendDemoLeadToNotion(data);

    if (res.success) {
      setStatus('success');
      trackEvent('form_submit_success', {
        form_type: 'demo',
        source,
        porte: fields.funcionarios,
      });
    } else {
      const msg = res.error || 'Algo deu errado. Tente novamente.';
      setStatus('error');
      setErrorMessage(msg);
      trackEvent('form_submit_error', {
        form_type: 'demo',
        error_message: msg,
      });
    }
  };

  const firstName = fields.nome.trim().split(/\s+/)[0] || '';

  return (
    <div className="flex flex-col gap-4">
      {!hideHeader && (
        <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
          <h2 className="text-xl font-bold leading-none tracking-tight">
            {status === 'success'
              ? firstName
                ? `Tudo certo, ${firstName}!`
                : 'Tudo certo!'
              : 'Agendar demonstração'}
          </h2>
          <p className="text-sm text-gray-500">
            {status === 'success'
              ? 'Agora escolha o melhor horário pra gente conversar.'
              : 'Preencha os dados abaixo e escolha um horário pra nossa conversa.'}
          </p>
        </div>
      )}

      {status === 'success' ? (
        <div className="flex flex-col space-y-4">
          <div className="flex items-center gap-3 text-left">
            <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
            <p className="text-sm text-gray-600">
              Recebi seus dados! Escolhe agora um horário que funcione pra você:
            </p>
          </div>

          <CalComEmbed
            calLink={CAL_LINK}
            name={fields.nome}
            email={fields.email}
            height={calHeight}
          />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <label htmlFor="nome" className="text-sm font-medium text-gray-700">Nome completo</label>
              <input
                required
                id="nome"
                name="nome"
                type="text"
                value={fields.nome}
                onChange={(e) => updateField('nome', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                placeholder="João Silva"
              />
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">E-mail corporativo</label>
              <input
                required
                id="email"
                name="email"
                type="email"
                value={fields.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                placeholder="joao@empresa.com"
              />
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-1">
              <label htmlFor="telefone" className="text-sm font-medium text-gray-700">WhatsApp</label>
              <input
                required
                id="telefone"
                name="telefone"
                type="tel"
                value={fields.telefone}
                onChange={(e) => updateField('telefone', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-1">
              <label htmlFor="cargo" className="text-sm font-medium text-gray-700">Cargo</label>
              <input
                required
                id="cargo"
                name="cargo"
                type="text"
                value={fields.cargo}
                onChange={(e) => updateField('cargo', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                placeholder="CEO / Diretor de Marketing"
              />
            </div>

            <div className="col-span-2 sm:col-span-1 space-y-1">
              <label htmlFor="empresa" className="text-sm font-medium text-gray-700">Nome da empresa</label>
              <input
                required
                id="empresa"
                name="empresa"
                type="text"
                value={fields.empresa}
                onChange={(e) => updateField('empresa', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                placeholder="Sua Empresa"
              />
            </div>

            <div className="col-span-2 space-y-1">
              <label htmlFor="funcionarios" className="text-sm font-medium text-gray-700">Tamanho da empresa</label>
              <select
                required
                id="funcionarios"
                name="funcionarios"
                value={fields.funcionarios}
                onChange={(e) => updateField('funcionarios', e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent bg-white"
              >
                <option value="" disabled>Selecione...</option>
                <option value="1 a 10 funcionários">1 a 10 funcionários</option>
                <option value="11 a 50 funcionários">11 a 50 funcionários</option>
                <option value="51 a 200 funcionários">51 a 200 funcionários</option>
                <option value="201 a 1000 funcionários">201 a 1000 funcionários</option>
                <option value="Mais de 1000 funcionários">Mais de 1000 funcionários</option>
              </select>
            </div>
          </div>

          {status === 'error' && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-100">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full flex justify-center items-center py-2.5 px-4 rounded-md text-sm font-semibold text-white bg-primary shadow-[0_4px_14px_rgba(205,80,241,0.3)] hover:-translate-y-0.5 hover:bg-[#d966f5] hover:shadow-[0_6px_18px_rgba(205,80,241,0.4)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-60 disabled:cursor-wait disabled:hover:translate-y-0"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              'Agendar Demo'
            )}
          </button>
        </form>
      )}
    </div>
  );
}
