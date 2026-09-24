const fs = require('fs');
const { PNG } = require('pngjs');

const padding = 36;
const files = process.argv.slice(2);

files.forEach((file) => {
  const image = PNG.sync.read(fs.readFileSync(file));
  let left = image.width;
  let top = image.height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      if (image.data[(y * image.width + x) * 4 + 3] <= 20) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  const width = right - left + 1 + padding * 2;
  const height = bottom - top + 1 + padding * 2;
  const trimmed = new PNG({ width, height });
  for (let y = 0; y < height - padding * 2; y += 1) {
    for (let x = 0; x < width - padding * 2; x += 1) {
      const from = ((top + y) * image.width + left + x) * 4;
      const to = ((y + padding) * width + x + padding) * 4;
      image.data.copy(trimmed.data, to, from, from + 4);
    }
  }
  fs.writeFileSync(file, PNG.sync.write(trimmed));
  console.log(`Trimmed ${file} to ${width}×${height}.`);
});
