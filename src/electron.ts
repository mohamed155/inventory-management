import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createClient } from '@libsql/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as Sentry from '@sentry/electron';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { PrismaClient } from '../generated/prisma/client.ts';
import { initPrismaActions } from './prisma-actions.ts';

Sentry.init({
  dsn: 'https://a94cd413c933574181a169af0718ea43@o294159.ingest.us.sentry.io/4511243195121664',
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let prisma: PrismaClient | null = null;

const isDev = !!process.env.ELECTRON_START_URL;

const getDbUrl = (): string => {
  if (isDev) return 'file:./dev.db';
  return pathToFileURL(join(app.getPath('userData'), 'app.db')).href;
};

const getMigrationsDir = (): string => join(__dirname, '../prisma/migrations');

const ensureDatabase = async (dbUrl: string): Promise<void> => {
  const client = createClient({ url: dbUrl });
  try {
    const result = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='User'",
    );
    if (result.rows.length > 0) return;

    const migrationsDir = getMigrationsDir();
    const migrations = readdirSync(migrationsDir)
      .sort()
      .map((name) => join(migrationsDir, name, 'migration.sql'))
      .filter(existsSync);

    for (const file of migrations) {
      const sql = readFileSync(file, 'utf-8');
      const statements = sql
        .split('\n')
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean);
      for (const stmt of statements) {
        await client.execute(stmt);
      }
    }
  } finally {
    client.close();
  }
};

const initWindow = async () => {
  try {
    const splashScreen = new BrowserWindow({
      width: 300,
      height: 300,
      frame: false,
      resizable: false,
      alwaysOnTop: true,
      show: false,
    });

    const splashPath = app.isPackaged
      ? join(process.resourcesPath, 'splash.html')
      : join(__dirname, 'splash.html');
    await splashScreen.loadFile(splashPath);
    splashScreen.show();

    const preloadPath = isDev
      ? join(__dirname, 'preload.ts')
      : join(__dirname, 'preload.js');

    const window = new BrowserWindow({
      width: 1200,
      height: 800,
      frame: false,
      show: false,
      webPreferences: {
        nodeIntegration: true,
        preload: preloadPath,
      },
    });

    const dbUrl = getDbUrl();
    await ensureDatabase(dbUrl);

    const adapter = new PrismaLibSql({ url: dbUrl });
    prisma = new PrismaClient({ adapter });

    if (process.env.ELECTRON_START_URL) {
      window.loadURL(process.env.ELECTRON_START_URL);
    } else {
      window.loadFile(join(__dirname, '../dist/index.html'));
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
    console.log('Process platform:', process.platform);
    ipcMain.handle('platform', () => process.platform);

    // window controls
    ipcMain.on('close-window', () => window?.close());
    ipcMain.on('maximize-window', () => window?.maximize());
    ipcMain.on('minimize-window', () => window?.minimize());
    ipcMain.on('restore-window', () => window?.restore());

    initPrismaActions(prisma);
  } catch (error) {
    console.error('Failed to initialize window:', error);
    dialog.showErrorBox('Startup Error', String(error));
    app.exit(1);
  }
};

app.whenReady().then(initWindow);
