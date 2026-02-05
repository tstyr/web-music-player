import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useMusicStore } from '@/lib/store';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const {
    currentTrack,
    isPlaying,
    setIsPlaying,
    setCurrentTrack,
    setProgress,
    setVolume
  } = useMusicStore();

  useEffect(() => {
    // Socket.io接続
    socketRef.current = io({
      path: '/socket.io',
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
    });

    // 他のクライアントからの再生イベント
    socketRef.current.on('play', (data) => {
      console.log('Received play event:', data);
      setIsPlaying(true);
    });

    // 他のクライアントからの一時停止イベント
    socketRef.current.on('pause', (data) => {
      console.log('Received pause event:', data);
      setIsPlaying(false);
    });

    // 他のクライアントからのシークイベント
    socketRef.current.on('seek', (data) => {
      console.log('Received seek event:', data);
      const { time } = data;
      setProgress((time / (currentTrack?.duration || 1)) * 100);
    });

    // 他のクライアントからの曲変更イベント
    socketRef.current.on('track-change', (data) => {
      console.log('Received track-change event:', data);
      const { track } = data;
      setCurrentTrack(track);
    });

    // 他のクライアントからの音量変更イベント
    socketRef.current.on('volume-change', (data) => {
      console.log('Received volume-change event:', data);
      const { volume } = data;
      setVolume(volume);
    });

    // マルチルーム同期再生コマンド
    socketRef.current.on('sync-play-command', (data) => {
      console.log('Received sync-play-command:', data);
      const { trackId, currentTime, syncTime } = data;
      
      // 指定された時刻まで待機してから再生
      const delay = syncTime - Date.now();
      if (delay > 0) {
        setTimeout(() => {
          // ここで実際の再生処理を実行
          setIsPlaying(true);
        }, delay);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // イベント送信用の関数
  const emitPlay = () => {
    if (socketRef.current) {
      socketRef.current.emit('play', { trackId: currentTrack?.id });
    }
  };

  const emitPause = () => {
    if (socketRef.current) {
      socketRef.current.emit('pause', { trackId: currentTrack?.id });
    }
  };

  const emitSeek = (time: number) => {
    if (socketRef.current) {
      socketRef.current.emit('seek', { time });
    }
  };

  const emitTrackChange = (track: any) => {
    if (socketRef.current) {
      socketRef.current.emit('track-change', { track });
    }
  };

  const emitVolumeChange = (volume: number) => {
    if (socketRef.current) {
      socketRef.current.emit('volume-change', { volume });
    }
  };

  const emitSyncPlay = (trackId: string, currentTime: number) => {
    if (socketRef.current) {
      socketRef.current.emit('sync-play', {
        trackId,
        currentTime,
        startTime: Date.now()
      });
    }
  };

  return {
    socket: socketRef.current,
    emitPlay,
    emitPause,
    emitSeek,
    emitTrackChange,
    emitVolumeChange,
    emitSyncPlay
  };
}
