/* eslint-disable @typescript-eslint/naming-convention */
/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  globalShortcut,
  nativeImage,
  IpcMainEvent,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import os from 'os';
import fs from 'fs';
import mm from 'musicmetadata';
import { resolveHtmlPath } from './util';
import initiateExpress, {
  emitTimeUpdate,
  setCurrentMedia,
  setCurrentPlaylist,
  setMainWindow,
  setPlayConfig,
  setPlaylists,
} from './app';

import { exec } from 'child_process';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const nets = os.networkInterfaces();
const getWifiIp = () => {
  for (const name of Object.keys(nets)) {
    if (!nets[name]) return '';
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '';
};
const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const USER_CONFIG_PATH = app.isPackaged
    ? os.platform() === 'win32'
      ? path.join(process.resourcesPath, 'assets')
      : path.join(os.homedir(), 'Library', 'User Data', app.getName(), 'config')
    : path.join(__dirname, 'assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  const DIMENSION_FILE = path.join(USER_CONFIG_PATH, 'bounds.json');

  if (!fs.existsSync(USER_CONFIG_PATH)) {
    fs.mkdirSync(USER_CONFIG_PATH, { recursive: true });
    fs.writeFileSync(
      DIMENSION_FILE,
      JSON.stringify({ bounds: { width: 1000, height: 800 } })
    );
  }

  let dimensions = null;

  try {
    dimensions = JSON.parse(fs.readFileSync(DIMENSION_FILE, 'utf-8'));
  } catch (error) {
    dimensions = { bounds: { width: 1000, height: 800 } };
  }

  mainWindow = new BrowserWindow({
    show: false,
    minWidth: 1000,
    minHeight: 800,
    width: dimensions.bounds.width,
    height: dimensions.bounds.height,
    center: true,
    icon: getAssetPath(os.platform() === 'win32' ? 'icon.png' : 'icon.icns'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
      webSecurity: false,
    },
  });

  mainWindow.setMenu(null);

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
    initiateExpress();
    setMainWindow(mainWindow);
    mainWindow.webContents.send('setWifiIp', getWifiIp());
  });

  mainWindow.on('close', () => {
    const dims = {
      bounds: mainWindow?.getBounds(),
    };
    fs.writeFileSync(DIMENSION_FILE, JSON.stringify(dims));
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

const previousIcon = nativeImage.createFromPath('../../assets/previous.png');
const nextIcon = nativeImage.createFromPath('../../assets/next.png');
const pauseIcon = nativeImage.createFromPath('../../assets/pause.png');
const playIcon = nativeImage.createFromPath('../../assets/play.png');

const doAction = (event: IpcMainEvent, isPlaying: boolean) => {
  mainWindow?.setThumbarButtons([
    {
      tooltip: 'previous',
      icon: previousIcon,
      click: () => {
        mainWindow?.webContents.send('playPrevious');
      },
    },
    {
      tooltip: 'pause',
      icon: isPlaying ? pauseIcon : playIcon,
      click: () => {
        mainWindow?.webContents.send('togglePlay');
      },
    },
    {
      tooltip: 'next',
      icon: nextIcon,
      click: () => {
        mainWindow?.webContents.send('playNext');
      },
    },
  ]);
};

const registerShortcuts = () => {
  globalShortcut.register('Alt+.', () => {
    mainWindow?.webContents.send('playNext');
  });
  globalShortcut.register('Alt+,', () => {
    mainWindow?.webContents.send('playPrevious');
  });
  globalShortcut.register('Alt+/', () => {
    mainWindow?.webContents.send('togglePlay');
  });
  globalShortcut.register('Alt+=', () => {
    mainWindow?.webContents.send('increaseVolume');
  });
  globalShortcut.register('Alt+-', () => {
    mainWindow?.webContents.send('decreaseVolume');
  });
};

app
  .whenReady()
  .then(() => {
    ipcMain.on('doAction', doAction);
    ipcMain.on('getPlaylist', setCurrentPlaylist);
    ipcMain.on('getPlaylists', setPlaylists);
    ipcMain.on('getCurrentMedia', setCurrentMedia);
    ipcMain.on('getConfig', setPlayConfig);
    ipcMain.on('turnOff', (e, state) => {
      if (state === 'shutdown') {
        if (mainWindow) mainWindow.close();
        exec('shutdown /s');
      } else {
        exec('rundll32.exe powrprof.dll, SetSuspendState Sleep');
      }
    });
    ipcMain.on('onTimeUpdate', emitTimeUpdate);

    registerShortcuts();
    globalShortcut.register('MediaNextTrack', () => {
      mainWindow?.webContents.send('playNext');
    });
    globalShortcut.register('MediaPlayPause', () => {
      mainWindow?.webContents.send('togglePlay');
    });
    globalShortcut.register('MediaPreviousTrack', () => {
      mainWindow?.webContents.send('playPrevious');
    });
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) {
        registerShortcuts();
        createWindow();
      }
    });
  })
  .catch(console.log);
