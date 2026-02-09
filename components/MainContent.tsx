'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Play, Pause, Heart, MoreHorizontal, Music2, Headphones, Edit2, Filter } from 'lucide-react';
import ServerDashboard from './ServerDashboard';
import UploadZone from './UploadZone';
import EditTrackModal from './EditTrackModal';
import TrackMenu from './TrackMenu';
import TrackListItem from './TrackListItem';
import SkeletonLoader from './SkeletonLoader';
import { useMusicStore } from '@/lib/store';
import { useSocket } from '@/hooks/useSocket';
import toast from 'react-hot-toast';

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

interface MainContentProps {
  onTrackSelect: (track: Track) => void;
  musicFolder: string | null;
  backgroundColor?: 'black' | 'gray' | 'white';
}

export default function MainContent({
  onTrackSelect,
  musicFolder,
  backgroundColor = 'black'
}: MainContentProps) {
  const {
    currentTrack,
    isPlaying,
    currentView,
    likedSongs,
    playPause,
    toggleLike,
    setCurrentPlaylist
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
  const [playlistMenuOpen, setPlaylistMenuOpen] = useState(false);
  const [playlistMenuPosition, setPlaylistMenuPosition] = useState({ x: 0, y: 0 });

  // プレイリストIDを抽出
  const playlistId = currentView.startsWith('playlist:') ? currentView.split(':')[1] : null;
  const isLikedView = currentView === 'liked';

  // Socket.ioでライブラリ更新を監視（デバウンス付き）
  const [updatePending, setUpdatePending] = useState(false);
  
  useSocket((data) => {
    // ライブラリ更新イベントを受信
    console.log('[MainContent] Library update received:', data);
    
    switch (data.type) {
      case 'track-added':
        toast.success(`新しい曲が追加されました: ${data.track?.title || '不明'}`);
        setUpdatePending(true);
        break;
      case 'track-updated':
        toast.success(`曲が更新されました: ${data.track?.title || '不明'}`);
        setUpdatePending(true);
        break;
      case 'track-deleted':
        toast.success('曲が削除されました');
        setUpdatePending(true);
        break;
      case 'tracks-uploaded':
        toast.success(`${data.count}件の曲がアップロードされました`, { duration: 5000 });
        setUpdatePending(true);
        break;
      case 'scan-complete':
        const result = data.result;
        if (result.added > 0 || result.updated > 0 || result.deleted > 0) {
          toast.success(
            `スキャン完了: ${result.added}件追加, ${result.updated}件更新, ${result.deleted}件削除`,
            { duration: 5000 }
          );
          setUpdatePending(true);
        }
        break;
    }
  });

  // 更新が保留されている場合、3秒後にまとめて更新
  useEffect(() => {
    if (updatePending) {
      const timeoutId = setTimeout(() => {
        fetchTracks();
        setUpdatePending(false);
      }, 3000);

      return () => clearTimeout(timeoutId);
    }
  }, [updatePending]);

  // 初回ロード時にトラックを取得
  useEffect(() => {
    fetchTracks();
  }, []); // 空の依存配列で初回のみ実行

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

  // データベースからトラックを取得（非同期最適化）
  const fetchTracks = useCallback(async (search?: string) => {
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
        // 非同期でステートを更新（メインスレッドをブロックしない）
        requestAnimationFrame(() => {
          setTracks(data.tracks || []);
        });
      }
    } catch (error) {
      console.error('Error fetching tracks:', error);
    } finally {
      setLoading(false);
    }
  }, [musicFolder, filterMode]);

  // フィルターモードが変更された時のみトラックを再取得
  useEffect(() => {
    if (filterMode !== 'all' || searchQuery) {
      const timeoutId = setTimeout(() => {
        fetchTracks(searchQuery);
      }, 300); // デバウンス: 300ms待ってから実行

      return () => clearTimeout(timeoutId);
    }
  }, [filterMode, searchQuery]); // musicFolderを削除して無限ループを防ぐ

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // useEffectで処理されるので、ここでは何もしない
  };

  // 編集ボタンのクリック処理（useCallback で最適化）
  const handleEditClick = useCallback((e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    setEditingTrack(track);
  }, []);

  // トラック更新後の処理（useCallback で最適化）
  const handleTrackSave = useCallback((updatedTrack: Partial<Track>) => {
    setTracks(prevTracks => prevTracks.map(t => 
      t.id === updatedTrack.id ? { ...t, ...updatedTrack } : t
    ));
    setEditingTrack(null);
  }, []);

  // トラックをクリックした時の処理（useCallback で最適化）
  const handleTrackClick = useCallback((track: Track) => {
    if (currentTrack?.id === track.id) {
      playPause();
    } else {
      onTrackSelect(track);
      setCurrentPlaylist(tracks);
    }
  }, [currentTrack?.id, playPause, onTrackSelect, setCurrentPlaylist, tracks]);

  // いいねボタンのクリック処理（useCallback で最適化）
  const handleLikeClick = useCallback(async (e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    
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
  }, [likedSongs, toggleLike]);

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

  const handleTrackMenuOpen = useCallback((e: React.MouseEvent, trackId: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setTrackMenuPosition({
      x: rect.left - 250,
      y: rect.top
    });
    setTrackMenuOpen(trackId);
  }, []);

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
    
    const handlePlaylistPlay = () => {
      if (displayTracks.length > 0) {
        setCurrentPlaylist(displayTracks);
        onTrackSelect(displayTracks[0]);
      }
    };

    const handleDeletePlaylist = async () => {
      if (!playlistId) return;
      
      if (!confirm('このプレイリストを削除しますか？')) return;
      
      try {
        const response = await fetch(`/api/playlists/${playlistId}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          toast.success('プレイリストを削除しました');
          // ホーム画面に戻る
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Failed to delete playlist:', error);
        toast.error('プレイリストの削除に失敗しました');
      }
    };

    const handleSharePlaylist = async () => {
      if (!playlistId) return;
      
      try {
        const shareUrl = `${window.location.origin}/playlist/share/${playlistId}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success('共有リンクをコピーしました！');
        setPlaylistMenuOpen(false);
      } catch (error) {
        console.error('Failed to copy share link:', error);
        toast.error('リンクのコピーに失敗しました');
      }
    };

    const handlePlaylistMenuOpen = (e: React.MouseEvent) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      setPlaylistMenuPosition({
        x: rect.left - 200,
        y: rect.top + rect.height
      });
      setPlaylistMenuOpen(true);
    };
    
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="p-6 glass border-b border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">{playlistInfo?.name || 'Playlist'}</h1>
              {displayTracks.length > 0 && (
                <button
                  onClick={handlePlaylistPlay}
                  className="w-12 h-12 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-lg"
                  title="プレイリストを再生"
                >
                  <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                </button>
              )}
            </div>
            {playlistId && (
              <button
                onClick={handlePlaylistMenuOpen}
                className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="プレイリストメニュー"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            )}
          </div>
          {playlistInfo?.description && (
            <p className="text-gray-400 mt-2">{playlistInfo.description}</p>
          )}
          <div className="text-sm text-gray-400 mt-2">
            {displayTracks.length} tracks
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-transparent to-black/20">
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
                    <div
                      key={track.id}
                      className="p-4 hover:bg-white/5 cursor-pointer group transition-colors"
                      onClick={() => {
                        setCurrentPlaylist(displayTracks);
                        handleTrackClick(track);
                      }}
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-1 relative">
                          <span className={`${isCurrentTrack ? 'text-green-500' : 'text-gray-400'} group-hover:hidden`}>
                            {isTrackPlaying ? '♪' : index + 1}
                          </span>
                          <button className="hidden group-hover:block absolute inset-0 flex items-center justify-center">
                            {isTrackPlaying ? (
                              <Pause className="w-4 h-4 text-white" />
                            ) : (
                              <Play className="w-4 h-4 text-white" />
                            )}
                          </button>
                        </div>
                        
                        <div className="col-span-4 flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center relative overflow-hidden">
                            {track.artwork ? (
                              <img 
                                src={track.artwork} 
                                alt={track.title}
                                className="w-full h-full object-cover"
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
                    </div>
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
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* ヘッダー */}
      <div className="p-3 sm:p-4 md:p-6 glass border-b border-white/10 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
          <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
            <h1 className="text-xl sm:text-2xl font-bold">
              {currentView === 'home' && 'Good evening'}
              {currentView === 'search' && 'Search'}
              {currentView === 'library' && 'Your Library'}
              {currentView === 'settings' && 'Settings'}
            </h1>
            {tracks.length > 0 && (
              <div className="text-xs sm:text-sm text-gray-400">
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
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              {/* フィルターボタン */}
              <div className="flex items-center space-x-2 overflow-x-auto">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    filterMode === 'all'
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  すべて
                </button>
                <button
                  onClick={() => setFilterMode('hiRes')}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    filterMode === 'hiRes'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  Hi-Res
                </button>
                <button
                  onClick={() => setFilterMode('recent')}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    filterMode === 'recent'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  最近追加
                </button>
              </div>

              {/* 検索バー */}
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search music..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-full pl-10 pr-4 py-2 w-full sm:w-64 md:w-80 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* コンテンツエリア - 画面いっぱいまで表示 */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-gradient-to-b from-transparent to-black/20 min-h-0 flex flex-col">
        {loading ? (
          <SkeletonLoader count={15} />
        ) : (
          <>
            {currentView === 'home' && (
              <div className="space-y-6 sm:space-y-8">
                {/* 現在再生中の曲情報 */}
                {currentTrack && (
                  <div className="glass rounded-xl p-4 sm:p-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                        {currentTrack.artwork ? (
                          <img 
                            src={currentTrack.artwork} 
                            alt={currentTrack.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                            <Music2 className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg sm:text-xl font-semibold truncate">Now Playing</h2>
                        <p className="text-sm sm:text-base text-gray-400 truncate">{currentTrack.title}</p>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">{currentTrack.artist}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 統計情報 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                  <div className="glass rounded-xl p-4 sm:p-6">
                    <div className="flex items-center space-x-3">
                      <Music2 className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 flex-shrink-0" />
                      <div>
                        <div className="text-xl sm:text-2xl font-bold">{tracks.length}</div>
                        <div className="text-sm sm:text-base text-gray-400">Total Tracks</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="glass rounded-xl p-4 sm:p-6">
                    <div className="flex items-center space-x-3">
                      <Headphones className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 flex-shrink-0" />
                      <div>
                        <div className="text-xl sm:text-2xl font-bold">{tracks.filter(t => t.isHighRes).length}</div>
                        <div className="text-sm sm:text-base text-gray-400">Hi-Res Tracks</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="glass rounded-xl p-4 sm:p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-500 font-bold text-sm sm:text-base">♪</span>
                      </div>
                      <div>
                        <div className="text-xl sm:text-2xl font-bold">
                          {Math.round(tracks.reduce((acc, t) => acc + t.duration, 0) / 3600)}h
                        </div>
                        <div className="text-sm sm:text-base text-gray-400">Total Duration</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 最近追加された曲 */}
                {tracks.length > 0 ? (
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Recently Added</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
                      {tracks.slice(0, 12).map((track) => {
                        const isCurrentTrack = currentTrack?.id === track.id;
                        const isTrackPlaying = isCurrentTrack && isPlaying;
                        const isTrackLiked = likedSongs.includes(track.id);
                        
                        return (
                        <div
                          key={track.id}
                          className="glass rounded-lg p-2 sm:p-3 cursor-pointer group transition-all hover:bg-white/10"
                          onClick={() => handleTrackClick(track)}
                        >
                          <div className="aspect-square bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mb-2 flex items-center justify-center relative overflow-hidden">
                            {track.artwork ? (
                              <img 
                                src={track.artwork} 
                                alt={track.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Music2 className="w-5 h-5 sm:w-6 sm:h-6" />
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              {isTrackPlaying ? (
                                <Pause className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              ) : (
                                <Play className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              )}
                            </div>
                            {track.isHighRes && (
                              <div className="absolute top-1 right-1 px-1 py-0.5 bg-purple-500 text-white text-xs rounded">
                                Hi-Res
                              </div>
                            )}
                          </div>
                          <h3 className={`font-semibold truncate text-xs sm:text-sm ${isCurrentTrack ? 'text-green-500' : ''}`}>
                            {track.title}
                          </h3>
                          <p className="text-gray-400 text-xs truncate">{track.artist}</p>
                          {track.quality && (
                            <p className={`text-xs mt-1 ${getQualityColor(track.quality)}`}>
                              {track.quality}
                            </p>
                          )}
                        </div>
                      )})}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Music2 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-600" />
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">楽曲が見つかりません</h3>
                    <p className="text-sm sm:text-base text-gray-400 mb-4">
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
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-full transition-colors text-sm sm:text-base"
                    >
                      ライブラリをスキャン
                    </button>
                  </div>
                )}
              </div>
            )}

            {(currentView === 'library' || currentView === 'search') && (
              <div className="space-y-6 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between flex-shrink-0">
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
                  <div className="glass rounded-xl overflow-hidden flex flex-col flex-1 min-h-0">
                    <div className="p-4 border-b border-white/10 flex-shrink-0">
                      <div className="grid grid-cols-12 gap-4 text-sm text-gray-400 font-medium">
                        <div className="col-span-1">#</div>
                        <div className="col-span-4">TITLE</div>
                        <div className="col-span-2">ALBUM</div>
                        <div className="col-span-2">QUALITY</div>
                        <div className="col-span-2">DURATION</div>
                        <div className="col-span-1"></div>
                      </div>
                    </div>
                    
                    {/* 最適化されたトラックリスト - 画面いっぱいまで拡張 */}
                    <div className="flex-1 overflow-y-auto optimized-scroll bg-gradient-to-b from-transparent to-black/20">
                      {tracks.map((track, index) => (
                        <TrackListItem
                          key={track.id}
                          track={track}
                          index={index}
                          isCurrentTrack={currentTrack?.id === track.id}
                          isPlaying={isPlaying}
                          isLiked={likedSongs.includes(track.id)}
                          onTrackClick={handleTrackClick}
                          onLikeClick={handleLikeClick}
                          onEditClick={handleEditClick}
                          onMenuClick={handleTrackMenuOpen}
                          formatDuration={(seconds: number) => {
                            const mins = Math.floor(seconds / 60);
                            const secs = seconds % 60;
                            return `${mins}:${secs.toString().padStart(2, '0')}`;
                          }}
                          formatFileSize={(bytes?: number) => {
                            if (!bytes) return '';
                            const sizes = ['B', 'KB', 'MB', 'GB'];
                            const i = Math.floor(Math.log(bytes) / Math.log(1024));
                            return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
                          }}
                          getQualityColor={(quality?: string) => {
                            if (!quality) return 'text-gray-400';
                            if (quality.includes('Hi-Res')) return 'text-purple-400';
                            if (quality.includes('Studio')) return 'text-blue-400';
                            if (quality.includes('CD')) return 'text-green-400';
                            return 'text-gray-400';
                          }}
                        />
                      ))}
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
            // プレイリストに追加完了
            setTrackMenuOpen(null);
          }}
        />
      )}

      {/* プレイリストメニュー */}
      {playlistMenuOpen && playlistId && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setPlaylistMenuOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute glass-dark border border-white/20 rounded-xl shadow-2xl overflow-hidden"
            style={{
              left: `${playlistMenuPosition.x}px`,
              top: `${playlistMenuPosition.y}px`,
              minWidth: '200px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="py-2">
              <button
                onClick={handleSharePlaylist}
                className="w-full px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center space-x-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span>共有リンクをコピー</span>
              </button>
              <div className="border-t border-white/10 my-1"></div>
              <button
                onClick={() => {
                  setPlaylistMenuOpen(false);
                  handleDeletePlaylist();
                }}
                className="w-full px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center space-x-3 text-red-400 hover:text-red-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>プレイリストを削除</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}