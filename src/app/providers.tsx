'use client';

import { DemoPopupProvider } from '@/components/forms/demo-popup';
import { ProposalBuilderProvider } from '@/components/proposal-builder';
import { BattleCardProvider } from '@/components/battle-card';

// I18nProvider foi removido — viraria passthrough depois que useT() virou
// função síncrona pura em S3. Quando virar multi-locale, reintroduzir aqui.

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DemoPopupProvider>
      <ProposalBuilderProvider>
        <BattleCardProvider>{children}</BattleCardProvider>
      </ProposalBuilderProvider>
    </DemoPopupProvider>
  );
}
