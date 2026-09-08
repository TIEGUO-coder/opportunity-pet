const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'src', 'renderer.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'styles.css'), 'utf8');
const renderer = fs.readFileSync(path.join(root, 'src', 'renderer.js'), 'utf8');

assert.match(html, /id="closeResult"[^>]*aria-label="Back to opportunity"[^>]*>← Back<\/button>/);
assert.doesNotMatch(html, /id="closeResult"[^>]*>×<\/button>/);
assert.match(css, /body\[data-view="result"\] #controls\s*\{\s*display:\s*none;/);
assert.match(renderer, /if \(!window\.confirm\('Quit Opportunity Pet\?'\)\) return;/);

console.log('Verified result-page back control cannot be confused with the hidden, confirmed app quit control.');
