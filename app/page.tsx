'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Sidebar from '@/components/Sidebar';
import PlayerBar from '@/components/PlayerBar';
import MainContent from '@/components/MainContent';
import FullscreenPlayer from '@/components/FullscreenPlayer';
import ServerUrlConfig from '@/components/ServerUrlConfig';
import { useMusicStore } from '@/lib/store';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useSocket } from '@/hooks/useSocket';

export default function HomePage() {
  const {
    currentTrack,
    isPlaying,
    currentView,
    setCurrentTrack,
    setIsPlaying,
    setCurrentView,
    playPause
  } = useMusicStore();

  // キーボードショートカットを有効化
  useKeyboardShortcuts();
  
  // Socket.io接続を有効化
  const socket = useSocket();

  const [musicFolder, setMusicFolder] = useState<string | null>(null);
  const [tracks, setTracks] = useState([]);
  const [backgroundColor, setBackgroundColor] = useState<'black' | 'gray' | 'white'>('black');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [gradientColors, setGradientColors] = useState({
    from: '#1db954',
    via: '#1ed760', 
    to: '#1aa34a'
  });
  const audioRef = useRef<HTMLAudioElement>(null);

  // Electron APIの初期化チェック
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      // 音楽フォルダ選択イベントのリスナー
      window.electronAPI.onMusicFolderSelected((path: string) => {
        setMusicFolder(path);
        console.log('Music folder selected:', path);
      });
    }
  }, []);

  const handleSelectMusicFolder = async () => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        const path = await window.electronAPI.selectMusicFolder();
        if (path) {
          setMusicFolder(path);
        }
      } catch (error) {
        console.error('Error selecting music folder:', error);
      }
    }
  };

  const handlePlayPause = () => {
    playPause();
  };

  const handleTrackSelect = (track: any) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    
    // プログレスを0にリセット
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    
    // アルバムアートから色を抽出（模擬）
    const colors = extractColorsFromTrack(track);
    setGradientColors(colors);
  };

  const extractColorsFromTrack = (track: any) => {
    // 実際の実装では、アルバムアートから色を抽出
    const colorPalettes = [
      { from: '#1db954', via: '#1ed760', to: '#1aa34a' }, // Spotify Green
      { from: '#ff6b6b', via: '#ff8e8e', to: '#ff4757' }, // Red
      { from: '#4ecdc4', via: '#6bcf7f', to: '#45b7aa' }, // Teal
      { from: '#a55eea', via: '#c44569', to: '#8854d0' }, // Purple
      { from: '#fd79a8', via: '#fdcb6e', to: '#e84393' }, // Pink
      { from: '#00b894', via: '#00cec9', to: '#55a3ff' }, // Blue-Green
    ];
    
    return colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
  };

  const getBackgroundClass = () => {
    switch (backgroundColor) {
      case 'black':
        return 'bg-black text-white';
      case 'gray':
        return 'bg-gray-900 text-white';
      case 'white':
        return 'bg-white text-black';
      default:
        return 'bg-black text-white';
    }
  };

  const toggleBackgroundColor = () => {
    setBackgroundColor(prev => {
      if (prev === 'black') return 'gray';
      if (prev === 'gray') return 'white';
      return 'black';
    });
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-black" style={{ height: '100dvh' }}>
      {/* モバイルメニューボタン */}
      <button
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-black/80 backdrop-blur-sm rounded-lg flex items-center justify-center text-white border border-white/20"
        title="メニュー"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* 背景色切り替えボタン */}
      <button
        onClick={toggleBackgroundColor}
        className="fixed top-4 right-4 z-50 px-3 py-2 sm:px-4 sm:py-2 rounded-lg glass hover-lift text-sm sm:text-base"
        title="背景色切り替え"
      >
        {backgroundColor === 'black' && '🌑 黒'}
        {backgroundColor === 'gray' && '🌓 灰色'}
        {backgroundColor === 'white' && '☀️ 白'}
      </button>
      
      {/* メインコンテンツエリア - プレイヤーバーの高さを引いた高さ */}
      <div className="flex flex-1 relative z-10 overflow-hidden" style={{ height: 'calc(100dvh - 5rem)' }}>
        {/* サイドバー - モバイルではオーバーレイ、タブレットではアイコンのみ */}
        <div className={`
          fixed md:relative inset-y-0 left-0 z-40 
          transform transition-transform duration-300 ease-in-out
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <Sidebar 
            currentView={currentView}
            onViewChange={(view) => {
              setCurrentView(view);
              setIsMobileSidebarOpen(false);
            }}
            onSelectMusicFolder={handleSelectMusicFolder}
            musicFolder={musicFolder}
          />
        </div>

        {/* モバイルオーバーレイ */}
        {isMobileSidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}
        
        {/* メインコンテンツ - flex-1で残りの高さを全て使用 */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-b from-gray-900 to-black">
          <MainContent 
            onTrackSelect={handleTrackSelect}
            musicFolder={musicFolder}
            backgroundColor={backgroundColor}
          />
        </div>
      </div>
      
      {/* プレイヤーバー - 固定位置（画面下部）、高さ5rem */}
      <div className="fixed bottom-0 left-0 right-0 z-50 h-20 safe-bottom">
        <PlayerBar 
          gradientColors={gradientColors}
          audioRef={audioRef}
        />
      </div>

      {/* 隠しオーディオ要素 */}
      <audio
        ref={audioRef}
        preload="metadata"
        crossOrigin="anonymous"
        style={{ display: 'none' }}
      />

      {/* 全画面プレイヤー */}
      <AnimatePresence>
        <FullscreenPlayer
          audioRef={audioRef}
          onProgressChange={(value) => {
            const audio = audioRef.current;
            if (audio && currentTrack && currentTrack.duration > 0) {
              const newTime = (value[0] / 100) * currentTrack.duration;
              audio.currentTime = newTime;
            }
          }}
          onVolumeChange={(value) => {
            const audio = audioRef.current;
            if (audio) {
              audio.volume = value[0] / 100;
            }
          }}
        />
      </AnimatePresence>

      {/* トースト通知 */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #374151'
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff'
            }
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff'
            }
          }
        }}
      />

      {/* サーバーURL設定 */}
      <ServerUrlConfig />
    </div>
  );
}