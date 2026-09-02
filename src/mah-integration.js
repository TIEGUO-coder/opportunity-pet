const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PREVIEW_PHASES = [
  ['accepted', 'Opportunity accepted', 0],
  ['route_created', 'Routemap created', 2500],
  ['product_build', 'Product tasks delegated', 6000],
  ['listing_preparation', 'Store listing prepared', 10000],
  ['store_monitoring', 'Store monitor scheduled', 14000],
  ['route_running', 'Routemap running', 18000]
];

function cleanText(value, fallback = '') {
  return typeof value === 'string' ? value.trim().slice(0, 8000) : fallback;
}

function normalizeOpportunity(input = {}) {
  return {
    id: cleanText(input.id, crypto.randomUUID()),
    title: cleanText(input.title, 'Untitled opportunity'),
    type: cleanText(input.type, 'Opportunity'),
    summary: cleanText(input.summary),
    evidence: cleanText(input.evidence),
    risk: cleanText(input.risk),
    smallestExperiment: cleanText(input.smallestExperiment),
    recommendedDirection: Array.isArray(input.recommendedDirection)
      ? input.recommendedDirection.map((item) => cleanText(item)).filter(Boolean).slice(0, 20)
      : [],
    checks: Array.isArray(input.checks)
      ? input.checks.map((item) => cleanText(item)).filter(Boolean).slice(0, 20)
      : [],
    salesChannel: cleanText(input.salesChannel, 'Gumroad')
  };
}

function phaseState(index, activeIndex) {
  if (index < activeIndex) return 'complete';
  if (index === activeIndex) return 'active';
  return 'pending';
}

class PreviewAdapter {
  constructor(dataFile) {
    this.dataFile = dataFile;
  }

  getStatus() {
    return {
      connected: false,
      mode: 'preview',
      label: 'MAH preview adapter',
      message: 'The real MAH adapter is not installed. Native MAH resources are previewed locally and never reported as live execution.'
    };
  }

  registerProjectEntry({ key = 'opportunity-pet', title = 'Opportunity Pet' } = {}) {
    return {
      id: `preview-entry:${cleanText(key, 'opportunity-pet')}`,
      title: cleanText(title, 'Opportunity Pet'),
      isLive: false,
      launchSurfaces: ['mah-project', 'desktop']
    };
  }

