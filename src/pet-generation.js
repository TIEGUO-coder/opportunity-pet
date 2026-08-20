const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');
const { PNG } = require('pngjs');

const ACTIONS = ['idle', 'walk', 'sleep', 'happy', 'chase', 'yawn'];
const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
const GENERATION_TIMEOUT_MS = 20 * 60 * 1000;

function findCodexExecutable(explicitPath = process.env.OPPORTUNITY_PET_CODEX_PATH) {
  const names = process.platform === 'win32' ? ['codex.exe', 'codex.cmd', 'codex'] : ['codex'];
  const candidates = [
    explicitPath,
    process.platform === 'darwin' ? '/opt/homebrew/bin/codex' : null,
    process.platform === 'darwin' ? '/usr/local/bin/codex' : null,
    ...String(process.env.PATH || '').split(path.delimiter).flatMap((dir) => names.map((name) => path.join(dir, name)))
  ].filter(Boolean);

  return candidates.find((candidate) => {
    try {
      return fs.statSync(candidate).isFile();
    } catch {
      return false;
    }
  }) || null;
}

function decodePhoto(dataUrl, index) {
  const match = /^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=\r\n]+)$/.exec(String(dataUrl || ''));
  if (!match) throw new Error(`Photo ${index + 1} is not a supported PNG, JPEG, or WebP image.`);
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length || buffer.length > MAX_PHOTO_BYTES) throw new Error(`Photo ${index + 1} is empty or larger than 20 MB.`);
  return { buffer, extension: match[1].startsWith('jp') ? 'jpg' : match[1] };
}

function isGreen(r, g, b) {
  return g > 115 && g > r * 1.18 && g > b * 1.18;
}

function removeChromaKey(image) {
  for (let i = 0; i < image.data.length; i += 4) {
    const r = image.data[i];
    const g = image.data[i + 1];
    const b = image.data[i + 2];
    if (image.data[i + 3] < 12 || isGreen(r, g, b)) {
      image.data[i] = 0;
      image.data[i + 1] = 0;
      image.data[i + 2] = 0;
      image.data[i + 3] = 0;
      continue;
    }
    const greenDominance = g - Math.max(r, b);
    if (g > 100 && greenDominance > 12) {
      image.data[i + 1] = Math.min(g, Math.max(r, b) + 10);
      image.data[i + 3] = Math.max(0, Math.min(image.data[i + 3], 255 - greenDominance * 10));
    }
  }
}

function cropToContent(image) {
  let minX = image.width;
  let minY = image.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < image.height; y += 1) {
    for (let x = 0; x < image.width; x += 1) {
      const alpha = image.data[(y * image.width + x) * 4 + 3];
      if (alpha <= 20) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) throw new Error('Generated action frame appears empty after background removal.');

  const pad = 4;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(image.width - 1, maxX + pad);
  maxY = Math.min(image.height - 1, maxY + pad);
  const result = new PNG({ width: maxX - minX + 1, height: maxY - minY + 1 });
  PNG.bitblt(image, result, minX, minY, result.width, result.height, 0, 0);
  return result;
}

function splitStrip(buffer) {
  const strip = PNG.sync.read(buffer);
  if (strip.width < 4 || strip.height < 1) throw new Error('Generated action strip is too small.');
  const cellWidth = Math.floor(strip.width / 4);
  const frames = [];

  for (let col = 0; col < 4; col += 1) {
    const width = col === 3 ? strip.width - col * cellWidth : cellWidth;
    const cell = new PNG({ width, height: strip.height });
    PNG.bitblt(strip, cell, col * cellWidth, 0, width, strip.height, 0, 0);
    removeChromaKey(cell);
    frames.push(cropToContent(cell));
  }

  const framePadding = 8;
  const width = Math.max(...frames.map((frame) => frame.width)) + framePadding * 2;
  const height = Math.max(...frames.map((frame) => frame.height)) + framePadding * 2;
  return frames.map((frame) => {
    const canvas = new PNG({ width, height });
    const offsetX = Math.floor((width - frame.width) / 2);
    const offsetY = height - frame.height - framePadding;
    PNG.bitblt(frame, canvas, 0, 0, frame.width, frame.height, offsetX, offsetY);
    return PNG.sync.write(canvas);
  });
}

