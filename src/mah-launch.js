const DEFAULT_DESKTOP_URL = 'mah://import/opportunity';

function clean(value, limit = 1600) {
  return typeof value === 'string' ? value.trim().slice(0, limit) : '';
}

function compactHandoff(payload = {}) {
  const opportunity = payload.opportunity || payload;
  return {
    version: 1,
    source: 'opportunity-pet',
    idempotencyKey: clean(payload.idempotencyKey, 240) || `opportunity:${clean(opportunity.id, 240)}`,
    opportunity: {
      id: clean(opportunity.id, 240),
      title: clean(opportunity.title, 240),
      type: clean(opportunity.type, 120),
      summary: clean(opportunity.summary),
      evidence: clean(opportunity.evidence, 800),
      risk: clean(opportunity.risk, 800),
      smallestExperiment: clean(opportunity.smallestExperiment, 1200),
      recommendedDirection: Array.isArray(opportunity.recommendedDirection)
        ? opportunity.recommendedDirection.map((item) => clean(item, 500)).filter(Boolean).slice(0, 8)
        : [],
      checks: Array.isArray(opportunity.checks)
        ? opportunity.checks.map((item) => clean(item, 500)).filter(Boolean).slice(0, 8)
        : []
    }
  };
}

function handoffUrl(base, handoff, expectedProtocol) {
  if (!base) return '';
  const url = new URL(base);
  if (expectedProtocol && url.protocol !== expectedProtocol) {
    throw new Error(`Expected a ${expectedProtocol} MAH URL.`);
  }
  const encoded = Buffer.from(JSON.stringify(handoff), 'utf8').toString('base64url');
  url.searchParams.set('source', 'opportunity-pet');
  url.searchParams.set('handoff', encoded);
  return url.toString();
}

function buildMahLaunchTargets(payload, options = {}) {
  const handoff = compactHandoff(payload);
  const desktopBase = options.desktopUrl || process.env.OPPORTUNITY_PET_MAH_DEEP_LINK || DEFAULT_DESKTOP_URL;
  const webBase = options.webUrl || process.env.OPPORTUNITY_PET_MAH_WEB_URL || '';
  return {
    handoff,
    desktopUrl: handoffUrl(desktopBase, handoff, 'mah:'),
    webUrl: handoffUrl(webBase, handoff, webBase ? 'https:' : '')
  };
}

async function launchMahOpportunity(payload, dependencies = {}, options = {}) {
  const targets = buildMahLaunchTargets(payload, options);
  const getApplicationInfoForProtocol = dependencies.getApplicationInfoForProtocol;
  const openExternal = dependencies.openExternal;
  let installed = false;

  if (typeof getApplicationInfoForProtocol === 'function') {
    try {
      await getApplicationInfoForProtocol(targets.desktopUrl);
      installed = true;
    } catch {
      installed = false;
    }
  }

  if (installed) {
    await openExternal(targets.desktopUrl);
    return { opened: true, target: 'desktop', url: targets.desktopUrl };
  }
  if (targets.webUrl) {
    await openExternal(targets.webUrl);
    return { opened: true, target: 'web', url: targets.webUrl };
  }
  return {
    opened: false,
    target: 'unconfigured',
    message: 'The MAH download URL has not been configured for this pre-release build.'
  };
}

module.exports = {
  DEFAULT_DESKTOP_URL,
  buildMahLaunchTargets,
  compactHandoff,
  launchMahOpportunity
};
