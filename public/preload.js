const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, data) => ipcRenderer.send(channel, data),
  receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
  generateVideo: (videos, mapCode, widgets) => ipcRenderer.invoke('generate-video', videos, mapCode, widgets),
  selectFile: (filters) => ipcRenderer.invoke('select-file', filters),
  onVideoGenerated: (callback) => ipcRenderer.on('video-generated', callback),
  videoProgress: (progress, action) => ipcRenderer.on('video-progress', progress, action)
});