function loadGeneratedActions(outputDir) {
  const actions = {};
  const framesRoot = path.join(outputDir, 'frames');
  fs.mkdirSync(framesRoot, { recursive: true });

  for (const action of ACTIONS) {
    const stripPath = path.join(outputDir, `${action}.png`);
    if (!fs.existsSync(stripPath)) throw new Error(`Codex did not create output/${action}.png.`);
    const frames = splitStrip(fs.readFileSync(stripPath));
    const actionDir = path.join(framesRoot, action);
    fs.mkdirSync(actionDir, { recursive: true });
    actions[action] = frames.map((frame, index) => {
      const file = path.join(actionDir, `${action}_${String(index + 1).padStart(3, '0')}.png`);
      fs.writeFileSync(file, frame);
      return pathToFileURL(file).href;
    });
  }
  return actions;
}

function runCodex(codexPath, jobDir, photoPaths, onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    const prompt = 'Read and follow ./SKILL.md. Use every attached pet photo, generate the complete action pack under ./output, and satisfy the completion contract without asking questions.';
    const args = ['exec', '--ephemeral', '--skip-git-repo-check', '--sandbox', 'workspace-write', '--cd', jobDir];
    photoPaths.forEach((photo) => args.push('--image', photo));
    args.push(prompt);

    const isNodeScript = path.extname(codexPath).toLowerCase() === '.js';
    const isWindowsCommand = process.platform === 'win32' && ['.cmd', '.bat'].includes(path.extname(codexPath).toLowerCase());
    const executable = isNodeScript ? process.execPath : codexPath;
    const spawnArgs = isNodeScript ? [codexPath, ...args] : args;
    const child = spawn(executable, spawnArgs, {
      cwd: jobDir,
      env: process.env,
      shell: isWindowsCommand,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let output = '';
    let settled = false;
    const writeLog = () => {
      fs.writeFileSync(path.join(jobDir, 'codex.log'), output);
    };
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill();
      writeLog();
      reject(new Error('Codex generation timed out after 20 minutes.'));
    }, GENERATION_TIMEOUT_MS);

    onProgress('Codex is studying the pet photos and building a character sheet...');
    const collect = (chunk) => {
      output = `${output}${chunk}`.slice(-12000);
      if (/image|generat|character|sprite|action/i.test(String(chunk))) {
        onProgress('Codex is generating and checking the six action strips...');
      }
    };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      writeLog();
      reject(error);
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      writeLog();
      if (code === 0) resolve(output);
      else reject(new Error(`Codex exited with code ${code}. Open Codex once, confirm you are signed in, and try again.`));
    });
  });
}

async function generatePetWithCodex({ photos, petName }, options) {
  if (!Array.isArray(photos) || photos.length < 3 || photos.length > 5) {
    return { ok: false, error: 'Choose 3-5 pet photos first.' };
  }
  const codexPath = findCodexExecutable(options.codexPath);
  if (!codexPath) return { ok: false, error: 'Codex CLI was not found. Install and sign in to Codex, or use the local fallback.' };

  const jobId = randomUUID();
  const jobDir = path.join(options.userDataPath, 'pet-generation', jobId);
  const inputDir = path.join(jobDir, 'inputs');
  const outputDir = path.join(jobDir, 'output');
  fs.mkdirSync(inputDir, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });

  try {
    const photoPaths = photos.map((dataUrl, index) => {
      const decoded = decodePhoto(dataUrl, index);
      const file = path.join(inputDir, `photo-${String(index + 1).padStart(2, '0')}.${decoded.extension}`);
      fs.writeFileSync(file, decoded.buffer);
      return file;
    });
    fs.copyFileSync(options.skillPath, path.join(jobDir, 'SKILL.md'));
    fs.writeFileSync(path.join(jobDir, 'job.json'), JSON.stringify({
      version: 1,
      petName: String(petName || 'My pet').slice(0, 80),
      sourcePhotoCount: photos.length,
      outputDirectory: 'output'
    }, null, 2));

    await runCodex(codexPath, jobDir, photoPaths, options.onProgress);
    options.onProgress('The action pack is ready. Cleaning and aligning frames...');
    const actions = loadGeneratedActions(outputDir);
    return { ok: true, actions, jobId };
  } catch (error) {
    return { ok: false, error: error.message || String(error), jobId };
  } finally {
    fs.rmSync(inputDir, { recursive: true, force: true });
  }
}

module.exports = {
  ACTIONS,
  findCodexExecutable,
  generatePetWithCodex,
  loadGeneratedActions,
  splitStrip
};
