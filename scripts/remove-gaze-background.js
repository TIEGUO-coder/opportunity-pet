const fs = require('fs');
const { PNG } = require('pngjs');

const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error('Usage: node scripts/remove-gaze-background.js input.png output.png');
const source = PNG.sync.read(fs.readFileSync(input));
const out = new PNG({ width: source.width, height: source.height });
out.data.set(source.data);
const cols = 4;
const rows = 2;
const cellWidth = source.width / cols;
const cellHeight = source.height / rows;

function colorDistance(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
}

for (let row = 0; row < rows; row += 1) {
  for (let col = 0; col < cols; col += 1) {
    const left = Math.round(col * cellWidth);
    const top = Math.round(row * cellHeight);
    const right = Math.round((col + 1) * cellWidth);
    const bottom = Math.round((row + 1) * cellHeight);
    const width = right - left;
    const height = bottom - top;
    const seen = new Uint8Array(width * height);
    const queue = [];
    const seed = (x, y) => {
      const index = y * width + x;
      if (!seen[index]) { seen[index] = 1; queue.push([x, y]); }
    };
    for (let x = 0; x < width; x += 1) { seed(x, 0); seed(x, height - 1); }
    for (let y = 1; y < height - 1; y += 1) { seed(0, y); seed(width - 1, y); }
    for (let i = 0; i < queue.length; i += 1) {
      const [x, y] = queue[i];
      const at = ((top + y) * source.width + left + x) * 4;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const next = ny * width + nx;
        if (seen[next]) continue;
        const nextAt = ((top + ny) * source.width + left + nx) * 4;
        if (colorDistance(source.data.subarray(at, at + 3), source.data.subarray(nextAt, nextAt + 3)) > 30) continue;
        seen[next] = 1;
        queue.push([nx, ny]);
      }
    }
    for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
      if (seen[y * width + x]) out.data[((top + y) * source.width + left + x) * 4 + 3] = 0;
    }
  }
}
fs.writeFileSync(output, PNG.sync.write(out));
