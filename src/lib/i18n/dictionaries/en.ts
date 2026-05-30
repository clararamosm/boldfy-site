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

  // /para/rh page — honest version, mirrors paraRh in pt-BR.ts
  paraRh: {
    metaTitle: 'Boldfy · For HR & People teams',
    metaDesc:
      'Your company is losing talent to smaller competitors who show up more on LinkedIn. See how to turn employees into an authentic showcase of your culture.',
    heroTag: 'For HR & People teams',
    heroTitle: 'Your team is already your best recruiter.',
    heroTitleHighlight: 'It just needs the mic.',
    heroSubtitle:
      "The platform that turns employees into an authentic showcase of your culture: employer branding on the outside, belonging and brand culture on the inside. Whoever arrives already knows what it's like to work there.",
    heroCta1: 'Build my package',
    heroCta2: 'Book a demo',
    diagTag: 'The HR pain in B2B',
    diagTitle: 'The paradox of the great place where',
    diagTitleHighlight: "no one knows it's great.",
    diagStat1: 'Candidates research people, not companies',
    diagStat2: 'Headhunter cost through the roof',
    diagBody1:
      'Your company is a great place to work, and the whole team knows it. But the only voice talking about the culture is institutional: the job description, the Company Page post, the paid campaign.',
    diagBody2:
      'Meanwhile, the smaller competitor has 15 people posting about their routine. And that narrative, told by those who live it, is a thousand times stronger.',
    diagVsTitle: 'Visibility on LinkedIn',
    diagVsSub: 'Last week · senior role open',
    diagVsYouLabel: 'Your company',
    diagVsYouValue: '3 posts',
    diagVsYouDesc: 'Institutional Company Page',
    diagVsThemLabel: 'Competitor',
    diagVsThemValue: '42 posts',
    diagVsThemDesc: '15 people from the team',
    diagVsFooter: 'Worse product. Lower salary. Shows up more and wins the talent.',
    diffTag: 'Critical distinction',
    diffTitle: 'Boldfy is',
    diffTitleHighlight: 'NOT',
    diffTitleEnd: ' an internal comms tool.',
    diffBody: 'This is where category confusion runs highest. We make a point of being clear.',
    diffLeftLabel: 'Internal comms (not us)',
    diffLeftTitle: 'Inside to inside',
    diffLeftTag1: 'Intranet',
    diffLeftTag2: 'Slack',
    diffLeftTag3: 'Internal newsletter',
    diffLeftTag4: 'Digital board',
    diffLeftTag5: 'Corporate feed',
    diffRightLabel: 'Boldfy (us)',
    diffRightTitle: 'Inside to outside',
    diffRightTag1: 'Employer brand',
    diffRightTag2: 'Authentic voice',
    diffRightTag3: 'Public LinkedIn',
    diffRightTag4: 'Organic reach',
    diffRightTag5: 'Visible culture',
    viradaTag: 'How Boldfy solves it',
    viradaTitle: 'Culture told by',
    viradaTitleHighlight: 'those who live it.',
    viradaIntro:
      'No template, no rigid guideline. The narrative comes from the person, and the engine works both ways: it communicates the culture outward and strengthens it inward.',
    virada1Title: 'Authentic employer branding.',
    virada1Desc:
      "Several employees sharing the day-to-day on LinkedIn. Culture that's truly visible, not in a paid campaign.",
    virada2Title: 'Whoever arrives already knows you.',
    virada2Desc:
      'The person who applies has already seen the culture, the team and the projects in the feed. A more aligned candidate, a conversation that starts warmer.',
    virada3Title: 'Culture inward, not just outward.',
    virada3Desc:
      "Gamification aligns the team with the brand: everyone understands the pitch, gets involved in the company's topics and feels part of something bigger. People who belong stay longer and cost less to attract.",
    virada4Title: 'Rewards that HR chooses.',
    virada4Desc:
      'Gamification feeds into prizes you define: not just vouchers, but a day off, a spa day, or branded items (backpack, hoodie) with symbolic value. Wellbeing and brand culture, rewarding those who build.',
    numTag: 'What this can generate',
    numTitle: 'The numbers,',
    numTitleHighlight: 'no fluff.',
    numCenario: 'a 200-person scale-up with ~30 active employees posting 2-3x a week',
    numStat1Value: '100k–150k',
    numStat1Label: 'organic impressions/month',
    numStat1Tag1: 'Visibility',
    numStat1Tag2: 'Awareness',
    numStat2Value: '25–30',
    numStat2Label: 'active employees posting 2-3x/week',
    numStat2Tag1: 'Real adoption',
    numStat2Tag2: 'At scale',
    numStat3Value: 'Retention',
    numStat3Label: 'Less cost-per-hire and turnover, through belonging',
    numStat3Tag1: 'Belonging',
    numStat3Tag2: 'Culture inward',
    numKpiTitle: 'Suggested KPIs',
    numKpiTag1: 'eNPS',
    numKpiTag2: 'Senior retention',
    numKpiTag3: 'Fit rate',
    numKpiTag4: 'Glassdoor',
    numKpiTag5: 'Time to hire',
    numKpiTag6: 'Offer acceptance',
    camTag: 'Which solution fits',
    camTitle: 'Which path',
    camTitleHighlight: 'to take.',
    camIntro:
      "For HR & People, the SaaS platform is the most common path. In larger companies, or in departments that don't want to brief internal design for every asset, it's worth combining it with Content as a Service (design track) for ready-made pieces aligned with the employer brand.",
    cam1Tag: 'Software as a Service',
    cam1Title: 'Boldfy platform',
    cam1Desc:
      'The complete system for the whole team to become an employer-brand creator. Contextual AI, gamification, learning tracks and dashboard, all self-serve.',
    cam1Cta: 'Explore the platform',
    cam2Tag: 'Content as a Service',
    cam2Title: 'Content production',
    cam2Desc:
      'We operate alongside you. Strategy, production and handcrafted publishing aligned with the employer brand, with Boldfy underneath organizing everything.',
    cam2Cta: 'Explore the service',
    faqTag: 'FAQ',
    faqTitle: 'Questions that',
    faqTitleHighlight: 'Heads of People ask.',
    faq1Q: 'Is Boldfy an internal comms tool?',
    faq1A:
      "No. Internal comms is the company talking to employees (intranet, Slack, boards). Boldfy is the opposite: it's what your team says outward, on LinkedIn. If you need both, Boldfy complements, never replaces.",
    faq2Q: 'Will I have to force employees to use it?',
    faq2A:
      "No. Invited people become active in the first months just from gamification and recognition. Forcing it produces bad posts; whoever doesn't want to take part shouldn't join the program.",
    faq3Q: 'What about compliance risk in employee content?',
    faq3A:
      'The Brand Context sets the guardrails (topics, tone, sensitive subjects). The AI keeps each post within those limits, plus employees review before publishing and admins can follow all content through the company feed. LGPD and governance considered from day one.',
    faq4Q: 'How long until results show up?',
    faq4A:
      "Reach and culture in the feed show up in the first weeks, as the team activates. The effect on employer branding (a candidate who arrives already knowing the company) and on internal belonging is gradual and settles over the first months. Boldfy doesn't cross-reference applications with employee posts, so you track the recruiting impact with your own HR indicators.",
    faq5Q: 'Do I need to involve marketing to use Boldfy?',
    faq5A:
      'Ideally yes, because the Brand Context is shared. But HR can have admin access. The two teams end up working side by side.',
    faq6Q: 'How does Boldfy help with rewards?',
    faq6A:
      'The platform has a rewards-tips tab focused on vouchers: where to buy them and how to upload the codes straight into Boldfy. Redemption then runs automatically for whoever has points, with no manual delivery from HR. Culture rewards (day off, branded kit, mentorship) are set up the same way.',
    rewTag: 'Rewards',
    rewTitle: 'What the team trades points for,',
    rewTitleHighlight: 'you decide.',
    rewIntro:
      'HR defines the catalog. Every redemption is someone who posted for the brand, and every reward becomes fuel for belonging.',
    rew1Name: 'AI credits', rew1Desc: 'Use them on the platform', rew1Badge: 'Instant credit',
    rew2Name: 'Amazon / iFood voucher', rew2Desc: 'Monetary voucher', rew2Badge: 'Instant code',
    rew3Name: 'Day off', rew3Desc: 'A day off', rew3Badge: 'Culture',
    rew4Name: 'Spa day', rew4Desc: 'Care for those who care for the brand', rew4Badge: 'Wellbeing',
    rew5Name: 'Branded kit', rew5Desc: 'Backpack and hoodie', rew5Badge: 'Brand',
    rew6Name: 'Mentorship with leadership', rew6Desc: '1:1 with someone you admire', rew6Badge: 'Connection',
    rewPoint1: 'The catalog is yours: you define each reward and how much it costs in points.',
    rewPoint2: 'Vouchers on autopilot: Boldfy shows where to buy, you upload the codes and redemption runs on its own, with no HR time spent.',
    rewPoint3: 'From monetary to cultural: voucher, day off, spa day, branded kit or mentorship, all in one place.',
    rewStoreTab1: 'Store',
    rewStoreTab2: 'My redemptions',
    rewStoreTab3: 'History',
    rewCta: 'Redeem',
  },
};

export default en;
