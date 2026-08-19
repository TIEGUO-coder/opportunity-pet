const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('teiguoWindow', {
  moveBy: (dx, dy) => ipcRenderer.invoke('window:move-by', dx, dy),
  setAlwaysOnTop: (enabled) => ipcRenderer.invoke('window:set-always-on-top', enabled),
  setMode: (mode) => ipcRenderer.invoke('window:set-mode', mode),
  getCursorPosition: () => ipcRenderer.invoke('cursor:get-position'),
  quit: () => ipcRenderer.invoke('window:quit')
});
