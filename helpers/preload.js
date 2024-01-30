// helpers/preload.js
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    openNewWindow: (url) => ipcRenderer.send('open-new-window', url)
});

