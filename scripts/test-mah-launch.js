const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  buildMahLaunchTargets,
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
assert.equal(new URL(targets.desktopUrl).searchParams.get('source'), 'opportunity-pet');
assert.ok(new URL(targets.desktopUrl).searchParams.get('handoff'));

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

  const unconfigured = await launchMahOpportunity(payload, {
    getApplicationInfoForProtocol: async () => { throw new Error('not installed'); },
    openExternal: async () => { throw new Error('must not open'); }
  }, { desktopUrl: 'mah://import/opportunity' });
  assert.equal(unconfigured.target, 'unconfigured');

  console.log('Verified installed-MAH deep linking, structured opportunity handoff, and web download fallback.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
