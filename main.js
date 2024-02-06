const { app, BrowserWindow, ipcMain} = require('electron');
const fileURLToPath = require('url');
const path = require('path');
const axios = require('axios');
const { Chess } = require('chess.js');


let win;
let modal;


const createWindow = () => {
  win = new BrowserWindow({
    width: 960,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  win.loadFile('public/index.html')

  win.on('closed', () => {
    win = null;
    if (modal) {
      modal.close();
    }
  });
}

ipcMain.handle('send-api-request', async () => {
  let endpoint = `https://stockfish.online/api/stockfish.php?fen=${gameState}&depth=5&mode=bestmove`
  try {
    const response = await axios.get(endpoint);
    return response.data;
} catch (error) {
    console.error('API request failed:', error);
    throw error;
}
});

const createOrReuseModalWindow = (url) => {
  if (modal && !modal.isDestroyed()) {
    modal.focus();
  } else {
    modal = new BrowserWindow({ 
      parent: win,
      modal: true,
      show: false,
      width: 960,
      height: 720,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js')
      }
    });
    modal.on('closed', () => {
      modal = null;
    });
  }
  modal.loadURL(url);
  modal.once('ready-to-show', () => {
    modal.show();
  });
}

ipcMain.on('open-new-window', (event, url) => {
  createOrReuseModalWindow(url);
});

const game = new Chess();
let gameState = game.fen();
ipcMain.handle('show-move', (event, moveString) => {
  let move = game.move(moveString, {verbose: true});
  if (move && !game.isGameOver()) {
    game.undo();
    return {success: true, move: move};
  } else {
    return { success: false, error: "Invalid move or game over" };
  }
});

ipcMain.handle('make-move', (event, moveString) => {
    let move = game.move(moveString, {verbose: true});
    gameState = game.fen();
    if (move && !game.isGameOver()) {
      return { success: true, state: gameState, move: move, turn: game.turn() };
    } else {
      return { success: false, error: "invalid move or game over" };
    }

});

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
