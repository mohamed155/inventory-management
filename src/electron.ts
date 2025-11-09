import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { app, BrowserWindow, ipcMain } from 'electron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const initWindow = async () => {
  const splashScreen = new BrowserWindow({
    width: 300,
    height: 300,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
  });

  await splashScreen.loadFile(`${__dirname}/splash.html`);

  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    show: false,
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

  window.once('ready-to-show', () => {
    splashScreen.close();
    window?.show();
  });

  window.on('maximize', () => {
    window?.webContents.send('window-maximized', true);
  });

  window.on('unmaximize', () => {
    window?.webContents.send('window-maximized', false);
  });

  window.on('close', () => {
    app.quit();
  });

  ipcMain.handle('is-maximized', () => window?.isMaximized());

  // window controls
  ipcMain.on('close-window', () => window?.close());
  ipcMain.on('maximize-window', () => window?.maximize());
  ipcMain.on('minimize-window', () => window?.minimize());
  ipcMain.on('restore-window', () => window?.restore());
};

app.whenReady().then(initWindow);
