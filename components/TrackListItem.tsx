'use client';

import React from 'react';
import { Play, Pause, Heart, Edit2, MoreHorizontal, Music2 } from 'lucide-react';

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

interface TrackListItemProps {
  track: Track;
  index: number;
  isCurrentTrack: boolean;
  isPlaying: boolean;
  isLiked: boolean;
  onTrackClick: (track: Track) => void;
  onLikeClick: (e: React.MouseEvent, trackId: string) => void;
  onEditClick: (e: React.MouseEvent, track: Track) => void;
  onMenuClick: (e: React.MouseEvent, trackId: string) => void;
  formatDuration: (seconds: number) => string;
  formatFileSize: (bytes?: number) => string;
  getQualityColor: (quality?: string) => string;
  style?: React.CSSProperties;
}

const TrackListItem = React.memo(({
  track,
  index,
  isCurrentTrack,
  isPlaying,
  isLiked,
  onTrackClick,
  onLikeClick,
  onEditClick,
  onMenuClick,
  formatDuration,
  formatFileSize,
  getQualityColor,
  style
}: TrackListItemProps) => {
  const isTrackPlaying = isCurrentTrack && isPlaying;

  return (
    <div
      className="p-4 hover:bg-white/5 cursor-pointer group transition-colors border-b border-white/5"
      onClick={() => onTrackClick(track)}
    >
      <div className="grid grid-cols-12 gap-4 items-center">
        <div className={`col-span-1 ${isCurrentTrack ? 'text-green-500' : 'text-gray-400'} group-hover:hidden`}>
          {isTrackPlaying ? '♪' : index + 1}
        </div>
        <div className="col-span-1 hidden group-hover:block">
          {isTrackPlaying ? (
            <Pause className="w-4 h-4 text-green-500" />
          ) : (
            <Play className="w-4 h-4 text-white" />
          )}
        </div>
        
        <div className="col-span-4 flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center relative overflow-hidden flex-shrink-0">
            {track.artwork ? (
              <img 
                src={track.artwork} 
                alt={track.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <Music2 className="w-4 h-4" />
            )}
            {track.isHighRes && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full"></div>
            )}
          </div>
          <div className="min-w-0">
            <div className={`font-medium truncate ${isCurrentTrack ? 'text-green-500' : 'text-white'}`}>
              {track.title}
            </div>
            <div className="text-sm text-gray-400 truncate">{track.artist}</div>
          </div>
        </div>
        
        <div className="col-span-2 text-gray-400 text-sm truncate">
          {track.album}
        </div>
        
        <div className="col-span-2">
          <div className={`text-sm ${getQualityColor(track.quality)}`}>
            {track.quality || 'Unknown'}
          </div>
          {track.sampleRate && track.bitDepth && (
            <div className="text-xs text-gray-500">
              {(track.sampleRate / 1000).toFixed(1)}kHz/{track.bitDepth}bit
            </div>
          )}
        </div>
        
        <div className="col-span-2 text-gray-400 text-sm">
          <div>{formatDuration(track.duration)}</div>
          {track.fileSize && (
            <div className="text-xs text-gray-500">
              {formatFileSize(track.fileSize)}
            </div>
          )}
        </div>
        
        <div className="col-span-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => onLikeClick(e, track.id)}
              className={`${isLiked ? 'text-green-500' : 'text-gray-400'} hover:text-green-400 cursor-pointer`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={(e) => onEditClick(e, track)}
              className="text-gray-400 hover:text-white cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => onMenuClick(e, track.id)}
              className="text-gray-400 hover:text-white cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // カスタム比較関数で不要な再レンダリングを防ぐ
  return (
    prevProps.track.id === nextProps.track.id &&
    prevProps.isCurrentTrack === nextProps.isCurrentTrack &&
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.isLiked === nextProps.isLiked &&
    prevProps.index === nextProps.index
  );
});

TrackListItem.displayName = 'TrackListItem';

export default TrackListItem;
