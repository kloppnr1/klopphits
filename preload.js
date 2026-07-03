const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getConfig: () => ipcRenderer.invoke('config:get'),
  setConfig: (patch) => ipcRenderer.invoke('config:set', patch),
  listMedia: (kind) => ipcRenderer.invoke('media:list', kind),
  listDirs: (dirPath) => ipcRenderer.invoke('fs:listDirs', dirPath),
  steamList: () => ipcRenderer.invoke('steam:list'),
  steamLaunch: (appid) => ipcRenderer.invoke('steam:launch', appid),
  openBigPicture: () => ipcRenderer.invoke('steam:bigpicture'),
  retroOpen: (url) => ipcRenderer.invoke('retro:open', url),
  quit: () => ipcRenderer.invoke('app:quit')
});
