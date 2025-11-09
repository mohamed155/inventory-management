import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { app, BrowserWindow, ipcMain } from 'electron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let window: BrowserWindow | null = null;

const createWindow = () => {
  window = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      preload: `${__dirname}/preload.ts`,
    },
  });

  if (process.env.ELECTRON_START_URL) {
    window.loadURL(process.env.ELECTRON_START_URL);
  } else {
    window.loadFile('../builder/index.html');
  }

  window.on('maximize', () => {
    window?.webContents.send('window-maximized', true);
  });

  window.on('unmaximize', () => {
    window?.webContents.send('window-maximized', false);
  });

  window.on('close', () => {
    app.quit();
  });
};

app.whenReady().then(createWindow);

ipcMain.handle('is-maximized', () => window?.isMaximized());

// window controls
ipcMain.on('close-window', () => window?.close());
ipcMain.on('maximize-window', () => window?.maximize());
ipcMain.on('minimize-window', () => window?.minimize());
ipcMain.on('restore-window', () => window?.restore());
