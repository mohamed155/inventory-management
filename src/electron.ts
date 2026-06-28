import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createClient } from '@libsql/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import * as Sentry from '@sentry/electron';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import au from 'electron-updater';
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
    await client.execute(
      `CREATE TABLE IF NOT EXISTS "_applied_migrations" ("name" TEXT NOT NULL PRIMARY KEY)`,
    );

    // Recovery: if Purchase exists but lacks inventoryId, the multi_inventory migration
    // was silently marked applied despite failing — remove stale records so they re-run.
    const { rows: purchaseCols } = await client.execute(`PRAGMA table_info("Purchase")`);
    if (
      purchaseCols.length > 0 &&
      !purchaseCols.some((r) => (r as Record<string, unknown>).name === 'inventoryId')
    ) {
      await client.execute({
        sql: `DELETE FROM "_applied_migrations" WHERE name IN (?, ?)`,
        args: ['20260528001455_multi_inventory', '20260528003620_fix_cascade_chain'],
      });
    }

    const migrationsDir = getMigrationsDir();
    const migrations = readdirSync(migrationsDir)
      .sort()
      .filter((name) => existsSync(join(migrationsDir, name, 'migration.sql')))
      .map((name) => ({ name, file: join(migrationsDir, name, 'migration.sql') }));

    for (const { name, file } of migrations) {
      const { rows } = await client.execute({
        sql: 'SELECT 1 FROM "_applied_migrations" WHERE name = ?',
        args: [name],
      });
      if (rows.length > 0) continue;

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

      await client.execute({
        sql: 'INSERT OR IGNORE INTO "_applied_migrations" (name) VALUES (?)',
        args: [name],
      });
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
      width: 1400,
      height: 800,
      frame: false,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
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
    ipcMain.handle('platform', () => process.platform);
    ipcMain.on('download-update', () => au.autoUpdater.downloadUpdate());
    ipcMain.on('install-update', () => au.autoUpdater.quitAndInstall());

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

app.whenReady().then(() => {
  au.autoUpdater.autoDownload = false;
  au.autoUpdater.checkForUpdates();

  au.autoUpdater.on('update-available', () => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('update-available');
    });
  });

  au.autoUpdater.on('update-downloaded', () => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('update-downloaded');
    });
  });

  initWindow();
});
