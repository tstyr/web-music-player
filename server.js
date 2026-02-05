const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3001', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// 起動時の自動スキャン
async function performInitialScan() {
  try {
    console.log('[Server] Performing initial music library scan...');
    
    // Next.jsアプリが準備完了するまで待機
    const defaultFolder = path.join(process.cwd(), 'uploads', 'music');
    const folderPath = process.env.MUSIC_LIBRARY_PATH || defaultFolder;
    
    // APIエンドポイントを呼び出す
    const response = await fetch(`http://localhost:${port}/api/music/scan`, {
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

app.prepare().then(async () => {
  const server = createServer(async (req, res) => {
    try {
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
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // 再生状態の同期
    socket.on('play', (data) => {
      console.log('Play event:', data);
      socket.broadcast.emit('play', data);
    });

    socket.on('pause', (data) => {
      console.log('Pause event:', data);
      socket.broadcast.emit('pause', data);
    });

    socket.on('seek', (data) => {
      console.log('Seek event:', data);
      socket.broadcast.emit('seek', data);
    });

    socket.on('track-change', (data) => {
      console.log('Track change event:', data);
      socket.broadcast.emit('track-change', data);
    });

    socket.on('volume-change', (data) => {
      console.log('Volume change event:', data);
      socket.broadcast.emit('volume-change', data);
    });

    // マルチルーム同期再生
    socket.on('sync-play', (data) => {
      const syncTime = Date.now() + 200;
      io.emit('sync-play-command', {
        ...data,
        syncTime
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  server
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      
      // サーバー起動後にスキャンを実行
      setTimeout(() => {
        performInitialScan();
      }, 2000);
    });
});
