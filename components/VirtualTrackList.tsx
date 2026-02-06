'use client';

import React, { useCallback, useMemo } from 'react';
// @ts-ignore - react-window type definitions issue
import ReactWindow from 'react-window';
import TrackListItem from './TrackListItem';

const { FixedSizeList } = ReactWindow;

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  filePath: string;
  format?: string;
  sampleRate?: number;
  bitDepth?: number;
  bitrate?: number;
  isHighRes?: boolean;
  quality?: string;
  fileSize?: number;
  fileName?: string;
  artwork?: string;
}

interface VirtualTrackListProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  likedSongs: string[];
  onTrackClick: (track: Track) => void;
  onLikeClick: (e: React.MouseEvent, trackId: string) => void;
  onEditClick: (e: React.MouseEvent, track: Track) => void;
  onMenuClick: (e: React.MouseEvent, trackId: string) => void;
  height: number;
}

const VirtualTrackList = React.memo(({
  tracks,
  currentTrack,
  isPlaying,
  likedSongs,
  onTrackClick,
  onLikeClick,
  onEditClick,
  onMenuClick,
  height
}: VirtualTrackListProps) => {
  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const formatFileSize = useCallback((bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  }, []);

  const getQualityColor = useCallback((quality?: string) => {
    if (!quality) return 'text-gray-400';
    if (quality.includes('Hi-Res')) return 'text-purple-400';
    if (quality.includes('Studio')) return 'text-blue-400';
    if (quality.includes('CD')) return 'text-green-400';
    return 'text-gray-400';
  }, []);

  // 行のレンダリング関数
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const track = tracks[index];
    const isCurrentTrack = currentTrack?.id === track.id;
    const isLiked = likedSongs.includes(track.id);

    return (
      <TrackListItem
        track={track}
        index={index}
        isCurrentTrack={isCurrentTrack}
        isPlaying={isPlaying}
        isLiked={isLiked}
        onTrackClick={onTrackClick}
        onLikeClick={onLikeClick}
        onEditClick={onEditClick}
        onMenuClick={onMenuClick}
        formatDuration={formatDuration}
        formatFileSize={formatFileSize}
        getQualityColor={getQualityColor}
        style={style}
      />
    );
  }, [
    tracks,
    currentTrack,
    isPlaying,
    likedSongs,
    onTrackClick,
    onLikeClick,
    onEditClick,
    onMenuClick,
    formatDuration,
    formatFileSize,
    getQualityColor
  ]);

  // 現在再生中のトラックのインデックスを取得
  const currentIndex = useMemo(() => {
    if (!currentTrack) return -1;
    return tracks.findIndex(t => t.id === currentTrack.id);
  }, [tracks, currentTrack]);

  return (
    <FixedSizeList
      height={height}
      itemCount={tracks.length}
      itemSize={80}
      width="100%"
      overscanCount={5}
      initialScrollOffset={currentIndex > 0 ? currentIndex * 80 : 0}
      className="scrollbar-thin"
    >
      {Row}
    </FixedSizeList>
  );
});

VirtualTrackList.displayName = 'VirtualTrackList';

export default VirtualTrackList;
