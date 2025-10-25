import { Channels } from 'main/preload';

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        sendMessage(channel: Channels, args: unknown[]): void;
        on(
          channel: string,
          func: (...args: unknown[]) => void
        ): (() => void) | undefined;
        once(channel: string, func: (...args: unknown[]) => void): void;
      };
      onMediaBuffer: (callback: any) => void;
      onMediaMetadata: (callback: any) => void;
      getPlaylist: (playlist: object) => void;
      getPlaylists: (playlists: object) => void;
      getCurrentMedia: (media: object) => void;
      getConfig: (config: object) => void;
      onRequestPlayNext: (callback: any) => void;
      onRequestPlayPrevious: (callback: any) => void;
      onTogglePlay: (callback: any) => void;
      onDecreaseVolume: (callback: any) => void;
      onIncreaseVolume: (callback: any) => void;
      doAction: (isPlaying: boolean) => void;
      chooseMedia: (callback: any) => void;
      seekTo: (callback: any) => void;
      changePlaylist: (callback: any) => void;
      changeTimer: (callback: any) => void;
      requestTurnOff: (callback: any) => void;
      turnOff: (callback: any) => void;
      requestTimeUpdate: (callback: any) => void;
      onTimeUpdate: (time: number) => void;
      setWifiIp: (callback: any) => void;
    };
  }
}

export {};
