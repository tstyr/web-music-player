import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useMusicStore } from '@/lib/store';

// シングルトンSocket接続（全コンポーネントで共有）
let globalSocket: Socket | null = null;

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
      // 接続時にサーバー時刻との同期を開始
      performTimeSync();
    });

    globalSocket.on('device-registered', (data) => {
      console.log('[Socket] Device registered:', data);
      // デバイス情報をローカルストレージに保存
      if (typeof window !== 'undefined') {
        localStorage.setItem('deviceId', data.deviceId);
        localStorage.setItem('deviceName', data.deviceName);
        localStorage.setItem('deviceType', data.deviceType);
      }
    });

    globalSocket.on('device-list-update', (data) => {
      console.log('[Socket] Device list updated:', data.devices);
      // Zustandストアに保存
      const store = useMusicStore.getState();
      store.setConnectedDevices(data.count);
      
      // カスタムイベントを発火（DeviceControlコンポーネントで受信）
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('device-list-update', { detail: data }));
      }
    });

    globalSocket.on('connect_error', (error) => {
      console.warn('[Socket] Connection error:', error.message);
    });

    globalSocket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });
  }
  return globalSocket;
}

// サーバー時刻との同期（NTPライクな方式）
function performTimeSync() {
  if (!globalSocket) return;
  
  const samples: number[] = [];
  const sampleCount = 5;
  
  for (let i = 0; i < sampleCount; i++) {
    setTimeout(() => {
      const t0 = performance.now();
      globalSocket?.emit('time-sync-request', Date.now());
      
      globalSocket?.once('time-sync-response', (data: any) => {
        const t3 = performance.now();
        const roundTripTime = t3 - t0;
        const serverTime = data.serverTime;
        const clientTime = Date.now();
        
        // オフセット計算（往復遅延の半分を考慮）
        const offset = serverTime - clientTime + (roundTripTime / 2);
        samples.push(offset);
        
        if (samples.length === sampleCount) {
          // 中央値を使用（外れ値の影響を減らす）
          samples.sort((a, b) => a - b);
          const medianOffset = samples[Math.floor(samples.length / 2)];
          
          console.log(`[Time Sync] Offset: ${medianOffset.toFixed(2)}ms (RTT: ${roundTripTime.toFixed(2)}ms)`);
          
          // Zustandストアに保存
          const store = useMusicStore.getState();
          store.setServerTimeOffset(medianOffset);
        }
      });
    }, i * 200); // 200msごとにサンプリング
  }
}

export function useSocket(onLibraryUpdate?: (data: any) => void) {
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scheduledPlaybackRef = useRef<number | null>(null);
  
  const {
    currentTrack,
    isPlaying,
    volume,
    setIsPlaying,
    setCurrentTrack,
    setProgress,
    setVolume,
    isSyncMode,
    serverTimeOffset,
    setCurrentPlaylist,
    playFromPlaylist
  } = useMusicStore();

  // 前回の状態を追跡
  const prevIsPlayingRef = useRef(isPlaying);
  const prevTrackIdRef = useRef(currentTrack?.id);
  const prevVolumeRef = useRef(volume);

  useEffect(() => {
    // シングルトンSocketを取得
    socketRef.current = getSocket();

    // イベントリスナーを設定
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
      if (isSyncMode && audioRef.current) {
        const { time } = data;
        audioRef.current.currentTime = time;
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

    // 高精度同期再生コマンド
    const handleSyncPlayCommand = (data: any) => {
      if (!isSyncMode || !audioRef.current) return;
      
      const { trackId, currentTime, syncTime, serverTime } = data;
      const localServerTime = Date.now() + serverTimeOffset;
      const delay = syncTime - localServerTime;
      
      console.log(`[Sync Play] Scheduled in ${delay}ms (server offset: ${serverTimeOffset}ms)`);
      
      // 既存のスケジュールをキャンセル
      if (scheduledPlaybackRef.current) {
        clearTimeout(scheduledPlaybackRef.current);
      }
      
      if (delay > 0) {
        // 未来の時刻に再生をスケジュール
        scheduledPlaybackRef.current = window.setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.currentTime = currentTime || 0;
            audioRef.current.play().catch(console.error);
            setIsPlaying(true);
          }
        }, delay);
      } else {
        // 即座に再生
        audioRef.current.currentTime = currentTime || 0;
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    };

    // 同期トラック変更
    const handleSyncTrackChange = (data: any) => {
      if (!isSyncMode) return;
      
      const { trackId, syncTime } = data;
      const localServerTime = Date.now() + serverTimeOffset;
      const delay = syncTime - localServerTime;
      
      console.log(`[Sync Track Change] Scheduled in ${delay}ms`);
      
      if (delay > 0) {
        setTimeout(() => {
          // トラック変更ロジック（プレイリストから次の曲を取得）
          const store = useMusicStore.getState();
          store.playNext();
        }, delay);
      } else {
        const store = useMusicStore.getState();
        store.playNext();
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
    socket.on('sync-track-change', handleSyncTrackChange);
    socket.on('library-update', handleLibraryUpdate);

    return () => {
      // クリーンアップ
      socket.off('play', handlePlay);
      socket.off('pause', handlePause);
      socket.off('seek', handleSeek);
      socket.off('track-change', handleTrackChange);
      socket.off('volume-change', handleVolumeChange);
      socket.off('sync-play-command', handleSyncPlayCommand);
      socket.off('sync-track-change', handleSyncTrackChange);
      socket.off('library-update', handleLibraryUpdate);
      
      if (scheduledPlaybackRef.current) {
        clearTimeout(scheduledPlaybackRef.current);
      }
    };
  }, [isSyncMode, onLibraryUpdate, currentTrack?.duration, serverTimeOffset, setIsPlaying, setCurrentTrack, setProgress, setVolume]);

  // 再生状態の変化を監視して自動送信
  useEffect(() => {
    if (!socketRef.current || !isSyncMode) return;

    if (prevIsPlayingRef.current !== isPlaying) {
      if (isPlaying) {
        console.log('[Socket] Emitting play event');
        socketRef.current.emit('play', { 
          trackId: currentTrack?.id,
          timestamp: Date.now()
        });
      } else {
        console.log('[Socket] Emitting pause event');
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
      console.log('[Socket] Emitting track-change event');
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
        console.log('[Socket] Emitting volume-change event');
        socketRef.current?.emit('volume-change', { 
          volume,
          timestamp: Date.now()
        });
        prevVolumeRef.current = volume;
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [volume, isSyncMode]);

  // オーディオ要素の参照を設定
  const setAudioElement = (audio: HTMLAudioElement | null) => {
    audioRef.current = audio;
  };

  // 高精度同期再生をリクエスト
  const requestSyncPlay = (trackId: string, currentTime: number = 0, delay: number = 150) => {
    if (socketRef.current && isSyncMode) {
      socketRef.current.emit('sync-play-request', {
        trackId,
        currentTime,
        delay
      });
    }
  };

  // 次の曲への同期切り替え
  const requestSyncNextTrack = (trackId: string, delay: number = 100) => {
    if (socketRef.current && isSyncMode) {
      socketRef.current.emit('sync-next-track', {
        trackId,
        delay
      });
    }
  };

  return {
    socket: socketRef.current,
    setAudioElement,
    requestSyncPlay,
    requestSyncNextTrack,
    performTimeSync
  };
}
