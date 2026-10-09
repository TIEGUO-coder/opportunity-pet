const fs = require('fs');
const path = require('path');
const { createHash, randomUUID } = require('crypto');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');
const { PNG } = require('pngjs');
const { writePoseGuides } = require('./pose-guides');

const ACTION_PACK_VERSION = 6;
const ACTION_SPECS = Object.freeze({
  idle: {
    files: ['idle.png'], columns: 4, rows: 2, fps: 4, loop: true,
    beats: ['neutral', 'inhale', 'blink starts', 'eyes closed', 'eyes reopen', 'exhale', 'ear attends', 'neutral return']
  },
  walk: {
    files: ['walk.png'], columns: 4, rows: 2, fps: 8, loop: true,
    beats: ['left contact', 'left load', 'left mid-stance', 'left push-off', 'right contact', 'right load', 'right mid-stance', 'right push-off']
  },
  settle: {
    files: ['settle.png'], columns: 4, rows: 2, fps: 6, loop: false,
    beats: ['last walking step', 'shorter step', 'front paws plant', 'hindquarters lower', 'body turns forward', 'seated adjustment', 'tail settles', 'stable seated pose']
  },
  gaze: {
    files: ['gaze-a.png', 'gaze-b.png'], columns: 4, rows: 2, fps: 8, loop: false,
    beats: ['up-left', 'up-left to up', 'up', 'up to up-right', 'up-right', 'up-right to right', 'right', 'right to down-right', 'down-right', 'down-right to down', 'down', 'down to down-left', 'down-left', 'down-left to left', 'left', 'left to up-left']
  },
  sleep: {
    files: ['sleep.png'], columns: 4, rows: 2, fps: 4, loop: false,
    beats: ['seated', 'looks down', 'front lowers', 'side lowers', 'paws tuck', 'tail wraps', 'head rests', 'stable curled sleep']
  },
  happy: {
    files: ['happy.png'], columns: 4, rows: 2, fps: 7, loop: false,
    beats: ['neutral', 'notices owner', 'ears lift', 'body rises', 'happy peak', 'small bounce', 'body settles', 'neutral return']
  },
  chase: {
    files: ['chase.png'], columns: 4, rows: 2, fps: 9, loop: false,
    beats: ['notices target', 'head tracks', 'weight shifts', 'body crouches', 'first stalking step', 'second stalking step', 'accelerates', 'ready to pounce']
  },
  catch: {
    files: ['catch.png'], columns: 4, rows: 2, fps: 10, loop: false,
    beats: ['ready crouch', 'hind legs load', 'front paws reach', 'grounded pounce', 'contact', 'front paws land', 'hind paws recover', 'stable landing']
  },
  yawn: {
    files: ['yawn.png'], columns: 4, rows: 2, fps: 5, loop: false,
    beats: ['calm', 'eyes soften', 'mouth starts opening', 'mouth half open', 'peak yawn', 'mouth closing', 'eyes reopen', 'calm return']
  }
});
const ACTIONS = Object.freeze(Object.keys(ACTION_SPECS));
const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
const GENERATION_TIMEOUT_MS = Math.max(60 * 1000, Number(process.env.OPPORTUNITY_PET_CODEX_TIMEOUT_MS || 15 * 60 * 1000));
const IDENTITY_TIMEOUT_MS = Math.min(GENERATION_TIMEOUT_MS, 90 * 1000);
const INACTIVITY_TIMEOUT_MS = 7 * 60 * 1000;
const DEFAULT_CODEX_MODEL = 'gpt-5.6-luna';

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
  const background = new Uint8Array(image.width * image.height);
  const queue = [];
  const isBackground = (pixel) => {
    const offset = pixel * 4;
    return image.data[offset + 3] < 12 || isGreen(image.data[offset], image.data[offset + 1], image.data[offset + 2]);
  };
  const seed = (pixel) => {
    if (!background[pixel] && isBackground(pixel)) {
      background[pixel] = 1;
      queue.push(pixel);
    }
  };
  for (let x = 0; x < image.width; x += 1) {
    seed(x);
    seed((image.height - 1) * image.width + x);
  }
  for (let y = 1; y + 1 < image.height; y += 1) {
    seed(y * image.width);
    seed(y * image.width + image.width - 1);
  }
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const pixel = queue[cursor];
    const x = pixel % image.width;
    const y = Math.floor(pixel / image.width);
    const neighbors = [
      x ? pixel - 1 : -1,
      x + 1 < image.width ? pixel + 1 : -1,
      y ? pixel - image.width : -1,
      y + 1 < image.height ? pixel + image.width : -1
    ];
    neighbors.forEach((neighbor) => {
      if (neighbor >= 0 && !background[neighbor] && isBackground(neighbor)) {
        background[neighbor] = 1;
        queue.push(neighbor);
      }
    });
  }
  for (let pixel = 0; pixel < background.length; pixel += 1) {
    if (!background[pixel]) continue;
    const offset = pixel * 4;
    image.data[offset] = 0;
    image.data[offset + 1] = 0;
    image.data[offset + 2] = 0;
    image.data[offset + 3] = 0;
  }
}

