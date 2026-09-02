const fs = require('fs');
const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');
const { PreviewAdapter } = require('../src/mah-integration');

const outputRoot = path.join(__dirname, '..', 'docs', 'screenshots');
const sizes = {
  pet: { width: 120, height: 130 },
  scout: { width: 200, height: 140 },
  setup: { width: 280, height: 450 },
  preferences: { width: 300, height: 450 },
  lead: { width: 280, height: 450 },
  brief: { width: 320, height: 560 },
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
  const mahAdapter = new PreviewAdapter(path.join(app.getPath('userData'), 'mah-preview-projects.json'));

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
  ipcMain.handle('mah:get-status', () => mahAdapter.getStatus());
  ipcMain.handle('mah:register-project-entry', (_event, payload) => mahAdapter.registerProjectEntry(payload));
  ipcMain.handle('mah:create-opportunity-routemap', (_event, payload) => mahAdapter.createOpportunityRoutemap(payload));
  ipcMain.handle('mah:get-project-snapshot', (_event, projectId) => mahAdapter.getProjectSnapshot(projectId));
  ipcMain.handle('mah:submit-checkpoint-decision', (_event, payload) => mahAdapter.submitCheckpointDecision(payload));

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
    localStorage.removeItem('opportunityPet.scoutPreferences');
    localStorage.removeItem('opportunityPet.scoutFeedback');
    document.getElementById('petNameInput').value = 'Tieguo';
    document.getElementById('createPet').click();
  `);
  await waitFor(win, `document.body.dataset.view === 'preferences'`);
  await capture(win, path.join(outputRoot, 'scout-preferences.png'));
  await win.webContents.executeJavaScript(`document.querySelector('[data-role-id="creator"]').click();`);
  await waitFor(win, `document.getElementById('preferenceSetup').dataset.step === 'interests'`);
  await capture(win, path.join(outputRoot, 'scout-interests.png'));
  await win.webContents.executeJavaScript(`
    document.querySelector('[data-interest-id="digital-products"]').click();
    document.getElementById('savePreferences').click();
  `);
  await waitFor(win, `document.body.dataset.view === 'lead' && document.getElementById('leadTitle').textContent.includes('Creator Store')`);
  await capture(win, path.join(outputRoot, 'creator-store-lead.png'));
  await win.webContents.executeJavaScript(`document.getElementById('skipLead').click();`);
  await waitFor(win, `document.querySelector('.action-stack').classList.contains('feedback-open')`);
  await capture(win, path.join(outputRoot, 'scout-feedback.png'));
  await win.webContents.executeJavaScript(`document.querySelector('.action-stack').classList.remove('feedback-open');`);

  await win.webContents.executeJavaScript(`document.getElementById('approveLead').click();`);
  await waitFor(win, `!document.getElementById('reviewPlan').disabled`);
  win.setBounds({ width: sizes.brief.width, height: sizes.brief.height }, true);
  await win.webContents.executeJavaScript(`document.getElementById('reviewPlan').click();`);
  await waitFor(
    win,
    `document.body.classList.contains('brief-open') && document.getElementById('briefPanel').classList.contains('visible') && document.getElementById('briefOpportunity').textContent.includes('Creator Store')`
  );
  await new Promise((resolve) => setTimeout(resolve, 250));
  await capture(win, path.join(outputRoot, 'creator-store-brief.png'));

  await win.webContents.executeJavaScript(`document.getElementById('showResult').click();`);
  await waitFor(win, `document.body.dataset.view === 'result' && document.getElementById('resultRevenue').textContent === '$203'`);
  await new Promise((resolve) => setTimeout(resolve, 200));
  await capture(win, path.join(outputRoot, 'creator-store-result.png'));

  console.log('Captured scout-preferences.png, scout-interests.png, scout-feedback.png, creator-store-lead.png, creator-store-brief.png, and creator-store-result.png');
  app.exit(0);
}

main().catch((error) => {
  console.error(error);
  app.exit(1);
});
