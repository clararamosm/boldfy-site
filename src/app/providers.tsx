'use client';

import { I18nProvider } from '@/lib/i18n/context';
import { DemoPopupProvider } from '@/components/forms/demo-popup';
import { ProposalBuilderProvider } from '@/components/proposal-builder';
import { BattleCardProvider } from '@/components/battle-card';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <DemoPopupProvider>
        <ProposalBuilderProvider>
          <BattleCardProvider>{children}</BattleCardProvider>
        </ProposalBuilderProvider>
      </DemoPopupProvider>
    </I18nProvider>
  );
}
