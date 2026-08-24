const fs = require('fs');
const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const { PNG } = require('pngjs');
const { DEFAULT_CODEX_MODEL, findCodexExecutable, generatePetWithCodex } = require('../src/pet-generation');

const defaultPhotoPaths = [
  '微信图片_20260727112439_13_2.jpg',
  '微信图片_20260727112440_14_2.jpg',
  '微信图片_20260727112440_15_2.jpg'
].map((file) => path.join(__dirname, '..', file));

function toDataUrl(filePath) {
  const extension = path.extname(filePath).slice(1).toLowerCase() || 'jpeg';
  const mime = extension === 'png' ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${fs.readFileSync(filePath).toString('base64')}`;
}

function decodePng(dataUrl) {
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  return PNG.sync.read(Buffer.from(base64, 'base64'));
}

function hasTransparentBorder(png) {
  const { width, height, data } = png;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (x > 2 && x < width - 3 && y > 2 && y < height - 3) continue;
      if (data[(y * width + x) * 4 + 3] !== 0) return false;
    }
  }
  return true;
}

function hasVisiblePixels(png) {
  for (let i = 3; i < png.data.length; i += 4) {
    if (png.data[i] > 24) return true;
  }
  return false;
}

async function main() {
  const photoPaths = process.argv.slice(2);
  const inputs = (photoPaths.length ? photoPaths : defaultPhotoPaths).map((file) => path.resolve(file));
  inputs.forEach((file) => {
    if (!fs.existsSync(file)) throw new Error(`Missing test photo: ${file}`);
  });

  app.setPath('userData', path.join(app.getPath('temp'), `opportunity-pet-local-fallback-${Date.now()}`));
  await app.whenReady();
  ipcMain.handle('window:set-mode', () => true);
  ipcMain.handle('window:set-always-on-top', () => true);
  ipcMain.handle('window:minimize', () => true);
  ipcMain.handle('window:move-by', () => true);
  ipcMain.handle('window:quit', () => true);
  ipcMain.handle('cursor:get-position', () => null);
  const realCodex = process.env.OPPORTUNITY_PET_REAL_CODEX === '1';
  const codexPath = realCodex ? findCodexExecutable() : 'Codex CLI';
  ipcMain.handle('pet:codex-status', () => ({ available: Boolean(codexPath), path: codexPath, model: realCodex ? DEFAULT_CODEX_MODEL : 'test' }));
  ipcMain.handle('pet:generate-with-codex', (event, payload) => {
    if (realCodex) {
      return generatePetWithCodex(payload, {
        codexPath,
        userDataPath: app.getPath('userData'),
        skillPath: path.join(__dirname, '..', 'skills', 'pet-action-pack', 'SKILL.md'),
        codexModel: DEFAULT_CODEX_MODEL,
        onProgress: () => {}
      });
    }
    return {
      ok: false,
      error: 'Built-in image generation unavailable: HTTP 403 Forbidden',
      jobId: 'test-codex-job-403',
      logPath: '/tmp/opportunity-pet-test/codex.log',
      codexModel: 'gpt-5.6-luna'
    };
  });

  const win = new BrowserWindow({
    width: 280,
    height: 450,
    show: false,
    frame: false,
    transparent: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'src', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  await win.loadFile(path.join(__dirname, '..', 'src', 'renderer.html'));
  const dataUrls = inputs.map(toDataUrl);
  const result = await win.webContents.executeJavaScript(`
    (async () => {
      localStorage.removeItem('opportunityPet.profile');
      localStorage.removeItem('opportunityPet.importedActions');
      localStorage.removeItem('opportunityPet.spriteSheet');
      const input = document.getElementById('petPhotoInput');
      const transfer = new DataTransfer();
      const urls = ${JSON.stringify(dataUrls)};
      for (let index = 0; index < urls.length; index += 1) {
        const response = await fetch(urls[index]);
        const blob = await response.blob();
        transfer.items.add(new File([blob], 'pet-' + index + '.jpg', { type: 'image/jpeg' }));
      }
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 100));
      document.getElementById('generatePet').click();
      const maxTries = ${process.env.OPPORTUNITY_PET_REAL_CODEX === '1' ? 4200 : 80};
      for (let tries = 0; tries < maxTries; tries += 1) {
        const actions = localStorage.getItem('opportunityPet.importedActions');
        const profile = localStorage.getItem('opportunityPet.profile');
        const note = document.getElementById('assetNote').textContent;
        const setupVisible = document.getElementById('petSetup').classList.contains('visible');
        const leadVisible = document.getElementById('leadCard').classList.contains('visible');
        const petSrc = document.getElementById('pet').src;
        if (actions && profile && !setupVisible && leadVisible && document.body.dataset.view === 'lead' && /^data:image\\/png;base64,/.test(petSrc)) {
          return {
            actions: JSON.parse(actions),
            profile: JSON.parse(profile),
            note,
            view: document.body.dataset.view,
            setupVisible,
            leadVisible,
            petSrc
          };
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      throw new Error('Timed out waiting for generated local fallback actions and lead screen');
    })();
  `);
  const { actions, profile, note, view, setupVisible, leadVisible, petSrc } = result;
  if (profile.generatedFrom !== 'codex-assisted-local-render') {
    throw new Error(`Expected codex-assisted-local-render profile, got ${profile.generatedFrom}`);
  }
  if (!profile.generationJobId || (!realCodex && profile.generationJobId !== 'test-codex-job-403')) {
    throw new Error(`Expected Codex job id to be preserved, got ${profile.generationJobId}`);
  }
  if (!realCodex && !/HTTP 403 Forbidden/.test(profile.codexError || '')) {
    throw new Error('Expected Codex image generation error to be preserved in the pet profile');
  }
  if (realCodex && !/(HTTP 403 Forbidden|timed out|Codex exited with code|Codex did not create output)/i.test(profile.codexError || '')) {
    throw new Error(`Expected real Codex failure reason to be preserved in the pet profile, got: ${profile.codexError || ''}`);
  }
  if (profile.sourcePhotoCount !== 3) {
    throw new Error(`Expected profile to record 3 source photos, got ${profile.sourcePhotoCount}`);
  }
  if (view !== 'lead' || setupVisible || !leadVisible) {
    throw new Error(`Expected second screen lead view, got view=${view}, setupVisible=${setupVisible}, leadVisible=${leadVisible}`);
  }
  if (!/^data:image\/png;base64,/.test(petSrc)) {
    throw new Error('Expected displayed pet to use the generated action frame');
  }
  const expectedActions = ['idle', 'walk', 'sleep', 'happy', 'chase', 'yawn'];
  expectedActions.forEach((action) => {
    if (!Array.isArray(actions[action]) || actions[action].length !== 4) {
      throw new Error(`Expected 4 ${action} frames`);
    }
    actions[action].forEach((frame, index) => {
      const png = decodePng(frame);
      if (png.width !== 280 || png.height !== 280) {
        throw new Error(`${action}_${index + 1} has wrong dimensions`);
      }
      if (!hasVisiblePixels(png)) {
        throw new Error(`${action}_${index + 1} is blank`);
      }
      if (!hasTransparentBorder(png)) {
        throw new Error(`${action}_${index + 1} is not transparent at the border`);
      }
    });
  });

  console.log(`Verified ${realCodex ? 'real Codex -> local render' : 'mock Codex -> local render'} chain: setup hidden, lead screen shown, generated pet displayed, 6 actions, 24 visible transparent frames.`);
  app.quit();
}

main().catch((error) => {
  console.error(error);
  app.exit(1);
});
