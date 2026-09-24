const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const root = path.resolve(__dirname, '..');
const source = PNG.sync.read(fs.readFileSync(path.join(root, 'assets/source/teiguo-walk-settle-strip.png')));
const frames = [
  [620, 18, 510, 688],
  [1160, 18, 510, 688],
  [1720, 18, 452, 688]
];

function keepLargestSubject(frame) {
  const seen = new Uint8Array(frame.width * frame.height);
  let largest = [];
  for (let y = 0; y < frame.height; y += 1) {
    for (let x = 0; x < frame.width; x += 1) {
      const start = y * frame.width + x;
      if (seen[start] || frame.data[(start << 2) + 3] < 24) continue;
      const pixels = [start];
      seen[start] = 1;
      for (let i = 0; i < pixels.length; i += 1) {
        const point = pixels[i];
        const px = point % frame.width;
        const py = Math.floor(point / frame.width);
        for (const [nx, ny] of [[px - 1, py], [px + 1, py], [px, py - 1], [px, py + 1]]) {
          const next = ny * frame.width + nx;
          if (nx < 0 || ny < 0 || nx >= frame.width || ny >= frame.height || seen[next] || frame.data[(next << 2) + 3] < 24) continue;
          seen[next] = 1;
          pixels.push(next);
        }
      }
      if (pixels.length > largest.length) largest = pixels;
    }
  }
  const keep = new Uint8Array(frame.width * frame.height);
  largest.forEach((point) => { keep[point] = 1; });
  for (let point = 0; point < keep.length; point += 1) {
    if (!keep[point]) frame.data[(point << 2) + 3] = 0;
  }
}

frames.forEach(([left, top, width, height], index) => {
  const frame = new PNG({ width, height });
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const from = ((top + y) * source.width + left + x) << 2;
      const to = (y * width + x) << 2;
      source.data.copy(frame.data, to, from, from + 4);
    }
  }
  keepLargestSubject(frame);
  fs.writeFileSync(path.join(root, 'assets/teiguo/settle', `settle_00${index + 1}.png`), PNG.sync.write(frame));
});

console.log('Prepared three complete walk-to-sit transition frames.');
