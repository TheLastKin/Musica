import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels = 'ipc-example';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    sendMessage(channel: Channels, args: unknown[]) {
      ipcRenderer.send(channel, args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => ipcRenderer.removeListener(channel, subscription);
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    }
  },
  getMedia: (path: string) => ipcRenderer.invoke("getMedia", path),
  onRequestPlayNext: (callback: any) => ipcRenderer.on("playNext", callback),
  onRequestPlayPrevious: (callback: any) => ipcRenderer.on("playPrevious", callback),
  onRequestPause: (callback: any) => ipcRenderer.on("togglePlay", callback),
  onDecreaseVolume: (callback: any) => ipcRenderer.on("decreaseVolume", callback),
  onIncreaseVolume: (callback: any) => ipcRenderer.on("increaseVolume", callback),
  mediaChanged: (isPlaying: boolean) => ipcRenderer.send("mediaChanged", isPlaying)
});