function inspectMatte(image) {
  const samples = [];
  let transparent = 0;
  let green = 0;
  const sampleSize = Math.min(12, image.width, image.height);
  const corners = [
    [0, 0],
    [image.width - sampleSize, 0],
    [0, image.height - sampleSize],
    [image.width - sampleSize, image.height - sampleSize]
  ];

  for (const [startX, startY] of corners) {
    for (let y = startY; y < startY + sampleSize; y += 1) {
      for (let x = startX; x < startX + sampleSize; x += 1) {
        const index = (y * image.width + x) * 4;
        const alpha = image.data[index + 3];
        const r = image.data[index];
        const g = image.data[index + 1];
        const b = image.data[index + 2];
        if (alpha < 12) {
          transparent += 1;
          continue;
        }
        if (alpha > 220 && isGreen(r, g, b)) green += 1;
        if (alpha >= 220) samples.push([r, g, b]);
      }
    }
  }

  if (transparent > samples.length * 0.2 || green > samples.length * 0.2) return { supported: true, matte: 'transparent-or-green' };
  if (!samples.length) return { supported: true, matte: 'transparent' };
  const totals = samples.reduce((sum, sample) => {
    sum[0] += sample[0];
    sum[1] += sample[1];
    sum[2] += sample[2];
    return sum;
  }, [0, 0, 0]);
  const color = totals.map((value) => value / samples.length);
  const brightness = (color[0] + color[1] + color[2]) / 3;
  const spread = Math.max(...color) - Math.min(...color);
  if (brightness > 210 && spread <= 35) return { supported: false, matte: 'white-or-gray' };
  return { supported: true, matte: 'unknown-dark' };
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

  const pad = 0;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(image.width - 1, maxX + pad);
  maxY = Math.min(image.height - 1, maxY + pad);
  const result = new PNG({ width: maxX - minX + 1, height: maxY - minY + 1 });
  PNG.bitblt(image, result, minX, minY, result.width, result.height, 0, 0);
  return result;
}

function keepDominantSubject(image) {
  const visible = new Uint8Array(image.width * image.height);
  const seen = new Uint8Array(visible.length);
  for (let pixel = 0; pixel < visible.length; pixel += 1) visible[pixel] = image.data[pixel * 4 + 3] > 20 ? 1 : 0;
  const components = [];
  for (let start = 0; start < visible.length; start += 1) {
    if (!visible[start] || seen[start]) continue;
    const component = [];
    const queue = [start];
    seen[start] = 1;
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const pixel = queue[cursor];
      component.push(pixel);
      const x = pixel % image.width;
      const y = Math.floor(pixel / image.width);
      const neighbors = [
        x ? pixel - 1 : -1,
        x + 1 < image.width ? pixel + 1 : -1,
        y ? pixel - image.width : -1,
        y + 1 < image.height ? pixel + image.width : -1
      ];
      neighbors.forEach((neighbor) => {
        if (neighbor >= 0 && visible[neighbor] && !seen[neighbor]) {
          seen[neighbor] = 1;
          queue.push(neighbor);
        }
      });
    }
    components.push(component);
  }
  components.sort((a, b) => b.length - a.length);
  if (!components.length) throw new Error('Generated frame contains no visible pet.');
  if (components[1] && components[1].length > Math.max(512, components[0].length * 0.02)) {
    throw new Error('Generated frame contains a detached body part or neighbouring-cell fragment.');
  }
  const keep = new Uint8Array(visible.length);
  components[0].forEach((pixel) => { keep[pixel] = 1; });
  for (let pixel = 0; pixel < keep.length; pixel += 1) {
    if (!keep[pixel]) image.data[pixel * 4 + 3] = 0;
  }
}

