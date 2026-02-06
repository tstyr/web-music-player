'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Search, 
  Library, 
  PlusCircle, 
  Heart,
  Monitor,
  FolderOpen,
  Music,
  Upload,
  Settings,
  ListPlus,
  Trash2
} from 'lucide-react';
import { useMusicStore } from '@/lib/store';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onSelectMusicFolder: () => void;
  musicFolder: string | null;
}

export default function Sidebar({ 
  currentView, 
  onViewChange, 
  onSelectMusicFolder,
  musicFolder 
}: SidebarProps) {
  const { playlists, setPlaylists } = useMusicStore();
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  // プレイリストを取得（初回のみ）
  useEffect(() => {
    fetchPlaylists();
  }, []); // 空の依存配列で初回のみ実行

  const fetchPlaylists = async () => {
    try {
      const response = await fetch('/api/playlists');
      const data = await response.json();
      if (data.playlists) {
        setPlaylists(data.playlists);
      }
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      console.log('[Sidebar] Playlist name is empty');
      return;
    }

    console.log('[Sidebar] Creating playlist:', newPlaylistName);

    try {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPlaylistName,
          description: ''
        })
      });

      console.log('[Sidebar] Response status:', response.status);
      const data = await response.json();
      console.log('[Sidebar] Response data:', data);

      if (response.ok && data.playlist) {
        console.log('[Sidebar] Playlist created successfully:', data.playlist);
        setPlaylists([...playlists, data.playlist]);
        setNewPlaylistName('');
        setIsCreatingPlaylist(false);
      } else {
        console.error('[Sidebar] Failed to create playlist:', data.error);
        alert(`プレイリストの作成に失敗しました: ${data.error || '不明なエラー'}`);
      }
    } catch (error) {
      console.error('[Sidebar] Failed to create playlist:', error);
      alert('プレイリストの作成中にエラーが発生しました');
    }
  };

  const handlePlaylistClick = (playlistId: string) => {
    onViewChange(`playlist:${playlistId}`);
  };

  const handleDeletePlaylist = async (playlistId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('このプレイリストを削除しますか？')) return;
    
    try {
      const response = await fetch(`/api/playlists/${playlistId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setPlaylists(playlists.filter(p => p.id !== playlistId));
        if (currentView === `playlist:${playlistId}`) {
          onViewChange('home');
        }
      }
    } catch (error) {
      console.error('Failed to delete playlist:', error);
    }
  };

  const mainMenuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'library', label: 'Your Library', icon: Library },
  ];

  const serverMenuItems = [
    { id: 'dashboard', label: 'Server Status', icon: Monitor },
    { id: 'upload', label: 'Upload Music', icon: Upload },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 lg:w-64 md:w-20 h-full glass-dark border-r border-white/10 flex flex-col overflow-hidden transition-all duration-300">
      {/* ロゴエリア */}
      <div className="p-4 sm:p-6 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Music className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 flex-shrink-0" />
          <span className="text-lg sm:text-xl font-bold truncate md:hidden lg:inline">Spotify Clone</span>
        </div>
      </div>

      {/* メインメニュー */}
      <div className="px-2 sm:px-3 py-3 sm:py-4 flex-shrink-0">
        <nav className="space-y-1">
          {mainMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center space-x-3 px-2 sm:px-3 py-2 rounded-lg text-left transition-colors text-sm sm:text-base ${
                currentView === item.id
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              title={item.label}
            >
              <item.icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="font-medium truncate md:hidden lg:inline">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* 音楽フォルダ選択 */}
      <div className="px-3 py-2 border-t border-white/10 md:hidden lg:block">
        <button
          onClick={onSelectMusicFolder}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <FolderOpen className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-medium">Music Folder</div>
            {musicFolder && (
              <div className="text-xs text-gray-500 truncate">
                {musicFolder}
              </div>
            )}
          </div>
        </button>
      </div>

      {/* サーバーメニュー */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 md:hidden lg:block">
          Server
        </div>
        <nav className="space-y-1">
          {serverMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                currentView === item.id
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              title={item.label}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium md:hidden lg:inline">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* プレイリスト */}
      <div className="flex-1 px-3 py-4 border-t border-white/10 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider md:hidden lg:block">
            Playlists
          </div>
          <button
            onClick={() => setIsCreatingPlaylist(true)}
            className="text-gray-400 hover:text-white transition-transform hover:scale-110"
            title="新しいプレイリストを作成"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
        </div>

        {/* プレイリスト作成フォーム */}
        {isCreatingPlaylist && (
          <div className="mb-3 p-2 bg-white/5 rounded-lg">
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreatePlaylist()}
              placeholder="プレイリスト名"
              className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              autoFocus
            />
            <div className="flex space-x-2 mt-2">
              <button
                onClick={handleCreatePlaylist}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white text-xs py-1 rounded"
              >
                作成
              </button>
              <button
                onClick={() => {
                  setIsCreatingPlaylist(false);
                  setNewPlaylistName('');
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-xs py-1 rounded"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}
        
        <div className="space-y-1">
          {/* Liked Songs */}
          <button
            onClick={() => onViewChange('liked')}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              currentView === 'liked'
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            title="Liked Songs"
          >
            <div className="flex items-center space-x-3">
              <Heart className="w-4 h-4 text-green-500 fill-current flex-shrink-0" />
              <span className="text-sm truncate md:hidden lg:inline">Liked Songs</span>
            </div>
          </button>

          {/* ユーザーのプレイリスト */}
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="group relative"
            >
              <button
                onClick={() => handlePlaylistClick(playlist.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  currentView === `playlist:${playlist.id}`
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                title={playlist.name}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <ListPlus className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm truncate md:hidden lg:inline">{playlist.name}</span>
                  </div>
                  <button
                    onClick={(e) => handleDeletePlaylist(playlist.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-opacity md:hidden lg:inline-block"
                    title="プレイリストを削除"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}