import { contextBridge, ipcRenderer } from 'electron';
import type { User } from '../generated/prisma/client.ts';

contextBridge.exposeInMainWorld('electronAPI', {
  // properties
  isMaximized: () => ipcRenderer.invoke('is-maximized'),

  // callbacks
  onWindowMaximized: (callback: (isMaximized: boolean) => void) =>
    ipcRenderer.on('window-maximized', (_, isMaximized) =>
      callback(isMaximized),
    ),

  // window methods
  closeWindow: () => ipcRenderer.send('close-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  restoreWindow: () => ipcRenderer.send('restore-window'),

  // prisma actions
  createUser: (user: User) => ipcRenderer.invoke('createUser', user),
  getUsers: () => ipcRenderer.invoke('getUsers'),
  getUserById: (id: number) => ipcRenderer.invoke('getUserById', id),
  getUserByUsername: (username: string) =>
    ipcRenderer.invoke('getUserByUsername', username),
  getUsersCount: () => ipcRenderer.invoke('getUsersCount'),
});
