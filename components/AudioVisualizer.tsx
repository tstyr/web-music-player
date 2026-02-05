'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  audioElement?: HTMLAudioElement | null;
  className?: string;
  barCount?: number;
  height?: number;
}

export default function AudioVisualizer({ 
  isPlaying, 
  audioElement,
  className = "w-16 h-8",
  barCount = 32,
  height = 32
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const previousDataRef = useRef<Float32Array | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 線形補間関数
  const lerp = (start: number, end: number, factor: number): number => {
    return start + (end - start) * factor;
  };

  // Web Audio API の初期化
  const initializeAudioContext = useCallback(async () => {
    if (!audioElement || audioContextRef.current) return;

    try {
      console.log('Initializing audio context for visualizer...');
      
      // AudioContext の作成
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // AnalyserNode の作成と設定
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 4096; // 高精細な周波数解析
      analyserRef.current.smoothingTimeConstant = 0.8; // スムージング
      
      // MediaElementAudioSourceNode の作成
      sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
      
      // 接続: source -> analyser -> destination
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      
      // データ配列の初期化
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      previousDataRef.current = new Float32Array(barCount);
      
      console.log('Audio context initialized successfully', {
        bufferLength,
        barCount,
        audioElement: !!audioElement
      });
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  }, [audioElement, barCount]);

  // 描画関数
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    const previousData = previousDataRef.current;

    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスサイズの取得
    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / barCount;

    // キャンバスをクリア
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.clearRect(0, 0, width, height);

    if (!analyser || !dataArray || !previousData) {
      // フォールバック: ランダムなビジュアライザー
      for (let i = 0; i < barCount; i++) {
        const randomHeight = Math.random() * height * 0.5;
        const x = i * barWidth;
        const y = height - randomHeight;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(x, y, barWidth - 1, randomHeight);
      }
    } else {
      // 周波数データを取得
      analyser.getByteFrequencyData(dataArray);

      // 周波数データをバーの数に合わせてサンプリング
      const samplesPerBar = Math.floor(dataArray.length / barCount);

      for (let i = 0; i < barCount; i++) {
        // 各バーに対応する周波数範囲の平均値を計算
        let sum = 0;
        const startIndex = i * samplesPerBar;
        const endIndex = Math.min(startIndex + samplesPerBar, dataArray.length);
        
        for (let j = startIndex; j < endIndex; j++) {
          sum += dataArray[j];
        }
        
        const average = sum / (endIndex - startIndex);
        const normalizedValue = average / 255; // 0-1に正規化
        
        // 線形補間でスムーズな動きを実現
        const lerpFactor = 0.15; // 補間の強さ（小さいほどスムーズ）
        previousData[i] = lerp(previousData[i], normalizedValue, lerpFactor);
        
        // バーの高さを計算
        const barHeight = previousData[i] * height * 0.9; // 90%の高さまで使用
        
        // バーを描画
        const x = i * barWidth;
        const y = height - barHeight;
        
        ctx.fillStyle = '#FFFFFF'; // 白色
        ctx.fillRect(x, y, barWidth - 1, barHeight); // -1 でバー間にスペース
      }
    }

    // 次のフレームをリクエスト
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(draw);
    }
  }, [isPlaying, barCount]);

  // 全画面表示の切り替え
  const toggleFullscreen = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      if (!isFullscreen) {
        await canvas.requestFullscreen();
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
        // 全画面時は画面サイズに合わせる
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      } else {
        // 通常時は指定されたサイズ
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        }
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [isFullscreen]);

  // オーディオコンテキストの初期化
  useEffect(() => {
    console.log('AudioVisualizer useEffect triggered:', { 
      audioElement: !!audioElement, 
      isPlaying,
      hasAnalyser: !!analyserRef.current 
    });
    
    if (audioElement && isPlaying && !analyserRef.current) {
      initializeAudioContext();
    }
  }, [audioElement, isPlaying, initializeAudioContext]);

  // アニメーションの開始/停止
  useEffect(() => {
    if (isPlaying && analyserRef.current) {
      // AudioContext の再開（ブラウザのポリシー対応）
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      
      draw();
    } else {
      // アニメーションを停止
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // キャンバスをクリア
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      
      // 前回のデータをリセット
      if (previousDataRef.current) {
        previousDataRef.current.fill(0);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, draw]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`${className} cursor-pointer ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}
      onClick={toggleFullscreen}
      style={{
        width: isFullscreen ? '100vw' : undefined,
        height: isFullscreen ? '100vh' : height,
      }}
    />
  );
}