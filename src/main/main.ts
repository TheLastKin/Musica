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
import { app, BrowserWindow, shell, ipcMain, globalShortcut, nativeImage, IpcMainEvent, TouchBar } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { resolveHtmlPath } from './util';
import fs from 'fs';
import mm from 'musicmetadata';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const getMedia = async (event: any, path: string) => {
  let buffer = fs.readFileSync(path).buffer;
  let stream = fs.createReadStream(path);
  return new Promise((resolve, reject) => {
    mm(stream, (err, metadata) => {
      if(err){
        resolve({ buffer, metadata: {} })
      }else{
        resolve({ buffer, metadata })
      }
    })
  })
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

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  const D_File = path.join(app.getAppPath(), "bounds.json");
  let dimensions = null;

  try {
    dimensions = JSON.parse(fs.readFileSync(D_File, "utf-8"))
  } catch (error) {

  }

  mainWindow = new BrowserWindow({
    show: false,
    minWidth: 1000,
    minHeight: 800,
    width: dimensions ? dimensions.bounds.width : 1000,
    height: dimensions ? dimensions.bounds.height: 800,
    center: true,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
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
  });

  mainWindow.on("close", () => {
    const dimensions = {
      bounds: mainWindow?.getBounds()
    }
    fs.writeFileSync(D_File, JSON.stringify(dimensions))
  })

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

const mediaChanged = (event: IpcMainEvent, isPlaying: boolean) => {
  mainWindow?.setThumbarButtons([{
    tooltip: "previous",
    icon: nativeImage.createFromPath("../../assets/previous.png"),
    click: () => {
      mainWindow?.webContents.send("playNext");
    }
  }, {
    tooltip: "pause",
    icon: isPlaying ? nativeImage.createFromPath("../../assets/pause.jpeg") : nativeImage.createFromPath("../../assets/play.png"),
    click: () => {
      mainWindow?.webContents.send("togglePlay")
    }
  }, {
    tooltip: "next",
    icon: nativeImage.createFromPath("../../assets/next.png"),
    click: () => {
      mainWindow?.webContents.send("playPrevious")
    }
  }])
}


app
  .whenReady()
  .then(() => {
    ipcMain.handle("getMedia", getMedia);
    ipcMain.on("mediaChanged", mediaChanged);

    globalShortcut.register("Alt+.", () => {
      mainWindow?.webContents.send("playNext")
    })
    globalShortcut.register("Alt+,", () => {
      mainWindow?.webContents.send("playPrevious")
    })
    globalShortcut.register("Alt+/", () => {
      mainWindow?.webContents.send("togglePlay")
    })
    globalShortcut.register("MediaNextTrack", () => {
      mainWindow?.webContents.send("playNext")
    })
    globalShortcut.register("MediaPlayPause", () => {
      mainWindow?.webContents.send("togglePlay")
    })
    globalShortcut.register("MediaPreviousTrack", () => {
      mainWindow?.webContents.send("playPrevious")
    })
    globalShortcut.register("Alt+=", () => {
      mainWindow?.webContents.send("increaseVolume")
    })
    globalShortcut.register("Alt+-", () => {
      mainWindow?.webContents.send("decreaseVolume")
    })
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
