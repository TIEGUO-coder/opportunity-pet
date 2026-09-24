const path = require('path');
const { app, BrowserWindow, ipcMain } = require('electron');

const ROOT = path.join(__dirname, '..');
const BOUNDS = { x: 160, y: 120, width: 360, height: 520 };

async function main() {
  app.setPath('userData', path.join(app.getPath('temp'), `opportunity-pet-screen-record-${Date.now()}`));
  await app.whenReady();

  let win;
  ipcMain.handle('window:set-mode', () => true);
  ipcMain.handle('window:set-always-on-top', () => true);
  ipcMain.handle('window:minimize', () => true);
  ipcMain.handle('window:move-by', () => true);
  ipcMain.handle('window:quit', () => true);
  ipcMain.handle('cursor:get-position', () => null);
  ipcMain.handle('pet:codex-status', () => ({ available: true, path: 'Codex CLI', model: 'demo' }));

  win = new BrowserWindow({
    ...BOUNDS,
    title: 'Opportunity Pet Recording Demo',
    show: true,
    frame: false,
    transparent: false,
    backgroundColor: '#0d1117',
    alwaysOnTop: true,
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
      body,
      body[data-view="setup"] {
        background:
          radial-gradient(circle at 50% 78%, rgba(239, 223, 196, .17), transparent 35%),
          #0d1117 !important;
      }
      #petSetup, #resultCard, #toolbar, .toolbar, .tool-button,
      .lead-card .evidence-grid, .lead-card .action-stack,
      .change-pet-action, .close-card, #scoutNow, #pin, #resetPet, #minimize, #quit {
        display: none !important;
      }
      #leadCard:not(.visible),
      #resultCard:not(.visible),
      body:not([data-view="lead"]) #leadNotice {
        display: none !important;
      }
      body[data-view="pet"] .pet-wrap {
        left: 50% !important;
        right: auto !important;
        bottom: 46px !important;
        width: 154px !important;
        height: 150px !important;
        transform: translateX(-50%);
        z-index: 4;
      }
      body[data-view="pet"] .pet-wrap.pacing {
        animation: demoPaceAround 1.9s ease-in-out both !important;
      }
      body[data-view="pet"] .pet-wrap.pacing #pet {
        animation: demoWalkFacing 1.9s steps(1, end) both !important;
        transform-origin: 50% 100%;
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
      @keyframes demoWalkFacing {
        0%, 50% { transform: translateX(-50%) scaleX(-1); }
        51%, 100% { transform: translateX(-50%) scaleX(1); }
      }
      @keyframes demoSit {
        0% { transform: translateX(-50%) translateY(10px) scale(.95); }
        100% { transform: translateX(-50%) translateY(0) scale(1); }
      }
    \`;
    document.head.appendChild(style);
    localStorage.setItem('opportunityPet.profile', JSON.stringify({
      name: 'Iron',
      photoDataUrl: '',
      assetMode: 'generated',
      sourcePhotoCount: 0,
      generatedFrom: 'default-iron',
      createdAt: new Date().toISOString()
    }));
    location.reload();
  `);

  await new Promise((resolve) => win.webContents.once('did-finish-load', resolve));
  await win.webContents.executeJavaScript(`
    const style = document.createElement('style');
    style.textContent = \`
      body,
      body[data-view="setup"] {
        background:
          radial-gradient(circle at 50% 78%, rgba(239, 223, 196, .17), transparent 35%),
          #0d1117 !important;
      }
      #petSetup, #resultCard, #toolbar, .toolbar, .tool-button,
      .lead-card .evidence-grid, .lead-card .action-stack,
      .change-pet-action, .close-card, #scoutNow, #pin, #resetPet, #minimize, #quit {
        display: none !important;
      }
      #leadCard:not(.visible),
      #resultCard:not(.visible),
      body:not([data-view="lead"]) #leadNotice {
        display: none !important;
      }
      body[data-view="pet"] .pet-wrap {
        left: 50% !important;
        right: auto !important;
        bottom: 46px !important;
        width: 154px !important;
        height: 150px !important;
        transform: translateX(-50%);
        z-index: 4;
      }
      body[data-view="pet"] .pet-wrap.pacing {
        animation: demoPaceAround 1.9s ease-in-out both !important;
      }
      body[data-view="pet"] .pet-wrap.pacing #pet {
        animation: demoWalkFacing 1.9s steps(1, end) both !important;
        transform-origin: 50% 100%;
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
      @keyframes demoWalkFacing {
        0%, 50% { transform: translateX(-50%) scaleX(-1); }
        51%, 100% { transform: translateX(-50%) scaleX(1); }
      }
      @keyframes demoSit {
        0% { transform: translateX(-50%) translateY(10px) scale(.95); }
        100% { transform: translateX(-50%) translateY(0) scale(1); }
      }
    \`;
    document.head.appendChild(style);
    document.body.dataset.view = 'pet';
    leadCard.classList.remove('visible');
    resultCard.classList.remove('visible');
    briefPanel.classList.remove('visible');
    currentLeadIndex = -1;
    currentLead = null;
    clearTimeout(scoutingTimer);
    clearTimeout(ambientTimer);
    window.__opportunityPetRecordingDemoTimers = [];
    const clearDemoTimers = () => {
      for (const timer of window.__opportunityPetRecordingDemoTimers) clearTimeout(timer);
      window.__opportunityPetRecordingDemoTimers = [];
    };
    const demoSummary = 'Turn one messy template, guide, or prompt pack into a product page, delivery file, FAQ, launch copy, and proof dashboard.';
    const resetDemo = () => {
      clearDemoTimers();
      leadCard.classList.remove('visible');
      resultCard.classList.remove('visible');
      briefPanel.classList.remove('visible');
      document.body.classList.remove('brief-open');
      document.body.dataset.view = 'pet';
      currentLeadIndex = -1;
      currentLead = null;
      currentAnimation = '';
      clearTimeout(scoutingTimer);
      clearTimeout(ambientTimer);
      setPetMotion('');
      window.__opportunityPetRecordingDemoRunning = false;
      return true;
    };
    const startDemo = () => {
      if (window.__opportunityPetRecordingDemoRunning) return true;
      resetDemo();
      window.__opportunityPetRecordingDemoRunning = true;
      document.getElementById('leadSummary').textContent = demoSummary;
      setPetMotion('pacing');
      startAnimation('walk', 190, true);
      window.__opportunityPetRecordingDemoTimers.push(setTimeout(() => {
        setPetMotion('');
        showLeadCard().then(() => {
          document.getElementById('leadSummary').textContent = demoSummary;
        });
      }, 1650));
      window.__opportunityPetRecordingDemoTimers.push(setTimeout(() => {
        window.__opportunityPetRecordingDemoRunning = false;
      }, 3200));
      return true;
    };
    document.getElementById('petWrap').addEventListener('click', startDemo, { once: true });
    window.__resetOpportunityPetRecordingDemo = resetDemo;
    window.__startOpportunityPetRecordingDemo = startDemo;
    resetDemo();
    setTimeout(() => {
      document.getElementById('leadSummary').textContent = demoSummary;
    }, 2100);
  `);

  console.log(`Recording demo window ready at ${BOUNDS.x},${BOUNDS.y},${BOUNDS.width},${BOUNDS.height}`);
}

main().catch((error) => {
  console.error(error);
  app.quit();
  process.exit(1);
});
