/**
 * Barrel pros adapters de form.
 *
 * Cada server action importa SÓ o adapter que ela usa:
 *   import { adaptReport } from '@/lib/form-adapters/report';
 *
 * Esse index é conveniência pra imports múltiplos (ex: script de backfill).
 */

export type { ClassifiedLead } from './types';
export { adaptReport } from './report';
export { adaptBeta } from './beta';
export { adaptDemo } from './demo';
export { adaptProposal, type ProposalAdapterContext } from './proposal';
export { adaptLinkedInExtension, type LinkedInExtensionInput } from './linkedin-extension';