function resizePng(source, width, height) {
  const output = new PNG({ width, height });
  for (let y = 0; y < height; y += 1) {
    const sourceY = Math.max(0, Math.min(source.height - 1, (y + 0.5) * source.height / height - 0.5));
    const y0 = Math.floor(sourceY);
    const y1 = Math.min(source.height - 1, y0 + 1);
    const fy = sourceY - y0;
    for (let x = 0; x < width; x += 1) {
      const sourceX = Math.max(0, Math.min(source.width - 1, (x + 0.5) * source.width / width - 0.5));
      const x0 = Math.floor(sourceX);
      const x1 = Math.min(source.width - 1, x0 + 1);
      const fx = sourceX - x0;
      const to = (y * width + x) * 4;
      const samples = [
        [(y0 * source.width + x0) * 4, (1 - fx) * (1 - fy)],
        [(y0 * source.width + x1) * 4, fx * (1 - fy)],
        [(y1 * source.width + x0) * 4, (1 - fx) * fy],
        [(y1 * source.width + x1) * 4, fx * fy]
      ];
      let alpha = 0;
      let red = 0;
      let green = 0;
      let blue = 0;
      samples.forEach(([from, weight]) => {
        const weightedAlpha = source.data[from + 3] * weight;
        alpha += weightedAlpha;
        red += source.data[from] * weightedAlpha;
        green += source.data[from + 1] * weightedAlpha;
        blue += source.data[from + 2] * weightedAlpha;
      });
      output.data[to + 3] = Math.round(alpha);
      if (alpha > 0) {
        output.data[to] = Math.round(red / alpha);
        output.data[to + 1] = Math.round(green / alpha);
        output.data[to + 2] = Math.round(blue / alpha);
      }
    }
  }
  return output;
}

function normalizeFrameSet(subjects, targetDiagonal = 390) {
  const diagonals = subjects.map((subject) => Math.hypot(subject.width, subject.height)).sort((a, b) => a - b);
  const median = diagonals[Math.floor(diagonals.length / 2)];
  const corrections = subjects.map((subject) => {
    const ratio = median / Math.hypot(subject.width, subject.height);
    return Math.abs(1 - ratio) <= 0.05 ? 1 : Math.min(1.18, Math.max(0.82, ratio));
  });
  const fitScale = Math.min(
    targetDiagonal / median,
    440 / Math.max(...subjects.map((subject, index) => subject.width * corrections[index])),
    430 / Math.max(...subjects.map((subject, index) => subject.height * corrections[index]))
  );
  return subjects.map((subject, index) => {
    const scale = corrections[index] * fitScale;
    const width = Math.max(1, Math.round(subject.width * scale));
    const height = Math.max(1, Math.round(subject.height * scale));
    const resized = resizePng(subject, width, height);
    const canvas = new PNG({ width: 512, height: 512 });
    const offsetX = Math.floor((canvas.width - width) / 2);
    const offsetY = 462 - height;
    PNG.bitblt(resized, canvas, 0, 0, width, height, offsetX, offsetY);
    return PNG.sync.write(canvas);
  });
}

function extractSheetFrames(buffer, { columns = 4, rows = 2 } = {}) {
  const sheet = PNG.sync.read(buffer);
  if (sheet.width < columns || sheet.height < rows) throw new Error('Generated action sheet is too small.');
  const matte = inspectMatte(sheet);
  if (!matte.supported) {
    throw new Error('Generated action sheet uses a white or gray background. Regenerate with transparent background or flat #00FF00 chroma green; white mattes cut holes in pale fur.');
  }
  const frames = [];
  const cellWidth = Math.floor(sheet.width / columns);
  const cellHeight = Math.floor(sheet.height / rows);
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const width = col === columns - 1 ? sheet.width - col * cellWidth : cellWidth;
      const height = row === rows - 1 ? sheet.height - row * cellHeight : cellHeight;
      const cell = new PNG({ width, height });
      PNG.bitblt(sheet, cell, col * cellWidth, row * cellHeight, width, height, 0, 0);
      removeChromaKey(cell);
      keepDominantSubject(cell);
      frames.push(cropToContent(cell));
    }
  }
  return frames;
}

function splitSheet(buffer, spec = {}) {
  return normalizeFrameSet(extractSheetFrames(buffer, spec), spec.targetDiagonal);
}

function splitStrip(buffer) {
  return splitSheet(buffer, { columns: 4, rows: 1 });
}

function changedPixelRatio(first, second) {
  const a = PNG.sync.read(first);
  const b = PNG.sync.read(second);
  if (a.width !== b.width || a.height !== b.height) return 1;
  let visible = 0;
  let changed = 0;
  for (let y = 0; y < a.height; y += 2) {
    for (let x = 0; x < a.width; x += 2) {
      const index = (y * a.width + x) * 4;
      const alphaA = a.data[index + 3];
      const alphaB = b.data[index + 3];
      if (Math.max(alphaA, alphaB) <= 20) continue;
      visible += 1;
      const colorDifference =
        Math.abs(a.data[index] * alphaA - b.data[index] * alphaB) / 255 +
        Math.abs(a.data[index + 1] * alphaA - b.data[index + 1] * alphaB) / 255 +
        Math.abs(a.data[index + 2] * alphaA - b.data[index + 2] * alphaB) / 255;
      if (Math.abs(alphaA - alphaB) > 16 || colorDifference > 48) changed += 1;
    }
  }
  return visible ? changed / visible : 0;
}

