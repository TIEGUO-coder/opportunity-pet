const fs = require('fs');
const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');

const outputRoot = path.join(__dirname, '..', 'docs', 'screenshots');
const sizes = {
  pet: { width: 120, height: 130 },
  setup: { width: 280, height: 450 },
  lead: { width: 280, height: 450 },
  result: { width: 320, height: 520 }
};

async function waitFor(win, expression, timeoutMs = 6000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const ready = await win.webContents.executeJavaScript(expression);
    if (ready) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for: ${expression}`);
}

async function capture(win, file) {
  const image = await win.capturePage();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, image.toPNG());
}

async function main() {
  app.setPath('userData', path.join(app.getPath('temp'), `opportunity-pet-demo-shots-${Date.now()}`));
  await app.whenReady();

  let win;
  ipcMain.handle('window:set-mode', (_event, mode) => {
    const size = sizes[mode] || sizes.pet;
    win.setBounds({ width: size.width, height: size.height }, true);
    return true;
  });
  ipcMain.handle('window:set-always-on-top', () => true);
  ipcMain.handle('window:minimize', () => true);
  ipcMain.handle('window:move-by', () => true);
  ipcMain.handle('window:quit', () => true);
  ipcMain.handle('cursor:get-position', () => null);
  ipcMain.handle('pet:codex-status', () => ({ available: true, path: 'Codex CLI', model: 'demo' }));

  win = new BrowserWindow({
    width: sizes.setup.width,
    height: sizes.setup.height,
    show: false,
    frame: false,
    transparent: false,
    backgroundColor: '#0d1117',
    webPreferences: {
      preload: path.join(__dirname, '..', 'src', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  await win.loadFile(path.join(__dirname, '..', 'src', 'renderer.html'));
  await win.webContents.executeJavaScript(`
    localStorage.removeItem('opportunityPet.profile');
    localStorage.removeItem('opportunityPet.importedActions');
    localStorage.removeItem('opportunityPet.spriteSheet');
    document.getElementById('petNameInput').value = 'Tieguo';
    document.getElementById('createPet').click();
  `);
  await waitFor(win, `document.body.dataset.view === 'lead' && document.getElementById('leadTitle').textContent.includes('Creator Store')`);
  await capture(win, path.join(outputRoot, 'creator-store-lead.png'));

  await win.webContents.executeJavaScript(`document.getElementById('showResult').click();`);
  await waitFor(win, `document.body.dataset.view === 'result' && document.getElementById('resultRevenue').textContent === '$203'`);
  await new Promise((resolve) => setTimeout(resolve, 200));
  await capture(win, path.join(outputRoot, 'creator-store-result.png'));

  console.log('Captured creator-store-lead.png and creator-store-result.png');
  app.exit(0);
}

main().catch((error) => {
  console.error(error);
  app.exit(1);
});
