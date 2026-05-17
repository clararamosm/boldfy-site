/**
 * DEPRECATED — rota Folk removida em mai/2026. Arquivo stub até Clara
 * rodar `rm -r src/app/internal/crm/settings/import-folk/` no terminal nativo.
 *
 * Quem cair aqui é redirect pro import do AC, que virou a fonte única.
 */

import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function ImportFolkRemoved() {
  redirect('/internal/crm/settings/import');
}
