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
  Settings
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

  // プレイリストを取得
  useEffect(() => {
    fetchPlaylists();
  }, []);

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
    if (!newPlaylistName.trim()) return;

    try {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPlaylistName,
          description: ''
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPlaylists([...playlists, data.playlist]);
        setNewPlaylistName('');
        setIsCreatingPlaylist(false);
      }
    } catch (error) {
      console.error('Failed to create playlist:', error);
    }
  };

  const handlePlaylistClick = (playlistId: string) => {
    onViewChange(`playlist:${playlistId}`);
  };

  const mainMenuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'library', label: 'Your Library', icon: Library },
  ];

  const serverMenuItems = [
    { id: 'dashboard', label: 'Server Status', icon: Monitor },
    { id: 'upload', label: 'Upload Music', icon: Upload },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 h-full glass-dark border-r border-white/10 flex flex-col">
      {/* ロゴエリア */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <Music className="w-8 h-8 text-green-500" />
          <span className="text-xl font-bold">Spotify Clone</span>
        </div>
      </div>

      {/* メインメニュー */}
      <div className="px-3 py-4">
        <nav className="space-y-1">
          {mainMenuItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                currentView === item.id
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </motion.button>
          ))}
        </nav>
      </div>

      {/* 音楽フォルダ選択 */}
      <div className="px-3 py-2 border-t border-white/10">
        <motion.button
          onClick={onSelectMusicFolder}
          className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.98 }}
        >
          <FolderOpen className="w-5 h-5" />
          <div className="flex-1 min-w-0">
            <div className="font-medium">Music Folder</div>
            {musicFolder && (
              <div className="text-xs text-gray-500 truncate">
                {musicFolder}
              </div>
            )}
          </div>
        </motion.button>
      </div>

      {/* サーバーメニュー */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Server
        </div>
        <nav className="space-y-1">
          {serverMenuItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                currentView === item.id
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </motion.button>
          ))}
        </nav>
      </div>

      {/* プレイリスト */}
      <div className="flex-1 px-3 py-4 border-t border-white/10 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Playlists
          </div>
          <motion.button
            onClick={() => setIsCreatingPlaylist(true)}
            className="text-gray-400 hover:text-white"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="新しいプレイリストを作成"
          >
            <PlusCircle className="w-4 h-4" />
          </motion.button>
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
          <motion.button
            onClick={() => onViewChange('liked')}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              currentView === 'liked'
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            whileHover={{ x: 4 }}
          >
            <div className="flex items-center space-x-3">
              <Heart className="w-4 h-4 text-green-500 fill-current" />
              <span className="text-sm truncate">Liked Songs</span>
            </div>
          </motion.button>

          {/* ユーザーのプレイリスト */}
          {playlists.map((playlist, index) => (
            <motion.button
              key={playlist.id}
              onClick={() => handlePlaylistClick(playlist.id)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                currentView === `playlist:${playlist.id}`
                  ? 'bg-white/10 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              whileHover={{ x: 4 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gray-600 rounded-sm flex items-center justify-center">
                  <Music className="w-2.5 h-2.5" />
                </div>
                <span className="text-sm truncate">{playlist.name}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}