function validateMeaningfulMotion(action, frames) {
  const unique = [];
  frames.forEach((frame) => {
    if (!unique.some((candidate) => changedPixelRatio(frame, candidate) < 0.002)) unique.push(frame);
  });
  const minimum = action === 'gaze' ? 12 : 6;
  if (unique.length < minimum) {
    throw new Error(`Generated ${action} action has only ${unique.length} meaningfully different frames; ${minimum} are required.`);
  }
}

function loadGeneratedActions(outputDir, { requireLocalJob = true } = {}) {
  const actions = {};
  const framesRoot = path.join(outputDir, 'frames');
  const errorPath = path.join(outputDir, 'error.json');
  if (fs.existsSync(errorPath)) {
    try {
      const errorPayload = JSON.parse(fs.readFileSync(errorPath, 'utf8'));
      throw new Error(errorPayload.error || 'Codex reported that image generation failed.');
    } catch (error) {
      if (error instanceof SyntaxError) throw new Error('Codex reported that image generation failed. output/error.json is not valid JSON.');
      throw error;
    }
  }
  const manifestPath = path.join(outputDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) throw new Error('Codex did not create output/manifest.json.');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.version !== ACTION_PACK_VERSION) throw new Error(`Unsupported action-pack version: ${manifest.version || 'missing'}.`);
  if (!['quadruped', 'biped', 'flyer', 'serpent', 'blob'].includes(manifest.bodyPlan)) {
    throw new Error('The generated action-pack manifest is missing a supported bodyPlan.');
  }
  for (const [action, spec] of Object.entries(ACTION_SPECS)) {
    if (JSON.stringify(manifest.actions?.[action]) !== JSON.stringify(spec.files)) {
      throw new Error(`The generated action-pack manifest does not satisfy the ${action} file contract.`);
    }
    if (manifest.playback?.[action]?.fps !== spec.fps || manifest.playback?.[action]?.loop !== spec.loop) {
      throw new Error(`The generated action-pack manifest does not satisfy the ${action} playback contract.`);
    }
  }
  if (!fs.existsSync(path.join(outputDir, 'character-sheet.png'))) {
    throw new Error('Codex did not create output/character-sheet.png.');
  }
  const qualityReportPath = path.join(outputDir, 'quality-report.json');
  if (!fs.existsSync(qualityReportPath)) throw new Error('Codex did not create output/quality-report.json.');
  const qualityReport = JSON.parse(fs.readFileSync(qualityReportPath, 'utf8'));
  const anchorPath = path.join(outputDir, 'character-sheet.png');
  const anchorSha256 = createHash('sha256').update(fs.readFileSync(anchorPath)).digest('hex');
  if (qualityReport.version !== ACTION_PACK_VERSION || qualityReport.identityAnchor !== 'character-sheet.png' || qualityReport.identityAnchorSha256 !== anchorSha256) {
    throw new Error('The identity quality report is not bound to the delivered character sheet.');
  }
  if (requireLocalJob) {
    const jobDir = path.dirname(outputDir);
    const job = JSON.parse(fs.readFileSync(path.join(jobDir, 'job.json'), 'utf8'));
    const poseGuideManifestPath = path.join(jobDir, 'pose-guides', 'manifest.json');
    if (!fs.existsSync(poseGuideManifestPath)) throw new Error('The generation job is missing its deterministic pose guides.');
    const poseGuideManifestSha256 = createHash('sha256').update(fs.readFileSync(poseGuideManifestPath)).digest('hex');
    if (job.poseGuideManifestSha256 !== poseGuideManifestSha256 || qualityReport.poseGuideManifestSha256 !== poseGuideManifestSha256) {
      throw new Error('The quality report is not bound to the deterministic pose guides used by this job.');
    }
  }
  for (const action of ACTIONS) {
    const audit = qualityReport.actions?.[action];
    if (!audit || audit.identityLocked !== true || audit.anatomyComplete !== true || audit.motionApproved !== true || !Number.isInteger(audit.attempts) || audit.attempts < 1 || audit.attempts > 3) {
      throw new Error(`The generated ${action} action did not pass the identity, anatomy, and motion audit.`);
    }
  }
  fs.mkdirSync(framesRoot, { recursive: true });

  for (const [action, spec] of Object.entries(ACTION_SPECS)) {
    const subjects = spec.files.flatMap((fileName) => {
      const sheetPath = path.join(outputDir, fileName);
      if (!fs.existsSync(sheetPath)) throw new Error(`Codex did not create output/${fileName}.`);
      return extractSheetFrames(fs.readFileSync(sheetPath), spec);
    });
    const frames = normalizeFrameSet(subjects, spec.targetDiagonal);
    validateMeaningfulMotion(action, frames);
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

function runCodex(codexPath, jobDir, photoPaths, onProgress = () => {}, codexModel = process.env.OPPORTUNITY_PET_CODEX_MODEL || DEFAULT_CODEX_MODEL) {
  return new Promise((resolve, reject) => {
    const job = JSON.parse(fs.readFileSync(path.join(jobDir, 'job.json'), 'utf8'));
    const isIdentityStage = job.stage === 'identity';
    const timeoutMs = isIdentityStage ? IDENTITY_TIMEOUT_MS : GENERATION_TIMEOUT_MS;
    const prompt = isIdentityStage
      ? 'Read and follow ./SKILL.md. This is the identity-preview stage: use every attached pet photo and create only ./output/character-sheet.png (or ./output/error.json). Do not generate action sheets yet. If job.json includes revisionFeedback or revisionNote, treat them as owner-approved visual corrections. Do not ask questions.'
      : 'Read and follow ./SKILL.md. This is the action-pack stage: preserve the existing ./output/character-sheet.png exactly, use every attached pet photo, generate the complete action pack under ./output, and satisfy the completion contract without asking questions.';
    // Keep generation deterministic: unrelated user plugins can spend the preview budget updating.
    const args = ['exec', '--ephemeral', '--ignore-user-config', '--skip-git-repo-check', '--sandbox', 'workspace-write', '--model', codexModel, '--cd', jobDir];
    photoPaths.forEach((photo) => args.push('--image', photo));
    args.push('--', '-');

    const isNodeScript = path.extname(codexPath).toLowerCase() === '.js';
    const isWindowsCommand = process.platform === 'win32' && ['.cmd', '.bat'].includes(path.extname(codexPath).toLowerCase());
    const executable = isNodeScript ? process.execPath : codexPath;
    const spawnArgs = isNodeScript ? [codexPath, ...args] : args;
    const child = spawn(executable, spawnArgs, {
      cwd: jobDir,
      env: process.env,
      shell: isWindowsCommand,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const logPath = path.join(jobDir, 'codex.log');
    const outputDir = path.join(jobDir, 'output');
    const startedAt = new Date().toISOString();
    const header = [
      `Command: ${executable} ${spawnArgs.join(' ')}`,
      `Job: ${jobDir}`,
      `Model: ${codexModel}`,
      `Started: ${startedAt}`,
      `Prompt: ${prompt}`,
      ''
    ].join('\n');
    let output = '';
    let settled = false;
    let firstOutputSeen = false;
    let identityPreviewSent = false;
    let lastActionProgress = -1;
    let lastHeartbeatAt = 0;
    let lastActivityAt = Date.now();
    const writeLog = () => {
      fs.writeFileSync(logPath, `${header}\n${output.slice(-24000)}`);
    };
    const outputFileCount = () => {
      try {
        return fs.readdirSync(outputDir).filter((file) => !file.startsWith('.')).length;
      } catch {
        return 0;
      }
    };
    const publishActionProgress = (final = false) => {
      if (isIdentityStage) return;
      const files = new Set();
      try { fs.readdirSync(outputDir).forEach((file) => files.add(file)); } catch {}
      const completed = Object.values(ACTION_SPECS).flatMap((spec) => spec.files).filter((file) => files.has(file)).length;
      const total = Object.values(ACTION_SPECS).flatMap((spec) => spec.files).length;
      if (final || completed !== lastActionProgress) {
        lastActionProgress = completed;
        onProgress({ type: 'action-progress', completed, total, final });
      }
    };
    const publishIdentityPreview = () => {
      if (identityPreviewSent) return;
      const characterSheetPath = path.join(outputDir, 'character-sheet.png');
      try {
        const characterSheet = fs.readFileSync(characterSheetPath);
        if (!characterSheet.length) return;
        identityPreviewSent = true;
        onProgress({ type: 'identity-preview', dataUrl: `data:image/png;base64,${characterSheet.toString('base64')}` });
      } catch {
        // The file is not ready yet; the next progress check will retry.
      }
    };
    writeLog();
    publishActionProgress();
    child.stdin.on('error', () => {});
    child.stdin.end(prompt);
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill();
      writeLog();
      reject(new Error(isIdentityStage
        ? `Character preview timed out after ${Math.round(timeoutMs / 1000)} seconds without creating an image. Try again; no action pack was started.`
        : `Codex generation timed out after ${Math.round(timeoutMs / 60000)} minutes before completing the action pack.`));
    }, timeoutMs);
    const heartbeat = setInterval(() => {
      if (settled) return;
      publishIdentityPreview();
      publishActionProgress();
      const files = outputFileCount();
      if (files > 0) {
        if (!firstOutputSeen) onProgress(`Codex has started writing output files. Log: ${logPath}`);
        firstOutputSeen = true;
        return;
      }

      const elapsed = Date.now() - Date.parse(startedAt);
      if (elapsed - lastHeartbeatAt >= 30000) {
        lastHeartbeatAt = elapsed;
        onProgress(isIdentityStage
          ? `Codex is still building the first character preview; no image file yet. Log: ${logPath}`
          : `Codex is still building the movement pack; no output files yet. Log: ${logPath}`);
      }
      if (!firstOutputSeen && Date.now() - lastActivityAt > INACTIVITY_TIMEOUT_MS) {
        settled = true;
        child.kill();
        clearTimeout(timer);
        clearInterval(heartbeat);
        writeLog();
        reject(new Error('Codex produced no log activity for 7 minutes before writing output files. Inspect codex.log in the generation job folder.'));
      }
    }, 15000);

    onProgress(`Codex started with ${codexModel}. Log: ${logPath}`);
    onProgress(isIdentityStage
      ? 'Codex is studying the pet photos and building a character preview...'
      : 'Codex is using the approved character preview to build and check the movement pack...');
    const collect = (chunk) => {
      output = `${output}${chunk}`;
      lastActivityAt = Date.now();
      writeLog();
      if (/image|generat|character|sprite|action/i.test(String(chunk))) {
        onProgress(isIdentityStage
          ? 'Codex is checking the illustrated pet identity...'
          : 'Codex is generating and checking the standardized action sheets...');
      }
    };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearInterval(heartbeat);
      writeLog();
      reject(error);
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearInterval(heartbeat);
      writeLog();
      publishIdentityPreview();
      publishActionProgress(true);
      if (code === 0) resolve(output);
      else if (/model is not supported/i.test(output)) {
        reject(new Error(`Codex model ${codexModel} is not supported by this account. Set OPPORTUNITY_PET_CODEX_MODEL to a supported Codex model and try again. Inspect codex.log in the generation job folder.`));
      } else {
        reject(new Error(`Codex exited with code ${code}. Open Codex once, confirm you are signed in, and inspect codex.log in the generation job folder.`));
      }
    });
  });
}

