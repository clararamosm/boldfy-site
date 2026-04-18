/**
 * Utility to build consistent ActiveCampaign tags across all form actions
 * (proposal, demo, contact, beta).
 *
 * Important: this file is NOT a server action — it's pure client/server
 * utility. That's why it lives in /lib and not in /app/actions.
 * (Next.js requires all exports of 'use server' files to be async.)
 */

export function buildACTags(params: {
  formType: string;
  origem?: string;
  utms?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_term?: string;
  };
  extraTags?: string[];
}): string[] {
  const tags: string[] = [];

  // Sempre taggeia o tipo de form
  tags.push(`Form: ${params.formType}`);

  // Origem do botão no site (ex: "home:solutions", "precos:saas", "caas:hero")
  if (params.origem) tags.push(`Origem: ${params.origem}`);

  // UTMs — cada um vira uma tag separada pra facilitar segmentação no AC
  const u = params.utms ?? {};
  if (u.utm_source) tags.push(`utm_source:${u.utm_source}`);
  if (u.utm_medium) tags.push(`utm_medium:${u.utm_medium}`);
  if (u.utm_campaign) tags.push(`utm_campaign:${u.utm_campaign}`);
  if (u.utm_content) tags.push(`utm_content:${u.utm_content}`);
  if (u.utm_term) tags.push(`utm_term:${u.utm_term}`);

  // Extras específicos do form
  if (params.extraTags) tags.push(...params.extraTags);

  return tags;
}
