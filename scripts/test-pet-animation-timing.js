const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { frameIndexAtElapsed, actionDuration, scoutStepOffsetAtElapsed } = require('../src/pet-animation-timing');

assert.equal(frameIndexAtElapsed(0, 100, 4), 0);
assert.equal(frameIndexAtElapsed(99, 100, 4), 0);
assert.equal(frameIndexAtElapsed(100, 100, 4), 1);
assert.equal(frameIndexAtElapsed(399, 100, 4), 3);
assert.equal(frameIndexAtElapsed(400, 100, 4), 0);
assert.equal(frameIndexAtElapsed(900, 100, 4, false), 3);
assert.equal(actionDuration(125, 4), 500);
assert.equal(scoutStepOffsetAtElapsed(0, 140), 24);
assert.equal(scoutStepOffsetAtElapsed(139, 140), 24);
assert.equal(scoutStepOffsetAtElapsed(2100, 140), -24);
assert.equal(scoutStepOffsetAtElapsed(2240, 140), -24);

const rendererHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer.html'), 'utf8');
const rendererJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer.js'), 'utf8');
assert.match(rendererHtml, /<canvas id="pet"/);
assert.match(rendererJs, /requestAnimationFrame\(runAnimationFrame\)/);
assert.match(rendererJs, /getContext\('2d'/);
assert.match(rendererJs, /scoutStepOffsetAtElapsed/);
assert.doesNotMatch(rendererJs, /setInterval\(showFrame/);
const styles = fs.readFileSync(path.join(__dirname, '..', 'src', 'styles.css'), 'utf8');
assert.doesNotMatch(styles, /animation:\s*paceAround/);
assert.match(styles, /body\[data-view="scout"\] \.pet-wrap\.pacing/);

console.log('Verified Canvas rendering, refresh-synchronized timing, looping, and one-shot completion boundaries.');
