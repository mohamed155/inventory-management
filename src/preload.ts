import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // properties
  isMaximized: () => ipcRenderer.invoke('is-maximized'),

  // callbacks
  onWindowMaximized: (callback: (isMaximized: boolean) => void) =>
    ipcRenderer.on('window-maximized', (_, isMaximized) =>
      callback(isMaximized),
    ),

  // methods
  closeWindow: () => ipcRenderer.send('close-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  restoreWindow: () => ipcRenderer.send('restore-window'),
});
