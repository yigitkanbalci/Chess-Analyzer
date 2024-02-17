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
  //console.log(line.toUpperCase())
})

// wait for port to open...
port.on('open', () => {
  // ...then test by simulating incoming data
  port.port.emitData("Hello, world!\n")
})

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
let gameState;
let game;

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

ipcMain.handle('start-game', async (event, p1, p2) => { // Make the function async
  game = new Chess();
  const id = uuidv4();
  gameState = game.fen();
  gameObject = {
    id: id,
    p1: p1,
    p2: p2,
    moves: [],
    gameOver: false,
    turn: 'w',
    lastMove: gameState,
  };
  gameObject.moves.push(gameState);
  
  try {
    const response = await dbOperations.addGame(gameObject);
    return { success: true, game: gameObject };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
});

ipcMain.handle('end-game', (event) => {
  game.reset();
})

ipcMain.handle('is-game-over', (event) => {
  return { state: game.isGameOver() };
})

ipcMain.handle('show-move', (event, moveString) => {
  try {
    let move = game.move(moveString, {verbose: true});
    if (move && !game.isGameOver()) {
      game.undo();
      return {success: true, move: move};
    } 
    if (game.isGameOver()) {
      game.undo()
      return { success: true, message: 'Check Mate!!', move: move}
    } 
  } catch {
      return { success: false, error: 'Invalid move' };
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
    try {
      let move = game.move(moveString, {verbose: true});
      gameState = game.fen();
      gameObject.lastMove = gameState;
      gameObject.moves.push(gameState);
      gameObject.turn = game.turn();
      if (move) {
        if (game.isGameOver()) {
          gameObject.gameOver = game.isGameOver();
          gameObject.turn = game.turn();
          gameObject.winner = gameObject.turn === 'w' ? 'black' : 'white';
        }

        dbOperations.updateGame(gameObject.id, gameObject).then(response => {
        }).catch(error => {
          console.log(error);
        })
       
        return { success: true, move: move, state: gameState, game: gameObject };  
     }
    } catch {
        if (game.isGameOver()){ 
          let winner = gameObject.turn === 'w' ? 'black' : 'white';
          return { success: false, error: 'game is over', gameOver: true, winner: winner };
        }
        
        return { success: false, error: 'unknown error' };
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

ipcMain.handle('get-games', (event) => {
  return dbOperations.getGames().then(response => {
    let activeGames = response.games;
    return { success: true, games: activeGames };
  }).catch(error => {
    return { success: false, message: 'No active games found' };
  });
});

ipcMain.handle('get-game-by-id', async (event, id) => {
  try {
    const response = await dbOperations.getGame(id);
    gameObject = response.game;
    game = new Chess();
    gameState = gameObject.lastMove;
    game.load(gameState);
    gameObject.turn = game.turn();
    return { success: true, message: "Game found in db", game: gameObject };
  } catch (error) {
    return { success: false, message: "Game not found in db", error: error.toString() };
  }
});


app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
