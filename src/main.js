const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let petWindow;

const windowSizes = {
  pet: { width: 120, height: 130 },
  setup: { width: 540, height: 560 },
  lead: { width: 280, height: 450 }
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
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: '#00000000',
    title: '铁锅桌宠',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  petWindow.loadFile(path.join(__dirname, 'renderer.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
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

ipcMain.handle('cursor:get-position', () => {
  return screen.getCursorScreenPoint();
});

ipcMain.handle('window:quit', () => {
  app.quit();
});
