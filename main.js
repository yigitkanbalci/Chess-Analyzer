import { app, BrowserWindow, ipcMain} from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { Chess } from 'chess.js';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { MockBinding } from '@serialport/binding-mock';
import { SerialPortStream } from '@serialport/stream';
import dbOperations from './db/db.js';
import {v4 as uuidv4 } from  'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win;
let modal;

app.commandLine.appendSwitch('enable-features','SharedArrayBuffer')

// Create a port and enable the echo and recording.
MockBinding.createPort('/dev/tty.usbserial-11240', { echo: true, record: true })
const port = new SerialPortStream({ binding: MockBinding, path: '/dev/tty.usbserial-11240', baudRate: 14400 })

/* Add some action for incoming data. For example,
** print each incoming line in uppercase */
const parser = new ReadlineParser()
port.pipe(parser).on('data', line => {
  console.log(line.toUpperCase())
})

// wait for port to open...
port.on('open', () => {
  // ...then test by simulating incoming data
  port.port.emitData("Hello, world!\n")
})
console.log(__dirname);
console.log(path.join(__dirname, 'preload.js'));
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

let gameObject;

ipcMain.handle('send-api-request', async () => {
  let endpoint = `https://stockfish.online/api/stockfish.php?fen=${gameState}&depth=10&mode=bestmove`
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

ipcMain.handle('start-game', (event, p1, p2) => {
  game = new Chess();
  let id = uuidv4();
  gameObject = {
    id: id,
    p1: p1,
    p2: p2,
    moves: [],
  };
  gameState = game.fen();
  gameObject.moves.push(gameState);
  if (game) {
    console.log('game started');
  }

  if (gameObject) {
    dbOperations.addGame(gameObject).then(response => {
      console.log(response.message);
    }).catch(error => {
      console.log(error);
    });
  }
})

ipcMain.handle('end-game', (event) => {
  game.reset();
})

ipcMain.handle('is-game-over', (event) => {
  return { state: game.isGameOver() };
})

let game = null;
let gameState = null;

ipcMain.handle('show-move', (event, moveString) => {
  let move = game.move(moveString, {verbose: true});
  if (move && !game.isGameOver()) {
    game.undo();
    return {success: true, move: move};
  } else {
    return { success: false, error: "Invalid move or game over" };
  }
});

ipcMain.handle('get-state', (event) => {
    if (gameState) {
      return { success: true, state: gameState, turn: game.turn()};
    } else {
      return { success: false, error: "Game state not found" };
    }
})

ipcMain.handle('make-move', (event, moveString) => {
    let turn = game.turn();
    try {
      let move = game.move(moveString, {verbose: true});
      gameState = game.fen();
      gameObject.moves.push(gameState);
      if (game.isGameOver()) {
        return { success: true, message: "gameover", gameOver: true };
      }
      else if (move) {
        dbOperations.updateGame(gameObject.id, gameObject).then(response => {
          console.log(response.message);
        }).catch(error => {
          console.log(error);
        })
        return { success: true, state: gameState, move: move, turn: turn };
      } else { 
        return { success: false, error: "error making move"};
      }
    } catch {
        throw new Error("error");
    }
});

ipcMain.handle('legal-moves', (event, source) => {
    let moves = game.moves({square:source, verbose: true});
    if (moves) {
      return { success:true, moves: moves};
    } else {
      return { success: false, error: "No valid moves"}
    }
});

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