function generationPaths(userDataPath, jobId) {
  const root = path.resolve(userDataPath, 'Opportunity Pet Tasks');
  const jobDir = path.resolve(root, jobId);
  if (!jobDir.startsWith(`${root}${path.sep}`)) throw new Error('Invalid generation job.');
  return {
    root,
    jobDir,
    logPath: path.join(jobDir, 'codex.log'),
    inputDir: path.join(jobDir, 'inputs'),
    outputDir: path.join(jobDir, 'output')
  };
}

function createGenerationJobId(petName) {
  const readableName = String(petName || 'my-pet')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32) || 'my-pet';
  return `opportunity-pet-${readableName}-${randomUUID().slice(0, 8)}`;
}

function actionMetadata() {
  return Object.fromEntries(Object.entries(ACTION_SPECS).map(([action, spec]) => [action, { fps: spec.fps, loop: spec.loop }]));
}

function actionSheetProgress(outputDir) {
  const files = Object.values(ACTION_SPECS).flatMap((spec) => spec.files);
  return {
    completed: files.filter((file) => fs.existsSync(path.join(outputDir, file))).length,
    total: files.length
  };
}

function readIdentityPreview(outputDir) {
  const errorPath = path.join(outputDir, 'error.json');
  if (fs.existsSync(errorPath)) {
    const payload = JSON.parse(fs.readFileSync(errorPath, 'utf8'));
    throw new Error(payload.error || 'Codex could not lock the pet identity from these photos.');
  }
  const characterSheet = fs.readFileSync(path.join(outputDir, 'character-sheet.png'));
  const image = PNG.sync.read(characterSheet);
  if (!image.width || !image.height) throw new Error('Codex created an unusable pet identity preview.');
  return `data:image/png;base64,${characterSheet.toString('base64')}`;
}