  readStore() {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
      return parsed.projects ? parsed : { projects: {} };
    } catch {
      return { projects: {} };
    }
  }

  writeStore(store) {
    fs.mkdirSync(path.dirname(this.dataFile), { recursive: true });
    fs.writeFileSync(this.dataFile, `${JSON.stringify(store, null, 2)}\n`);
  }

  createOpportunityRoutemap(payload) {
    const opportunity = normalizeOpportunity(payload?.opportunity);
    const idempotencyKey = cleanText(payload?.idempotencyKey, `opportunity:${opportunity.id}`);
    const store = this.readStore();
    const existing = Object.values(store.projects).find((candidate) => candidate.idempotencyKey === idempotencyKey);
    if (existing) return this.hydrate(existing);

    const now = new Date().toISOString();
    const projectId = `preview-project-${crypto.randomUUID()}`;
    const record = {
      idempotencyKey,
      createdAt: now,
      updatedAt: now,
      project: {
        id: projectId,
        entryId: 'preview-entry:opportunity-pet',
        title: opportunity.title,
        mode: 'preview',
        isLive: false
      },
      routemap: {
        id: `preview-route-${crypto.randomUUID()}`,
        opportunity
      },
      result: {
        isIllustrative: true,
        note: 'Illustrative target only. No live MAH routemap, task, schedule, listing, order, or revenue was created by the preview adapter.'
      }
    };
    store.projects[projectId] = record;
    this.writeStore(store);
    return this.hydrate(record);
  }

  getProjectSnapshot(projectId) {
    const store = this.readStore();
    const record = store.projects[projectId];
    if (!record) throw new Error(`MAH project not found: ${projectId}`);
    const snapshot = this.hydrate(record);
    store.projects[projectId] = { ...record, updatedAt: snapshot.updatedAt };
    this.writeStore(store);
    return snapshot;
  }

  submitCheckpointDecision({ projectId, checkpointId, decision } = {}) {
    const snapshot = this.getProjectSnapshot(projectId);
    return {
      projectId: snapshot.project.id,
      checkpointId: cleanText(checkpointId),
      decision: cleanText(decision),
      accepted: false,
      isLive: false,
      message: 'Checkpoint decisions are shown for contract testing only in preview mode.'
    };
  }

  hydrate(record) {
    const elapsed = Date.now() - new Date(record.createdAt).getTime();
    let activeIndex = 0;
    PREVIEW_PHASES.forEach((phase, index) => {
      if (elapsed >= phase[2]) activeIndex = index;
    });
    const active = PREVIEW_PHASES[activeIndex];
    const phases = PREVIEW_PHASES.map(([key, label], index) => ({
      key,
      label,
      state: phaseState(index, activeIndex)
    }));
    const resourceState = (phaseIndex) => phaseState(phaseIndex, activeIndex);

    return {
      project: record.project,
      routemap: {
        ...record.routemap,
        status: active[0],
        statusLabel: active[1],
        phases,
        nextAction: activeIndex === PREVIEW_PHASES.length - 1
          ? 'Connect the production MAH adapter to continue with live resources.'
          : PREVIEW_PHASES[activeIndex + 1][1]
      },
      tasks: [
        { id: `${record.project.id}:validate`, kind: 'validate_asset', label: 'Validate the source asset', state: resourceState(1) },
        { id: `${record.project.id}:build`, kind: 'build_product', label: 'Build the first sellable package', state: resourceState(2) },
        { id: `${record.project.id}:listing`, kind: 'prepare_listing', label: 'Prepare the storefront listing', state: resourceState(3) }
      ],
      schedules: [
        { id: `${record.project.id}:scout`, kind: 'opportunity_scout', label: 'Scout for new opportunities', state: 'preview' },
        { id: `${record.project.id}:monitor`, kind: 'store_monitor', label: 'Monitor the connected storefront', state: resourceState(4) }
      ],
      checkpoints: [
        { id: `${record.project.id}:publish`, kind: 'publish_approval', label: 'Approve storefront publishing', state: activeIndex < 3 ? 'pending' : 'preview' }
      ],
      events: phases
        .filter((phase) => phase.state !== 'pending')
        .map((phase) => ({ type: `routemap.${phase.key}`, state: phase.state, source: 'preview' })),
      result: record.result,
      isLive: false,
      updatedAt: new Date().toISOString()
    };
  }
}

function validateAdapter(adapter) {
  const required = [
    'getStatus',
    'registerProjectEntry',
    'createOpportunityRoutemap',
    'getProjectSnapshot',
    'submitCheckpointDecision'
  ];
  required.forEach((method) => {
    if (typeof adapter?.[method] !== 'function') {
      throw new Error(`MAH adapter must implement ${method}().`);
    }
  });
  return adapter;
}

function loadExternalAdapter(modulePath, context) {
  const resolved = path.isAbsolute(modulePath) ? modulePath : path.resolve(modulePath);
  const exported = require(resolved);
  const adapter = typeof exported.createAdapter === 'function'
    ? exported.createAdapter(context)
    : exported;
  return validateAdapter(adapter);
}

function createMahIntegration({ userDataPath, adapterModule = process.env.OPPORTUNITY_PET_MAH_ADAPTER } = {}) {
  const context = { userDataPath };
  if (adapterModule) return loadExternalAdapter(adapterModule, context);
  return new PreviewAdapter(path.join(userDataPath, 'mah-preview-projects.json'));
}

module.exports = {
  PREVIEW_PHASES,
  PreviewAdapter,
  createMahIntegration,
  normalizeOpportunity
};
