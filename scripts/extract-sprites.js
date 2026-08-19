const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'assets', 'source', 'teiguo-generated-spritesheet.png');
const outRoot = path.join(root, 'assets', 'teiguo');
const actions = ['idle', 'walk', 'sleep', 'happy'];
const alphaThreshold = 20;

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function readPng(file) {
  return PNG.sync.read(fs.readFileSync(file));
}

function writePng(file, png) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, PNG.sync.write(png));
}

function isGreen(r, g, b) {
  return g > 115 && g > r * 1.18 && g > b * 1.18;
}

function edgeAlpha(r, g, b) {
  if (isGreen(r, g, b)) return 0;
  const greenDominance = g - Math.max(r, b);
  if (g > 100 && greenDominance > 12) return Math.max(0, 255 - greenDominance * 10);
  return 255;
}

function despill(r, g, b, alpha) {
  if (alpha === 0) return [0, 0, 0];
  if (alpha === 255) return [r, g, b];
  const cap = Math.max(r, b) + 10;
  return [r, Math.min(g, cap), b];
}

function makeCellMask(sheet, col, row) {
  const cellWidth = Math.floor(sheet.width / 4);
  const cellHeight = Math.floor(sheet.height / 4);
  const startX = col * cellWidth;
  const startY = row * cellHeight;
  const endX = col === 3 ? sheet.width : startX + cellWidth;
  const endY = row === 3 ? sheet.height : startY + cellHeight;
  const width = endX - startX;
  const height = endY - startY;
  const alpha = new Uint8Array(width * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceIdx = (sheet.width * (startY + y) + (startX + x)) << 2;
      alpha[y * width + x] = edgeAlpha(sheet.data[sourceIdx], sheet.data[sourceIdx + 1], sheet.data[sourceIdx + 2]);
    }
  }

  return { startX, startY, width, height, alpha };
}

function largestComponentBounds(mask) {
  const visited = new Uint8Array(mask.width * mask.height);
  let best = null;
  const queue = [];

  for (let y = 0; y < mask.height; y += 1) {
    for (let x = 0; x < mask.width; x += 1) {
      const start = y * mask.width + x;
      if (visited[start] || mask.alpha[start] <= alphaThreshold) continue;

      let count = 0;
      let minX = x;
      let minY = y;
      let maxX = x;
      let maxY = y;
      visited[start] = 1;
      queue.length = 0;
      queue.push(start);

      for (let q = 0; q < queue.length; q += 1) {
        const idx = queue[q];
        const cx = idx % mask.width;
        const cy = Math.floor(idx / mask.width);
        count += 1;
        minX = Math.min(minX, cx);
        minY = Math.min(minY, cy);
        maxX = Math.max(maxX, cx);
        maxY = Math.max(maxY, cy);

        const neighbors = [
          [cx - 1, cy],
          [cx + 1, cy],
          [cx, cy - 1],
          [cx, cy + 1]
        ];

        for (const [nx, ny] of neighbors) {
          if (nx < 0 || ny < 0 || nx >= mask.width || ny >= mask.height) continue;
          const next = ny * mask.width + nx;
          if (visited[next] || mask.alpha[next] <= alphaThreshold) continue;
          visited[next] = 1;
          queue.push(next);
        }
      }

      if (!best || count > best.count) best = { count, minX, minY, maxX, maxY };
    }
  }

  return best || { count: 0, minX: 0, minY: 0, maxX: mask.width - 1, maxY: mask.height - 1 };
}

function cropCell(sheet, col, row) {
  const mask = makeCellMask(sheet, col, row);
  const bounds = largestComponentBounds(mask);

  const pad = 4;
  const minX = Math.max(0, bounds.minX - pad);
  const minY = Math.max(0, bounds.minY - pad);
  const maxX = Math.min(mask.width - 1, bounds.maxX + pad);
  const maxY = Math.min(mask.height - 1, bounds.maxY + pad);

  const width = Math.max(1, maxX - minX + 1);
  const height = Math.max(1, maxY - minY + 1);
  const frame = new PNG({ width, height });

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const sourceX = mask.startX + minX + x;
      const sourceY = mask.startY + minY + y;
      const sourceIdx = (sheet.width * sourceY + sourceX) << 2;
      const targetIdx = (width * y + x) << 2;
      const r = sheet.data[sourceIdx];
      const g = sheet.data[sourceIdx + 1];
      const b = sheet.data[sourceIdx + 2];
      const maskIdx = (minY + y) * mask.width + (minX + x);
      const alpha = mask.alpha[maskIdx] <= alphaThreshold ? 0 : mask.alpha[maskIdx];
      const [nr, ng, nb] = despill(r, g, b, alpha);
      frame.data[targetIdx] = nr;
      frame.data[targetIdx + 1] = ng;
      frame.data[targetIdx + 2] = nb;
      frame.data[targetIdx + 3] = alpha === 0 ? 0 : Math.min(alpha, sheet.data[sourceIdx + 3]);
    }
  }

  return frame;
}

function normalizeActionFrames(frames) {
  const framePadding = 8;
  const width = Math.max(...frames.map((frame) => frame.width)) + framePadding * 2;
  const height = Math.max(...frames.map((frame) => frame.height)) + framePadding * 2;

  return frames.map((frame) => {
    const canvas = new PNG({ width, height });
    const offsetX = Math.floor((width - frame.width) / 2);
    const offsetY = height - frame.height - framePadding;

    for (let y = 0; y < frame.height; y += 1) {
      for (let x = 0; x < frame.width; x += 1) {
        const sourceIdx = (frame.width * y + x) << 2;
        const targetIdx = (width * (offsetY + y) + (offsetX + x)) << 2;
        canvas.data[targetIdx] = frame.data[sourceIdx];
        canvas.data[targetIdx + 1] = frame.data[sourceIdx + 1];
        canvas.data[targetIdx + 2] = frame.data[sourceIdx + 2];
        canvas.data[targetIdx + 3] = frame.data[sourceIdx + 3];
      }
    }

    return canvas;
  });
}

function main() {
  if (!fs.existsSync(source)) {
    throw new Error(`Missing spritesheet: ${source}`);
  }

  const sheet = readPng(source);
  actions.forEach((action, row) => {
    const frames = [];
    for (let col = 0; col < 4; col += 1) {
      frames.push(cropCell(sheet, col, row));
    }

    normalizeActionFrames(frames).forEach((frame, col) => {
      const file = path.join(outRoot, action, `${action}_${String(col + 1).padStart(3, '0')}.png`);
      writePng(file, frame);
    });
  });

  console.log(`Extracted ${actions.length * 4} transparent frames into ${outRoot}`);
}

main();