function validatePetPhotos(photos) {
  if (!Array.isArray(photos) || photos.length < 3 || photos.length > 5) throw new Error('Choose 3-5 pet photos first.');
  const decodedPhotos = photos.map(decodePhoto);
  const hashes = new Set(decodedPhotos.map(({ buffer }) => createHash('sha256').update(buffer).digest('hex')));
  if (hashes.size < 3) throw new Error('Choose at least 3 different pet photos. Repeating the same image does not provide another useful angle.');
  return decodedPhotos;
}

function writeCodexHandoff(jobDir, stage) {
  const instructions = stage === 'actions'
    ? 'Open this folder as a Codex task. Read SKILL.md and job.json. The owner approved output/character-sheet.png. Generate the complete action pack into output/, preserve character-sheet.png byte-for-byte, and finish only when manifest.json and quality-report.json pass the contract.'
    : 'Open this folder as a Codex task. Read SKILL.md and job.json. Use every image in inputs/ to create only output/character-sheet.png (or output/error.json). Do not create any action sheets. Finish after the static identity preview is ready.';
  fs.writeFileSync(path.join(jobDir, 'RUN_IN_CODEX.md'), `${instructions}\n`);
}

function preparePetCodexHandoff({ photos, petName, feedback = [], feedbackNote = '' }, options) {
  let jobId;
  let paths;
  try {
    const decodedPhotos = validatePetPhotos(photos);
    jobId = createGenerationJobId(petName);
    paths = generationPaths(options.userDataPath, jobId);
    fs.mkdirSync(paths.inputDir, { recursive: true });
    fs.mkdirSync(paths.outputDir, { recursive: true });
    decodedPhotos.forEach((decoded, index) => fs.writeFileSync(path.join(paths.inputDir, `photo-${String(index + 1).padStart(2, '0')}.${decoded.extension}`), decoded.buffer));
    fs.copyFileSync(options.skillPath, path.join(paths.jobDir, 'SKILL.md'));
    const poseGuideManifestSha256 = writePoseGuides(path.join(paths.jobDir, 'pose-guides'), ACTION_SPECS, ACTION_PACK_VERSION);
    fs.writeFileSync(path.join(paths.jobDir, 'job.json'), JSON.stringify({
      version: ACTION_PACK_VERSION,
      petName: String(petName || 'My pet').slice(0, 80),
      sourcePhotoCount: photos.length,
      stage: 'identity',
      revisionFeedback: Array.isArray(feedback) ? feedback.map((item) => String(item).slice(0, 48)).filter(Boolean).slice(0, 5) : [],
      revisionNote: String(feedbackNote || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 180),
      outputDirectory: 'output', poseGuideDirectory: 'pose-guides', poseGuideManifestSha256, requiredActions: ACTION_SPECS
    }, null, 2));
    writeCodexHandoff(paths.jobDir, 'identity');
    return { ok: true, jobId, jobDir: paths.jobDir };
  } catch (error) {
    return { ok: false, error: error.message || String(error), jobId, jobDir: paths?.jobDir };
  }
}

