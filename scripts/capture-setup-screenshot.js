const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');

const outputPath = path.resolve(process.argv[2] || path.join(__dirname, '..', 'docs', 'screenshots', 'setup-page.png'));

async function main() {
  app.setPath('userData', path.join(app.getPath('temp'), `opportunity-pet-screenshot-${Date.now()}`));
  await app.whenReady();
  ipcMain.handle('window:set-mode', () => true);
  ipcMain.handle('cursor:get-position', () => null);
  ipcMain.handle('pet:codex-status', () => ({ available: true, path: 'Codex CLI' }));

  const win = new BrowserWindow({
    width: 280,
    height: 450,
    show: false,
    frame: false,
    transparent: false,
    backgroundColor: '#e8ddc8',
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
    document.body.dataset.view = 'setup';
    document.getElementById('petSetup').classList.add('visible');
  `);
  await new Promise((resolve) => setTimeout(resolve, 500));

  const image = await win.capturePage();
  await require('fs').promises.mkdir(path.dirname(outputPath), { recursive: true });
  await require('fs').promises.writeFile(outputPath, image.toPNG());
  app.quit();
}

main().catch((error) => {
  console.error(error);
  app.quit();
  process.exitCode = 1;
});
