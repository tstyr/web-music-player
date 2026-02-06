import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useMusicStore } from '@/lib/store';

// シングルトンSocket接続（全コンポーネントで共有）
let globalSocket: Socket | null = null;
let connectionInitialized = false;

function getSocket(): Socket {
  if (!globalSocket) {
    globalSocket = io({
      path: '/socket.io',
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 3,
      timeout: 20000,
      transports: ['websocket', 'polling'],
    });

    globalSocket.on('connect', () => {
      console.log('[Socket] Connected:', globalSocket?.id);
    });

    globalSocket.on('connect_error', (error) => {
      console.warn('[Socket] Connection error:', error.message);
    });

    globalSocket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    connectionInitialized = true;
  }
  return globalSocket;
}

export function useSocket(onLibraryUpdate?: (data: any) => void) {
  const socketRef = useRef<Socket | null>(null);
  const {
    currentTrack,
    isPlaying,
    progress,
    volume,
    setIsPlaying,
    setCurrentTrack,
    setProgress,
    setVolume,
    isSyncMode
  } = useMusicStore();

  // 前回の状態を追跡
  const prevIsPlayingRef = useRef(isPlaying);
  const prevTrackIdRef = useRef(currentTrack?.id);
  const prevVolumeRef = useRef(volume);

  useEffect(() => {
    // シングルトンSocketを取得
    socketRef.current = getSocket();

    // イベントリスナーを設定（重複登録を防ぐため一度だけ）
    const socket = socketRef.current;

    // 他のクライアントからの再生イベント
    const handlePlay = (data: any) => {
      if (isSyncMode) {
        setIsPlaying(true);
      }
    };

    const handlePause = (data: any) => {
      if (isSyncMode) {
        setIsPlaying(false);
      }
    };

    const handleSeek = (data: any) => {
      if (isSyncMode) {
        const { time } = data;
        setProgress((time / (currentTrack?.duration || 1)) * 100);
      }
    };

    const handleTrackChange = (data: any) => {
      if (isSyncMode) {
        const { track } = data;
        setCurrentTrack(track);
      }
    };

    const handleVolumeChange = (data: any) => {
      if (isSyncMode) {
        const { volume } = data;
        setVolume(volume);
      }
    };

    const handleSyncPlayCommand = (data: any) => {
      if (isSyncMode) {
        const { trackId, currentTime, syncTime } = data;
        const delay = syncTime - Date.now();
        if (delay > 0) {
          setTimeout(() => {
            setIsPlaying(true);
          }, delay);
        }
      }
    };

    const handleLibraryUpdate = (data: any) => {
      if (onLibraryUpdate) {
        onLibraryUpdate(data);
      }
    };

    // イベントリスナーを登録
    socket.on('play', handlePlay);
    socket.on('pause', handlePause);
    socket.on('seek', handleSeek);
    socket.on('track-change', handleTrackChange);
    socket.on('volume-change', handleVolumeChange);
    socket.on('sync-play-command', handleSyncPlayCommand);
    socket.on('library-update', handleLibraryUpdate);

    return () => {
      // クリーンアップ時にイベントリスナーを削除
      socket.off('play', handlePlay);
      socket.off('pause', handlePause);
      socket.off('seek', handleSeek);
      socket.off('track-change', handleTrackChange);
      socket.off('volume-change', handleVolumeChange);
      socket.off('sync-play-command', handleSyncPlayCommand);
      socket.off('library-update', handleLibraryUpdate);
    };
  }, [isSyncMode, onLibraryUpdate, currentTrack?.duration, setIsPlaying, setCurrentTrack, setProgress, setVolume]);

  // 再生状態の変化を監視して自動送信
  useEffect(() => {
    if (!socketRef.current || !isSyncMode) return;

    // 再生/一時停止の変化
    if (prevIsPlayingRef.current !== isPlaying) {
      if (isPlaying) {
        console.log('Emitting play event');
        socketRef.current.emit('play', { 
          trackId: currentTrack?.id,
          timestamp: Date.now()
        });
      } else {
        console.log('Emitting pause event');
        socketRef.current.emit('pause', { 
          trackId: currentTrack?.id,
          timestamp: Date.now()
        });
      }
      prevIsPlayingRef.current = isPlaying;
    }
  }, [isPlaying, currentTrack?.id, isSyncMode]);

  // トラック変更を監視して自動送信
  useEffect(() => {
    if (!socketRef.current || !isSyncMode) return;

    if (prevTrackIdRef.current !== currentTrack?.id && currentTrack) {
      console.log('Emitting track-change event');
      socketRef.current.emit('track-change', { 
        track: currentTrack,
        timestamp: Date.now()
      });
      prevTrackIdRef.current = currentTrack.id;
    }
  }, [currentTrack?.id, isSyncMode]);

  // 音量変更を監視して自動送信（デバウンス付き）
  useEffect(() => {
    if (!socketRef.current || !isSyncMode) return;

    const timeoutId = setTimeout(() => {
      if (prevVolumeRef.current !== volume) {
        console.log('Emitting volume-change event');
        socketRef.current?.emit('volume-change', { 
          volume,
          timestamp: Date.now()
        });
        prevVolumeRef.current = volume;
      }
    }, 300); // 300msデバウンス

    return () => clearTimeout(timeoutId);
  }, [volume, isSyncMode]);

  // イベント送信用の関数（手動送信用）
  const emitPlay = () => {
    if (socketRef.current && isSyncMode) {
      socketRef.current.emit('play', { 
        trackId: currentTrack?.id,
        timestamp: Date.now()
      });
    }
  };

  const emitPause = () => {
    if (socketRef.current && isSyncMode) {
      socketRef.current.emit('pause', { 
        trackId: currentTrack?.id,
        timestamp: Date.now()
      });
    }
  };

  const emitSeek = (time: number) => {
    if (socketRef.current && isSyncMode) {
      socketRef.current.emit('seek', { 
        time,
        timestamp: Date.now()
      });
    }
  };

  const emitTrackChange = (track: any) => {
    if (socketRef.current && isSyncMode) {
      socketRef.current.emit('track-change', { 
        track,
        timestamp: Date.now()
      });
    }
  };

  const emitVolumeChange = (volume: number) => {
    if (socketRef.current && isSyncMode) {
      socketRef.current.emit('volume-change', { 
        volume,
        timestamp: Date.now()
      });
    }
  };

  const emitSyncPlay = (trackId: string, currentTime: number) => {
    if (socketRef.current && isSyncMode) {
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
