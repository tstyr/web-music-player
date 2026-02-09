'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Music2, Play, Clock, User, ArrowLeft, Download } from 'lucide-react';
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
  isHighRes?: boolean;
  quality?: string;
  artwork?: string;
}

interface SharedPlaylist {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  trackCount: number;
  tracks: Track[];
}

export default function PlaylistSharePage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = params.id as string;
  
  const [playlist, setPlaylist] = useState<SharedPlaylist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchSharedPlaylist();
  }, [playlistId]);

  const fetchSharedPlaylist = async () => {
    try {
      const response = await fetch(`/api/playlists/share/${playlistId}`);
      const data = await response.json();

      if (response.ok) {
        setPlaylist(data.playlist);
      } else {
        setError(data.error || 'プレイリストが見つかりません');
      }
    } catch (error) {
      console.error('Failed to fetch shared playlist:', error);
      setError('プレイリストの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleImportPlaylist = async () => {
    setImporting(true);
    
    try {
      // TODO: 実際のユーザーIDを取得（認証システムから）
      // 現在はデモ用に固定値を使用
      const userId = 'demo-user-id';
      
      const response = await fetch(`/api/playlists/share/${playlistId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('プレイリストをライブラリに追加しました！');
        // ホーム画面に戻る
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        toast.error(data.error || 'プレイリストの追加に失敗しました');
      }
    } catch (error) {
      console.error('Failed to import playlist:', error);
      toast.error('プレイリストの追加中にエラーが発生しました');
    } finally {
      setImporting(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = () => {
    if (!playlist) return '0:00';
    const total = playlist.tracks.reduce((acc, track) => acc + track.duration, 0);
    const hours = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    return hours > 0 ? `${hours}時間${mins}分` : `${mins}分`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">プレイリストを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Music2 className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h1 className="text-2xl font-bold mb-2 text-white">プレイリストが見つかりません</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-full transition-colors inline-flex items-center space-x-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>ホームに戻る</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900" style={{ minHeight: '100dvh' }}>
      {/* ヘッダー */}
      <div className="glass-dark border-b border-white/10 p-4 sm:p-6">
        <button
          onClick={() => router.push('/')}
          className="text-gray-400 hover:text-white transition-colors inline-flex items-center space-x-2 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>戻る</span>
        </button>
      </div>

      {/* プレイリスト情報 */}
      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 sm:p-8 mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            {/* プレイリストアイコン */}
            <div className="w-32 h-32 sm:w-48 sm:h-48 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-2xl">
              <Music2 className="w-16 h-16 sm:w-24 sm:h-24 text-white" />
            </div>

            {/* プレイリスト詳細 */}
            <div className="flex-1">
              <div className="text-sm text-gray-400 mb-2">プレイリスト</div>
              <h1 className="text-3xl sm:text-5xl font-bold mb-4 text-white">{playlist.name}</h1>
              {playlist.description && (
                <p className="text-gray-300 mb-4">{playlist.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>{playlist.createdBy}</span>
                </div>
                <span>•</span>
                <div className="flex items-center space-x-2">
                  <Music2 className="w-4 h-4" />
                  <span>{playlist.trackCount}曲</span>
                </div>
                <span>•</span>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{getTotalDuration()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="mt-6 flex flex-wrap gap-4">
            <button
              onClick={handleImportPlaylist}
              disabled={importing}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white px-8 py-3 rounded-full transition-colors inline-flex items-center space-x-2 font-semibold shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              {importing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>追加中...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>ライブラリに追加</span>
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* トラックリスト */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl overflow-hidden"
        >
          <div className="p-4 border-b border-white/10">
            <div className="grid grid-cols-12 gap-4 text-sm text-gray-400 font-medium">
              <div className="col-span-1">#</div>
              <div className="col-span-5">タイトル</div>
              <div className="col-span-3">アルバム</div>
              <div className="col-span-2">品質</div>
              <div className="col-span-1">時間</div>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {playlist.tracks.map((track, index) => (
              <div
                key={track.id}
                className="p-4 hover:bg-white/5 transition-colors"
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-1 text-gray-400">
                    {index + 1}
                  </div>

                  <div className="col-span-5 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center relative overflow-hidden flex-shrink-0">
                      {track.artwork ? (
                        <img
                          src={track.artwork}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music2 className="w-4 h-4 text-gray-400" />
                      )}
                      {track.isHighRes && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-white truncate">{track.title}</div>
                      <div className="text-sm text-gray-400 truncate">{track.artist}</div>
                    </div>
                  </div>

                  <div className="col-span-3 text-gray-400 text-sm truncate">
                    {track.album}
                  </div>

                  <div className="col-span-2">
                    <div className="text-sm text-gray-400">
                      {track.quality || 'Unknown'}
                    </div>
                    {track.sampleRate && track.bitDepth && (
                      <div className="text-xs text-gray-500">
                        {(track.sampleRate / 1000).toFixed(1)}kHz/{track.bitDepth}bit
                      </div>
                    )}
                  </div>

                  <div className="col-span-1 text-gray-400 text-sm">
                    {formatDuration(track.duration)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
