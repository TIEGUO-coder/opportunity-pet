const DEFAULT_DESKTOP_URL = 'mah://account';
const DEFAULT_DOWNLOAD_URL = 'https://mah.bot/download';

async function openMahApplication(applicationPath, openPath) {
  if (process.platform === 'darwin') {
    // Use the OS launcher with a bounded timeout so an app-open request cannot wait indefinitely.
    await new Promise((resolve, reject) => {
      require('child_process').execFile('/usr/bin/open', ['-a', applicationPath], { timeout: 8000 }, (error) => {
        if (error) reject(new Error('MAH could not be opened. Please try again.'));
        else resolve();
      });
    });
    return;
  }
  const error = await openPath(applicationPath);
  if (error) throw new Error(error);
}

function clean(value, limit = 1600) {
  return typeof value === 'string' ? value.trim().slice(0, limit) : '';
}

function compactPreferences(preferences = {}) {
  const interests = Array.isArray(preferences.interests)
    ? preferences.interests.map((item) => clean(item, 80)).filter(Boolean).slice(0, 8)
    : [];
  return {
    version: Number.isFinite(preferences.version) ? preferences.version : 1,
    role: clean(preferences.role, 80),
    interests,
    skipped: Boolean(preferences.skipped)
  };
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
    },
    scoutingPreferences: compactPreferences(payload.scoutingPreferences)
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

function downloadUrl(base) {
  if (!base) return '';
  const url = new URL(base);
  if (url.protocol !== 'https:') throw new Error('Expected a https: MAH download URL.');
  url.searchParams.set('source', 'opportunity-pet');
  return url.toString();
}

function buildMahLaunchTargets(payload, options = {}) {
  const handoff = compactHandoff(payload);
  const desktopBase = options.desktopUrl || process.env.OPPORTUNITY_PET_MAH_DEEP_LINK || DEFAULT_DESKTOP_URL;
  const webBase = options.webUrl || process.env.OPPORTUNITY_PET_MAH_WEB_URL || '';
  const downloadBase = options.downloadUrl || process.env.OPPORTUNITY_PET_MAH_DOWNLOAD_URL || DEFAULT_DOWNLOAD_URL;
  return {
    handoff,
    desktopUrl: desktopBase === DEFAULT_DESKTOP_URL ? desktopBase : handoffUrl(desktopBase, handoff, 'mah:'),
    webUrl: handoffUrl(webBase, handoff, webBase ? 'https:' : ''),
    downloadUrl: downloadUrl(downloadBase)
  };
}

async function launchMahOpportunity(payload, dependencies = {}, options = {}) {
  const targets = buildMahLaunchTargets(payload, options);
  const getApplicationInfoForProtocol = dependencies.getApplicationInfoForProtocol;
  const openExternal = dependencies.openExternal;
  let installed = false;
  let application;

  if (typeof getApplicationInfoForProtocol === 'function') {
    let lookupTimer;
    try {
      application = await Promise.race([
        getApplicationInfoForProtocol(targets.desktopUrl),
        new Promise((_, reject) => {
          lookupTimer = setTimeout(() => reject(Object.assign(new Error('MAH installation check timed out. Please try again.'), { code: 'MAH_LOOKUP_TIMEOUT' })), options.lookupTimeoutMs || 8000);
        })
      ]);
      installed = true;
    } catch (error) {
      // A stalled system lookup is not evidence that MAH is absent.
      if (error.code === 'MAH_LOOKUP_TIMEOUT') throw error;
      installed = false;
    } finally {
      clearTimeout(lookupTimer);
    }
  }

  if (installed) {
    try {
      if (targets.desktopUrl === DEFAULT_DESKTOP_URL && application?.path && dependencies.openApplication) {
        await dependencies.openApplication(application.path);
      } else {
        await openExternal(targets.desktopUrl);
      }
      return { opened: true, target: 'desktop', url: targets.desktopUrl, contextAttached: targets.desktopUrl !== DEFAULT_DESKTOP_URL, roadmapOpened: false };
    } catch (error) {
      if (!targets.webUrl && !targets.downloadUrl) throw error;
    }
  }
  if (targets.webUrl) {
    await openExternal(targets.webUrl);
    return { opened: true, target: 'web', url: targets.webUrl };
  }
  await openExternal(targets.downloadUrl);
  return { opened: true, target: 'download', url: targets.downloadUrl };
}

module.exports = {
  openMahApplication,
  DEFAULT_DESKTOP_URL,
  DEFAULT_DOWNLOAD_URL,
  buildMahLaunchTargets,
  compactHandoff,
  launchMahOpportunity
};
