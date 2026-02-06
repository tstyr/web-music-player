'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Shuffle, 
  Repeat,
  Heart,
  MoreHorizontal,
  VolumeX,
  Volume1,
  Monitor
} from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';
import AudioVisualizer from './AudioVisualizer';
import DeviceControl from './DeviceControl';
import TrackMenu from './TrackMenu';
import { useMusicStore } from '@/lib/store';

interface PlayerBarProps {
  gradientColors: {
    from: string;
    via: string;
    to: string;
  };
  audioRef?: React.RefObject<HTMLAudioElement>;
  onAnalyserReady?: (analyser: AnalyserNode) => void;
}

export default function PlayerBar({ 
  gradientColors,
  audioRef: externalAudioRef,
  onAnalyserReady
}: PlayerBarProps) {
  const {
    currentTrack,
    isPlaying,
    progress,
    volume,
    likedSongs,
    setProgress,
    setCurrentTime,
    setVolume,
    setIsMuted,
    setIsFullscreenPlayer,
    playPause,
    playNext,
    playPrevious,
    toggleLike
  } = useMusicStore();
  const [localProgress, setLocalProgress] = useState(0);
  const [localVolume, setLocalVolume] = useState(volume);
  const [isMuted, setLocalIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState(0); // 0: off, 1: all, 2: one
  const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(false);
  const [isTrackMenuOpen, setIsTrackMenuOpen] = useState(false);
  const [trackMenuPosition, setTrackMenuPosition] = useState({ x: 0, y: 0 });
  const [isBuffering, setIsBuffering] = useState(false);
  const [audioFormat, setAudioFormat] = useState({
    source: 'No audio',
    output: 'No audio',
    quality: 'Unknown',
    format: 'Unknown'
  });
  const internalAudioRef = useRef<HTMLAudioElement>(null);
  const audioRef = externalAudioRef || internalAudioRef;
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Zustandのprogressをローカルに同期
  useEffect(() => {
    setLocalProgress(progress);
  }, [progress]);

  // Zustandのvolumeをローカルに同期
  useEffect(() => {
    setLocalVolume(volume);
  }, [volume]);

  // いいね機能
  const handleLike = async () => {
    if (!currentTrack) return;

    try {
      const response = await fetch('/api/music/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackId: currentTrack.id,
          isLiked: !likedSongs.includes(currentTrack.id),
        }),
      });

      if (response.ok) {
        toggleLike(currentTrack.id);
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  // プログレスバーの手動変更
  const handleProgressChange = (value: number[]) => {
    const audio = audioRef.current;
    if (audio && currentTrack && currentTrack.duration > 0) {
      const newTime = (value[0] / 100) * currentTrack.duration;
      audio.currentTime = newTime;
      setLocalProgress(value[0]);
      setProgress(value[0]);
    }
  };

  // オーディオフォーマット情報の更新
  useEffect(() => {
    if (currentTrack) {
      const sampleRate = currentTrack.sampleRate || 44100;
      const bitDepth = currentTrack.bitDepth || 16;
      const format = currentTrack.format || 'Unknown';
      const quality = currentTrack.quality || 'Unknown';
      
      setAudioFormat({
        source: `${(sampleRate / 1000).toFixed(1)}kHz / ${bitDepth}bit`,
        output: `${(sampleRate / 1000).toFixed(1)}kHz / ${bitDepth}bit`,
        quality: quality,
        format: format
      });
    }
  }, [currentTrack]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVolumeChange = (value: number[]) => {
    setLocalVolume(value[0]);
    setVolume(value[0]);
    setLocalIsMuted(value[0] === 0);
    setIsMuted(value[0] === 0);
  };

  const toggleMute = () => {
    setLocalIsMuted(!isMuted);
    setIsMuted(!isMuted);
  };

  const getVolumeIcon = () => {
    if (isMuted || localVolume === 0) return VolumeX;
    if (localVolume < 50) return Volume1;
    return Volume2;
  };

  const VolumeIcon = getVolumeIcon();

  const isLiked = currentTrack ? likedSongs.includes(currentTrack.id) : false;

  const handleTrackMenuOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setTrackMenuPosition({
      x: rect.left,
      y: rect.top - 10
    });
    setIsTrackMenuOpen(true);
  };

  // Media Session API の設定
  useEffect(() => {
    if (!currentTrack || typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    try {
      // メタデータを設定
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title || 'Unknown Track',
        artist: currentTrack.artist || 'Unknown Artist',
        album: currentTrack.album || 'Unknown Album',
        artwork: currentTrack.artwork ? [
          { src: currentTrack.artwork, sizes: '96x96', type: 'image/jpeg' },
          { src: currentTrack.artwork, sizes: '128x128', type: 'image/jpeg' },
          { src: currentTrack.artwork, sizes: '192x192', type: 'image/jpeg' },
          { src: currentTrack.artwork, sizes: '256x256', type: 'image/jpeg' },
          { src: currentTrack.artwork, sizes: '384x384', type: 'image/jpeg' },
          { src: currentTrack.artwork, sizes: '512x512', type: 'image/jpeg' },
        ] : []
      });

      // 再生状態を設定
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      // アクションハンドラーを設定
      navigator.mediaSession.setActionHandler('play', () => {
        console.log('Media Session: Play');
        playPause();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        console.log('Media Session: Pause');
        playPause();
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        console.log('Media Session: Previous track');
        playPrevious();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        console.log('Media Session: Next track');
        playNext();
      });

      navigator.mediaSession.setActionHandler('seekbackward', (details) => {
        const audio = audioRef.current;
        if (audio) {
          const skipTime = details.seekOffset || 10;
          audio.currentTime = Math.max(audio.currentTime - skipTime, 0);
        }
      });

      navigator.mediaSession.setActionHandler('seekforward', (details) => {
        const audio = audioRef.current;
        if (audio && currentTrack) {
          const skipTime = details.seekOffset || 10;
          audio.currentTime = Math.min(audio.currentTime + skipTime, currentTrack.duration);
        }
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        const audio = audioRef.current;
        if (audio && details.seekTime !== undefined) {
          audio.currentTime = details.seekTime;
        }
      });

      // 位置情報を更新
      if (currentTrack.duration > 0) {
        navigator.mediaSession.setPositionState({
          duration: currentTrack.duration,
          playbackRate: 1.0,
          position: audioRef.current?.currentTime || 0
        });
      }

      console.log('Media Session API initialized');
    } catch (error) {
      console.error('Media Session API error:', error);
    }
  }, [currentTrack, isPlaying]);

  // 再生位置の更新
  useEffect(() => {
    if (!currentTrack || typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    const updatePositionState = () => {
      const audio = audioRef.current;
      if (audio && currentTrack.duration > 0 && !isNaN(audio.currentTime)) {
        try {
          navigator.mediaSession.setPositionState({
            duration: currentTrack.duration,
            playbackRate: audio.playbackRate,
            position: audio.currentTime
          });
        } catch (error) {
          // エラーは無視（一部のブラウザでは未対応）
        }
      }
    };

    const intervalId = setInterval(updatePositionState, 1000);
    return () => clearInterval(intervalId);
  }, [currentTrack]);

  // Web Audio API の初期化
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || analyserRef.current) return;

    try {
      console.log('Initializing Web Audio API...');
      
      // AudioContext の作成
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // AnalyserNode の作成
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 4096;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      // MediaElementAudioSourceNode の作成
      sourceRef.current = audioContextRef.current.createMediaElementSource(audio);
      
      // 接続: source -> analyser -> destination
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      
      console.log('Web Audio API initialized successfully');
      
      // 親コンポーネントに通知
      if (onAnalyserReady && analyserRef.current) {
        onAnalyserReady(analyserRef.current);
      }
    } catch (error) {
      console.error('Failed to initialize Web Audio API:', error);
    }
  }, [audioRef, onAnalyserReady]);

  // オーディオ要素の制御とクリーンアップ
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    // 音楽ファイルのURLを設定
    let streamUrl: string;
    
    // サンプルトラックの場合は特別な処理
    if (currentTrack.filePath.startsWith('/sample/')) {
      console.log('Sample track detected, skipping audio playback');
      return;
    }
    
    // ファイルパスを正規化
    let normalizedPath = currentTrack.filePath.normalize('NFC');
    
    // 絶対パスの場合は相対パスに変換
    if (normalizedPath.includes('uploads\\music') || normalizedPath.includes('uploads/music')) {
      // uploads/music 以降のパスを抽出
      const musicIndex = normalizedPath.indexOf('uploads');
      if (musicIndex !== -1) {
        normalizedPath = normalizedPath.substring(musicIndex);
        // バックスラッシュをスラッシュに変換
        normalizedPath = normalizedPath.replace(/\\/g, '/');
        // uploads/music/ の部分を削除（ファイル名のみにする）
        normalizedPath = normalizedPath.replace(/^uploads\/music\//, '');
      }
    }
    
    // パスの各部分を個別にエンコード
    const pathParts = normalizedPath.split('/').filter(p => p);
    const encodedParts = pathParts.map(part => encodeURIComponent(part));
    streamUrl = `/api/music/stream/${encodedParts.join('/')}`;
    
    console.log('[PlayerBar] Setting audio source:', {
      original: currentTrack.filePath,
      normalized: normalizedPath,
      url: streamUrl
    });
    
    // 新しい曲の場合のみsrcを設定
    const fullUrl = new URL(streamUrl, window.location.origin).href;
    if (audio.src !== fullUrl) {
      // 古いオーディオをクリーンアップ
      audio.pause();
      audio.currentTime = 0;
      
      // 新しいソースを設定
      audio.src = streamUrl;
      audio.load(); // 明示的にロード
      setProgress(0);
      setLocalProgress(0);
      
      console.log('[PlayerBar] Audio source changed, cleaned up previous instance');
    }
    
    audio.volume = (isMuted ? 0 : volume) / 100;

    // クリーンアップ関数
    return () => {
      // コンポーネントがアンマウントされる時のみクリーンアップ
      // 曲が変わるだけではクリーンアップしない
    };
  }, [currentTrack]);

  // 音量制御
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = (isMuted ? 0 : volume) / 100;
    }
  }, [volume, isMuted]);

  // 再生/一時停止の制御
  useEffect(() => {
    const audio = audioRef.current;
    const audioContext = audioContextRef.current;
    if (!audio || !currentTrack) return;
    
    // サンプルトラックはスキップ
    if (currentTrack.filePath.startsWith('/sample/')) {
      return;
    }

    if (isPlaying) {
      // AudioContext を再開（ブラウザのポリシー対応）
      if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          console.log('AudioContext resumed');
        });
      }
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Audio playing successfully');
          })
          .catch(error => {
            console.error('Audio play error:', error);
            // ユーザーインタラクションが必要な場合
            if (error.name === 'NotAllowedError') {
              alert('ブラウザのポリシーにより、音声の自動再生がブロックされました。再生ボタンをもう一度クリックしてください。');
            }
          });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  // オーディオイベントリスナーと再生時間の更新
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let animationFrameId: number;
    
    // requestAnimationFrameを使用して毎フレーム更新
    const updateProgress = () => {
      if (audio && currentTrack && currentTrack.duration > 0 && !audio.paused) {
        const progressPercent = (audio.currentTime / currentTrack.duration) * 100;
        setLocalProgress(progressPercent);
        setProgress(progressPercent);
        setCurrentTime(audio.currentTime);
      }
      animationFrameId = requestAnimationFrame(updateProgress);
    };

    const handleTimeUpdate = () => {
      if (currentTrack && currentTrack.duration > 0) {
        const progressPercent = (audio.currentTime / currentTrack.duration) * 100;
        setLocalProgress(progressPercent);
        setProgress(progressPercent);
        setCurrentTime(audio.currentTime);
      }
    };

    const handlePlay = () => {
      console.log('Audio started playing');
      animationFrameId = requestAnimationFrame(updateProgress);
    };

    const handlePause = () => {
      console.log('Audio paused');
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };

    const handleEnded = () => {
      console.log('Audio ended');
      setLocalProgress(0);
      setProgress(0);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      // 次の曲に進む処理をここに追加可能
    };

    const handleLoadedMetadata = () => {
      console.log('Audio metadata loaded:', {
        duration: audio.duration,
        src: audio.src
      });
      
      // Durationが正しく取得できたら、Zustandストアを更新
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        // currentTrackのdurationを更新（必要に応じて）
        console.log('Valid duration detected:', audio.duration);
      }
    };

    const handleCanPlay = () => {
      console.log('Audio can play');
      setIsBuffering(false);
    };

    const handleWaiting = () => {
      console.log('Audio waiting (buffering)');
      setIsBuffering(true);
    };

    const handleError = (e: Event) => {
      const target = e.target as HTMLAudioElement;
      console.error('Audio error:', {
        error: target.error,
        code: target.error?.code,
        message: target.error?.message,
        src: target.src
      });
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('error', handleError);

    // 再生中の場合はアニメーションを開始
    if (!audio.paused) {
      animationFrameId = requestAnimationFrame(updateProgress);
    }

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('error', handleError);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [currentTrack]);

  if (!currentTrack) {
    return (
      <div className="h-20 glass-dark border-t border-white/10 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Select a track to start playing</div>
      </div>
    );
  }

  return (
    <div className="h-16 sm:h-20 glass-dark border-t border-white/10 px-2 sm:px-4 flex items-center justify-between gap-2 sm:gap-4">
      {/* 現在の曲情報 */}
      <div className="flex items-center space-x-2 sm:space-x-4 w-1/4 sm:w-1/4 min-w-0 flex-shrink">
        <motion.div 
          className="w-10 h-10 sm:w-14 sm:h-14 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
          whileHover={{ scale: 1.05 }}
          onClick={() => setIsFullscreenPlayer(true)}
        >
          {currentTrack.artwork ? (
            <img 
              src={currentTrack.artwork} 
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
              <span className="text-xs text-gray-400">♪</span>
            </div>
          )}
        </motion.div>
        
        <div 
          className="min-w-0 flex-1 cursor-pointer hidden sm:block"
          onClick={() => setIsFullscreenPlayer(true)}
        >
          <div className="text-white font-medium truncate hover:underline text-sm sm:text-base">
            {currentTrack.title || 'Unknown Track'}
          </div>
          <div className="text-gray-400 text-xs sm:text-sm truncate hover:underline">
            {currentTrack.artist || 'Unknown Artist'}
          </div>
        </div>
        
        <motion.button
          className={`${isLiked ? 'text-green-500' : 'text-gray-400'} hover:text-green-400 hidden sm:block`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleLike}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
        </motion.button>
      </div>

      {/* プレイヤーコントロール */}
      <div className="flex flex-col items-center space-y-1 sm:space-y-2 w-full sm:w-1/2 max-w-md flex-1">
        {/* コントロールボタン */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <motion.button
            onClick={() => setIsShuffled(!isShuffled)}
            className={`${isShuffled ? 'text-green-500' : 'text-gray-400'} hover:text-white hidden sm:block`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Shuffle className="w-3 h-3 sm:w-4 sm:h-4" />
          </motion.button>
          
          <motion.button
            onClick={playPrevious}
            className="text-gray-400 hover:text-white"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.button>
          
          <motion.button
            onClick={playPause}
            className="w-8 h-8 sm:w-10 sm:h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 play-pulse relative"
            whileTap={{ scale: 0.95 }}
          >
            {isBuffering ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
            ) : isPlaying ? (
              <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
            )}
          </motion.button>
          
          <motion.button
            onClick={playNext}
            className="text-gray-400 hover:text-white"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.button>
          
          <motion.button
            onClick={() => setRepeatMode((prev) => (prev + 1) % 3)}
            className={`${repeatMode > 0 ? 'text-green-500' : 'text-gray-400'} hover:text-white relative hidden sm:block`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Repeat className="w-3 h-3 sm:w-4 sm:h-4" />
            {repeatMode === 2 && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
            )}
          </motion.button>
        </div>

        {/* プログレスバー */}
        <div className="flex items-center space-x-2 sm:space-x-3 w-full">
          <span className="text-xs text-gray-400 w-8 sm:w-10 text-right">
            {formatTime(audioRef.current?.currentTime || 0)}
          </span>
          
          <Slider.Root
            className="relative flex items-center select-none touch-none w-full h-8 sm:h-5"
            style={{ touchAction: 'none' }}
            value={[localProgress]}
            onValueChange={handleProgressChange}
            max={100}
            step={1}
          >
            <Slider.Track className="bg-gray-600 relative grow rounded-full h-1">
              <Slider.Range className="absolute bg-white rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-4 h-4 sm:w-3 sm:h-3 bg-white rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Progress"
            />
          </Slider.Root>
          
          <span className="text-xs text-gray-400 w-8 sm:w-10">
            {formatTime(currentTrack?.duration || 0)}
          </span>
        </div>
      </div>

      {/* 右側コントロール */}
      <div className="flex items-center space-x-2 sm:space-x-4 w-auto sm:w-1/4 justify-end flex-shrink-0">
        {/* オーディオ品質表示 - デスクトップのみ */}
        <div className="hidden xl:flex flex-col text-xs text-gray-400">
          <div className="flex items-center space-x-2">
            <span>Source: {audioFormat.source}</span>
            {currentTrack?.isHighRes && (
              <span className="px-1 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                Hi-Res
              </span>
            )}
          </div>
          <div>Output: {audioFormat.output}</div>
          <div className="text-green-400">{audioFormat.format} • {audioFormat.quality}</div>
        </div>

        {/* ビジュアライザー - タブレット以上 */}
        <div className="hidden md:block">
          <AudioVisualizer 
            isPlaying={isPlaying} 
            analyser={analyserRef.current}
            className="w-12 h-6 sm:w-16 sm:h-8"
            barCount={32}
            height={32}
            backgroundColor="black"
            currentTrack={currentTrack}
            onPlayPause={playPause}
            progress={localProgress}
            onProgressChange={handleProgressChange}
            currentTime={audioRef.current?.currentTime || 0}
            duration={currentTrack?.duration || 0}
            volume={localVolume}
            onVolumeChange={handleVolumeChange}
          />
        </div>

        {/* ボリュームコントロール - タブレット以上 */}
        <div className="hidden md:flex items-center space-x-2">
          <motion.button
            onClick={toggleMute}
            className="text-gray-400 hover:text-white"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <VolumeIcon className="w-4 h-4" />
          </motion.button>
          
          <Slider.Root
            className="relative flex items-center select-none touch-none w-16 sm:w-20 h-5"
            style={{ touchAction: 'none' }}
            value={[isMuted ? 0 : localVolume]}
            onValueChange={handleVolumeChange}
            max={100}
            step={1}
          >
            <Slider.Track className="bg-gray-600 relative grow rounded-full h-1">
              <Slider.Range className="absolute bg-white rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-3 h-3 bg-white rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Volume"
            />
          </Slider.Root>
        </div>

        {/* デバイス制御ボタン */}
        <motion.button
          onClick={() => setIsDeviceMenuOpen(!isDeviceMenuOpen)}
          className="text-gray-400 hover:text-white hidden sm:block"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="デバイス制御"
        >
          <Monitor className="w-4 h-4" />
        </motion.button>

        {/* メニューボタン */}
        <motion.button
          onClick={handleTrackMenuOpen}
          className="text-gray-400 hover:text-white"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <MoreHorizontal className="w-4 h-4" />
        </motion.button>
      </div>

      {/* デバイス制御メニュー */}
      <DeviceControl 
        isOpen={isDeviceMenuOpen}
        onClose={() => setIsDeviceMenuOpen(false)}
      />

      {/* トラックメニュー */}
      {currentTrack && (
        <TrackMenu
          track={currentTrack}
          isOpen={isTrackMenuOpen}
          onClose={() => setIsTrackMenuOpen(false)}
          position={trackMenuPosition}
          onEdit={() => {
            // TODO: 編集モーダルを開く
            setIsTrackMenuOpen(false);
          }}
          onDelete={() => {
            // トラック削除後、再生を停止
            playPause();
            setIsTrackMenuOpen(false);
          }}
          onAddToPlaylist={() => {
            // TODO: プレイリストに追加
            setIsTrackMenuOpen(false);
          }}
        />
      )}
    </div>
  );
}