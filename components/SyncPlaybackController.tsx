'use client';

import { useEffect, useRef } from 'react';
import { useMusicStore } from '@/lib/store';
import { useSocket } from '@/hooks/useSocket';

interface SyncPlaybackControllerProps {
  audioElement: HTMLAudioElement | null;
}

export default function SyncPlaybackController({ audioElement }: SyncPlaybackControllerProps) {
  const { isSyncMode, currentTrack, isPlaying, serverTimeOffset } = useMusicStore();
  const { setAudioElement, requestSyncPlay, requestSyncNextTrack } = useSocket();
  const animationFrameRef = useRef<number | null>(null);
  const lastSyncTimeRef = useRef<number>(0);

  // オーディオ要素をSocketフックに登録
  useEffect(() => {
    if (audioElement) {
      setAudioElement(audioElement);
    }
  }, [audioElement, setAudioElement]);

  // 高精度プログレスバー同期（requestAnimationFrame使用）
  useEffect(() => {
    if (!audioElement || !isSyncMode || !isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const syncProgress = () => {
      const now = performance.now();
      
      // 50msごとに同期チェック（より頻繁に）
      if (now - lastSyncTimeRef.current > 50) {
        const store = useMusicStore.getState();
        const expectedTime = audioElement.currentTime;
        const actualTime = store.currentTime;
        
        // 30ms以上のズレがあれば補正（より厳密に）
        const drift = Math.abs(expectedTime - actualTime);
        if (drift > 0.03) {
          console.log(`[Sync] Drift detected: ${(drift * 1000).toFixed(0)}ms, correcting...`);
          audioElement.currentTime = expectedTime;
          store.setCurrentTime(expectedTime);
          store.setProgress((expectedTime / (currentTrack?.duration || 1)) * 100);
        } else {
          // 小さなズレでも定期的に更新
          store.setCurrentTime(expectedTime);
          store.setProgress((expectedTime / (currentTrack?.duration || 1)) * 100);
        }
        
        lastSyncTimeRef.current = now;
      }
      
      animationFrameRef.current = requestAnimationFrame(syncProgress);
    };

    animationFrameRef.current = requestAnimationFrame(syncProgress);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioElement, isSyncMode, isPlaying, currentTrack?.duration]);

  // トラック終了時の同期処理
  useEffect(() => {
    if (!audioElement || !isSyncMode) return;

    const handleEnded = () => {
      const store = useMusicStore.getState();
      const currentIndex = store.currentPlaylist.findIndex(t => t.id === currentTrack?.id);
      
      if (currentIndex >= 0 && currentIndex < store.currentPlaylist.length - 1) {
        const nextTrack = store.currentPlaylist[currentIndex + 1];
        // 次の曲への同期切り替えをリクエスト
        requestSyncNextTrack(nextTrack.id, 50); // 50ms後に切り替え
      }
    };

    audioElement.addEventListener('ended', handleEnded);

    return () => {
      audioElement.removeEventListener('ended', handleEnded);
    };
  }, [audioElement, isSyncMode, currentTrack?.id, requestSyncNextTrack]);

  return null; // このコンポーネントはUIを持たない
}
