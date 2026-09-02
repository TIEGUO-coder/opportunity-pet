const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const root = path.resolve(__dirname, '..');
const actions = ['idle', 'walk', 'sleep', 'happy', 'chase', 'yawn'];
let checked = 0;

for (const action of actions) {
  let expectedSize = null;
  for (let i = 1; i <= 4; i += 1) {
    const file = path.join(root, 'assets', 'teiguo', action, `${action}_${String(i).padStart(3, '0')}.png`);
    if (!fs.existsSync(file)) throw new Error(`Missing frame: ${file}`);
    const image = PNG.sync.read(fs.readFileSync(file));
    const size = `${image.width}x${image.height}`;
    if (expectedSize && size !== expectedSize) throw new Error(`Frame size shifts within ${action}: ${file}`);
    expectedSize = size;
    let transparent = 0;
    let opaque = 0;
    for (let p = 3; p < image.data.length; p += 4) {
      if (image.data[p] === 0) transparent += 1;
      if (image.data[p] > 180) opaque += 1;
    }
    if (transparent === 0) throw new Error(`Frame has no transparent pixels: ${file}`);
    if (opaque < 500) throw new Error(`Frame appears empty: ${file}`);
    for (let x = 0; x < image.width; x += 1) {
      const top = (x << 2) + 3;
      const bottom = (((image.height - 1) * image.width + x) << 2) + 3;
      if (image.data[top] > 20 || image.data[bottom] > 20) throw new Error(`Frame touches a horizontal edge: ${file}`);
    }
    for (let y = 0; y < image.height; y += 1) {
      const left = (y * image.width << 2) + 3;
      const right = ((y * image.width + image.width - 1) << 2) + 3;
      if (image.data[left] > 20 || image.data[right] > 20) throw new Error(`Frame touches a vertical edge: ${file}`);
    }
    checked += 1;
  }
}

let expectedWalkSize = null;
for (let i = 1; i <= 8; i += 1) {
  const file = path.join(root, 'assets', 'teiguo', 'walk-v2', `walk_${String(i).padStart(3, '0')}.png`);
  if (!fs.existsSync(file)) throw new Error(`Missing smooth walk frame: ${file}`);
  const image = PNG.sync.read(fs.readFileSync(file));
  const size = `${image.width}x${image.height}`;
  if (expectedWalkSize && size !== expectedWalkSize) throw new Error(`Smooth walk frame size shifts: ${file}`);
  expectedWalkSize = size;
  let transparent = 0;
  let opaque = 0;
  for (let p = 3; p < image.data.length; p += 4) {
    if (image.data[p] === 0) transparent += 1;
    if (image.data[p] > 180) opaque += 1;
  }
  if (transparent === 0 || opaque < 500) throw new Error(`Invalid smooth walk frame: ${file}`);
  const groundedColumns = [];
  for (let x = 0; x < image.width; x += 1) {
    let grounded = false;
    for (let y = Math.floor(image.height * 0.82); y < image.height; y += 1) {
      if (image.data[(y * image.width + x) * 4 + 3] > 180) {
        grounded = true;
        break;
      }
    }
    if (grounded) groundedColumns.push(x);
  }
  let pawGroups = 0;
  let previousX = -10;
  groundedColumns.forEach((x) => {
    if (x - previousX > 3) pawGroups += 1;
    previousX = x;
  });
  if (pawGroups < 3) throw new Error(`Smooth walk frame appears to be missing legs or paws: ${file}`);
  for (let x = 0; x < image.width; x += 1) {
    if (image.data[x * 4 + 3] > 20) throw new Error(`Smooth walk frame touches top edge: ${file}`);
    if (image.data[((image.height - 1) * image.width + x) * 4 + 3] > 20) throw new Error(`Smooth walk frame touches bottom edge: ${file}`);
  }
  for (let y = 0; y < image.height; y += 1) {
    if (image.data[y * image.width * 4 + 3] > 20) throw new Error(`Smooth walk frame touches left edge: ${file}`);
    if (image.data[(y * image.width + image.width - 1) * 4 + 3] > 20) throw new Error(`Smooth walk frame touches right edge: ${file}`);
  }
  checked += 1;
}

console.log(`Verified ${checked} transparent frames.`);
