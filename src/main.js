const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const { DEFAULT_CODEX_MODEL, findCodexExecutable, generatePetWithCodex } = require('./pet-generation');
const { createMahIntegration } = require('./mah-integration');

let petWindow;
let managedWorkflowAdapter;

const windowSizes = {
  pet: { width: 120, height: 130 },
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

  petWindow.loadFile(path.join(__dirname, 'renderer.html'));
}

function petActionPackSkillPath() {
  const root = app.isPackaged ? process.resourcesPath : app.getAppPath();
  return path.join(root, 'skills', 'pet-action-pack', 'SKILL.md');
}

function mahAdapter() {
  if (!managedWorkflowAdapter) {
    managedWorkflowAdapter = createMahIntegration({ userDataPath: app.getPath('userData') });
  }
  return managedWorkflowAdapter;
}

app.whenReady().then(() => {
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
  const nextX = x + oldWidth - size.width;
  const nextY = y + oldHeight - size.height;
  const next = clampWindowPosition(nextX, nextY, size.width, size.height);
  petWindow.setBounds({ x: next.x, y: next.y, width: size.width, height: size.height }, true);
  return true;
});

ipcMain.handle('window:minimize', () => {
  if (!petWindow) return false;
  petWindow.minimize();
  return true;
});

ipcMain.handle('cursor:get-position', () => {
  return screen.getCursorScreenPoint();
});

ipcMain.handle('pet:codex-status', () => {
  const path = findCodexExecutable();
  return { available: Boolean(path), path, model: process.env.OPPORTUNITY_PET_CODEX_MODEL || DEFAULT_CODEX_MODEL };
});

ipcMain.handle('pet:generate-with-codex', async (event, payload) => {
  return generatePetWithCodex(payload || {}, {
    codexModel: process.env.OPPORTUNITY_PET_CODEX_MODEL || DEFAULT_CODEX_MODEL,
    userDataPath: app.getPath('userData'),
    skillPath: petActionPackSkillPath(),
    onProgress: (message) => event.sender.send('pet:generation-progress', message)
  });
});

ipcMain.handle('mah:get-status', async () => mahAdapter().getStatus());

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
