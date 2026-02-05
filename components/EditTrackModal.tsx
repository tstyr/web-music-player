'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Music } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

interface Track {
  id: string;
  title: string;
  artist?: string;
  album?: string;
  genre?: string;
  artwork?: string;
}

interface EditTrackModalProps {
  track: Track;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTrack: Partial<Track>) => void;
}

export default function EditTrackModal({
  track,
  isOpen,
  onClose,
  onSave
}: EditTrackModalProps) {
  const [formData, setFormData] = useState({
    title: track.title || '',
    artist: track.artist || '',
    album: track.album || '',
    genre: track.genre || ''
  });
  const [artworkFile, setArtworkFile] = useState<File | null>(null);
  const [artworkPreview, setArtworkPreview] = useState<string | null>(track.artwork || null);
  const [isSaving, setIsSaving] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setArtworkFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setArtworkPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 1
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // アルバムアートをアップロード
      let artworkUrl = track.artwork;
      if (artworkFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', artworkFile);
        formDataUpload.append('trackId', track.id);

        const uploadResponse = await fetch('/api/music/artwork', {
          method: 'POST',
          body: formDataUpload
        });

        if (uploadResponse.ok) {
          const { url } = await uploadResponse.json();
          artworkUrl = url;
        }
      }

      // メタデータを更新
      const response = await fetch(`/api/music/tracks/${track.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          artwork: artworkUrl
        })
      });

      if (response.ok) {
        const updatedTrack = await response.json();
        onSave(updatedTrack);
        toast.success('メタデータを更新しました');
        onClose();
      } else {
        toast.error('更新に失敗しました');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('エラーが発生しました');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* オーバーレイ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* モーダル */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* ヘッダー */}
          <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">メタデータを編集</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-gray-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* コンテンツ */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* アルバムアート */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                アルバムアート
              </label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <input {...getInputProps()} />
                {artworkPreview ? (
                  <div className="space-y-4">
                    <img
                      src={artworkPreview}
                      alt="Artwork preview"
                      className="w-48 h-48 object-cover rounded-lg mx-auto"
                    />
                    <p className="text-sm text-gray-400">
                      クリックまたはドラッグして変更
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-48 h-48 bg-gray-800 rounded-lg mx-auto flex items-center justify-center">
                      <Music className="w-16 h-16 text-gray-600" />
                    </div>
                    <div>
                      <Upload className="w-8 h-8 mx-auto text-gray-500 mb-2" />
                      <p className="text-gray-400">
                        {isDragActive
                          ? 'ここにドロップ'
                          : 'クリックまたはドラッグして画像をアップロード'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, WEBP (最大5MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 曲名 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                曲名
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-green-500 focus:outline-none transition-colors"
                placeholder="Unknown Track"
              />
            </div>

            {/* アーティスト名 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                アーティスト名
              </label>
              <input
                type="text"
                value={formData.artist}
                onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-green-500 focus:outline-none transition-colors"
                placeholder="Unknown Artist"
              />
            </div>

            {/* アルバム名 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                アルバム名
              </label>
              <input
                type="text"
                value={formData.album}
                onChange={(e) => setFormData({ ...formData, album: e.target.value })}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-green-500 focus:outline-none transition-colors"
                placeholder="Unknown Album"
              />
            </div>

            {/* ジャンル */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                ジャンル
              </label>
              <input
                type="text"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 border border-gray-700 focus:border-green-500 focus:outline-none transition-colors"
                placeholder="Unknown Genre"
              />
            </div>

            {/* ボタン */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
