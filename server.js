const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const path = require('path');
const chokidar = require('chokidar');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// 標準出力のバッファリングを無効化
if (process.stdout.isTTY) {
  process.stdout._handle.setBlocking(true);
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// グローバルなSocket.ioインスタンス
let globalIo = null;

// ファイル監視用の変数
let fileWatcher = null;
let scanDebounceTimer = null;

// リクエストロガー
function logRequest(req) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.headers['cf-connecting-ip'] || 
             req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'] || 'Unknown';
  
  // 即座に標準出力へ書き出し
  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);
  
  // Cloudflare経由かどうかを判定
  if (req.headers['cf-connecting-ip']) {
    console.log(`  └─ Via Cloudflare Tunnel`);
  }
  
  // 詳細ログ（開発モード時のみ）
  if (dev && url.includes('/api/')) {
    console.log(`  └─ User-Agent: ${userAgent.substring(0, 50)}...`);
  }
}

// 起動時の自動スキャン
async function performInitialScan() {
  try {
    console.log('[Server] Performing initial music library scan...');
    
    // Next.jsアプリが準備完了するまで待機
    const defaultFolder = path.join(process.cwd(), 'uploads', 'music');
    const folderPath = process.env.MUSIC_LIBRARY_PATH || defaultFolder;
    
    // APIエンドポイントを呼び出す
    const response = await fetch(`http://127.0.0.1:${port}/api/music/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folderPath })
    }).catch(() => null);
    
    if (response && response.ok) {
      const data = await response.json();
      console.log('[Server] Initial scan complete:', data.result);
    } else {
      console.log('[Server] Initial scan skipped (API not ready yet)');
    }
  } catch (error) {
    console.error('[Server] Initial scan error:', error.message);
  }
}

// ファイル監視の開始
function startFileWatcher() {
  const defaultFolder = path.join(process.cwd(), 'uploads', 'music');
  const watchPath = process.env.MUSIC_LIBRARY_PATH || defaultFolder;
  
  console.log(`[File Watcher] Starting file watcher for: ${watchPath}`);
  
  fileWatcher = chokidar.watch(watchPath, {
    ignored: /(^|[\/\\])\../, // 隠しファイルを無視
    persistent: true,
    ignoreInitial: true, // 初回スキャンは手動で行う
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100
    }
  });

  fileWatcher
    .on('add', (filePath) => {
      console.log(`[File Watcher] File added: ${filePath}`);
      triggerAutoScan('File added');
    })
    .on('change', (filePath) => {
      console.log(`[File Watcher] File changed: ${filePath}`);
      triggerAutoScan('File changed');
    })
    .on('unlink', (filePath) => {
      console.log(`[File Watcher] File removed: ${filePath}`);
      triggerAutoScan('File removed');
    })
    .on('error', (error) => {
      console.error(`[File Watcher] Error:`, error);
    });
}

// 自動スキャンのトリガー（デバウンス付き）
function triggerAutoScan(reason) {
  // 既存のタイマーをクリア
  if (scanDebounceTimer) {
    clearTimeout(scanDebounceTimer);
  }
  
  // 3秒後にスキャンを実行（複数のファイル変更をまとめて処理）
  scanDebounceTimer = setTimeout(async () => {
    console.log(`[Auto Scan] Triggered by: ${reason}`);
    
    try {
      const defaultFolder = path.join(process.cwd(), 'uploads', 'music');
      const folderPath = process.env.MUSIC_LIBRARY_PATH || defaultFolder;
      
      const response = await fetch(`http://127.0.0.1:${port}/api/music/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath, autoScan: true })
      });
      
      if (response && response.ok) {
        const data = await response.json();
        console.log('[Auto Scan] Complete:', data.result);
      }
    } catch (error) {
      console.error('[Auto Scan] Error:', error.message);
    }
  }, 3000);
}

