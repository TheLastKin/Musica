const EventEmitter = require('node:events');
const { app } = require('electron');

class SwiftAddon extends EventEmitter {
  constructor() {
    super();

    if (process.platform !== 'darwin') {
      throw new Error('This module is only available on macOS');
    }

    let native;
    if(app.isPackaged) {
      native = require(process.resourcesPath + '/swift_addon.node');
    } else{
      native = require("bindings")('swift_addon');
    }
    this.addon = new native.SwiftAddon();
  }
  spawnWindow(filePath, atTime) {
    this.addon.spawnWindow(filePath, atTime);
  }

  closeWindow() {
    this.addon.closeWindow();
  }

  toggleVideo() {
    this.addon.toggleVideo();
  }

  parse(payload) {
    const parsed = JSON.parse(payload);

    return { ...parsed, date: new Date(parsed.date) };
  }
}

if (process.platform === 'darwin') {
  module.exports = new SwiftAddon();
} else {
  module.exports = {};
}
