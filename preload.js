const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadMemory: () => ipcRenderer.invoke('load-memory'),
  saveMemory: (data) => ipcRenderer.invoke('save-memory', data)
});