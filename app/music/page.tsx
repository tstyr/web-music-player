'use client';

import { useEffect, useState } from 'react';
import AudioPlayer from '@/components/AudioPlayer';

interface Track {
  id: string;
  title: string;
  artist: string | null;
  album: string | null;
  duration: number;
  filePath: string;
  sampleRate: number | null;
}

export default function MusicPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTracks();
  }, [searchQuery]);

  const fetchTracks = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      const response = await fetch(`/api/music/tracks?${params.toString()}`);
      const data = await response.json();
      setTracks(data.tracks || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch tracks:', error);
      setLoading(false);
    }
  };

  const handlePlayTrack = async (track: Track) => {
    // ファイルパスから相対パスを生成
    // track.filePathは絶対パス（例: C:/Music/album/song.mp3）
    // これを相対パスに変換してストリーミングAPIに渡す
    
    // まず、音楽ライブラリのパスを取得
    let musicPath = 'C:/Music';
    try {
      const configResponse = await fetch('/api/music/config');
      const config = await configResponse.json();
      musicPath = config.musicLibraryPath || 'C:/Music';
    } catch (error) {
      console.warn('Config API error, using default path');
    }
    
    let relativePath = track.filePath;
    
    // 音楽ライブラリパスを除去
    if (relativePath.startsWith(musicPath)) {
      relativePath = relativePath.substring(musicPath.length);
    }
    
    // Windowsパスの場合、ドライブレターを除去して相対パスに変換
    // C:/Music/album/song.mp3 -> album/song.mp3
    const windowsPathMatch = relativePath.match(/^[A-Z]:[\\\/](.+)$/i);
    if (windowsPathMatch) {
      relativePath = windowsPathMatch[1];
    }
    
    // バックスラッシュをスラッシュに変換
    relativePath = relativePath.replace(/\\/g, '/');
    
    // 先頭のスラッシュを除去
    relativePath = relativePath.replace(/^\/+/, '');
    
    // パスをエンコード（各セグメントを個別にエンコード）
    const pathSegments = relativePath.split('/').filter(s => s.length > 0).map(segment => encodeURIComponent(segment));
    const streamUrl = `/api/music/stream/${pathSegments.join('/')}`;
    
    setCurrentTrack({
      ...track,
      filePath: streamUrl,
    });
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 pb-32">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">音楽ライブラリ</h1>
          
          {/* 検索バー */}
          <input
            type="text"
            placeholder="楽曲、アーティスト、アルバムで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-green-500"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl text-gray-400">読み込み中...</div>
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-xl text-gray-400 mb-4">楽曲が見つかりません</div>
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/music/scan', { method: 'POST' });
                  const data = await response.json();
                  if (data.success) {
                    alert(`スキャン完了: ${data.result.added}件追加, ${data.result.updated}件更新`);
                    fetchTracks();
                  } else {
                    alert('スキャンエラー: ' + data.error);
                  }
                } catch (error) {
                  alert('スキャン中にエラーが発生しました');
                }
              }}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full transition-colors"
            >
              ライブラリをスキャン
            </button>
          </div>
        ) : (
          <div className="bg-gray-800/50 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800/80">
                <tr>
                  <th className="text-left p-4 text-gray-400 font-normal">#</th>
                  <th className="text-left p-4 text-gray-400 font-normal">タイトル</th>
                  <th className="text-left p-4 text-gray-400 font-normal">アーティスト</th>
                  <th className="text-left p-4 text-gray-400 font-normal">アルバム</th>
                  <th className="text-right p-4 text-gray-400 font-normal">時間</th>
                </tr>
              </thead>
              <tbody>
                {tracks.map((track, index) => (
                  <tr
                    key={track.id}
                    onClick={() => handlePlayTrack(track)}
                    className="hover:bg-gray-700/50 cursor-pointer transition-colors border-b border-gray-700/50"
                  >
                    <td className="p-4 text-gray-400">{index + 1}</td>
                    <td className="p-4 font-medium">{track.title}</td>
                    <td className="p-4 text-gray-400">{track.artist || '-'}</td>
                    <td className="p-4 text-gray-400">{track.album || '-'}</td>
                    <td className="p-4 text-gray-400 text-right">{formatDuration(track.duration)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {currentTrack && (
        <AudioPlayer
          src={currentTrack.filePath}
          volume={75}
          isPlaying={false}
          onLoadedMetadata={(metadata) => {
            console.log('Audio metadata:', metadata);
          }}
        />
      )}
    </div>
  );
}
