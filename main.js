import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let win;
ipcMain.on('open-new-window', (event, url) => {
  const modal = new BrowserWindow({ 
      parent: win,
      width: 960, 
      height: 720,
  });
  modal.loadURL(url);
});

const createWindow = () => {
    win = new BrowserWindow({
      width: 960,
      height: 720,
      webPreferences: {
        preload: path.join(__dirname, 'helpers/preload.js')
      }
    })
  
    win.loadFile('views/index.html')
  }


  app.whenReady().then(() => {
    createWindow()
    
    app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
  });


  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  })


  