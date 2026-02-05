'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Play, Pause, Heart, MoreHorizontal, Music2, Headphones, Edit2, Filter } from 'lucide-react';
import ServerDashboard from './ServerDashboard';
import UploadZone from './UploadZone';
import AudioVisualizer from './AudioVisualizer';
import EditTrackModal from './EditTrackModal';
import TrackMenu from './TrackMenu';
import { useMusicStore } from '@/lib/store';
import toast from 'react-hot-toast';

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  format?: string;
  sampleRate?: number;
  bitDepth?: number;
  bitrate?: number;
  isHighRes?: boolean;
  quality?: string;
  fileSize?: number;
  fileName?: string;
}

interface MainContentProps {
  onTrackSelect: (track: Track) => void;
  musicFolder: string | null;
  analyser?: AnalyserNode | null;
  backgroundColor?: 'black' | 'gray' | 'white';
}

export default function MainContent({
  onTrackSelect,
  musicFolder,
  analyser,
  backgroundColor = 'black'
}: MainContentProps) {
  const {
    currentTrack,
    isPlaying,
    currentView,
    likedSongs,
    playPause,
    toggleLike
  } = useMusicStore();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'hiRes' | 'recent'>('all');
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([]);
  const [playlistInfo, setPlaylistInfo] = useState<{ name: string; description?: string } | null>(null);
  const [trackMenuOpen, setTrackMenuOpen] = useState<string | null>(null);
  const [trackMenuPosition, setTrackMenuPosition] = useState({ x: 0, y: 0 });

  // プレイリストIDを抽出
  const playlistId = currentView.startsWith('playlist:') ? currentView.split(':')[1] : null;
  const isLikedView = currentView === 'liked';

  // 初回ロード時にトラックを取得
  useEffect(() => {
    fetchTracks();
  }, []);

  // プレイリストの楽曲を取得
  useEffect(() => {
    if (playlistId) {
      fetchPlaylistTracks(playlistId);
    } else if (isLikedView) {
      fetchLikedTracks();
    }
  }, [playlistId, isLikedView]);

  const fetchPlaylistTracks = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/playlists/${id}`);
      const data = await response.json();
      
      if (response.ok && data.playlist) {
        setPlaylistInfo({
          name: data.playlist.name,
          description: data.playlist.description
        });
        // PlaylistTrackからTrackを抽出
        const tracks = data.playlist.tracks.map((pt: any) => pt.track);
        setPlaylistTracks(tracks);
      }
    } catch (error) {
      console.error('Error fetching playlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLikedTracks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/music/tracks');
      const data = await response.json();
      
      if (response.ok) {
        // いいねした曲のみフィルター
        const liked = data.tracks.filter((t: Track) => likedSongs.includes(t.id));
        setPlaylistTracks(liked);
        setPlaylistInfo({ name: 'Liked Songs', description: 'あなたがいいねした曲' });
      }
    } catch (error) {
      console.error('Error fetching liked tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  // データベースからトラックを取得
  const fetchTracks = async (search?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (musicFolder) params.append('folder', musicFolder);
      if (filterMode === 'hiRes') params.append('hiRes', 'true');
      if (filterMode === 'recent') params.append('recent', 'true');
      
      const response = await fetch(`/api/music/tracks?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setTracks(data.tracks || []);
      }
    } catch (error) {
      console.error('Error fetching tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracks(searchQuery);
  }, [musicFolder, filterMode, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      fetchTracks(query);
    } else {
      fetchTracks();
    }
  };

  // 編集ボタンのクリック処理
  const handleEditClick = (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    setEditingTrack(track);
  };

  // トラック更新後の処理
  const handleTrackSave = (updatedTrack: Partial<Track>) => {
    setTracks(tracks.map(t => 
      t.id === updatedTrack.id ? { ...t, ...updatedTrack } : t
    ));
    setEditingTrack(null);
  };

  // トラックをクリックした時の処理
  const handleTrackClick = (track: Track) => {
    if (currentTrack?.id === track.id) {
      // 同じ曲をクリックした場合は再生/一時停止を切り替え
      playPause();
    } else {
      // 別の曲をクリックした場合は新しい曲を再生
      onTrackSelect(track);
    }
  };

  // いいねボタンのクリック処理
  const handleLikeClick = async (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation(); // 親要素のクリックイベントを防ぐ
    
    try {
      const isLiked = likedSongs.includes(trackId);
      const response = await fetch('/api/music/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackId,
          isLiked: !isLiked,
        }),
      });

      if (response.ok) {
        toggleLike(trackId);
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getQualityColor = (quality?: string) => {
    if (!quality) return 'text-gray-400';
    if (quality.includes('Hi-Res')) return 'text-purple-400';
    if (quality.includes('Studio')) return 'text-blue-400';
    if (quality.includes('CD')) return 'text-green-400';
    return 'text-gray-400';
  };

  const handleTrackMenuOpen = (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setTrackMenuPosition({
      x: rect.left - 250, // メニュー幅を考慮
      y: rect.top
    });
    setTrackMenuOpen(trackId);
  };

  if (currentView === 'dashboard') {
    return <ServerDashboard />;
  }

  if (currentView === 'upload') {
    return (
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Upload Music</h1>
          <UploadZone onUploadComplete={() => fetchTracks()} />
        </div>
      </div>
    );
  }

  // プレイリスト表示
  if (playlistId || isLikedView) {
    const displayTracks = playlistTracks;
    
    return (
      <div className="flex-1 flex flex-col">
        <div className="p-6 glass border-b border-white/10">
          <h1 className="text-2xl font-bold">{playlistInfo?.name || 'Playlist'}</h1>
          {playlistInfo?.description && (
            <p className="text-gray-400 mt-2">{playlistInfo.description}</p>
          )}
          <div className="text-sm text-gray-400 mt-2">
            {displayTracks.length} tracks
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
            </div>
          ) : displayTracks.length === 0 ? (
            <div className="text-center py-12">
              <Music2 className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <h3 className="text-xl font-semibold mb-2">プレイリストが空です</h3>
              <p className="text-gray-400">楽曲を追加してください</p>
            </div>
          ) : (
            <div className="glass rounded-xl overflow-hidden">
              <div className="p-4 border-b border-white/10">
                <div className="grid grid-cols-12 gap-4 text-sm text-gray-400 font-medium">
                  <div className="col-span-1">#</div>
                  <div className="col-span-4">TITLE</div>
                  <div className="col-span-2">ALBUM</div>
                  <div className="col-span-2">QUALITY</div>
                  <div className="col-span-2">DURATION</div>
                  <div className="col-span-1"></div>
                </div>
              </div>
              
              <div className="divide-y divide-white/5">
                {displayTracks.map((track, index) => {
                  const isCurrentTrack = currentTrack?.id === track.id;
                  const isTrackPlaying = isCurrentTrack && isPlaying;
                  const isTrackLiked = likedSongs.includes(track.id);
                  
                  return (
                    <motion.div
                      key={track.id}
                      className="p-4 hover:bg-white/5 cursor-pointer group"
                      whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                      onClick={() => handleTrackClick(track)}
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
                          <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center relative">
                            <Music2 className="w-4 h-4" />
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
                        
                        <div className="col-span-1 opacity-0 group-hover:opacity-100">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => handleLikeClick(e, track.id)}
                              className={`${isTrackLiked ? 'text-green-500' : 'text-gray-400'} hover:text-green-400 cursor-pointer`}
                            >
                              <Heart className={`w-4 h-4 ${isTrackLiked ? 'fill-current' : ''}`} />
                            </button>
                            <button
                              onClick={(e) => handleEditClick(e, track)}
                              className="text-gray-400 hover:text-white cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <MoreHorizontal className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {editingTrack && (
          <EditTrackModal
            track={editingTrack}
            isOpen={!!editingTrack}
            onClose={() => setEditingTrack(null)}
            onSave={handleTrackSave}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* ヘッダー */}
      <div className="p-6 glass border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold">
              {currentView === 'home' && 'Good evening'}
              {currentView === 'search' && 'Search'}
              {currentView === 'library' && 'Your Library'}
              {currentView === 'settings' && 'Settings'}
            </h1>
            {tracks.length > 0 && (
              <div className="text-sm text-gray-400">
                {tracks.length} tracks
                {tracks.filter(t => t.isHighRes).length > 0 && (
                  <span className="ml-2 px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">
                    {tracks.filter(t => t.isHighRes).length} Hi-Res
                  </span>
                )}
              </div>
            )}
          </div>
          
          {(currentView === 'search' || currentView === 'library') && (
            <div className="flex items-center space-x-4">
              {/* フィルターボタン */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    filterMode === 'all'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  すべて
                </button>
                <button
                  onClick={() => setFilterMode('hiRes')}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    filterMode === 'hiRes'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  Hi-Res
                </button>
                <button
                  onClick={() => setFilterMode('recent')}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    filterMode === 'recent'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  最近追加
                </button>
              </div>

              {/* 検索バー */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search music..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-full pl-10 pr-4 py-2 w-80 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* コンテンツエリア */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <>
            {currentView === 'home' && (
              <div className="space-y-8">
                {/* 大きなビジュアライザー（音楽再生中のみ表示） */}
                {currentTrack && (
                  <div className="glass rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-semibold">Now Playing</h2>
                        <p className="text-gray-400">{currentTrack.title} - {currentTrack.artist}</p>
                      </div>
                      <div className="text-sm text-gray-400">
                        Click visualizer for fullscreen
                      </div>
                    </div>
                    <div className={`${backgroundColor === 'white' ? 'bg-gray-100' : 'bg-black'} rounded-lg overflow-hidden`}>
                      <AudioVisualizer
                        isPlaying={isPlaying}
                        analyser={analyser}
                        className="w-full h-32"
                        barCount={128}
                        height={128}
                        backgroundColor={backgroundColor}
                        currentTrack={currentTrack}
                        onPlayPause={() => {}}
                        progress={0}
                        onProgressChange={() => {}}
                        currentTime={0}
                        duration={currentTrack.duration}
                        volume={75}
                        onVolumeChange={() => {}}
                      />
                    </div>
                  </div>
                )}

                {/* 統計情報 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="glass rounded-xl p-6">
                    <div className="flex items-center space-x-3">
                      <Music2 className="w-8 h-8 text-green-500" />
                      <div>
                        <div className="text-2xl font-bold">{tracks.length}</div>
                        <div className="text-gray-400">Total Tracks</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="glass rounded-xl p-6">
                    <div className="flex items-center space-x-3">
                      <Headphones className="w-8 h-8 text-purple-500" />
                      <div>
                        <div className="text-2xl font-bold">{tracks.filter(t => t.isHighRes).length}</div>
                        <div className="text-gray-400">Hi-Res Tracks</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="glass rounded-xl p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-blue-500 font-bold">♪</span>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {Math.round(tracks.reduce((acc, t) => acc + t.duration, 0) / 3600)}h
                        </div>
                        <div className="text-gray-400">Total Duration</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 最近追加された曲 */}
                {tracks.length > 0 ? (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Recently Added</h2>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                      {tracks.slice(0, 12).map((track) => {
                        const isCurrentTrack = currentTrack?.id === track.id;
                        const isTrackPlaying = isCurrentTrack && isPlaying;
                        const isTrackLiked = likedSongs.includes(track.id);
                        
                        return (
                        <motion.div
                          key={track.id}
                          className="glass rounded-lg p-3 hover-lift cursor-pointer group"
                          whileHover={{ scale: 1.02 }}
                          onClick={() => handleTrackClick(track)}
                        >
                          <div className="aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mb-2 flex items-center justify-center relative">
                            <Music2 className="w-6 h-6" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              {isTrackPlaying ? (
                                <Pause className="w-5 h-5 text-white" />
                              ) : (
                                <Play className="w-5 h-5 text-white" />
                              )}
                            </div>
                            {track.isHighRes && (
                              <div className="absolute top-1 right-1 px-1 py-0.5 bg-purple-500 text-white text-xs rounded">
                                Hi-Res
                              </div>
                            )}
                          </div>
                          <h3 className={`font-semibold truncate text-sm ${isCurrentTrack ? 'text-green-500' : ''}`}>
                            {track.title}
                          </h3>
                          <p className="text-gray-400 text-xs truncate">{track.artist}</p>
                          {track.quality && (
                            <p className={`text-xs mt-1 ${getQualityColor(track.quality)}`}>
                              {track.quality}
                            </p>
                          )}
                        </motion.div>
                      )})}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Music2 className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <h3 className="text-xl font-semibold mb-2">楽曲が見つかりません</h3>
                    <p className="text-gray-400 mb-4">
                      音楽ライブラリをスキャンして楽曲を追加してください
                    </p>
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/music/scan', { method: 'POST' });
                          const data = await response.json();
                          if (data.success) {
                            toast.success(`スキャン完了: ${data.result.added}件追加, ${data.result.updated}件更新`);
                            fetchTracks();
                          } else {
                            toast.error('スキャンエラー: ' + data.error);
                          }
                        } catch (error) {
                          toast.error('スキャン中にエラーが発生しました');
                        }
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full transition-colors"
                    >
                      ライブラリをスキャン
                    </button>
                  </div>
                )}
              </div>
            )}

            {(currentView === 'library' || currentView === 'search') && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">
                    {searchQuery ? `Search results for "${searchQuery}"` : 'Your Music'}
                  </h2>
                  <div className="text-sm text-gray-400">
                    {musicFolder ? `From: ${musicFolder}` : 'Database tracks'}
                  </div>
                </div>

                {tracks.length === 0 ? (
                  <div className="text-center py-12">
                    <Music2 className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                    <h3 className="text-xl font-semibold mb-2">No tracks found</h3>
                    <p className="text-gray-400">
                      {searchQuery 
                        ? 'Try a different search term' 
                        : 'Upload some music or select a music folder to get started'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="glass rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                      <div className="grid grid-cols-12 gap-4 text-sm text-gray-400 font-medium">
                        <div className="col-span-1">#</div>
                        <div className="col-span-4">TITLE</div>
                        <div className="col-span-2">ALBUM</div>
                        <div className="col-span-2">QUALITY</div>
                        <div className="col-span-2">DURATION</div>
                        <div className="col-span-1"></div>
                      </div>
                    </div>
                    
                    <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
                      {tracks.map((track, index) => {
                        const isCurrentTrack = currentTrack?.id === track.id;
                        const isTrackPlaying = isCurrentTrack && isPlaying;
                        const isTrackLiked = likedSongs.includes(track.id);
                        
                        return (
                        <motion.div
                          key={track.id}
                          className="p-4 hover:bg-white/5 cursor-pointer group"
                          whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                          onClick={() => handleTrackClick(track)}
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
                              <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center relative">
                                <Music2 className="w-4 h-4" />
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
                            
                            <div className="col-span-1 opacity-0 group-hover:opacity-100">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => handleLikeClick(e, track.id)}
                                  className={`${isTrackLiked ? 'text-green-500' : 'text-gray-400'} hover:text-green-400 cursor-pointer`}
                                >
                                  <Heart className={`w-4 h-4 ${isTrackLiked ? 'fill-current' : ''}`} />
                                </button>
                                <button
                                  onClick={(e) => handleEditClick(e, track)}
                                  className="text-gray-400 hover:text-white cursor-pointer"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={(e) => handleTrackMenuOpen(e, track.id)}
                                  className="text-gray-400 hover:text-white cursor-pointer"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )})}
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentView === 'settings' && (
              <div className="max-w-2xl">
                <h2 className="text-xl font-semibold mb-6">Settings</h2>
                <div className="space-y-6">
                  <div className="glass rounded-xl p-6">
                    <h3 className="font-semibold mb-4">Audio Quality</h3>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3">
                        <input type="radio" name="quality" className="text-green-500" defaultChecked />
                        <span>Hi-Res (192kHz/24bit)</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input type="radio" name="quality" className="text-green-500" />
                        <span>Studio Quality (96kHz/24bit)</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input type="radio" name="quality" className="text-green-500" />
                        <span>CD Quality (44.1kHz/16bit)</span>
                      </label>
                    </div>
                  </div>

                  <div className="glass rounded-xl p-6">
                    <h3 className="font-semibold mb-4">Supported Formats</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-medium text-purple-400 mb-2">Lossless</h4>
                        <ul className="space-y-1 text-gray-400">
                          <li>FLAC (up to 192kHz/32bit)</li>
                          <li>WAV (up to 192kHz/32bit)</li>
                          <li>DSD (DSD64, DSD128)</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-400 mb-2">Compressed</h4>
                        <ul className="space-y-1 text-gray-400">
                          <li>MP3 (up to 320kbps)</li>
                          <li>AAC/M4A (up to 320kbps)</li>
                          <li>OGG Vorbis</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 編集モーダル */}
      {editingTrack && (
        <EditTrackModal
          track={editingTrack}
          isOpen={!!editingTrack}
          onClose={() => setEditingTrack(null)}
          onSave={handleTrackSave}
        />
      )}

      {/* トラックメニュー */}
      {trackMenuOpen && tracks.find(t => t.id === trackMenuOpen) && (
        <TrackMenu
          track={tracks.find(t => t.id === trackMenuOpen)!}
          isOpen={!!trackMenuOpen}
          onClose={() => setTrackMenuOpen(null)}
          position={trackMenuPosition}
          onEdit={() => {
            const track = tracks.find(t => t.id === trackMenuOpen);
            if (track) setEditingTrack(track);
            setTrackMenuOpen(null);
          }}
          onDelete={() => {
            fetchTracks();
            setTrackMenuOpen(null);
          }}
          onAddToPlaylist={() => {
            toast.success('プレイリストに追加しました');
            setTrackMenuOpen(null);
          }}
        />
      )}
    </div>
  );
}