function getPetCodexHandoffStatus({ jobId }, options) {
  try {
    const paths = generationPaths(options.userDataPath, String(jobId || ''));
    const job = JSON.parse(fs.readFileSync(path.join(paths.jobDir, 'job.json'), 'utf8'));
    const errorPath = path.join(paths.outputDir, 'error.json');
    if (fs.existsSync(errorPath)) return { ok: true, state: 'error', error: JSON.parse(fs.readFileSync(errorPath, 'utf8')).error || 'Codex could not generate this pet.' };
    const characterPath = path.join(paths.outputDir, 'character-sheet.png');
    if (!fs.existsSync(characterPath)) return { ok: true, state: 'waiting', stage: job.stage };
    if (job.stage === 'identity') return { ok: true, state: 'identity-ready', previewDataUrl: readIdentityPreview(paths.outputDir) };
    if (!fs.existsSync(path.join(paths.outputDir, 'manifest.json'))) {
      return { ok: true, state: 'waiting', stage: 'actions', ...actionSheetProgress(paths.outputDir) };
    }
    return { ok: true, state: 'actions-ready', actions: loadGeneratedActions(paths.outputDir), actionMetadata: actionMetadata() };
  } catch (error) {
    return { ok: false, error: error.message || String(error) };
  }
}

function advancePetCodexHandoff({ jobId }, options) {
  try {
    const paths = generationPaths(options.userDataPath, String(jobId || ''));
    const jobPath = path.join(paths.jobDir, 'job.json');
    const job = JSON.parse(fs.readFileSync(jobPath, 'utf8'));
    if (job.stage !== 'identity') throw new Error('This preview is no longer waiting for approval.');
    readIdentityPreview(paths.outputDir);
    job.stage = 'actions';
    fs.writeFileSync(jobPath, JSON.stringify(job, null, 2));
    writeCodexHandoff(paths.jobDir, 'actions');
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message || String(error) };
  }
}

