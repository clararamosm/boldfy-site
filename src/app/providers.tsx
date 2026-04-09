'use client';

import { I18nProvider } from '@/lib/i18n/context';
import { DemoPopupProvider } from '@/components/forms/demo-popup';
import { ProposalBuilderProvider } from '@/components/proposal-builder';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DemoPopupProvider>
      <ProposalBuilderProvider>
        <I18nProvider>{children}</I18nProvider>
      </ProposalBuilderProvider>
    </DemoPopupProvider>
  );
}
