import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const createWindow = () => {
    const win = new BrowserWindow({
      width: 800,
      height: 600,
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
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })


  