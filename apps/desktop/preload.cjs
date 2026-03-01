const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mvpDesktop', {
  sendMessage: (input) => ipcRenderer.invoke('chat:send', input)
});
