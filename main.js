import { app, BrowserWindow, ipcMain} from 'electron';
import path, { parse } from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { Chess } from 'chess.js';
import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import { MockBinding } from '@serialport/binding-mock';
import { SerialPortStream } from '@serialport/stream';
import dbOperations from './db/db.js';
import {v4 as uuidv4 } from  'uuid';
import {evaluateChessMove} from './public/function/gpt.js'
import { write } from 'fs';
import { handlers, MessageTypes } from './public/function/controller.js';

// // const INACTIVITY_THRESHOLD = 2000; // 10 seconds, adjust as needed
// // let inactivityTimeout;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win;
let modal;
let portPath;
let baudRate = 115200;

app.commandLine.appendSwitch('enable-features','SharedArrayBuffer')

const ports = await SerialPort.list();
  const nonBluetoothPorts = ports.filter(port => !port.path.includes('Bluetooth'));

  if (nonBluetoothPorts.length > 0) {
      portPath = nonBluetoothPorts[0].path; // Assume the first non-Bluetooth port is the ESP32
  } else {
    console.error('No suitable serial port found');
  }

const port = new SerialPort({
  path: portPath,
  baudRate: baudRate,
})

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

parser.on('data', function(data) {
  // clearTimeout(inactivityTimeout);
  // inactivityTimeout = setTimeout(() => {
  //   win.webContents.send('clear-tiles');
  // }, INACTIVITY_THRESHOLD);
  console.log(data);
  try {
    // Try to parse the incoming data as JSON.
    const obj = JSON.parse(data);
    if (obj.data == "piece"){
      console.log(`Type: ${obj.type}, Color: ${obj.color}, EEPROM ID: ${obj.eeprom_id}`);
    }
    
    if (obj.data == "error"){
      //send error to renderer side UI
      console.log(`Error: ${obj.message}`);
      win.webContents.send('error', obj);
    }

    if(obj.data == "tile"){
      //send tile to renderer side to UI
      win.webContents.send('tile', obj);
    }

    if (obj.data == "echo") {
      console.log(`Echo: ${obj.message}`);
      //send echo to renderer side to UI
      win.webContents.send('echo', obj);
    }

    if (obj.data == "move") {
      if (obj.move == "No move") {
        win.webContents.send('clear-tiles')
      } else {
        win.webContents.send('move', obj);
      }
      
      console.log(`Move: ${obj.move}`);
      //send move to renderer side to UI

    }

  } catch (e) {
    // You might want to log or handle incomplete or corrupted data here.
    //console.log("Error parsing JSON:", e);
  }
});

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
let prevState;
let currState;

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


const createOrReuseModalWindow = (content, type) => {
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
  if (type === 'url') {
    modal.loadURL(content);
  } else if (type === 'html') {
    modal.loadURL(`data:text/html;charset=utf-8,${encodeURI(content)}`);
  }
  modal.once('ready-to-show', () => {
    modal.show();
  });
}

ipcMain.on('open-new-window', (event, content, type) => {
  createOrReuseModalWindow(content, type);
});

ipcMain.handle('start-game', async (event, p1, p2) => {
  handlers.sendMessage(MessageTypes.START_GAME, "start", port);
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
  handlers.sendMessage(MessageTypes.END_GAME, "end", port);
})

ipcMain.handle('is-game-over', (event) => {
  return { state: game.isGameOver() };
})

ipcMain.handle('show-move', async (event, moveString) => {
  try {
    const start = performance.now();
    let move = game.move(moveString, {verbose: true});
    let res = await evaluateChessMove(game.fen(), moveString);
    if (move && !game.isGameOver()) {
      game.undo();
      const end = performance.now();
      console.log(`Time taken to execute show-move request: ${end - start}ms.`)
      return {success: true, move: move, eval: res};
    } 
    if (game.isGameOver()) {
      game.undo()
      const end = performance.now();
      console.log(`Time taken to execute show-move request: ${end - start}ms.`)
      return { success: true, message: 'Check Mate!!', move: move, eval: res}
    } 
  } catch {
      return { success: false, error: 'Invalid move' };
  }
});

ipcMain.handle('validate-board', (event) => {
  try {
    handlers.sendMessage(MessageTypes.VALIDATE_BOARD, "validate", port);
    return { success: true, state: game.fen() };
  } catch {
    return { success: false, error: 'Invalid board' };
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
      const start = performance.now();
      prevState = game.fen();
      console.log(game.fen());
      let move = game.move(moveString, {verbose: true});
      console.log(game.fen());
      currState = game.fen();
      gameState = game.fen();
      console.log(move)
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
       
        const end = performance.now();
        console.log(`Time taken to execute make-move handler: ${end - start}ms.`)
        return { success: true, move: move, state: gameState, game: gameObject };  
     }
    } catch {
        if (game.isGameOver()){ 
          let winner = gameObject.turn === 'w' ? 'black' : 'white';
          handlers.sendMessage(MessageTypes.END_GAME, "game end", port);
          return { success: false, error: 'game is over', gameOver: true, winner: winner };
        }
        handlers.sendMessage(MessageTypes.INVALID_MOVE, "invalid", port);
        return { success: false, error: 'invalid move' };
    }
});

ipcMain.handle('legal-moves', (event, source) => {
    let moves = game.moves({square:source, verbose: true});
    console.log(game.turn());
    if (moves) {
      let movesString = moves.map(move => {
        return move.to;
      }).join(', ');
      handlers.sendMessage(MessageTypes.LEGAL_MOVES, movesString, port);
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

port.on('error', function(err) {
  console.log('Error: ', err.message);
});

