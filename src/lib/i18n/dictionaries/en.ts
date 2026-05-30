/**
 * English copy — WIP. Populated block by block as we refactor the PT site.
 *
 * NOT wired up yet: getDictionary() still returns pt-BR. This file exists so the
 * future "English site" project is purely structural (locale type + routing +
 * hreflang), with the copy already written and brand-book-aligned — no copy
 * refactor needed at that point. Keys mirror pt-BR.ts.
 *
 * Intentionally untyped (plain object) while partial, so it doesn't need every
 * Dictionary key yet. The structural project will type it as Dictionary once
 * complete and finish the remaining sections.
 */
const en = {
  home: {
    // Use-cases section
    personasTag: 'Where you come in',
    personasTitle: 'Every team in your company has a different pain.',
    personasTitleHighlight: 'We solve each one.',
    personasSubtitle:
      'Choose the pain you come in through. The solution is the same; the starting point is yours.',

    // Persona: Marketing
    ucMarketingTitle: 'For Marketing',
    ucMarketingHeadline: "Organic demand generation that doesn't charge per impression",
    ucMarketingDesc:
      "Real awareness, qualified remarketing lists, and a CAC that doesn't climb with your Ads.",
    ucMarketingBenefit1: 'Organic impressions at scale, no CPM',
    ucMarketingBenefit2: 'Qualified remarketing lists',
    ucMarketingBenefit3: 'Dashboard with paid-media equivalent value',
    ucMarketingCta: 'See how Boldfy solves it',

    // Persona: Sales
    ucVendasTitle: 'For Sales',
    ucVendasHeadline: 'Salespeople with digital authority before the first touch',
    ucVendasDesc:
      "The prospect already knows who's reaching out. Shorter cycle, less ghosting.",
    ucVendasBenefit1: 'Structured social selling with gamification',
    ucVendasBenefit2: 'Technical authority with AI assisting',
    ucVendasBenefit3: 'Higher reply rate on cold outreach',
    ucVendasCta: 'See how Boldfy solves it',

    // Persona: HR
    ucRhTitle: 'For HR',
    ucRhHeadline: 'Employer brand told by the team itself',
    ucRhDesc:
      "Culture shows up in the feed through the voice of those who live it. Whoever arrives already knows what it's like to work there.",
    ucRhBenefit1: 'Authentic employer branding via EGC',
    ucRhBenefit2: 'Culture shown by those who live it',
    ucRhBenefit3: 'A more recognized team, with an effect on turnover',
    ucRhCta: 'See how Boldfy solves it',
  },
};

export default en;
