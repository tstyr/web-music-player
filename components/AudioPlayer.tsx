'use client';

import { useState, useRef, useEffect } from 'react';

interface AudioPlayerProps {
  src: string;
  onLoadedMetadata?: (metadata: AudioMetadata) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  volume: number;
  isPlaying: boolean;
}

interface AudioMetadata {
  duration: number;
  sampleRate: number;
  bitDepth: number;
  channels: number;
  bitrate: number;
  format: string;
}

export default function AudioPlayer({
  src,
  onLoadedMetadata,
  onTimeUpdate,
  onEnded,
  volume,
  isPlaying
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [audioMetadata, setAudioMetadata] = useState<AudioMetadata | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      // Web Audio APIでより詳細な情報を取得
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const audioContext = audioContextRef.current;
      
      // 基本的なメタデータ
      const metadata: AudioMetadata = {
        duration: audio.duration,
        sampleRate: audioContext.sampleRate,
        bitDepth: 16, // デフォルト値（実際のファイルから取得するにはサーバーサイドが必要）
        channels: 2, // ステレオデフォルト
        bitrate: 0, // 計算で求める
        format: src.split('.').pop()?.toUpperCase() || 'UNKNOWN'
      };

      // ビットレートの推定
      if (audio.duration > 0) {
        fetch(src, { method: 'HEAD' })
          .then(response => {
            const contentLength = response.headers.get('content-length');
            if (contentLength) {
              const fileSizeBytes = parseInt(contentLength);
              const bitrate = Math.round((fileSizeBytes * 8) / audio.duration / 1000);
              metadata.bitrate = bitrate;
              setAudioMetadata(metadata);
              onLoadedMetadata?.(metadata);
            }
          })
          .catch(() => {
            setAudioMetadata(metadata);
            onLoadedMetadata?.(metadata);
          });
      } else {
        setAudioMetadata(metadata);
        onLoadedMetadata?.(metadata);
      }

      // アナライザーの設定
      if (!analyserRef.current) {
        const source = audioContext.createMediaElementSource(audio);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        analyserRef.current = analyser;
      }
    };

    const handleTimeUpdate = () => {
      onTimeUpdate?.(audio.currentTime, audio.duration);
    };

    const handleEnded = () => {
      onEnded?.();
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src, onLoadedMetadata, onTimeUpdate, onEnded]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  const getAudioQualityLabel = (metadata: AudioMetadata) => {
    const { sampleRate, bitDepth, format } = metadata;
    
    if (sampleRate >= 192000) return 'Hi-Res (192kHz+)';
    if (sampleRate >= 96000) return 'Hi-Res (96kHz)';
    if (sampleRate >= 48000) return 'Studio Quality';
    if (sampleRate >= 44100) return 'CD Quality';
    return 'Standard Quality';
  };

  const getFormatInfo = (metadata: AudioMetadata) => {
    const { sampleRate, bitDepth, format, bitrate } = metadata;
    return {
      source: `${(sampleRate / 1000).toFixed(1)}kHz / ${bitDepth}bit`,
      format: format,
      bitrate: bitrate > 0 ? `${bitrate}kbps` : 'Unknown',
      quality: getAudioQualityLabel(metadata)
    };
  };

  return (
    <div className="hidden">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        crossOrigin="anonymous"
      />
      {audioMetadata && (
        <div className="audio-metadata" data-metadata={JSON.stringify(getFormatInfo(audioMetadata))} />
      )}
    </div>
  );
}