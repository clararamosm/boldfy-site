/**
 * DEPRECATED — UTM Generator foi promovido pra rota top-level
 * /internal/utm (mai/2026 ciclo 3). Esta page só redireciona pra preservar
 * bookmarks/links antigos.
 */

import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function DashboardUtmRedirect() {
  redirect('/internal/utm');
}
