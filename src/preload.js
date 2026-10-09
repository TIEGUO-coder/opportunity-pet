const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('teiguoWindow', {
  moveBy: (dx, dy) => ipcRenderer.invoke('window:move-by', dx, dy),
  setAlwaysOnTop: (enabled) => ipcRenderer.invoke('window:set-always-on-top', enabled),
  setMode: (mode) => ipcRenderer.invoke('window:set-mode', mode),
  minimize: () => ipcRenderer.invoke('window:minimize'),
  getCursorPosition: () => ipcRenderer.invoke('cursor:get-position'),
  discardPetGeneration: (payload) => ipcRenderer.invoke('pet:discard-generation', payload),
  prepareCodexHandoff: (payload) => ipcRenderer.invoke('pet:prepare-codex-handoff', payload),
  getCodexHandoffStatus: (payload) => ipcRenderer.invoke('pet:get-codex-handoff-status', payload),
  advanceCodexHandoff: (payload) => ipcRenderer.invoke('pet:advance-codex-handoff', payload),
  openCodexHandoffFolder: (payload) => ipcRenderer.invoke('pet:open-codex-handoff-folder', payload),
  copyCodexInstruction: (payload) => ipcRenderer.invoke('pet:copy-codex-instruction', payload),
  getMahStatus: () => ipcRenderer.invoke('mah:get-status'),
  openMahOpportunity: (payload) => ipcRenderer.invoke('mah:open-opportunity', payload),
  registerMahProjectEntry: (payload) => ipcRenderer.invoke('mah:register-project-entry', payload),
  createOpportunityRoutemap: (payload) => ipcRenderer.invoke('mah:create-opportunity-routemap', payload),
  getMahProjectSnapshot: (projectId) => ipcRenderer.invoke('mah:get-project-snapshot', projectId),
  submitMahCheckpointDecision: (payload) => ipcRenderer.invoke('mah:submit-checkpoint-decision', payload),
  quit: () => ipcRenderer.invoke('window:quit')
});
