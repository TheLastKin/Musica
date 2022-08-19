import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example';

contextBridge.exposeInMainWorld('electron', {
  getMedia: (path: string) => ipcRenderer.invoke("getMedia", path),
  onRequestPlayNext: (callback: any) => ipcRenderer.on("playNext", callback),
  onRequestPlayPrevious: (callback: any) => ipcRenderer.on("playPrevious", callback),
  onRequestPause: (callback: any) => ipcRenderer.on("togglePlay", callback)
});
