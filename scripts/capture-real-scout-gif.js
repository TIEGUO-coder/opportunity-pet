const fs = require('fs');
const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const GIFEncoder = require('gif-encoder-2');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'docs', 'demo', 'scout-motion-v2.gif');
const WIDTH = 200;
const HEIGHT = 140;
const FPS = 20;
const DURATION_MS = 2240;
const FRAME_DELAY_MS = Math.round(1000 / FPS);

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(win, expression, timeoutMs = 5000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await win.webContents.executeJavaScript(expression)) return;
    await wait(20);
  }
  throw new Error(`Timed out waiting for: ${expression}`);
}

function encodeGif(frames) {
  const encoder = new GIFEncoder(WIDTH, HEIGHT, 'neuquant', true);
  encoder.setRepeat(0);
  encoder.setDelay(FRAME_DELAY_MS);
  encoder.setQuality(8);
  encoder.start();
  frames.forEach((frame) => encoder.addFrame(frame));
  encoder.finish();
  return encoder.out.getData();
}

function bgraToRgba(bitmap) {
  const rgba = Buffer.from(bitmap);
  for (let index = 0; index < rgba.length; index += 4) {
    const blue = rgba[index];
    rgba[index] = rgba[index + 2];
    rgba[index + 2] = blue;
  }
  return rgba;
}

async function reload(win) {
  await new Promise((resolve) => {
    win.webContents.once('did-finish-load', resolve);
    win.webContents.reload();
  });
}

async function main() {
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  app.setPath('userData', path.join(app.getPath('temp'), `opportunity-pet-scout-capture-${Date.now()}`));
  await app.whenReady();

  let win;
  const sizes = {
    pet: { width: 120, height: 130 },
    scout: { width: WIDTH, height: HEIGHT },
    setup: { width: 280, height: 450 },
    preferences: { width: 300, height: 450 },
    lead: { width: 280, height: 450 },
    result: { width: 320, height: 520 }
  };

  ipcMain.handle('window:set-mode', (_event, mode) => {
    if (!win || win.isDestroyed()) return false;
    const size = sizes[mode] || sizes.pet;
    win.setBounds({ width: size.width, height: size.height }, false);
    return true;
  });
  ipcMain.handle('window:set-always-on-top', () => true);
  ipcMain.handle('window:minimize', () => true);
  ipcMain.handle('window:move-by', () => true);
  ipcMain.handle('window:quit', () => true);
  ipcMain.handle('cursor:get-position', () => null);
  ipcMain.handle('pet:codex-status', () => ({ available: true, path: 'Codex CLI', model: 'capture' }));
  ipcMain.handle('mah:get-status', () => ({ connected: false, mode: 'preview', label: 'MAH preview adapter' }));
  ipcMain.handle('mah:register-project-entry', () => ({ id: 'preview-entry:opportunity-pet', isLive: false }));

  win = new BrowserWindow({
    width: sizes.pet.width,
    height: sizes.pet.height,
    show: false,
    frame: false,
    transparent: false,
    backgroundColor: '#0d1117',
    webPreferences: {
      preload: path.join(ROOT, 'src', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  await win.loadFile(path.join(ROOT, 'src', 'renderer.html'));
  await win.webContents.executeJavaScript(`
    localStorage.clear();
    localStorage.setItem('opportunityPet.profile', JSON.stringify({
      name: 'Iron',
      photoDataUrl: '',
      assetMode: 'generated',
      generatedFrom: 'default-iron',
      createdAt: new Date().toISOString()
    }));
    localStorage.setItem('opportunityPet.scoutPreferences', JSON.stringify({
      version: 1,
      role: '',
      interests: [],
      skipped: true,
      updatedAt: new Date().toISOString()
    }));
  `);
  await reload(win);
  await waitFor(win, `document.body.dataset.view === 'pet'`);
  await win.webContents.executeJavaScript(`document.getElementById('scoutNow').click()`);
  await waitFor(win, `document.body.dataset.view === 'scout'`);
  await wait(80);

  const frames = [];
  const frameCount = Math.ceil(DURATION_MS / FRAME_DELAY_MS);
  const startedAt = Date.now();
  for (let index = 0; index < frameCount; index += 1) {
    const remaining = startedAt + index * FRAME_DELAY_MS - Date.now();
    if (remaining > 0) await wait(remaining);
    const view = await win.webContents.executeJavaScript(`document.body.dataset.view`);
    if (view !== 'scout') throw new Error(`Capture left the pet-only scout view at frame ${index}: ${view}`);
    const image = await win.webContents.capturePage();
    if ([0, 8, 16, 24, 31].includes(index)) {
      fs.writeFileSync(path.join(app.getPath('temp'), `opportunity-pet-scout-${index}.png`), image.toPNG());
    }
    const encodedSizeFrame = image.resize({ width: WIDTH, height: HEIGHT, quality: 'best' });
    frames.push(bgraToRgba(encodedSizeFrame.toBitmap()));
  }

  fs.writeFileSync(OUTPUT, encodeGif(frames));
  console.log(`Captured actual scout window: ${OUTPUT} (${frames.length} frames at ${FPS} FPS)`);
  win.destroy();
  app.quit();
}

main().catch((error) => {
  console.error(error);
  app.quit();
  process.exit(1);
});
