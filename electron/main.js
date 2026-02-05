const { app, BrowserWindow, dialog, ipcMain, Menu } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const Store = require('electron-store');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
let webServer = null;
let store = new Store();
let systemInfoInterval = null;

function createWindow() {
  // メインウィンドウを作成
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset', // macOS用のタイトルバースタイル
    frame: process.platform === 'darwin', // macOSではフレームを表示
    show: false, // 初期化完了まで非表示
    backgroundColor: '#0f0f0f', // ダークテーマの背景色
    icon: path.join(__dirname, 'assets/icon.png') // アプリアイコン（後で追加）
  });

  // 開発環境とプロダクション環境でのURL設定
  const startUrl = isDev 
    ? 'http://localhost:3000/admin/dashboard' 
    : `file://${path.join(__dirname, '../out/admin/dashboard.html')}`;

  mainWindow.loadURL(startUrl);

  // ウィンドウの準備ができたら表示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Start real-time system info updates
    startSystemInfoUpdates();
    
    // 開発環境では開発者ツールを開く
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // ウィンドウが閉じられた時の処理
  mainWindow.on('closed', () => {
    // Clean up intervals and processes
    if (systemInfoInterval) {
      clearInterval(systemInfoInterval);
    }
    if (webServer) {
      webServer.kill('SIGTERM');
    }
    mainWindow = null;
  });

  // メニューバーの設定
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Select Music Folder',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            selectMusicFolder();
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  // macOS用のメニュー調整
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 音楽フォルダ選択ダイアログ
async function selectMusicFolder() {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Music Folder',
    properties: ['openDirectory'],
    message: 'Choose the folder containing your music files'
  });

  if (!result.canceled && result.filePaths.length > 0) {
    const selectedPath = result.filePaths[0];
    // レンダラープロセスに選択されたパスを送信
    mainWindow.webContents.send('music-folder-selected', selectedPath);
    return selectedPath;
  }
  return null;
}

// IPCハンドラーの設定
ipcMain.handle('select-music-folder', selectMusicFolder);

// Web server management
ipcMain.handle('start-web-server', async () => {
  if (webServer) {
    return { success: false, message: 'Server is already running' };
  }

  try {
    const musicFolder = store.get('musicFolder', '');
    const env = { ...process.env };
    if (musicFolder) {
      env.MUSIC_FOLDER_PATH = musicFolder;
    }

    webServer = spawn('npm', ['run', 'start'], {
      cwd: process.cwd(),
      env: env,
      shell: true
    });

    webServer.stdout.on('data', (data) => {
      const logData = data.toString();
      mainWindow.webContents.send('server-log', { type: 'stdout', data: logData });
    });

    webServer.stderr.on('data', (data) => {
      const logData = data.toString();
      mainWindow.webContents.send('server-log', { type: 'stderr', data: logData });
    });

    webServer.on('close', (code) => {
      webServer = null;
      mainWindow.webContents.send('server-status', { running: false, code });
    });

    webServer.on('error', (error) => {
      webServer = null;
      mainWindow.webContents.send('server-log', { type: 'error', data: error.message });
      mainWindow.webContents.send('server-status', { running: false, error: error.message });
    });

    // Wait a bit and check if server started successfully
    setTimeout(() => {
      if (webServer) {
        mainWindow.webContents.send('server-status', { running: true });
      }
    }, 2000);

    return { success: true, message: 'Server starting...' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('stop-web-server', async () => {
  if (!webServer) {
    return { success: false, message: 'Server is not running' };
  }

  try {
    webServer.kill('SIGTERM');
    webServer = null;
    mainWindow.webContents.send('server-status', { running: false });
    return { success: true, message: 'Server stopped' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('get-server-status', async () => {
  return { running: webServer !== null };
});

// Music folder management
ipcMain.handle('set-music-folder', async (event, folderPath) => {
  store.set('musicFolder', folderPath);
  return { success: true };
});

ipcMain.handle('get-music-folder', async () => {
  return store.get('musicFolder', '');
});

// Real-time system information
function startSystemInfoUpdates() {
  if (systemInfoInterval) {
    clearInterval(systemInfoInterval);
  }

  const updateSystemInfo = async () => {
    try {
      const si = require('systeminformation');
      const [cpu, mem, fsSize, networkStats, currentLoad] = await Promise.all([
        si.cpu(),
        si.mem(),
        si.fsSize(),
        si.networkStats(),
        si.currentLoad()
      ]);

      const systemInfo = {
        cpu: {
          manufacturer: cpu.manufacturer,
          brand: cpu.brand,
          cores: cpu.cores,
          physicalCores: cpu.physicalCores,
          speed: cpu.speed,
          usage: currentLoad.currentLoad
        },
        memory: {
          total: mem.total,
          free: mem.free,
          used: mem.used,
          active: mem.active,
          usage: (mem.used / mem.total) * 100
        },
        storage: fsSize.map(fs => ({
          fs: fs.fs,
          type: fs.type,
          size: fs.size,
          used: fs.used,
          available: fs.available,
          use: fs.use
        })),
        network: networkStats.map(net => ({
          iface: net.iface,
          rx_bytes: net.rx_bytes,
          tx_bytes: net.tx_bytes,
          rx_sec: net.rx_sec,
          tx_sec: net.tx_sec
        })),
        uptime: process.uptime(),
        timestamp: Date.now()
      };

      mainWindow.webContents.send('system-info-update', systemInfo);
    } catch (error) {
      console.error('System info update error:', error);
    }
  };

  // Update immediately and then every second
  updateSystemInfo();
  systemInfoInterval = setInterval(updateSystemInfo, 1000);
}

ipcMain.handle('get-system-info', async () => {
  const si = require('systeminformation');
  try {
    const [cpu, mem, fsSize, networkStats, currentLoad] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.fsSize(),
      si.networkStats(),
      si.currentLoad()
    ]);

    return {
      cpu: {
        manufacturer: cpu.manufacturer,
        brand: cpu.brand,
        cores: cpu.cores,
        physicalCores: cpu.physicalCores,
        speed: cpu.speed,
        usage: currentLoad.currentLoad
      },
      memory: {
        total: mem.total,
        free: mem.free,
        used: mem.used,
        active: mem.active,
        usage: (mem.used / mem.total) * 100
      },
      storage: fsSize.map(fs => ({
        fs: fs.fs,
        type: fs.type,
        size: fs.size,
        used: fs.used,
        available: fs.available,
        use: fs.use
      })),
      network: networkStats.map(net => ({
        iface: net.iface,
        rx_bytes: net.rx_bytes,
        tx_bytes: net.tx_bytes,
        rx_sec: net.rx_sec,
        tx_sec: net.tx_sec
      })),
      uptime: process.uptime(),
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('System info error:', error);
    return null;
  }
});

// アプリケーションイベント
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// セキュリティ設定
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, navigationUrl) => {
    navigationEvent.preventDefault();
  });
});