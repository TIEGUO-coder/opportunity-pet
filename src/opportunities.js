window.OPPORTUNITIES = [
  {
    title: 'Missed-Quote Money Finder',
    type: 'Leak',
    summary: 'U.S. mobile detailers, cleaners, movers, lawn crews, and handymen lose jobs because customers ask for quotes in scattered places and owners reply too late or forget the follow-up.',
    evidence: 'Look for Yelp, Thumbtack, Facebook, and Google Business profiles where customers mention slow replies, no callback, vague pricing, or repeated quote questions.',
    risk: 'The first version must not pretend to be a full CRM. It should help one niche reply faster without sounding robotic or making fake price promises.',
    v1: 'Prototype a tiny quote triage helper for one niche: paste a customer message, get missing questions, a friendly reply draft, and a follow-up reminder.',
    grillQuestions: [
      'Which niche has the most obvious public pain: mobile detailers, house cleaners, movers, lawn crews, or handymen?',
      'What exact quote details does that niche need before a useful reply can be drafted?',
      'Should the first experiment be a paste-in web tool, a Chrome side panel, or a set of SMS templates with reminders?'
    ]
  },
  {
    title: 'Review Rescue Inbox',
    type: 'Reputation',
    summary: 'Many U.S. local businesses get Google reviews every week, but owners either ignore them or write rushed replies that make the business look less trustworthy.',
    evidence: 'Look at public Google Business profiles for dentists, cleaners, salons, auto shops, and restaurants with unanswered reviews or repeated copy-paste replies.',
    risk: 'Replies must sound specific and human. A bland AI answer can make an already unhappy customer feel even more ignored.',
    v1: 'Try a tiny browser helper that drafts review replies from the review text, business type, tone, and whether the owner wants to apologize, thank, clarify, or invite follow-up.',
    grillQuestions: [
      'Which local niche has the clearest public examples: dentists, salons, cleaners, auto shops, restaurants, or gyms?',
      'What makes a reply feel genuinely local instead of generated?',
      'Is the first experiment a Chrome extension, a paste-in web tool, or a Google Business workflow guide?'
    ]
  },
  {
    title: 'Resale Listing Polisher',
    type: 'Underserved',
    summary: 'Americans selling used phones, furniture, baby gear, tools, and sneakers on Facebook Marketplace, Craigslist, Mercari, OfferUp, or eBay often post bad photos and weak titles.',
    evidence: 'Look for listings with blurry cover photos, missing measurements, vague titles, and repeated buyer questions in public marketplace examples.',
    risk: 'Must not create fake condition claims; trust matters more than looking fancy.',
    v1: 'Build a small listing assistant that improves title structure, condition checklist, measurements, and platform-ready descriptions from item photos and notes.',
    grillQuestions: [
      'Which resale category has the clearest repeat pattern: phones, furniture, sneakers, tools, cameras, or baby gear?',
      'What can be tested without claiming the item will sell for more?',
      'Is the first experiment a listing generator, a price research helper, or a photo cleanup tool?'
    ]
  }
];
