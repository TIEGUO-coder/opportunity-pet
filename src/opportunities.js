window.OPPORTUNITIES = [
  {
    title: 'AI Resource Pack Shop',
    type: 'Underserved',
    summary: 'Builders keep asking for reusable prompts, assets, workflows, and starter packs, but most resources are scattered across posts and repo READMEs.',
    evidence: 'Repeated resource-list repos, prompt packs, and issue comments asking for templates.',
    risk: 'Could become a generic directory if the packs are not opinionated and task-specific.',
    v1: 'Ship 12 curated packs for one audience: AI builders shipping tiny SaaS/tools in a weekend.',
    grillQuestions: [
      'Who buys the first pack and what job are they already trying to finish?',
      'What makes this more than a list of links?',
      'What proof shows people will pay instead of bookmarking?'
    ]
  },
  {
    title: 'OSS Issue Digest Bot',
    type: 'Overloaded',
    summary: 'Maintainers with busy repos need weekly issue summaries that separate real user pain from noise.',
    evidence: 'High issue volume, stale triage labels, and repeated duplicate bug reports.',
    risk: 'GitHub notification fatigue is already high; the digest must save time immediately.',
    v1: 'Generate a weekly maintainer brief from issues, PRs, labels, and release notes for one repo.',
    grillQuestions: [
      'Which maintainer segment feels this pain weekly?',
      'What summary would they forward to collaborators?',
      'What signal beats GitHub’s native notifications?'
    ]
  },
  {
    title: 'Legacy API Testing Migration Helper',
    type: 'Stalled',
    summary: 'Older API testing projects have users asking for modern runtime support, but migration paths are unclear.',
    evidence: 'Open issues around Node/runtime upgrades, abandoned plugins, and stale release cadence.',
    risk: 'Migration tools are only valuable when the target ecosystem is obvious.',
    v1: 'A CLI that scans an old test collection and produces a modernized migration checklist.',
    grillQuestions: [
      'What exact old-to-new migration is painful enough?',
      'Can the first version be useful without full conversion?',
      'Where does distribution happen: CLI, GitHub Action, or hosted checker?'
    ]
  }
];
