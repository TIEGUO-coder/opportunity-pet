const CREATOR_STORE_BLUEPRINT = {
  id: 'creator-store-launch-kit-v1',
  version: 1,
  title: 'Creator Store Launch Kit',
  userPromise: 'Turn one useful but messy digital asset into a reviewable product package, a storefront-ready listing, and a result that can be monitored.',
  inputModes: {
    sample: {
      id: 'freelance-client-portal-source',
      label: 'Try the included sample',
      description: 'A deliberately messy set of freelance onboarding notes, checklists, and email drafts.'
    },
    ownAsset: {
      id: 'user-owned-digital-asset',
      label: 'Use my own asset',
      description: 'A template, prompt pack, checklist, guide, workflow, or related source material that the user owns and may sell.'
    }
  },
  requiredInputs: [
    { id: 'source_asset', label: 'Source asset files or notes', required: true },
    { id: 'asset_ownership', label: 'Confirmation that the user owns or may sell the material', required: true },
    { id: 'target_customer', label: 'One narrow target customer', required: true },
    { id: 'storefront', label: 'One intended storefront', required: true, defaultValue: 'Gumroad' },
    { id: 'price_range', label: 'A reviewable price range', required: true, defaultValue: '$29-$79' }
  ],
  evidencePolicy: {
    minimumSignals: 2,
    requiresSourceUrl: true,
    requiresObservedAt: true,
    requiresUserFitReason: true,
    note: 'The opportunity should be supported by recent public examples of similar products, buyer questions, or creator packaging problems.'
  },
  product: {
    id: 'freelance-client-portal-kit',
    title: 'Freelance Client Portal Kit',
    targetCustomer: 'Freelancers and solo service businesses that need a repeatable client onboarding and delivery workflow.',
    deliverables: [
      'Client intake questionnaire',
      'Project progress template',
      'File-delivery checklist',
      'Reusable client email templates',
      'Quick-start guide PDF',
      'Storefront title and description',
      'Storefront FAQ',
      'Cover-image brief',
      'Downloadable ZIP package'
    ]
  },
  stages: [
    {
      id: 'inspect_asset',
      title: 'Inspect the source asset',
      goal: 'Confirm ownership, understand what is useful, and identify missing material.',
      outputs: ['Asset inventory', 'Missing-material list', 'Initial risk notes']
    },
    {
      id: 'validate_demand',
      title: 'Validate the opportunity',
      goal: 'Check recent demand signals and narrow the buyer and promise.',
      outputs: ['Evidence set', 'Target customer', 'Product promise', 'Go/no-go recommendation']
    },
    {
      id: 'package_product',
      title: 'Build the sellable package',
      goal: 'Turn the source material into the complete Freelance Client Portal Kit.',
      outputs: ['All product deliverables', 'Downloadable ZIP package']
    },
    {
      id: 'quality_review',
      title: 'Review product quality',
      goal: 'Check completeness, usability, unsupported claims, and delivery instructions.',
      outputs: ['Quality report', 'Corrected final package']
    },
    {
      id: 'prepare_listing',
      title: 'Prepare the storefront listing',
      goal: 'Create a reviewable listing without publishing it yet.',
      outputs: ['Listing copy', 'FAQ', 'Price recommendation', 'Cover brief', 'Delivery settings']
    },
    {
      id: 'approve_publish',
      title: 'Ask the owner to approve publishing',
      goal: 'Let the owner review the final product, price, storefront copy, and public claims.',
      requiresOwnerApproval: true,
      outputs: ['Publish decision']
    },
    {
      id: 'publish_listing',
      title: 'Publish the approved listing',
      goal: 'Create the storefront product and return a verifiable public product URL.',
      outputs: ['Public product URL', 'Published-at timestamp']
    },
    {
      id: 'monitor_results',
      title: 'Monitor storefront results',
      goal: 'Check product availability, orders, refunds, revenue, and the last successful check time.',
      outputs: ['Verified result snapshot', 'Follow-up recommendation']
    }
  ],
  scheduledIntents: [
    {
      id: 'opportunity_scout',
      title: 'Scout for evidence-backed opportunities',
      startsWhen: 'A builder profile and scouting preferences exist.',
      output: 'A candidate opportunity with sources, dates, and a user-fit reason.'
    },
    {
      id: 'storefront_monitor',
      title: 'Monitor the connected storefront',
      startsWhen: 'A listing has a verified public product URL.',
      output: 'A verified snapshot of product status, orders, refunds, and revenue.'
    }
  ],
  successCriteria: [
    'The final ZIP contains every promised deliverable.',
    'The owner approved the final package, price, storefront copy, and public claims.',
    'Publishing returned a verifiable public product URL.',
    'The latest result snapshot identifies its source and check time.',
    'Illustrative revenue is never presented as verified revenue.'
  ],
  stopConditions: [
    'The user does not own or have permission to sell the source material.',
    'The opportunity has fewer than two inspectable demand signals.',
    'The source asset cannot support one narrow and honest product promise.',
    'The owner rejects the final package or publishing decision.',
    'The storefront cannot be connected or the published product cannot be verified.'
  ]
};

if (typeof module !== 'undefined' && module.exports) module.exports = CREATOR_STORE_BLUEPRINT;
if (typeof window !== 'undefined') window.CREATOR_STORE_BLUEPRINT = CREATOR_STORE_BLUEPRINT;
