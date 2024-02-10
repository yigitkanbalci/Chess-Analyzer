const { app, BrowserWindow, ipcMain} = require('electron');
const fileURLToPath = require('url');
const path = require('path');
const axios = require('axios');
const { Chess } = require('chess.js');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { MockBinding } = require('@serialport/binding-mock');
const { SerialPortStream } = require('@serialport/stream');


let win;
let modal;

// const port = new SerialPort({ path: '/dev/tty.usbserial-11240', baudRate: 14400 });
// const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }))
// parser.on('data', () => {
//   console.log('data received');
// });
// port.write('data sent\n');

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
      if (move) {
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
