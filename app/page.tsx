'use client';

import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Sidebar from '@/components/Sidebar';
import PlayerBar from '@/components/PlayerBar';
import MainContent from '@/components/MainContent';
import FullscreenPlayer from '@/components/FullscreenPlayer';
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
  const [gradientColors, setGradientColors] = useState({
    from: '#1db954',
    via: '#1ed760', 
    to: '#1aa34a'
  });
  const audioRef = useRef<HTMLAudioElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

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
    <div className={`h-screen flex flex-col overflow-hidden ${getBackgroundClass()}`}>
      {/* 背景色切り替えボタン */}
      <button
        onClick={toggleBackgroundColor}
        className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg glass hover-lift"
        title="背景色切り替え"
      >
        {backgroundColor === 'black' && '🌑 黒'}
        {backgroundColor === 'gray' && '🌓 灰色'}
        {backgroundColor === 'white' && '☀️ 白'}
      </button>
      
      {/* メインコンテンツエリア */}
      <div className="flex flex-1 relative z-10 min-h-0">
        {/* サイドバー */}
        <Sidebar 
          currentView={currentView}
          onViewChange={setCurrentView}
          onSelectMusicFolder={handleSelectMusicFolder}
          musicFolder={musicFolder}
        />
        
        {/* メインコンテンツ */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <MainContent 
            onTrackSelect={handleTrackSelect}
            musicFolder={musicFolder}
            analyser={analyserRef.current}
            backgroundColor={backgroundColor}
          />
        </div>
      </div>
      
      {/* プレイヤーバー */}
      <div className="flex-shrink-0">
        <PlayerBar 
          gradientColors={gradientColors}
          audioRef={audioRef}
          onAnalyserReady={(analyser) => {
            analyserRef.current = analyser;
          }}
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
          analyser={analyserRef.current}
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
    </div>
  );
}