const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { frameIndexAtElapsed, actionDuration } = require('../src/pet-animation-timing');

assert.equal(frameIndexAtElapsed(0, 100, 4), 0);
assert.equal(frameIndexAtElapsed(99, 100, 4), 0);
assert.equal(frameIndexAtElapsed(100, 100, 4), 1);
assert.equal(frameIndexAtElapsed(399, 100, 4), 3);
assert.equal(frameIndexAtElapsed(400, 100, 4), 0);
assert.equal(frameIndexAtElapsed(900, 100, 4, false), 3);
assert.equal(actionDuration(125, 4), 500);
const rendererHtml = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer.html'), 'utf8');
const rendererJs = fs.readFileSync(path.join(__dirname, '..', 'src', 'renderer.js'), 'utf8');
assert.match(rendererHtml, /<canvas id="pet"/);
assert.match(rendererJs, /requestAnimationFrame\(runAnimationFrame\)/);
assert.match(rendererJs, /getContext\('2d'/);
assert.doesNotMatch(rendererJs, /setInterval\(showFrame/);
assert.doesNotMatch(rendererJs, /scoutStepOffsetAtElapsed/);
const styles = fs.readFileSync(path.join(__dirname, '..', 'src', 'styles.css'), 'utf8');
assert.doesNotMatch(styles, /animation:\s*paceAround/);
assert.doesNotMatch(styles, /--scout-step-x/);

console.log('Verified Canvas rendering, refresh-synchronized timing, looping, and one-shot completion boundaries.');
