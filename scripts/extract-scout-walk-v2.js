const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'assets', 'source', 'teiguo-scout-walk-8frame-v2.png');
const output = path.join(root, 'assets', 'teiguo', 'walk-v2');
const frameCount = 8;

function isBackgroundCandidate(r, g, b) {
  return Math.min(r, g, b) >= 224 && Math.max(r, g, b) - Math.min(r, g, b) <= 18;
}

function findBackground(sheet) {
  const background = new Uint8Array(sheet.width * sheet.height);
  const queue = [];
  function enqueue(x, y) {
    const index = y * sheet.width + x;
    if (background[index]) return;
    const sourceIndex = index << 2;
    if (!isBackgroundCandidate(sheet.data[sourceIndex], sheet.data[sourceIndex + 1], sheet.data[sourceIndex + 2])) return;
    background[index] = 1;
    queue.push(index);
  }
  for (let x = 0; x < sheet.width; x += 1) {
    enqueue(x, 0);
    enqueue(x, sheet.height - 1);
  }
  for (let y = 0; y < sheet.height; y += 1) {
    enqueue(0, y);
    enqueue(sheet.width - 1, y);
  }
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const index = queue[cursor];
    const x = index % sheet.width;
    const y = Math.floor(index / sheet.width);
    if (x > 0) enqueue(x - 1, y);
    if (x + 1 < sheet.width) enqueue(x + 1, y);
    if (y > 0) enqueue(x, y - 1);
    if (y + 1 < sheet.height) enqueue(x, y + 1);
  }
  return background;
}

function findCats(sheet, background) {
  const visited = new Uint8Array(background.length);
  const components = [];
  for (let start = 0; start < background.length; start += 1) {
    if (background[start] || visited[start]) continue;
    visited[start] = 1;
    const pixels = [start];
    let minX = start % sheet.width;
    let maxX = minX;
    let minY = Math.floor(start / sheet.width);
    let maxY = minY;
    for (let cursor = 0; cursor < pixels.length; cursor += 1) {
      const index = pixels[cursor];
      const x = index % sheet.width;
      const y = Math.floor(index / sheet.width);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      for (const next of [index - 1, index + 1, index - sheet.width, index + sheet.width]) {
        if (next < 0 || next >= background.length || background[next] || visited[next]) continue;
        const nextX = next % sheet.width;
        if ((next === index - 1 || next === index + 1) && Math.abs(nextX - x) !== 1) continue;
        visited[next] = 1;
        pixels.push(next);
      }
    }
    if (pixels.length > 1000) components.push({ pixels, minX, maxX, minY, maxY });
  }
  return components.sort((a, b) => b.pixels.length - a.pixels.length).slice(0, frameCount).sort((a, b) => a.minX - b.minX);
}

function pruneThinProtrusions(sheet, component) {
  const source = new Uint8Array(sheet.width * sheet.height);
  component.pixels.forEach((pixel) => { source[pixel] = 1; });
  const core = new Uint8Array(source.length);
  component.pixels.forEach((pixel) => {
    const x = pixel % sheet.width;
    const y = Math.floor(pixel / sheet.width);
    let neighbors = 0;
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < sheet.width && ny >= 0 && ny < sheet.height) neighbors += source[ny * sheet.width + nx];
      }
    }
    if (neighbors >= 13) core[pixel] = 1;
  });

  const pixels = component.pixels.filter((pixel) => {
    const x = pixel % sheet.width;
    const y = Math.floor(pixel / sheet.width);
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < sheet.width && ny >= 0 && ny < sheet.height && core[ny * sheet.width + nx]) return true;
      }
    }
    return false;
  });
  const xs = pixels.map((pixel) => pixel % sheet.width);
  const ys = pixels.map((pixel) => Math.floor(pixel / sheet.width));
  return {
    pixels,
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys)
  };
}

function cropCat(sheet, component) {
  const pad = 5;
  const minX = Math.max(0, component.minX - pad);
  const minY = Math.max(0, component.minY - pad);
  const maxX = Math.min(sheet.width - 1, component.maxX + pad);
  const maxY = Math.min(sheet.height - 1, component.maxY + pad);
  const frame = new PNG({ width: maxX - minX + 1, height: maxY - minY + 1 });
  const componentPixels = new Set(component.pixels);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const sheetPixel = y * sheet.width + x;
      if (!componentPixels.has(sheetPixel)) continue;
      const sourceIndex = sheetPixel << 2;
      const targetIndex = ((y - minY) * frame.width + x - minX) << 2;
      frame.data[targetIndex] = sheet.data[sourceIndex];
      frame.data[targetIndex + 1] = sheet.data[sourceIndex + 1];
      frame.data[targetIndex + 2] = sheet.data[sourceIndex + 2];
      frame.data[targetIndex + 3] = 255;
    }
  }
  return frame;
}

function normalize(frames) {
  const padding = 8;
  const width = Math.max(...frames.map((frame) => frame.width)) + padding * 2;
  const height = Math.max(...frames.map((frame) => frame.height)) + padding * 2;
  return frames.map((frame) => {
    const canvas = new PNG({ width, height });
    const offsetX = Math.floor((width - frame.width) / 2);
    const offsetY = height - frame.height - padding;
    PNG.bitblt(frame, canvas, 0, 0, frame.width, frame.height, offsetX, offsetY);
    return canvas;
  });
}

function main() {
  const sheet = PNG.sync.read(fs.readFileSync(source));
  const cats = findCats(sheet, findBackground(sheet));
  if (cats.length !== frameCount) throw new Error(`Expected ${frameCount} cats, found ${cats.length}`);
  const frames = normalize(cats.map((cat) => cropCat(sheet, pruneThinProtrusions(sheet, cat))));
  fs.mkdirSync(output, { recursive: true });
  frames.forEach((frame, index) => {
    const name = `walk_${String(index + 1).padStart(3, '0')}.png`;
    fs.writeFileSync(path.join(output, name), PNG.sync.write(frame));
  });
  console.log(`Extracted ${frames.length} aligned walk frames (${frames[0].width}x${frames[0].height}).`);
}

main();
