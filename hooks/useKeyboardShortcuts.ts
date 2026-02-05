import { useEffect } from 'react';
import { useMusicStore } from '@/lib/store';

export function useKeyboardShortcuts() {
  const { isPlaying, playPause } = useMusicStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 入力フィールドにフォーカスがある場合はスキップ
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          playPause();
          break;
        case 'ArrowRight':
          e.preventDefault();
          // 次の曲へ（実装予定）
          console.log('Next track');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          // 前の曲へ（実装予定）
          console.log('Previous track');
          break;
        case 'ArrowUp':
          e.preventDefault();
          // 音量アップ（実装予定）
          console.log('Volume up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          // 音量ダウン（実装予定）
          console.log('Volume down');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, playPause]);
}
