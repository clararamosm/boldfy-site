'use client';

import { I18nProvider } from '@/lib/i18n/context';
import { DemoPopupProvider } from '@/components/forms/demo-popup';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <DemoPopupProvider>
      <I18nProvider>{children}</I18nProvider>
    </DemoPopupProvider>
  );
}
