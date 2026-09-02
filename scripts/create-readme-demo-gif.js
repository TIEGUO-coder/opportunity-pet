const fs = require('fs');
const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const GIFEncoder = require('gif-encoder-2');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'demo');
const OUT_FILE = path.join(OUT_DIR, 'pet-finds-lead.gif');
const WIDTH = 360;
const HEIGHT = 520;
const FPS = 12;
const DURATION_MS = 3200;
const FRAME_DELAY_MS = Math.round(1000 / FPS);

function makeGif(frames) {
  const encoder = new GIFEncoder(WIDTH, HEIGHT, 'neuquant', true);
  encoder.setRepeat(0);
  encoder.setDelay(FRAME_DELAY_MS);
  encoder.setQuality(10);
  encoder.start();
  frames.forEach((frame) => encoder.addFrame(frame));
  encoder.finish();
  return encoder.out.getData();
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function captureRealUiFrames(win) {
  const frames = [];
  const startedAt = Date.now();
  const frameCount = Math.ceil(DURATION_MS / FRAME_DELAY_MS);

  for (let index = 0; index < frameCount; index += 1) {
    const targetTime = startedAt + index * FRAME_DELAY_MS;
    const sleepFor = targetTime - Date.now();
    if (sleepFor > 0) await wait(sleepFor);
    const image = await win.webContents.capturePage();
    if (process.env.OPPORTUNITY_PET_DEMO_PREVIEW === '1' && [0, 3, 10, 16, 22, frameCount - 6].includes(index)) {
      fs.writeFileSync(path.join('/tmp', `opportunity-pet-real-demo-frame-${index}.png`), image.toPNG());
    }
    frames.push(image.toBitmap());
  }
  return frames;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  app.setPath('userData', path.join(app.getPath('temp'), `opportunity-pet-real-gif-${Date.now()}`));
  await app.whenReady();

  ipcMain.handle('window:set-mode', () => true);
  ipcMain.handle('window:set-always-on-top', () => true);
  ipcMain.handle('window:minimize', () => true);
  ipcMain.handle('window:move-by', () => true);
  ipcMain.handle('window:quit', () => true);
  ipcMain.handle('cursor:get-position', () => null);
  ipcMain.handle('pet:codex-status', () => ({ available: true, path: 'Codex CLI', model: 'demo' }));
  ipcMain.handle('mah:get-status', () => ({ connected: false, mode: 'preview', label: 'MAH preview adapter' }));
  ipcMain.handle('mah:register-project-entry', () => ({ id: 'preview-entry:opportunity-pet', isLive: false }));

  const win = new BrowserWindow({
    width: WIDTH,
    height: HEIGHT,
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
    const style = document.createElement('style');
    style.textContent = \`
      body {
        background:
          radial-gradient(circle at 50% 78%, rgba(239, 223, 196, .17), transparent 35%),
          #0d1117 !important;
      }
      body[data-view="setup"] {
        background:
          radial-gradient(circle at 50% 78%, rgba(239, 223, 196, .17), transparent 35%),
          #0d1117 !important;
      }
      #petSetup, #preferenceSetup, #resultCard, #toolbar, .toolbar, .tool-button, .lead-card .evidence-grid, .lead-card .action-stack,
      .change-pet-action, .close-card, #scoutNow, #pin, #resetPet, #minimize, #quit {
        display: none !important;
      }
      body[data-view="scout"] .pet-wrap {
        left: 50% !important;
        right: auto !important;
        bottom: 46px !important;
        width: 154px !important;
        height: 150px !important;
        transform: translateX(-50%);
        z-index: 4;
      }
      body[data-view="scout"] .pet-wrap.pacing {
        animation: demoPaceAround 1.9s linear both !important;
      }
      body[data-view="lead"] .pet-wrap {
        left: 50% !important;
        bottom: 30px !important;
        width: 128px !important;
        height: 126px !important;
        transform: translateX(-50%) translateY(0) !important;
        z-index: 4;
      }
      body[data-view="lead"] .pet-wrap.found {
        animation: demoSit 520ms ease-out both;
      }
      body[data-view="lead"] .pet-wrap.found #pet {
        animation: none !important;
      }
      .lead-notice {
        left: 24px !important;
        right: 24px !important;
        top: 26px !important;
        width: auto !important;
        font-size: 15px !important;
        line-height: 1.14 !important;
        padding: 9px 14px !important;
      }
      body[data-view="lead"] .lead-notice {
        display: block !important;
      }
      .lead-card {
        left: 26px !important;
        right: 26px !important;
        top: 74px !important;
        min-height: 0 !important;
        padding: 16px 18px 18px !important;
        border-radius: 18px !important;
        overflow: visible !important;
      }
      .lead-card .eyebrow {
        font-size: 13px !important;
      }
      .lead-card h1 {
        margin-top: 18px !important;
        font-size: 24px !important;
        line-height: 1.05 !important;
      }
      .lead-card .summary {
        font-size: 14px !important;
        line-height: 1.28 !important;
      }
      .lead-card .status-pill {
        font-size: 13px !important;
        padding: 8px 12px !important;
      }
      @keyframes demoPaceAround {
        0% { transform: translateX(-96px); }
        46% { transform: translateX(72px); }
        54% { transform: translateX(84px); }
        100% { transform: translateX(-18px); }
      }
      @keyframes demoSit {
        0% { transform: translateX(-50%) translateY(10px) scale(.95); }
        100% { transform: translateX(-50%) translateY(0) scale(1); }
      }
    \`;
    document.head.appendChild(style);
    document.getElementById('petNameInput').value = 'Iron';
    document.getElementById('createPet').click();
    setTimeout(() => {
      document.querySelector('[data-role-id="creator"]').click();
      document.querySelector('[data-interest-id="digital-products"]').click();
      document.getElementById('savePreferences').click();
    }, 80);
    setTimeout(() => {
      document.getElementById('leadSummary').textContent = 'Turn one messy template, guide, or prompt pack into a product page, delivery file, FAQ, launch copy, and proof dashboard.';
    }, 2050);
  `);

  while (await win.webContents.executeJavaScript(`document.body.dataset.view !== 'scout'`)) {
    await wait(20);
  }
  await wait(120);

  const frames = await captureRealUiFrames(win);
  fs.writeFileSync(OUT_FILE, makeGif(frames));
  const sizeKb = Math.round(fs.statSync(OUT_FILE).size / 1024);
  console.log(`Recorded real UI GIF: ${OUT_FILE} (${sizeKb} KB, ${frames.length} frames, ${DURATION_MS} ms)`);
  win.destroy();
  app.quit();
}

main().catch((error) => {
  console.error(error);
  app.quit();
  process.exit(1);
});
