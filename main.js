const { app, BrowserWindow, ipcMain} = require('electron');
const fileURLToPath = require('url');
const path = require('path');


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

  win.loadFile('views/index.html')

  win.on('closed', () => {
    win = null;
    if (modal) {
      modal.close();
    }
  });
}

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

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
