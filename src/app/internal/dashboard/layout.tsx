/**
 * Layout do /internal/dashboard — sub-nav comum a todas as 9 abas.
 *
 * Sub-nav é client component (usePathname) pra detectar aba ativa em
 * navegação client-side.
 */

import { DashboardSubNav } from '@/components/dashboard/sub-nav';
import './dashboard.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <DashboardSubNav />
      {children}
    </div>
  );
}
