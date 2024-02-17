// Source Code/preload.js
const { contextBridge, ipcRenderer } = require('electron');


console.log('preload loaded');
contextBridge.exposeInMainWorld('electronAPI', {
    openNewWindow: (url) => ipcRenderer.send('open-new-window', url),
    sendAPIRequest: () => ipcRenderer.invoke('send-api-request'),
});

contextBridge.exposeInMainWorld('ChessAPI', {
    startGame: (p1, p2) => ipcRenderer.invoke('start-game', p1, p2),
    showMove: (moveString) => ipcRenderer.invoke('show-move', moveString),
    makeMove: (moveString) => ipcRenderer.invoke('make-move', moveString),
    legalMoves: (source) => ipcRenderer.invoke('legal-moves', source),
    getState:  () => ipcRenderer.invoke('get-state'),
    getGames: () => ipcRenderer.invoke('get-games'),
});

contextBridge.exposeInMainWorld('LowAPI', {
    getGameById: (id) => ipcRenderer.invoke('get-game-by-id', id),
});





