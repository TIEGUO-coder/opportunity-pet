const { app, BrowserWindow, clipboard, ipcMain, screen, shell } = require('electron');
const path = require('path');
const { discardPetGeneration, preparePetCodexHandoff, getPetCodexHandoffStatus, advancePetCodexHandoff } = require('./pet-generation');
const { createMahIntegration } = require('./mah-integration');
const { nextWindowOrigin } = require('./window-layout');
const { launchMahOpportunity, openMahApplication } = require('./mah-launch');
const { findMahProjectRoot, saveMahOpportunity } = require('./mah-project');

let mahProjectRoot = findMahProjectRoot(process.env.OPPORTUNITY_PET_MAH_PROJECT_ROOT || path.join(__dirname, '..'));

let petWindow;
let managedWorkflowAdapter;
let currentWindowMode = 'pet';

const windowSizes = {
  pet: { width: 132, height: 150 },
  scout: { width: 200, height: 140 },
  setup: { width: 280, height: 450 },
  preferences: { width: 300, height: 450 },
  lead: { width: 280, height: 450 },
  result: { width: 320, height: 520 }
};

function clampWindowPosition(x, y, width, height) {
  const display = screen.getDisplayNearestPoint({ x, y });
  const bounds = display.workArea;
  return {
    x: Math.max(bounds.x, Math.min(x, bounds.x + bounds.width - width)),
    y: Math.max(bounds.y, Math.min(y, bounds.y + bounds.height - height))
  };
}

