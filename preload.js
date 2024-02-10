// Source Code/preload.js
const { contextBridge, ipcRenderer } = require('electron');


console.log('preload loaded');
contextBridge.exposeInMainWorld('electronAPI', {
    openNewWindow: (url) => ipcRenderer.send('open-new-window', url),
    sendAPIRequest: () => ipcRenderer.invoke('send-api-request'),
});

contextBridge.exposeInMainWorld('ChessAPI', {
    showMove: (moveString) => ipcRenderer.invoke('show-move', moveString),
    makeMove: (moveString) => ipcRenderer.invoke('make-move', moveString),
    legalMoves: (source) => ipcRenderer.invoke('legal-moves', source),
    getState:  () => ipcRenderer.invoke('get-state'),
});





