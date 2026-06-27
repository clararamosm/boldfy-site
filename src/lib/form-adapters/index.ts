/**
 * Barrel pros adapters de form.
 *
 * Cada server action importa SÓ o adapter que ela usa:
 *   import { adaptAlgoritmoLinkedin } from '@/lib/form-adapters/algoritmo-linkedin';
 *
 * Esse index é conveniência pra imports múltiplos (ex: script de backfill).
 */

export type { ClassifiedLead } from './types';
export { adaptAlgoritmoLinkedin } from './algoritmo-linkedin';
export { adaptCaseSemrush } from './case-semrush';
export { adaptBeta } from './beta';
export { adaptDemo } from './demo';
export { adaptProposal, type ProposalAdapterContext } from './proposal';
export { adaptLinkedInExtension, type LinkedInExtensionInput } from './linkedin-extension';
export {
  adaptLinkedInCompanyExtension,
  type LinkedInCompanyExtensionInput,
  type AdaptedLinkedInCompany,
} from './linkedin-company-extension';
export { adaptPlaybookTeamLedGrowth } from './playbook-team-led-growth';
export { adaptEventosbh } from './eventosbh';
