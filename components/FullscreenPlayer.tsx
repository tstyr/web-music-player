'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Play, Pause, SkipBack, SkipForward, Heart, Volume2 } from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';
import { useMusicStore } from '@/lib/store';
import AudioVisualizer from './AudioVisualizer';

interface FullscreenPlayerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  analyser: AnalyserNode | null;
  onProgressChange: (value: number[]) => void;
  onVolumeChange: (value: number[]) => void;
}

export default function FullscreenPlayer({
  audioRef,
  analyser,
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
      <div className="relative h-full flex flex-col items-center justify-center p-8">
        {/* 閉じるボタン */}
        <button
          onClick={() => setIsFullscreenPlayer(false)}
          className="absolute top-6 right-6 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all"
        >
          <X className="w-8 h-8" />
        </button>

        {/* アルバムアートとビジュアライザー */}
        <div className="flex-1 flex items-center justify-center w-full max-w-4xl">
          <div className="w-full space-y-8">
            {/* アルバムアート */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="aspect-square max-w-md mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-2xl overflow-hidden"
            >
              {currentTrack.artwork ? (
                <img
                  src={currentTrack.artwork}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-9xl">♪</span>
                </div>
              )}
            </motion.div>

            {/* ビジュアライザー */}
            <div className="h-32 bg-black/30 rounded-xl overflow-hidden backdrop-blur-sm">
              <AudioVisualizer
                isPlaying={isPlaying}
                analyser={analyser}
                className="w-full h-full"
                barCount={256}
                height={128}
                backgroundColor="black"
                currentTrack={currentTrack}
                onPlayPause={playPause}
                progress={progress}
                onProgressChange={onProgressChange}
                currentTime={currentTime}
                duration={currentTrack.duration}
                volume={volume}
                onVolumeChange={onVolumeChange}
              />
            </div>
          </div>
        </div>

        {/* 曲情報とコントロール */}
        <div className="w-full max-w-2xl space-y-6">
          {/* 曲情報 */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-white truncate">
              {currentTrack.title}
            </h1>
            <p className="text-xl text-gray-300 truncate">
              {currentTrack.artist}
            </p>
            {currentTrack.album && (
              <p className="text-lg text-gray-400 truncate">
                {currentTrack.album}
              </p>
            )}
          </div>

          {/* プログレスバー */}
          <div className="space-y-2">
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

          {/* コントロールボタン */}
          <div className="flex items-center justify-center space-x-8">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => toggleLike(currentTrack.id)}
              className={`${isLiked ? 'text-green-500' : 'text-gray-400'} hover:text-green-400 transition-colors`}
            >
              <Heart className={`w-7 h-7 ${isLiked ? 'fill-current' : ''}`} />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <SkipBack className="w-8 h-8" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={playPause}
              className="w-20 h-20 bg-white text-black rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-10 h-10" />
              ) : (
                <Play className="w-10 h-10 ml-1" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <SkipForward className="w-8 h-8" />
            </motion.button>

            <div className="flex items-center space-x-3">
              <Volume2 className="w-6 h-6 text-gray-400" />
              <Slider.Root
                className="relative flex items-center select-none touch-none w-24 h-5"
                value={[volume]}
                onValueChange={onVolumeChange}
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
          </div>
        </div>
      </div>
    </motion.div>
  );
}
