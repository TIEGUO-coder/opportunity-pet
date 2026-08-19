const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const root = path.resolve(__dirname, '..');
const actions = ['idle', 'walk', 'sleep', 'happy'];
let checked = 0;

for (const action of actions) {
  for (let i = 1; i <= 4; i += 1) {
    const file = path.join(root, 'assets', 'teiguo', action, `${action}_${String(i).padStart(3, '0')}.png`);
    if (!fs.existsSync(file)) throw new Error(`Missing frame: ${file}`);
    const image = PNG.sync.read(fs.readFileSync(file));
    let transparent = 0;
    let opaque = 0;
    for (let p = 3; p < image.data.length; p += 4) {
      if (image.data[p] === 0) transparent += 1;
      if (image.data[p] > 180) opaque += 1;
    }
    if (transparent === 0) throw new Error(`Frame has no transparent pixels: ${file}`);
    if (opaque < 500) throw new Error(`Frame appears empty: ${file}`);
    checked += 1;
  }
}

console.log(`Verified ${checked} transparent frames.`);
