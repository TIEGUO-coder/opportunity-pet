window.OPPORTUNITIES = [
  {
    title: 'Creator Store Launch Kit',
    id: 'creator-store-launch-kit',
    type: 'Creator product packaging',
    roles: ['creator', 'designer', 'operator', 'expert'],
    interests: ['digital-products', 'content-ip'],
    effortLevel: 3,
    riskLevel: 2,
    summary: 'Package a Notion template, checklist, guide, or repeatable client workflow into a small digital product for freelancers or solo businesses. Create a clear product page, ready-to-download files, a quick-start guide, and an FAQ. Start with one asset and one target buyer, then test demand before building a full store.',
    evidence: 'Before acting, collect at least two recent public examples with source links and dates that show similar products sell or that creators struggle to package this kind of asset.',
    risk: 'The first version must package one narrow asset into a sellable product. It should not promise passive income, fake sales, or automate spammy social posting.',
    v1: 'Package one user-owned asset into the Freelance Client Portal Kit: a complete ZIP download, quick-start guide, storefront copy, FAQ, cover brief, and reviewable $29-$79 price range.',
    recommendedDirection: [
      'Use the owner profile to find one template, prompt pack, checklist, guide, workflow, or repeated client process the owner already understands.',
      'Aim the first product at a narrow buyer, such as freelancers or solo service businesses that need repeatable onboarding and delivery.',
      'Turn the chosen opportunity into tasks, approvals, publishing, and ongoing result monitoring.'
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
    ],
    result: {
      isIllustrative: true,
      title: 'First client workflow target',
      customer: 'Local review reply helper',
      revenue: '$149',
      subtitle: 'Illustrative first-paid-pilot target for a reputation workflow',
      stats: [
        ['Pilot fee', '$149'],
        ['Drafts prepared', '42'],
        ['Owner approvals', '18'],
        ['Unanswered reviews', 'Down 63%']
      ],
      ledger: [
        ['Mon 9:00 AM', 'Dentist niche picked', '$0'],
        ['Wed 4:10 PM', 'Reply policy approved', '$0'],
        ['Fri 11:35 AM', 'Pilot workflow delivered', '+$149']
      ],
      note: 'Illustrative target only. Real replies must be approved by the business owner and never posted automatically.'
    }
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
    ],
    result: {
      isIllustrative: true,
      title: 'Listing quality target',
      customer: 'Resale listing assistant',
      revenue: '$59',
      subtitle: 'Illustrative first-packaged-service target for one resale category',
      stats: [
        ['Pilot fee', '$59'],
        ['Listings polished', '12'],
        ['Missing details found', '31'],
        ['Buyer questions reduced', 'Target 40%']
      ],
      ledger: [
        ['Tue 2:20 PM', 'Phone category chosen', '$0'],
        ['Thu 6:45 PM', 'Listing checklist approved', '$0'],
        ['Sat 10:05 AM', 'Pilot package delivered', '+$59']
      ],
      note: 'Illustrative target only. The workflow improves listing clarity but must not invent condition, authenticity, or sale-price claims.'
    }
  }
];
