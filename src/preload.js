const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('teiguoWindow', {
  moveBy: (dx, dy) => ipcRenderer.invoke('window:move-by', dx, dy),
  setAlwaysOnTop: (enabled) => ipcRenderer.invoke('window:set-always-on-top', enabled),
  setMode: (mode) => ipcRenderer.invoke('window:set-mode', mode),
  minimize: () => ipcRenderer.invoke('window:minimize'),
  getCursorPosition: () => ipcRenderer.invoke('cursor:get-position'),
  getCodexStatus: () => ipcRenderer.invoke('pet:codex-status'),
  generatePetWithCodex: (payload) => ipcRenderer.invoke('pet:generate-with-codex', payload),
  onGenerationProgress: (callback) => {
    const listener = (_event, message) => callback(message);
    ipcRenderer.on('pet:generation-progress', listener);
    return () => ipcRenderer.removeListener('pet:generation-progress', listener);
  },
  quit: () => ipcRenderer.invoke('window:quit')
});