function createWindow() {
  const { workArea } = screen.getPrimaryDisplay();
  const { width, height } = windowSizes.pet;

  petWindow = new BrowserWindow({
    width,
    height,
    x: workArea.x + workArea.width - width - 80,
    y: workArea.y + workArea.height - height - 48,
    frame: false,
    transparent: true,
    resizable: false,
    hasShadow: false,
    alwaysOnTop: false,
    skipTaskbar: false,
    backgroundColor: '#00000000',
    title: 'Opportunity Pet',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  petWindow.loadFile(path.join(__dirname, 'renderer.html'), {
    query: process.argv.includes('--from-mah') ? { fromMah: '1' } : {}
  }).then(() => {
    petWindow.show();
    petWindow.focus();
  });
}

function petActionPackSkillPath() {
  const root = app.isPackaged ? process.resourcesPath : app.getAppPath();
  return path.join(root, 'skills', 'pet-action-pack', 'SKILL.md');
}

function petTaskStoragePath() {
  return app.getPath('documents');
}

function mahAdapter() {
  if (!managedWorkflowAdapter) {
    managedWorkflowAdapter = createMahIntegration({ userDataPath: app.getPath('userData') });
  }
  return managedWorkflowAdapter;
}

// MAH can use this entry without coupling the pet to MAH login or task APIs.
function showPet() {
  if (!petWindow || petWindow.isDestroyed()) {
    if (app.isReady()) createWindow();
    return;
  }
  if (petWindow.isMinimized()) petWindow.restore();
  petWindow.show();
  petWindow.focus();
}

if (!app.requestSingleInstanceLock({ projectRoot: mahProjectRoot })) app.exit(0);
app.on('second-instance', (_event, argv, _workingDirectory, data) => {
  if (argv.includes('--from-mah')) {
    if (data?.projectRoot) mahProjectRoot = findMahProjectRoot(data.projectRoot);
  }
  showPet();
});
if (app.isPackaged) {
  app.on('open-url', (event, url) => {
    if (url !== 'opportunity-pet://open' && url !== 'opportunity-pet://open/') return;
    event.preventDefault();
    showPet();
  });
}

app.whenReady().then(() => {
  if (app.isPackaged) app.setAsDefaultProtocolClient('opportunity-pet');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      return;
    }
    if (petWindow?.isMinimized()) petWindow.restore();
    petWindow?.show();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('window:move-by', (_event, dx, dy) => {
  if (!petWindow) return;
  const [x, y] = petWindow.getPosition();
  const [width, height] = petWindow.getSize();
  const next = clampWindowPosition(x + Math.round(dx), y + Math.round(dy), width, height);
  petWindow.setPosition(next.x, next.y);
});

ipcMain.handle('window:set-always-on-top', (_event, enabled) => {
  if (!petWindow) return false;
  petWindow.setAlwaysOnTop(Boolean(enabled));
  return petWindow.isAlwaysOnTop();
});

ipcMain.handle('window:set-mode', (_event, mode) => {
  if (!petWindow) return false;
  const size = windowSizes[mode] || windowSizes.pet;
  const [x, y] = petWindow.getPosition();
  const [oldWidth, oldHeight] = petWindow.getSize();
  const origin = nextWindowOrigin({
    x,
    y,
    oldWidth,
    oldHeight,
    newWidth: size.width,
    newHeight: size.height,
    fromMode: currentWindowMode,
    toMode: mode
  });
  const next = clampWindowPosition(origin.x, origin.y, size.width, size.height);
  petWindow.setBounds({ x: next.x, y: next.y, width: size.width, height: size.height }, false);
  currentWindowMode = mode;
  return true;
});

ipcMain.handle('window:minimize', () => {
  if (!petWindow) return false;
  petWindow.minimize();
  return true;
});

ipcMain.handle('cursor:get-position', () => {
  const point = screen.getCursorScreenPoint();
  const [windowX, windowY] = petWindow ? petWindow.getPosition() : [0, 0];
  return {
    x: point.x,
    y: point.y,
    clientX: point.x - windowX,
    clientY: point.y - windowY
  };
});

ipcMain.handle('pet:discard-generation', async (_event, payload) => {
  return discardPetGeneration(payload || {}, { userDataPath: petTaskStoragePath() });
});

ipcMain.handle('pet:prepare-codex-handoff', async (_event, payload) => {
  return preparePetCodexHandoff(payload || {}, { userDataPath: petTaskStoragePath(), skillPath: petActionPackSkillPath() });
});

ipcMain.handle('pet:get-codex-handoff-status', async (_event, payload) => {
  return getPetCodexHandoffStatus(payload || {}, { userDataPath: petTaskStoragePath() });
});

ipcMain.handle('pet:advance-codex-handoff', async (_event, payload) => {
  return advancePetCodexHandoff(payload || {}, { userDataPath: petTaskStoragePath() });
});

ipcMain.handle('pet:open-codex-handoff-folder', async (_event, payload) => {
  const status = getPetCodexHandoffStatus(payload || {}, { userDataPath: petTaskStoragePath() });
  if (!status.ok) return status;
  const jobId = String(payload?.jobId || '');
  const jobDir = path.join(petTaskStoragePath(), 'Opportunity Pet Tasks', jobId);
  const error = await shell.openPath(jobDir);
  return error ? { ok: false, error } : { ok: true, jobDir };
});

ipcMain.handle('pet:copy-codex-instruction', (_event, payload) => {
  const status = getPetCodexHandoffStatus(payload || {}, { userDataPath: petTaskStoragePath() });
  if (!status.ok) return status;
  const message = status.stage === 'actions'
    ? 'Continue this Opportunity Pet task. Read RUN_IN_CODEX.md, then build the complete movement pack. Keep the approved portrait unchanged and write the finished pet into output/.'
    : 'Start this Opportunity Pet task. Read RUN_IN_CODEX.md, then use the photos already in inputs/ to make only the illustrated pet portrait. Write it to output/character-sheet.png so the app can show it for approval.';
  clipboard.writeText(message);
  return { ok: true };
});

ipcMain.handle('mah:get-status', async () => mahAdapter().getStatus());

ipcMain.handle('mah:open-opportunity', async (_event, payload) => {
  const saved = saveMahOpportunity(payload || {}, { projectRoot: mahProjectRoot, userDataPath: app.getPath('userData') });
  const launch = await launchMahOpportunity(payload || {}, {
    getApplicationInfoForProtocol: async (url) => {
      if (process.platform === 'darwin') {
        const standardPaths = ['/Applications/MAH.app', path.join(app.getPath('home'), 'Applications', 'MAH.app')];
        const installedPath = standardPaths.find((candidate) => require('fs').existsSync(candidate));
        if (installedPath) return { path: installedPath };
      }
      return app.getApplicationInfoForProtocol(url);
    },
    openApplication: (applicationPath) => openMahApplication(applicationPath, shell.openPath),
    openExternal: (url) => shell.openExternal(url, { activate: true })
  });
  return { ...launch, projectSaved: saved.projectSaved };
});

ipcMain.handle('mah:register-project-entry', async (_event, payload) => {
  return mahAdapter().registerProjectEntry(payload || {});
});

ipcMain.handle('mah:create-opportunity-routemap', async (_event, payload) => {
  return mahAdapter().createOpportunityRoutemap(payload || {});
});

ipcMain.handle('mah:get-project-snapshot', async (_event, projectId) => {
  return mahAdapter().getProjectSnapshot(projectId);
});

ipcMain.handle('mah:submit-checkpoint-decision', async (_event, payload) => {
  return mahAdapter().submitCheckpointDecision(payload || {});
});

ipcMain.handle('window:quit', () => {
  app.quit();
});