async function generatePetIdentityWithCodex({ photos, petName, feedback = [], feedbackNote = '' }, options) {
  if (!Array.isArray(photos) || photos.length < 3 || photos.length > 5) {
    return { ok: false, error: 'Choose 3-5 pet photos first.' };
  }
  let decodedPhotos;
  try {
    decodedPhotos = photos.map(decodePhoto);
  } catch (error) {
    return { ok: false, error: error.message || String(error) };
  }
  const uniquePhotoHashes = new Set(decodedPhotos.map(({ buffer }) => createHash('sha256').update(buffer).digest('hex')));
  if (uniquePhotoHashes.size < 3) {
    return { ok: false, error: 'Choose at least 3 different pet photos. Repeating the same image does not provide another useful angle.' };
  }
  const codexPath = findCodexExecutable(options.codexPath);
  if (!codexPath) return { ok: false, error: 'Codex CLI was not found. Install and sign in to Codex before generating a pet.' };

  const jobId = createGenerationJobId(petName);
  const { jobDir, logPath, inputDir, outputDir } = generationPaths(options.userDataPath, jobId);
  fs.mkdirSync(inputDir, { recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });

  try {
    const photoPaths = decodedPhotos.map((decoded, index) => {
      const file = path.join(inputDir, `photo-${String(index + 1).padStart(2, '0')}.${decoded.extension}`);
      fs.writeFileSync(file, decoded.buffer);
      return file;
    });
    fs.copyFileSync(options.skillPath, path.join(jobDir, 'SKILL.md'));
    const poseGuideManifestSha256 = writePoseGuides(path.join(jobDir, 'pose-guides'), ACTION_SPECS, ACTION_PACK_VERSION);
    fs.writeFileSync(path.join(jobDir, 'job.json'), JSON.stringify({
      version: ACTION_PACK_VERSION,
      petName: String(petName || 'My pet').slice(0, 80),
      sourcePhotoCount: photos.length,
      stage: 'identity',
      revisionFeedback: Array.isArray(feedback) ? feedback.map((item) => String(item).slice(0, 48)).filter(Boolean).slice(0, 5) : [],
      revisionNote: String(feedbackNote || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 180),
      outputDirectory: 'output',
      poseGuideDirectory: 'pose-guides',
      poseGuideManifestSha256,
      requiredActions: ACTION_SPECS
    }, null, 2));

    const codexModel = options.codexModel || process.env.OPPORTUNITY_PET_CODEX_MODEL || DEFAULT_CODEX_MODEL;
    await runCodex(codexPath, jobDir, photoPaths, options.onProgress, codexModel);
    const previewDataUrl = readIdentityPreview(outputDir);
    options.onProgress({ type: 'identity-preview', dataUrl: previewDataUrl });
    return { ok: true, jobId, previewDataUrl, logPath, codexPath, codexModel };
  } catch (error) {
    return { ok: false, error: error.message || String(error), jobId, jobDir, logPath, codexPath, codexModel: options.codexModel || process.env.OPPORTUNITY_PET_CODEX_MODEL || DEFAULT_CODEX_MODEL };
  }
}

async function generatePetActionsWithCodex({ jobId }, options) {
  let paths;
  try {
    paths = generationPaths(options.userDataPath, String(jobId || ''));
    const jobPath = path.join(paths.jobDir, 'job.json');
    const job = JSON.parse(fs.readFileSync(jobPath, 'utf8'));
    if (job.stage !== 'identity') throw new Error('This pet preview is no longer waiting for approval. Start again from the photos.');
    const photoPaths = fs.readdirSync(paths.inputDir)
      .filter((file) => /^photo-\d+\.(png|jpg|jpeg|webp)$/i.test(file))
      .sort()
      .map((file) => path.join(paths.inputDir, file));
    if (photoPaths.length < 3) throw new Error('The temporary pet photos are no longer available. Choose the photos again.');
    readIdentityPreview(paths.outputDir);
    job.stage = 'actions';
    fs.writeFileSync(jobPath, JSON.stringify(job, null, 2));
    const codexPath = findCodexExecutable(options.codexPath);
    if (!codexPath) throw new Error('Codex CLI was not found. Install and sign in to Codex before generating motions.');
    const codexModel = options.codexModel || process.env.OPPORTUNITY_PET_CODEX_MODEL || DEFAULT_CODEX_MODEL;
    await runCodex(codexPath, paths.jobDir, photoPaths, options.onProgress, codexModel);
    options.onProgress('The action pack is ready. Cleaning and aligning frames...');
    const actions = loadGeneratedActions(paths.outputDir);
    return { ok: true, actions, actionMetadata: actionMetadata(), jobId, jobDir: paths.jobDir, logPath: paths.logPath, codexPath, codexModel };
  } catch (error) {
    return { ok: false, error: error.message || String(error), jobId, jobDir: paths?.jobDir, logPath: paths?.logPath };
  } finally {
    if (paths?.inputDir) fs.rmSync(paths.inputDir, { recursive: true, force: true });
  }
}

function discardPetGeneration({ jobId }, options) {
  try {
    const { jobDir } = generationPaths(options.userDataPath, String(jobId || ''));
    fs.rmSync(jobDir, { recursive: true, force: true });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message || String(error) };
  }
}

async function generatePetWithCodex(payload, options) {
  const identity = await generatePetIdentityWithCodex(payload, options);
  if (!identity.ok) return identity;
  return generatePetActionsWithCodex({ jobId: identity.jobId }, options);
}

module.exports = {
  ACTIONS,
  ACTION_SPECS,
  ACTION_PACK_VERSION,
  DEFAULT_CODEX_MODEL,
  findCodexExecutable,
  preparePetCodexHandoff,
  getPetCodexHandoffStatus,
  advancePetCodexHandoff,
  generatePetIdentityWithCodex,
  generatePetActionsWithCodex,
  discardPetGeneration,
  generatePetWithCodex,
  loadGeneratedActions,
  splitSheet,
  splitStrip,
  validateMeaningfulMotion
};
