// Source Code/preload.js
const { contextBridge, ipcRenderer } = require('electron');
console.log('preload loaded');
contextBridge.exposeInMainWorld('electronAPI', {
    openNewWindow: (url) => ipcRenderer.send('open-new-window', url),
    sendAPIRequest: () => ipcRenderer.invoke('send-api-request')
});

