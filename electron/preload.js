const { contextBridge, ipcRenderer } = require('electron');

// セキュアなAPIをレンダラープロセスに公開
contextBridge.exposeInMainWorld('electronAPI', {
  // 音楽フォルダ選択
  selectMusicFolder: () => ipcRenderer.invoke('select-music-folder'),
  
  // 音楽フォルダ選択イベントのリスナー
  onMusicFolderSelected: (callback) => {
    ipcRenderer.on('music-folder-selected', (event, path) => callback(path));
  },
  
  // 音楽フォルダ管理
  setMusicFolder: (folderPath) => ipcRenderer.invoke('set-music-folder', folderPath),
  getMusicFolder: () => ipcRenderer.invoke('get-music-folder'),
  
  // Web server management
  startWebServer: () => ipcRenderer.invoke('start-web-server'),
  stopWebServer: () => ipcRenderer.invoke('stop-web-server'),
  getServerStatus: () => ipcRenderer.invoke('get-server-status'),
  
  // Server logs and status listeners
  onServerLog: (callback) => {
    ipcRenderer.on('server-log', (event, data) => callback(data));
  },
  onServerStatus: (callback) => {
    ipcRenderer.on('server-status', (event, status) => callback(status));
  },
  
  // システム情報取得
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // Real-time system info updates
  onSystemInfoUpdate: (callback) => {
    ipcRenderer.on('system-info-update', (event, data) => callback(data));
  },
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
  
  // プラットフォーム情報
  platform: process.platform,
  
  // アプリバージョン
  version: process.env.npm_package_version || '1.0.0'
});