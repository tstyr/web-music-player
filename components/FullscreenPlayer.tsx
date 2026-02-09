'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Play, Pause, SkipBack, SkipForward, Heart, Volume2, Maximize2 } from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';
import { useMusicStore } from '@/lib/store';

interface FullscreenPlayerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  onProgressChange: (value: number[]) => void;
  onVolumeChange: (value: number[]) => void;
}

export default function FullscreenPlayer({
  audioRef,
  onProgressChange,
  onVolumeChange
}: FullscreenPlayerProps) {
  const {
    currentTrack,
    isPlaying,
    progress,
    currentTime,
    volume,
    isFullscreenPlayer,
    likedSongs,
    setIsFullscreenPlayer,
    playPause,
    toggleLike
  } = useMusicStore();

  const [isArtworkFullscreen, setIsArtworkFullscreen] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isFullscreenPlayer || !currentTrack) return null;

  const isLiked = likedSongs.includes(currentTrack.id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-black to-gray-900"
      style={{
        backgroundImage: currentTrack.artwork 
          ? `url(${currentTrack.artwork})` 
          : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* ぼかしオーバーレイ */}
      <div className="absolute inset-0 backdrop-blur-3xl bg-black/70" />
      
      {/* コンテンツ */}
      <div className="relative h-full flex flex-col items-center justify-center p-4 sm:p-8" style={{ height: '100dvh' }}>
        {/* 閉じるボタン */}
        <button
          onClick={() => setIsFullscreenPlayer(false)}
          className="absolute top-4 sm:top-6 right-4 sm:right-6 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all z-10"
        >
          <X className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>

        {/* アルバムアート */}
        <div className="flex-1 flex items-center justify-center w-full max-w-4xl">
          <div className="w-full space-y-4 sm:space-y-8">
            {/* アルバムアート - object-fit: contain で途切れないように */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative aspect-square max-w-md mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-2xl overflow-hidden group"
            >
              {currentTrack.artwork ? (
                <>
                  <img
                    src={currentTrack.artwork}
                    alt={currentTrack.title}
                    className="w-full h-full object-contain bg-black"
                  />
                  {/* 全画面表示ボタン */}
                  <button
                    onClick={() => setIsArtworkFullscreen(true)}
                    className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                    title="全画面表示"
                  >
                    <Maximize2 className="w-5 h-5 text-white" />
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-9xl">♪</span>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* 曲情報とコントロール */}
        <div className="w-full max-w-2xl space-y-4 sm:space-y-6 pb-safe">
          {/* 曲情報 */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-4xl font-bold text-white truncate px-4">
              {currentTrack.title}
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 truncate px-4">
              {currentTrack.artist}
            </p>
            {currentTrack.album && (
              <p className="text-base sm:text-lg text-gray-400 truncate px-4">
                {currentTrack.album}
              </p>
            )}
          </div>

          {/* プログレスバー */}
          <div className="space-y-2 px-4">
            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-5"
              value={[progress]}
              onValueChange={onProgressChange}
              max={100}
              step={1}
            >
              <Slider.Track className="bg-gray-600 relative grow rounded-full h-1">
                <Slider.Range className="absolute bg-white rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb
                className="block w-4 h-4 bg-white rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white shadow-lg"
                aria-label="Progress"
              />
            </Slider.Root>
            
            <div className="flex justify-between text-sm text-gray-400">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(currentTrack.duration)}</span>
            </div>
          </div>

          {/* コントロールボタン - 完全中央揃え */}
          <div className="w-full max-w-2xl mx-auto">
            {/* メインコントロール - 中央 */}
            <div className="flex items-center justify-center space-x-4 sm:space-x-8 mb-4 sm:mb-6">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => toggleLike(currentTrack.id)}
                className={`${isLiked ? 'text-green-500' : 'text-gray-400'} hover:text-green-400 transition-colors`}
              >
                <Heart className={`w-6 h-6 sm:w-7 sm:h-7 ${isLiked ? 'fill-current' : ''}`} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <SkipBack className="w-6 h-6 sm:w-8 sm:h-8" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={playPause}
                className="w-16 h-16 sm:w-20 sm:h-20 bg-white text-black rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-transform"
              >
                {isPlaying ? (
                  <Pause className="w-8 h-8 sm:w-10 sm:h-10" />
                ) : (
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1" />
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <SkipForward className="w-6 h-6 sm:w-8 sm:h-8" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="text-gray-400 hover:text-white transition-colors hidden sm:block"
              >
                <Heart className="w-6 h-6 sm:w-7 sm:h-7 opacity-0" />
              </motion.button>
            </div>

            {/* 音量コントロール - 中央 */}
            <div className="flex items-center justify-center space-x-3 px-4">
              <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 flex-shrink-0" />
              <Slider.Root
                className="relative flex items-center select-none touch-none w-32 sm:w-48 h-8"
                value={[volume]}
                onValueChange={onVolumeChange}
                max={100}
                step={1}
                style={{ touchAction: 'none' }}
              >
                <Slider.Track className="bg-gray-600 relative grow rounded-full h-1">
                  <Slider.Range className="absolute bg-white rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb
                  className="block w-4 h-4 bg-white rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white shadow-lg cursor-pointer"
                  aria-label="Volume"
                />
              </Slider.Root>
              <span className="text-sm text-gray-400 w-10 text-right">{volume}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* アートワーク全画面表示モーダル */}
      {isArtworkFullscreen && currentTrack.artwork && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black flex items-center justify-center p-4"
          onClick={() => setIsArtworkFullscreen(false)}
        >
          <button
            onClick={() => setIsArtworkFullscreen(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all z-10"
          >
            <X className="w-8 h-8" />
          </button>
          <img
            src={currentTrack.artwork}
            alt={currentTrack.title}
            className="max-w-full max-h-full object-contain"
          />
        </motion.div>
      )}
    </motion.div>
  );
}