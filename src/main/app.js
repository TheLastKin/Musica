import { ipcMain } from "electron"
import fs from "fs"

const express = require("express")
const app = express()
const http = require("http")
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server)
const port = 4000;

let hasClient = false;
let mainWindow = null;
let playlists = [];
let currentPlaylist = [];
let playConfig = {};
let currentMedia = null;

function setPlaylists(event, p){
  playlists = p
}

function setPlayConfig(event, c){
  playConfig = c
  if(hasClient){
    io.emit("onConfigChanged", playConfig)
  }
}

function setCurrentPlaylist(event, playlist){
  currentPlaylist = playlist
  if(hasClient){
    io.emit("onPlaylistChanged", playlist)
  }
}

function setCurrentMedia(event, media){
  currentMedia = media
  if(hasClient){
    io.emit("onMediaChanged", media)
  }
}

function emitTimeUpdate(event, time){
  if(hasClient){
    io.emit("onTimeUpdate", time)
  }
}

function setMainWindow(mw){
  mainWindow = mw
}

export {
  setCurrentPlaylist,
  setCurrentMedia,
  setMainWindow,
  setPlaylists,
  setPlayConfig,
  emitTimeUpdate
}

export default function initiateExpress(){

  io.on("connection", () => {
    hasClient = true
    if(mainWindow){
      mainWindow.webContents.send('requestTimeUpdate');
    }
  })

  io.on("disconnect", () => {
    hasClient = false
  })

  app.get('/changePlaylist/:index', (req, res) => {
    if(mainWindow){
      mainWindow.webContents.send("changePlaylist", req.params.index)
      res.send({ status: true })
    }else{
      res.send({ status: false })
    }
  })

  app.get('/chooseMedia/:index', (req, res) => {
    if(mainWindow){
      mainWindow.webContents.send("chooseMedia", req.params.index)
      res.send({ status: true })
    }else{
      res.send({ status: false })
    }
  })

  app.get('/config', (req, res) => {
    res.send(playConfig)
  })

  app.get('/playlists', (req, res) => {
    res.send(playlists)
  })

  app.get('/playlist', (req, res) => {
    res.send(currentPlaylist)
  })

  app.get('/media', (req, res) => {
    res.send(currentMedia)
  })

  app.get('/shufflePlaylist', (req, res) => {
    if(mainWindow){
      mainWindow.webContents.send("shufflePlaylist")
      res.send({ status: true })
    }else{
      res.send({ status: false })
    }
  })

  app.get('/toggleRepeat', (req, res) => {
    if(mainWindow){
      mainWindow.webContents.send("toggleRepeat")
      res.send({ status: true })
    }else{
      res.send({ status: false })
    }
  })

  app.get('/changeMedia/:next', (req, res) => {
    if(mainWindow){
      if(req.params.next === "next"){
        mainWindow.webContents.send("playNext")
      }else{
        mainWindow.webContents.send("playPrevious")
      }
      res.send({ status: true })
    }else{
      res.send({ status: false })
    }
  })

  app.get('/changeVolume/:inc', (req, res) => {
    if(mainWindow){
      if(req.params.inc === "increase"){
        mainWindow.webContents.send("increaseVolume")
      }else{
        mainWindow.webContents.send("decreaseVolume")
      }
      res.send({ status: true })
    }else{
      res.send({ status: false })
    }
  })

  app.get('/togglePlay', (req, res) => {
    if(mainWindow){
      mainWindow.webContents.send("togglePlay")
      res.send({ status: true })
    }else{
      res.send({ status: false })
    }
  })

  app.get('/seekTo/:time', (req, res) => {
    if(mainWindow){
      mainWindow.webContents.send("seekTo", req.params.time)
      res.send({ status: true })
    }else{
      res.send({ status: false })
    }
  })

  app.get('/turnOff/:state', (req, res) => {
    if(mainWindow){
      mainWindow.webContents.send("requestTurnOff", req.params.state);
    }
  })

  app.get('/changeTimer/:type', (req, res) => {
    if(mainWindow){
      mainWindow.webContents.send("changeTimer", req.params.type);
      res.send({ status: true })
    }else{
      res.send({ status: false })
    }
  })

  if(!server.listening){
    server.listen(port, () => {
      console.log(`Express server listening at http://localhost:${port}`)
  })
  }
}
