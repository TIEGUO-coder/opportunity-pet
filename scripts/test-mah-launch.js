const assert = require('assert');
const { launchAgentPlist } = require('./mah-autostart');
const startupPlist = launchAgentPlist(['/bridge', '/pet', '/A&B/<pet>', '/project'], '/bridge.log');
assert.match(startupPlist, /A&amp;B\/&lt;pet&gt;/);
assert.match(startupPlist, /<key>RunAtLoad<\/key><true\/>/);
assert.doesNotMatch(startupPlist, /StartInterval|WatchPaths/);
const fs = require('fs');
const path = require('path');
const {
  buildMahLaunchTargets,
  compactHandoff,
  launchMahOpportunity
} = require('../src/mah-launch');

const payload = {
  idempotencyKey: 'opportunity:creator-store',
  opportunity: {
    id: 'creator-store',
    title: 'Creator Store Launch Kit',
    type: 'Digital product',
    summary: 'Package one useful asset and test demand.',
    recommendedDirection: ['Start with one narrow buyer.'],
    checks: ['Confirm evidence before publishing.']
  },
  scoutingPreferences: {
    version: 2,
    role: 'creator',
    interests: ['digital-products', 'open']
  }
};

const rendererHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer.html'), 'utf8');
assert.match(rendererHtml, /id="approveLead"[^>]*>Make this happen →<\/button>/);
assert.match(rendererHtml, /Turn this opportunity into your next project/);
const leadActions = rendererHtml.slice(rendererHtml.indexOf('<div class="action-stack">'), rendererHtml.indexOf('<section id="skipFeedback"'));
assert.doesNotMatch(leadActions.replace(/\b(?:id|class)="[^"]*"/g, ''), /\bMAH\b/i);
assert.doesNotMatch(rendererHtml, />Accept and open in MAH<\/button>/);
assert.doesNotMatch(rendererHtml, /copyMahOpportunity/);
const preload = fs.readFileSync(path.join(__dirname, '..', 'src', 'preload.js'), 'utf8');
assert.doesNotMatch(preload, /mah:(?:copy-opportunity|save-opportunity|pet-opened)/);

const targets = buildMahLaunchTargets(payload, {
  desktopUrl: 'mah://test-receiver/opportunity',
  webUrl: 'https://mah.test/download'
});
assert.equal(new URL(targets.desktopUrl).protocol, 'mah:');
assert.equal(new URL(targets.webUrl).protocol, 'https:');
assert.equal(new URL(targets.downloadUrl).hostname, 'mah.bot');
assert.equal(new URL(targets.desktopUrl).searchParams.get('source'), 'opportunity-pet');
assert.ok(new URL(targets.desktopUrl).searchParams.get('handoff'));
assert.equal(new URL(targets.downloadUrl).searchParams.get('handoff'), null);

assert.deepEqual(compactHandoff(payload).scoutingPreferences, {
  version: 2,
  role: 'creator',
  interests: ['digital-products', 'open'],
  skipped: false
});

(async () => {
  await assert.rejects(launchMahOpportunity(payload, {
    getApplicationInfoForProtocol: () => new Promise(() => {}),
    openExternal: async () => { throw new Error('A lookup timeout must not open the download page.'); }
  }, { lookupTimeoutMs: 10 }), /installation check timed out/);
  const opened = [];
  let installed = false;
  const launchDependencies = {
    getApplicationInfoForProtocol: async () => {
      if (!installed) throw new Error('not installed');
      return { name: 'MAH', path: '/Applications/MAH.app' };
    },
    openApplication: async (applicationPath) => opened.push(applicationPath),
    openExternal: async (url) => opened.push(url)
  };
  assert.equal((await launchMahOpportunity(payload, launchDependencies)).target, 'download');
  installed = true;
  const nativeLaunch = await launchMahOpportunity(payload, launchDependencies);
  assert.equal(nativeLaunch.target, 'desktop');
  assert.equal(nativeLaunch.contextAttached, false);
  assert.equal(opened.pop(), '/Applications/MAH.app');
  const nativeFailure = await launchMahOpportunity(payload, {
    ...launchDependencies,
    openApplication: async () => { throw new Error('launch failed'); }
  });
  assert.equal(nativeFailure.target, 'download');

  const os = require('os');
  const { findMahProjectRoot, saveMahOpportunity } = require('../src/mah-project');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'opportunity-mah-project-'));
  try {
    const component = path.join(root, 'components', 'app');
    fs.mkdirSync(component, { recursive: true });
    assert.equal(findMahProjectRoot(component), '');
    fs.mkdirSync(path.join(root, '.mah-project'));
    fs.writeFileSync(path.join(root, '.mah-project', 'project.json'), JSON.stringify({ schema_version: 1, project_id: 'test-project' }));
    assert.equal(findMahProjectRoot(component), root);
    const saved = saveMahOpportunity(payload, { projectRoot: root });
    assert.equal(saved.projectSaved, true);
    const record = JSON.parse(fs.readFileSync(saved.recordPath, 'utf8'));
    assert.equal(record.opportunity.id, payload.opportunity.id);
    assert.deepEqual(record.scoutingPreferences.interests, payload.scoutingPreferences.interests);
    assert.equal(record.prompt, undefined, 'The discarded copy/paste prompt must not be generated.');
    assert.equal(fs.readdirSync(path.dirname(saved.recordPath)).length, 1);
    assert.equal(saveMahOpportunity(payload, { projectRoot: root }).recordPath, saved.recordPath);
    const local = saveMahOpportunity(payload, { userDataPath: root });
    assert.equal(local.projectSaved, false);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }

  // Exercise the renderer's real click handler across download, install, and retry.
  const vm = require('vm');
  const renderer = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer.js'), 'utf8');
  const store = new Map();
  const button = { disabled: false, textContent: '' };
  const card = { dataset: {} };
  const status = {};
  let attempts = 0;
  let motionChanges = 0;
  let animationCancellations = 0;
  const context = vm.createContext({
    currentLead: payload.opportunity, approveLead: button, leadCard: card,
    PENDING_MAH_KEY: 'pending',
    localStorage: { getItem: (key) => store.get(key), setItem: (key, value) => store.set(key, value) },
    document: { getElementById: () => status },
    opportunityRoutemapPayload: () => payload,
    bridge: { openMahOpportunity: async (value) => {
      assert.deepEqual(JSON.parse(JSON.stringify(value)), payload);
      return { opened: true, target: ++attempts === 1 ? 'download' : 'desktop', contextAttached: false };
    } },
    ambientTimer: null, settleTimer: null, petMotionTimer: null,
    setTimeout, clearTimeout,
    cancelCurrentAnimation() { animationCancellations += 1; },
    setPetMotion() { motionChanges += 1; },
    playActionOnce() { motionChanges += 1; },
    startAnimation() { motionChanges += 1; }
  });
  vm.runInContext(renderer.slice(renderer.indexOf('function pendingMahOpportunity()'), renderer.indexOf('let scoutPreferences =')), context);
  vm.runInContext(renderer.slice(renderer.indexOf('async function approveCurrentLead()'), renderer.indexOf('async function skipCurrentLead()')), context);
  await context.approveCurrentLead();
  assert.equal(button.disabled, false);
  assert.equal(button.textContent, 'Make this happen →');
  assert.equal(JSON.parse(store.get('pending')).opportunity.id, payload.opportunity.id);
  await context.approveCurrentLead();
  assert.equal(attempts, 2);
  assert.equal(button.disabled, false);
  assert.match(status.textContent, /no roadmap has been created or opened/);
  assert.equal(motionChanges, 0, 'Handoff must not change the pet pose or play chase motion.');
  assert.equal(animationCancellations, 2);
  assert.equal(button.textContent, 'Make this happen →');
  assert.doesNotMatch(renderer, /launchedFromMah|copyMahOpportunity|bridge\.saveMahOpportunity|handoffComplete/);
  // A rejected or stalled IPC request must preserve context and re-enable the action.
  context.bridge.openMahOpportunity = async () => { throw new Error('launch failed'); };
  await context.approveCurrentLead();
  assert.equal(button.disabled, false);
  assert.match(status.textContent, /please try again/);
  context.setTimeout = (callback) => setTimeout(callback, 5);
  context.bridge.openMahOpportunity = () => new Promise(() => {});
  await context.approveCurrentLead();
  assert.equal(button.disabled, false);
  assert.match(status.textContent, /please try again/);
  assert.equal(JSON.parse(store.get('pending')).opportunity.id, payload.opportunity.id);
  assert.equal(button.textContent, 'Make this happen →');
  const desktop = await launchMahOpportunity(payload, {
    getApplicationInfoForProtocol: async () => ({ name: 'MAH' }),
    openExternal: async (url) => opened.push(url)
  }, { desktopUrl: 'mah://test-receiver/opportunity', webUrl: 'https://mah.test/download' });
  assert.equal(desktop.target, 'desktop');
  assert.equal(new URL(opened.pop()).protocol, 'mah:');

  const web = await launchMahOpportunity(payload, {
    getApplicationInfoForProtocol: async () => { throw new Error('not installed'); },
    openExternal: async (url) => opened.push(url)
  }, { desktopUrl: 'mah://test-receiver/opportunity', webUrl: 'https://mah.test/download' });
  assert.equal(web.target, 'web');
  assert.equal(new URL(opened.pop()).hostname, 'mah.test');

  const desktopFailureFallback = await launchMahOpportunity(payload, {
    getApplicationInfoForProtocol: async () => ({ name: 'MAH' }),
    openExternal: async (url) => {
      if (new URL(url).protocol === 'mah:') throw new Error('handler failed');
      opened.push(url);
    }
  }, { desktopUrl: 'mah://test-receiver/opportunity', webUrl: 'https://mah.test/import' });
  assert.equal(desktopFailureFallback.target, 'web');
  assert.equal(new URL(opened.pop()).pathname, '/import');

  const download = await launchMahOpportunity(payload, {
    getApplicationInfoForProtocol: async () => { throw new Error('not installed'); },
    openExternal: async (url) => opened.push(url)
  }, { desktopUrl: 'mah://test-receiver/opportunity' });
  assert.equal(download.target, 'download');
  assert.equal(new URL(opened.pop()).hostname, 'mah.bot');

  console.log('Verified installed-MAH deep linking, preference handoff, desktop failure fallback, and web download fallback.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
