'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import { sendDemoLeadToNotion, DemoLeadInput } from '@/app/actions/demo-leads';
import { cn } from '@/lib/utils'; // Assuming this exists based on common set up

type DemoPopupContextType = {
  isOpen: boolean;
  openPopup: () => void;
  closePopup: () => void;
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

  const openPopup = React.useCallback(() => setIsOpen(true), []);
  const closePopup = React.useCallback(() => setIsOpen(false), []);

  return (
    <DemoPopupContext.Provider value={{ isOpen, openPopup, closePopup }}>
      {children}
      <DemoPopupModal isOpen={isOpen} onOpenChange={setIsOpen} />
    </DemoPopupContext.Provider>
  );
}

function DemoPopupModal({
  isOpen,
  onOpenChange,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState('');

  const resetState = () => {
    setStatus('idle');
    setErrorMessage('');
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

    const formData = new FormData(e.currentTarget);
    const data: DemoLeadInput = {
      nome: formData.get('nome') as string,
      email: formData.get('email') as string,
      telefone: formData.get('telefone') as string,
      cargo: formData.get('cargo') as string,
      empresa: formData.get('empresa') as string,
      funcionarios: formData.get('funcionarios') as string,
    };

    const res = await sendDemoLeadToNotion(data);

    if (res.success) {
      setStatus('success');
    } else {
      setStatus('error');
      setErrorMessage(res.error || 'Algo deu errado. Tente novamente.');
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl">
          
          <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
            <Dialog.Title className="text-xl font-bold leading-none tracking-tight">
              {status === 'success' ? 'Solicitação enviada!' : 'Agendar demonstração'}
            </Dialog.Title>
            <Dialog.Description className="text-sm text-gray-500">
              {status === 'success' 
                ? 'Nossa equipe entrará em contato com você o mais breve possível.'
                : 'Preencha os dados abaixo e entraremos em contato para apresentar a Boldfy.'}
            </Dialog.Description>
          </div>

          <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 data-[state=open]:text-gray-500">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Dialog.Close>

          {status === 'success' ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
              <button
                onClick={() => handleOpenChange(false)}
                className="mt-4 px-6 py-2 bg-accent text-white font-medium rounded-md hover:bg-accent/90 transition-colors"
                type="button"
              >
                Concluir
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label htmlFor="nome" className="text-sm font-medium text-gray-700">Nome completo</label>
                  <input required id="nome" name="nome" type="text" className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent" placeholder="João Silva" />
                </div>
                
                <div className="col-span-2 sm:col-span-1 space-y-1">
                  <label htmlFor="email" className="text-sm font-medium text-gray-700">E-mail corporativo</label>
                  <input required id="email" name="email" type="email" className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent" placeholder="joao@empresa.com" />
                </div>

                <div className="col-span-2 sm:col-span-1 space-y-1">
                  <label htmlFor="telefone" className="text-sm font-medium text-gray-700">WhatsApp</label>
                  <input required id="telefone" name="telefone" type="tel" className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent" placeholder="(11) 99999-9999" />
                </div>

                <div className="col-span-2 sm:col-span-1 space-y-1">
                  <label htmlFor="cargo" className="text-sm font-medium text-gray-700">Cargo</label>
                  <input required id="cargo" name="cargo" type="text" className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent" placeholder="CEO / Diretor de Marketing" />
                </div>

                <div className="col-span-2 sm:col-span-1 space-y-1">
                  <label htmlFor="empresa" className="text-sm font-medium text-gray-700">Nome da empresa</label>
                  <input required id="empresa" name="empresa" type="text" className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent" placeholder="Sua Empresa" />
                </div>

                <div className="col-span-2 space-y-1">
                  <label htmlFor="funcionarios" className="text-sm font-medium text-gray-700">Tamanho da empresa</label>
                  <select required id="funcionarios" name="funcionarios" defaultValue="" className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent bg-white">
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
                className="w-full flex justify-center items-center py-2.5 px-4 rounded-md shadow-sm text-sm font-medium text-white bg-accent hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-75 disabled:cursor-not-allowed transition-colors"
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
