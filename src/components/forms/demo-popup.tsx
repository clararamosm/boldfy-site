'use client';

/**
 * Popup modal de agendamento de demo.
 *
 * Wrapper de Dialog (Radix) em volta do `<DemoForm />` — que é o componente
 * reutilizável de form + cal embed, também usado na LP `/agendar-demo`.
 *
 * Aciona via hook `useDemoPopup()` em qualquer CTA do site:
 *   const { openPopup } = useDemoPopup();
 *   <button onClick={() => openPopup('home:hero')}>Quero uma demo</button>
 */

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { trackEvent } from '@/lib/track';
import { DemoForm, type DemoFormStatus } from './demo-form';

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
    // a abrir o popup, então os dois eventos são simultâneos.
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

function DemoPopupModal({
  isOpen,
  onOpenChange,
  source,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  source: string;
}) {
  // O status do form fica aqui pra controlar o tamanho do Dialog (max-w-3xl
  // no success por causa do Cal embed, max-w-lg no form). A `key` no
  // DemoForm é resetada quando o popup abre/fecha pra limpar o state interno.
  const [formStatus, setFormStatus] = React.useState<DemoFormStatus>('idle');
  const [formKey, setFormKey] = React.useState(0);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reseta o form 300ms depois do close (anim do Dialog) — ao reabrir
      // a key muda e o DemoForm desmonta/remonta com state limpo.
      setTimeout(() => {
        setFormStatus('idle');
        setFormKey((k) => k + 1);
      }, 300);
    }
    onOpenChange(open);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={`fixed left-[50%] top-[50%] z-50 grid w-full ${
            formStatus === 'success' ? 'max-w-3xl' : 'max-w-lg'
          } max-h-[90vh] overflow-y-auto translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl`}
        >
          {/* Dialog.Title precisa existir pra acessibilidade (Radix exige). */}
          {/* Como o DemoForm renderiza seu próprio título visível, esse fica sr-only. */}
          <Dialog.Title className="sr-only">
            {formStatus === 'success' ? 'Demo agendada' : 'Agendar demonstração'}
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            Formulário pra agendar uma demonstração da Boldfy.
          </Dialog.Description>

          <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 data-[state=open]:text-gray-500">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </Dialog.Close>

          <DemoForm
            key={formKey}
            source={source}
            onStatusChange={setFormStatus}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
