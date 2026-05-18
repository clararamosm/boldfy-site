/**
 * Layout do /internal/crm — wraps as sub-views com sub-nav.
 *
 * O server component busca os counts (queries DB), e passa pra um client
 * component (CrmSubNav) que usa usePathname() pra detectar a aba ativa
 * corretamente em navegações client-side.
 */

import { getCrmCounts } from '@/lib/crm-queries';
import { CrmSubNav } from '@/components/crm/sub-nav';
import './crm.css';

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  let totalPeople: number | null = null;
  let totalCompanies: number | null = null;
  try {
    const counts = await getCrmCounts();
    totalPeople = counts.totalPeople;
    totalCompanies = counts.totalCompanies;
  } catch {
    // DB não conectado — passa null e o sub-nav esconde os counts
  }

  return (
    <div>
      <CrmSubNav totalPeople={totalPeople} totalCompanies={totalCompanies} />
      {children}
    </div>
  );
}
