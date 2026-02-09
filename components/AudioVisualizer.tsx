'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, X } from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';

interface AudioVisualizerProps {
  isPlaying: boolean;
  analyser?: AnalyserNode | null;
  className?: string;
  barCount?: number;
  height?: number;
  backgroundColor?: 'black' | 'gray' | 'white';
  currentTrack?: any;
  onPlayPause?: () => void;
  progress?: number;
  onProgressChange?: (value: number[]) => void;
  currentTime?: number;
  duration?: number;
  volume?: number;
  onVolumeChange?: (value: number[]) => void;
}

export default function AudioVisualizer({ 
  isPlaying, 
  analyser,
  className = "w-16 h-8",
  barCount = 64,
  height = 32,
  backgroundColor = 'black',
  currentTrack,
  onPlayPause,
  progress = 0,
  onProgressChange,
  currentTime = 0,
  duration = 0,
  volume = 75,
  onVolumeChange
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const previousDataRef = useRef<Float32Array | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // データ配列の初期化
  useEffect(() => {
    if (analyser && !dataArrayRef.current) {
      const bufferLength = analyser.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength) as Uint8Array;
      previousDataRef.current = new Float32Array(barCount);
      console.log('Data arrays initialized', { bufferLength, barCount });
    }
  }, [analyser, barCount]);

  // 描画関数
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const dataArray = dataArrayRef.current;
    const previousData = previousDataRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスサイズの取得
    const width = canvas.width;
    const height = canvas.height;
    
    // 全画面時はバー数を増やすが、パフォーマンスを考慮して制限
    const effectiveBarCount = isFullscreen ? Math.min(128, Math.floor(width / 4)) : barCount;
    const barWidth = Math.max(2, width / effectiveBarCount - 2);
    const barSpacing = 2;

    // 背景色を設定
    let bgColor = 'rgba(0, 0, 0, 1)';
    if (backgroundColor === 'gray') bgColor = 'rgba(17, 24, 39, 1)';
    if (backgroundColor === 'white') bgColor = 'rgba(255, 255, 255, 1)';
    
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // previousDataの配列サイズを調整
    if (!previousData || previousData.length !== effectiveBarCount) {
      previousDataRef.current = new Float32Array(effectiveBarCount);
    }
    const currentPreviousData = previousDataRef.current!;

    if (!analyser || !dataArray) {
      // フォールバック: 静的な小さいバー
      for (let i = 0; i < effectiveBarCount; i++) {
        const x = i * (barWidth + barSpacing);
        const barHeight = 4;
        const y = height - barHeight;
        
        ctx.fillStyle = backgroundColor === 'white' ? '#000000' : '#FFFFFF';
        ctx.fillRect(x, y, barWidth, barHeight);
      }
    } else {
      // 周波数データを取得
      // @ts-ignore
      analyser.getByteFrequencyData(dataArray);

      // 周波数データをバーの数に合わせてサンプリング
      const samplesPerBar = Math.floor(dataArray.length / effectiveBarCount);

      for (let i = 0; i < effectiveBarCount; i++) {
        // 各バーに対応する周波数範囲の平均値を計算
        let sum = 0;
        const startIndex = i * samplesPerBar;
        const endIndex = Math.min(startIndex + samplesPerBar, dataArray.length);
        
        for (let j = startIndex; j < endIndex; j++) {
          sum += dataArray[j];
        }
        
        const average = sum / (endIndex - startIndex);
        const normalizedValue = average / 255;
        
        // より滑らかな線形補間
        const lerpFactor = 0.3;
        const currentValue = currentPreviousData[i] || 0;
        const diff = normalizedValue - currentValue;
        currentPreviousData[i] = currentValue + diff * lerpFactor;
        
        // バーの高さを計算
        const minHeight = 4;
        const targetHeight = currentPreviousData[i] * height * 0.9;
        const barHeight = Math.max(targetHeight, minHeight);
        
        // バーを描画
        const x = i * (barWidth + barSpacing);
        const y = height - barHeight;
        
        ctx.fillStyle = backgroundColor === 'white' ? '#000000' : '#FFFFFF';
        ctx.fillRect(x, y, barWidth, barHeight);
      }
    }

    // 次のフレームをリクエスト（30FPSに制限してパフォーマンス向上）
    if (isPlaying) {
      setTimeout(() => {
        animationRef.current = requestAnimationFrame(draw);
      }, 1000 / 30); // 30FPS
    }
  }, [isPlaying, barCount, backgroundColor, isFullscreen, analyser]);

  // 角丸矩形を描画するヘルパー関数は削除（シンプルな矩形を使用）

  // 時間フォーマット関数
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 全画面表示の切り替え
  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!isFullscreen) {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen toggle failed:', error);
    }
  }, [isFullscreen]);

  // 全画面状態の監視
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // キャンバスサイズの調整
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      if (isFullscreen) {
        // 全画面時は画面サイズに合わせる（コントロールバーの高さを引く）
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - 120; // コントロールバー分を引く
      } else {
        // 通常時は指定されたサイズ
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [isFullscreen]);

  // アニメーションの開始/停止
  useEffect(() => {
    if (isPlaying && analyser) {
      draw();
    } else if (analyser) {
      // 停止中でも静的なビジュアライザーを表示
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;
          const effectiveBarCount = isFullscreen ? Math.min(128, Math.floor(width / 4)) : barCount;
          const barWidth = Math.max(2, width / effectiveBarCount - 2);
          const barSpacing = 2;
          
          // 背景色
          let bgColor = 'rgba(0, 0, 0, 1)';
          if (backgroundColor === 'gray') bgColor = 'rgba(17, 24, 39, 1)';
          if (backgroundColor === 'white') bgColor = 'rgba(255, 255, 255, 1)';
          
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, width, height);
          
          // 静的な小さいバーを表示
          for (let i = 0; i < effectiveBarCount; i++) {
            const x = i * (barWidth + barSpacing);
            const barHeight = 4;
            const y = height - barHeight;
            
            ctx.fillStyle = backgroundColor === 'white' ? '#000000' : '#FFFFFF';
            ctx.fillRect(x, y, barWidth, barHeight);
          }
        }
      }
      
      // 前回のデータをリセット
      if (previousDataRef.current) {
        previousDataRef.current.fill(0);
      }
    } else {
      // アニメーションを停止
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, draw, analyser, barCount, backgroundColor, isFullscreen]);

  return (
    <div 
      ref={containerRef}
      className={`${isFullscreen ? 'fixed inset-0 z-50 bg-black' : className}`}
    >
      <canvas
        ref={canvasRef}
        className="cursor-pointer w-full h-full"
        onClick={toggleFullscreen}
        style={{
          width: isFullscreen ? '100vw' : '100%',
          height: isFullscreen ? 'calc(100vh - 120px)' : height,
          backgroundColor: backgroundColor === 'black' ? '#000000' : backgroundColor === 'gray' ? '#111827' : '#FFFFFF',
        }}
      />
      
      {/* 全画面時のコントロールバー */}
      {isFullscreen && currentTrack && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg p-6">
          {/* 曲情報 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center">
                <span className="text-2xl">♪</span>
              </div>
              <div>
                <div className="text-xl font-bold text-white">{currentTrack.title || 'Unknown Track'}</div>
                <div className="text-gray-400">{currentTrack.artist || 'Unknown Artist'}</div>
              </div>
            </div>
            
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-gray-300 p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {/* プログレスバー */}
          <div className="flex items-center space-x-4 mb-4">
            <span className="text-sm text-gray-400 w-12 text-right">
              {formatTime(currentTime)}
            </span>
            
            <Slider.Root
              className="relative flex items-center select-none touch-none flex-1 h-5"
              value={[progress]}
              onValueChange={onProgressChange}
              max={100}
              step={1}
            >
              <Slider.Track className="bg-gray-600 relative grow rounded-full h-1">
                <Slider.Range className="absolute bg-white rounded-full h-full" />
              </Slider.Track>
              <Slider.Thumb
                className="block w-4 h-4 bg-white rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Progress"
              />
            </Slider.Root>
            
            <span className="text-sm text-gray-400 w-12">
              {formatTime(duration)}
            </span>
          </div>
          
          {/* コントロールボタン */}
          <div className="flex items-center justify-center space-x-6">
            <button className="text-gray-400 hover:text-white">
              <SkipBack className="w-6 h-6" />
            </button>
            
            <button
              onClick={onPlayPause}
              className="w-14 h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7" />
              ) : (
                <Play className="w-7 h-7 ml-1" />
              )}
            </button>
            
            <button className="text-gray-400 hover:text-white">
              <SkipForward className="w-6 h-6" />
            </button>
            
            <div className="flex items-center space-x-2 ml-8">
              <Volume2 className="w-5 h-5 text-gray-400" />
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
      )}
    </div>
  );
}


