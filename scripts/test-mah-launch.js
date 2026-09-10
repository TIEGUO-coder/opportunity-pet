const assert = require('assert');
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
assert.match(rendererHtml, /class="mah-continuation-note">Continues in MAH<\/p>/);
assert.doesNotMatch(rendererHtml, />Accept and open in MAH<\/button>/);

const targets = buildMahLaunchTargets(payload, {
  desktopUrl: 'mah://import/opportunity',
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
  const opened = [];
  const desktop = await launchMahOpportunity(payload, {
    getApplicationInfoForProtocol: async () => ({ name: 'MAH' }),
    openExternal: async (url) => opened.push(url)
  }, { desktopUrl: 'mah://import/opportunity', webUrl: 'https://mah.test/download' });
  assert.equal(desktop.target, 'desktop');
  assert.equal(new URL(opened.pop()).protocol, 'mah:');

  const web = await launchMahOpportunity(payload, {
    getApplicationInfoForProtocol: async () => { throw new Error('not installed'); },
    openExternal: async (url) => opened.push(url)
  }, { desktopUrl: 'mah://import/opportunity', webUrl: 'https://mah.test/download' });
  assert.equal(web.target, 'web');
  assert.equal(new URL(opened.pop()).hostname, 'mah.test');

  const desktopFailureFallback = await launchMahOpportunity(payload, {
    getApplicationInfoForProtocol: async () => ({ name: 'MAH' }),
    openExternal: async (url) => {
      if (new URL(url).protocol === 'mah:') throw new Error('handler failed');
      opened.push(url);
    }
  }, { desktopUrl: 'mah://import/opportunity', webUrl: 'https://mah.test/import' });
  assert.equal(desktopFailureFallback.target, 'web');
  assert.equal(new URL(opened.pop()).pathname, '/import');

  const download = await launchMahOpportunity(payload, {
    getApplicationInfoForProtocol: async () => { throw new Error('not installed'); },
    openExternal: async (url) => opened.push(url)
  }, { desktopUrl: 'mah://import/opportunity' });
  assert.equal(download.target, 'download');
  assert.equal(new URL(opened.pop()).hostname, 'mah.bot');

  console.log('Verified installed-MAH deep linking, preference handoff, desktop failure fallback, and web download fallback.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
