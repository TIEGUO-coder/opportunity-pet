window.OPPORTUNITIES = [
  {
    title: 'Creator Store Launch Kit',
    id: 'creator-store-launch-kit',
    type: 'Creator product packaging',
    roles: ['creator', 'designer', 'operator', 'expert'],
    interests: ['digital-products', 'content-ip'],
    effortLevel: 3,
    riskLevel: 2,
    summary: 'Turn one useful asset you already own into a focused digital product with a complete download, storefront page, delivery instructions, and a result you can inspect.',
    evidence: 'Before acting, collect at least two recent public examples with source links and dates that show similar products sell or that creators struggle to package this kind of asset.',
    risk: 'The first version must package one narrow asset into a sellable product. It should not promise passive income, fake sales, or automate spammy social posting.',
    v1: 'Package one user-owned asset into the Freelance Client Portal Kit: a complete ZIP download, quick-start guide, storefront copy, FAQ, cover brief, and reviewable $29-$79 price range.',
    recommendedDirection: [
      'Start with the included messy freelance-client sample or one template, prompt pack, checklist, guide, or workflow that the user owns.',
      'Aim the first product at freelancers and solo service businesses that need repeatable client onboarding and delivery.',
      'Finish one complete downloadable package, ask the owner to approve the product and listing, then verify the public product URL before monitoring results.'
    ],
    routemapChecks: [
      'The user confirms ownership or permission to sell the source material.',
      'The opportunity has at least two recent demand signals with source links and dates.',
      'The user approves the final product, price, storefront copy, and public claims before publishing.',
      'Stop if the product cannot return a complete ZIP, a verified public URL, or a sourced result snapshot.'
    ],
    blueprint: window.CREATOR_STORE_BLUEPRINT,
    result: {
      isIllustrative: true,
      title: 'Weekend store result',
      customer: 'Freelance Client Portal Kit',
      revenue: '$203',
      subtitle: 'Illustrative sales target for one packaged creator product',
      stats: [
        ['Balance', '$181'],
        ['Last 7 days', '$203'],
        ['Last 28 days', '$203'],
        ['Total earnings', '$203']
      ],
      ledger: [
        ['Fri 8:10 PM', 'Gumroad order x3', '+$87'],
        ['Sat 1:34 PM', 'Link-in-bio order x2', '+$58'],
        ['Sun 5:22 PM', 'Etsy listing order x2', '+$58']
      ],
      note: 'Illustrative target only. Live orders and revenue must come from a connected storefront monitor; this screen does not claim real sales.'
    }
  },
  {
    id: 'review-rescue-inbox',
    title: 'Review Rescue Inbox',
    type: 'Reputation',
    roles: ['developer', 'operator', 'expert'],
    interests: ['tools-apps', 'services'],
    effortLevel: 2,
    riskLevel: 3,
    summary: 'Many U.S. local businesses get Google reviews every week, but owners either ignore them or write rushed replies that make the business look less trustworthy.',
    evidence: 'Look at public Google Business profiles for dentists, cleaners, salons, auto shops, and restaurants with unanswered reviews or repeated copy-paste replies.',
    risk: 'Replies must sound specific and human. A bland AI answer can make an already unhappy customer feel even more ignored.',
    v1: 'Try a tiny browser helper that drafts review replies from the review text, business type, tone, and whether the owner wants to apologize, thank, clarify, or invite follow-up.',
    recommendedDirection: [
      'Start with one local niche where public examples are easy to inspect: dentists, salons, cleaners, restaurants, or auto shops.',
      'Make the first version a paste-in drafting tool or workflow guide before building a Chrome extension.',
      'Use tone controls and owner approval so each reply feels specific, local, and accountable.'
    ],
    routemapChecks: [
      'User chooses the niche and collects public examples before drafting.',
      'Codex can generate reply drafts, tone variants, and response policies.',
      'Human approval is required before any reply is posted.',
      'Stop if the workflow encourages fake reviews, spam, or generic apology templates.'
    ]
  },
  {
    id: 'resale-listing-polisher',
    title: 'Resale Listing Polisher',
    type: 'Underserved',
    roles: ['developer', 'creator', 'designer', 'operator'],
    interests: ['tools-apps', 'services'],
    effortLevel: 1,
    riskLevel: 1,
    summary: 'Americans selling used phones, furniture, baby gear, tools, and sneakers on Facebook Marketplace, Craigslist, Mercari, OfferUp, or eBay often post bad photos and weak titles.',
    evidence: 'Look for listings with blurry cover photos, missing measurements, vague titles, and repeated buyer questions in public marketplace examples.',
    risk: 'Must not create fake condition claims; trust matters more than looking fancy.',
    v1: 'Build a small listing assistant that improves title structure, condition checklist, measurements, and platform-ready descriptions from item photos and notes.',
    recommendedDirection: [
      'Start with a resale category that has repeat listings and clear buyer questions: phones, furniture, sneakers, tools, cameras, or baby gear.',
      'Make the first version a listing generator with condition checklist, title rewrite, measurements, and platform-ready description.',
      'Avoid revenue claims. The first proof should measure listing completeness, buyer questions reduced, and time saved.'
    ],
    routemapChecks: [
      'User chooses one resale category and one marketplace before building.',
      'Codex can generate titles, descriptions, condition checklists, and photo-shot lists.',
      'Human approval is required for condition, price, authenticity, and defects.',
      'Stop if the workflow invents missing details or implies guaranteed sale prices.'
    ]
  }
];
