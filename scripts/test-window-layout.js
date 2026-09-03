const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { nextWindowOrigin } = require('../src/window-layout');

const leadToScout = nextWindowOrigin({
  x: 100,
  y: 200,
  oldWidth: 280,
  oldHeight: 450,
  newWidth: 200,
  newHeight: 140,
  fromMode: 'lead',
  toMode: 'scout'
});
assert.deepEqual(leadToScout, { x: 140, y: 510 });
assert.equal(100 + 280 / 2, leadToScout.x + 200 / 2);

const renderer = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer.js'), 'utf8');
const skipFunction = renderer.match(/async function skipCurrentLead\(\) \{[\s\S]*?\n\}/)?.[0] || '';
assert.doesNotMatch(skipFunction, /setMode\('pet'\)/);
assert.doesNotMatch(skipFunction, /dataset\.view = 'pet'/);
assert.match(skipFunction, /await scoutForLead\(\)/);

const main = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.js'), 'utf8');
assert.match(main, /setBounds\([^\n]+, false\)/);

console.log('Verified skip-to-scout preserves the pet center and disables animated window sliding.');
