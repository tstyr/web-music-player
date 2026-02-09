import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiResponse } from 'next';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export function initSocketIO(server: NetServer) {
  const io = new SocketIOServer(server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

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

    // 高精度同期再生（ミリ秒単位）
    socket.on('sync-play-request', (data) => {
      const { trackId, currentTime, delay = 150 } = data;
      const serverTime = Date.now();
      const syncTime = serverTime + delay; // デフォルト150ms後に同期再生
      
      console.log(`[Sync] Scheduling playback at ${syncTime} (in ${delay}ms)`);
      
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
      
      io.emit('sync-track-change', {
        trackId,
        syncTime,
        serverTime
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}
