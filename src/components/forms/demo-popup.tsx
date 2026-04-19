'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import { sendDemoLeadToNotion, DemoLeadInput } from '@/app/actions/demo-leads';
import { useUtmParams } from '@/hooks/use-utm-params';
import { trackEvent } from '@/lib/track';
import { CalComEmbed } from './cal-com-embed';

const CAL_LINK = 'clara-boldfy/demo';

type DemoPopupContextType = {
  isOpen: boolean;
  openPopup: (source?: string) => void;
  closePopup: () => void;
  source: string;
};

const DemoPopupContext = React.createContext<DemoPopupContextType | undefined>(undefined);

export function useDemoPopup() {
  const context = React.useContext(DemoPopupContext);
  if (!context) {
    throw new Error('useDemoPopup must be used within a DemoPopupProvider');
  }
  return context;
}

export function DemoPopupProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [source, setSource] = React.useState('direto');

  const openPopup = React.useCallback((src?: string) => {
    const effectiveSource = src ?? 'direto';
    setSource(effectiveSource);
    setIsOpen(true);
    // Dispara cta_click + form_open juntos: o clique no CTA levou direto
    // a abrir o popup, ent\u00e3o os dois eventos s\u00e3o simult\u00e2neos.
    trackEvent('cta_click', { cta_type: 'demo', source: effectiveSource });
    trackEvent('form_open', { form_type: 'demo', source: effectiveSource });
  }, []);
  const closePopup = React.useCallback(() => setIsOpen(false), []);

  return (
    <DemoPopupContext.Provider value={{ isOpen, openPopup, closePopup, source }}>
      {children}
      <DemoPopupModal isOpen={isOpen} onOpenChange={setIsOpen} source={source} />
    </DemoPopupContext.Provider>
  );
}

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

function DemoPopupModal({
  isOpen,
  onOpenChange,
  source,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  source: string;
}) {
  const utms = useUtmParams();
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [fields, setFields] = React.useState<FormFields>(EMPTY_FIELDS);

  // Todos os campos sao required — form valido quando todos tem valor
  const isFormValid = Object.values(fields).every((v) => v.trim().length > 0);

  const updateField = (name: keyof FormFields, value: string) => {
    setFields((prev) => ({ ...prev, [name]: value }));
  };

  const resetState = () => {
    setStatus('idle');
    setErrorMessage('');
    setFields(EMPTY_FIELDS);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTimeout(resetState, 300); // clear state after close animation
    }
    onOpenChange(open);
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
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={`fixed left-[50%] top-[50%] z-50 grid w-full ${
            status === 'success' ? 'max-w-3xl' : 'max-w-lg'
          } max-h-[90vh] overflow-y-auto translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl`}
        >
          
          <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
            <Dialog.Title className="text-xl font-bold leading-none tracking-tight">
              {status === 'success'
                ? firstName
                  ? `Tudo certo, ${firstName}!`
                  : 'Tudo certo!'
                : 'Agendar demonstração'}
            </Dialog.Title>
            <Dialog.Description className="text-sm text-gray-500">
              {status === 'success'
                ? 'Agora escolha o melhor horário pra gente conversar.'
                : 'Preencha os dados abaixo e escolha um horário pra nossa conversa.'}
            </Dialog.Description>
          </div>

          <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 data-[state=open]:text-gray-500">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Dialog.Close>

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
                height="600px"
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
                disabled={status === 'loading' || !isFormValid}
                className={`w-full flex justify-center items-center py-2.5 px-4 rounded-md shadow-sm text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-all ${
                  isFormValid && status !== 'loading'
                    ? 'bg-accent hover:bg-accent/90 hover:shadow-md cursor-pointer'
                    : 'bg-accent/40 cursor-not-allowed'
                }`}
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