app.prepare().then(async () => {
  const server = createServer(async (req, res) => {
    try {
      // CORS ヘッダーを追加
      const origin = req.headers.origin;
      const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000'
      ];
      
      // Cloudflare PagesとTunnelのドメインを許可
      if (origin && (
        origin.match(/https:\/\/.*\.pages\.dev$/) ||
        origin.match(/https:\/\/.*\.trycloudflare\.com$/) ||
        allowedOrigins.includes(origin)
      )) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      }

      // OPTIONSリクエストの処理
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      // リクエストログを即座に出力
      logRequest(req);
      
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    // Cloudflare Tunnel経由でも動作するように設定
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    // CORS設定を追加
    allowRequest: (req, callback) => {
      const origin = req.headers.origin;
      // Cloudflare Pagesのドメインを許可
      const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        /https:\/\/.*\.pages\.dev$/,
        /https:\/\/.*\.trycloudflare\.com$/
      ];
      
      const isAllowed = !origin || allowedOrigins.some(allowed => {
        if (typeof allowed === 'string') {
          return origin === allowed;
        }
        return allowed.test(origin);
      });
      
      callback(null, isAllowed);
    }
  });

  // グローバルなSocket.ioインスタンスを保存
  globalIo = io;
  global.io = io; // グローバルに公開

  // 接続中のデバイスを管理
  const connectedDevices = new Map();

  // デバイス情報を取得
  function getDeviceInfo(socket) {
    const userAgent = socket.handshake.headers['user-agent'] || '';
    let deviceType = 'desktop';
    let deviceName = 'Unknown Device';

    if (/mobile/i.test(userAgent)) {
      deviceType = 'mobile';
      deviceName = 'Mobile Device';
    } else if (/tablet|ipad/i.test(userAgent)) {
      deviceType = 'tablet';
      deviceName = 'Tablet';
    } else {
      deviceName = 'Desktop';
    }

    // より詳細なデバイス名を取得
    if (/iPhone/i.test(userAgent)) {
      deviceName = 'iPhone';
    } else if (/iPad/i.test(userAgent)) {
      deviceName = 'iPad';
    } else if (/Android/i.test(userAgent)) {
      deviceName = 'Android Device';
    } else if (/Windows/i.test(userAgent)) {
      deviceName = 'Windows PC';
    } else if (/Mac/i.test(userAgent)) {
      deviceName = 'Mac';
    }

    return { deviceType, deviceName };
  }

  // 全クライアントにデバイスリストをブロードキャスト
  function broadcastDeviceList() {
    const deviceList = Array.from(connectedDevices.values());
    io.emit('device-list-update', {
      devices: deviceList,
      count: deviceList.length
    });
    console.log(`[Socket.io] Broadcasting device list: ${deviceList.length} devices`);
  }

  io.on('connection', (socket) => {
    const clientIp = socket.handshake.headers['cf-connecting-ip'] || 
                     socket.handshake.headers['x-forwarded-for'] || 
                     socket.handshake.address;
    
    const { deviceType, deviceName } = getDeviceInfo(socket);
    
    console.log(`[Socket.io] Client connected: ${socket.id} (IP: ${clientIp}, Type: ${deviceType})`);

    // デバイス情報を登録
    connectedDevices.set(socket.id, {
      id: socket.id,
      name: deviceName,
      type: deviceType,
      ip: clientIp,
      isActive: true,
      connectedAt: new Date().toISOString()
    });

    // 全クライアントにデバイスリストを送信
    broadcastDeviceList();

    // クライアントにデバイスIDを送信
    socket.emit('device-registered', {
      deviceId: socket.id,
      deviceName,
      deviceType
    });

    // デバイス名の更新をリクエスト
    socket.on('update-device-name', (data) => {
      const device = connectedDevices.get(socket.id);
      if (device) {
        device.name = data.name || device.name;
        connectedDevices.set(socket.id, device);
        broadcastDeviceList();
      }
    });

    // 時刻同期（クライアントがサーバー時刻とのオフセットを計算）
    socket.on('time-sync-request', (clientTime) => {
      const serverTime = Date.now();
      socket.emit('time-sync-response', {
        clientTime,
        serverTime,
        responseTime: Date.now()
      });
    });

    // 再生状態の同期
    socket.on('play', (data) => {
      console.log(`[Socket.io] Play event from ${socket.id}:`, data);
      socket.broadcast.emit('play', data);
    });

    socket.on('pause', (data) => {
      console.log(`[Socket.io] Pause event from ${socket.id}:`, data);
      socket.broadcast.emit('pause', data);
    });

    socket.on('seek', (data) => {
      console.log(`[Socket.io] Seek event from ${socket.id}:`, data);
      socket.broadcast.emit('seek', data);
    });

    socket.on('track-change', (data) => {
      console.log(`[Socket.io] Track change event from ${socket.id}:`, data);
      socket.broadcast.emit('track-change', data);
    });

    socket.on('volume-change', (data) => {
      console.log(`[Socket.io] Volume change event from ${socket.id}:`, data);
      socket.broadcast.emit('volume-change', data);
    });

    // 高精度同期再生（ミリ秒単位）
    socket.on('sync-play-request', (data) => {
      const { trackId, currentTime, delay = 150 } = data;
      const serverTime = Date.now();
      const syncTime = serverTime + delay; // デフォルト150ms後に同期再生
      
      console.log(`[Socket.io] Sync play request from ${socket.id}: scheduling at ${syncTime} (in ${delay}ms)`);
      
      io.emit('sync-play-command', {
        trackId,
        currentTime,
        syncTime,
        serverTime
      });
    });

    // 次の曲への同期切り替え
    socket.on('sync-next-track', (data) => {
      const { trackId, delay = 100 } = data;
      const serverTime = Date.now();
      const syncTime = serverTime + delay;
      
      console.log(`[Socket.io] Sync track change from ${socket.id}: ${trackId}`);
      
      io.emit('sync-track-change', {
        trackId,
        syncTime,
        serverTime
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
      
      // デバイスリストから削除
      connectedDevices.delete(socket.id);
      
      // 全クライアントに更新を通知
      broadcastDeviceList();
    });
  });

  server
    .once('error', (err) => {
      console.error('[Server] Error:', err);
      process.exit(1);
    })
    .listen(port, hostname, () => {
      console.log('========================================');
      console.log('  🎵 Music Player Server Started');
      console.log('========================================');
      console.log(`  Local:    http://localhost:${port}`);
      console.log(`  Network:  http://${hostname}:${port}`);
      console.log('========================================');
      console.log('  Cloudflare Tunnel: Ready to accept connections');
      console.log('  Trust Proxy: Enabled for Cloudflare');
      console.log('  Logging: Enhanced (immediate output)');
      console.log('  File Watcher: Enabled (auto-scan on changes)');
      console.log('========================================');
      console.log('');
      
      // サーバー起動後にスキャンを実行
      setTimeout(() => {
        performInitialScan();
      }, 2000);
      
      // ファイル監視を開始
      setTimeout(() => {
        startFileWatcher();
      }, 5000);
    });
});
