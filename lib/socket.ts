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
      const { trackId, startTime, currentTime } = data;
      const syncTime = Date.now() + 200; // 200ms後に同期再生
      
      io.emit('sync-play-command', {
        trackId,
        startTime,
        currentTime,
        syncTime
      });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}
