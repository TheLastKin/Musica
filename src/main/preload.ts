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
  onMediaBuffer: (callback: any) => ipcRenderer.on("onMediaBuffer", callback),
  onMediaMetadata: (callback: any) => ipcRenderer.on("onMediaMetadata", callback),
  getPlaylist: (playlist: object) => ipcRenderer.send("getPlaylist", playlist),
  getPlaylists: (playlists: object) => ipcRenderer.send("getPlaylists", playlists),
  getCurrentMedia: (media: object) => ipcRenderer.send("getCurrentMedia", media),
  getConfig: (config: object) => ipcRenderer.send("getConfig", config),
  onRequestPlayNext: (callback: any) => ipcRenderer.on("playNext", callback),
  onRequestPlayPrevious: (callback: any) => ipcRenderer.on("playPrevious", callback),
  onTogglePlay: (callback: any) => ipcRenderer.on("togglePlay", callback),
  onDecreaseVolume: (callback: any) => ipcRenderer.on("decreaseVolume", callback),
  onIncreaseVolume: (callback: any) => ipcRenderer.on("increaseVolume", callback),
  doAction: (isPlaying: boolean) => ipcRenderer.send("doAction", isPlaying),
  chooseMedia: (callback: any) => ipcRenderer.on("chooseMedia", callback),
  seekTo: (callback: any) => ipcRenderer.on("seekTo", callback),
  changePlaylist: (callback: any) => ipcRenderer.on("changePlaylist", callback),
  changeTimer: (callback: any) => ipcRenderer.on("changeTimer", callback),
  requestTurnOff: (callback: any) => ipcRenderer.on("requestTurnOff", callback),
  turnOff: (callback: any) => ipcRenderer.send("turnOff", callback),
  requestTimeUpdate: (callback: any) => ipcRenderer.on("requestTimeUpdate", callback),
  onTimeUpdate: (time: number) => ipcRenderer.send("onTimeUpdate", time)
});
