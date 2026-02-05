'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, 
  Edit2, 
  ListPlus, 
  Share2, 
  Info,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Track {
  id: string;
  title: string;
  artist: string;
  filePath: string;
}

interface TrackMenuProps {
  track: Track;
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  onEdit?: () => void;
  onDelete?: () => void;
  onAddToPlaylist?: () => void;
}

export default function TrackMenu({
  track,
  isOpen,
  onClose,
  position,
  onEdit,
  onDelete,
  onAddToPlaylist
}: TrackMenuProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteFile, setDeleteFile] = useState(false);

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/music/tracks/${track.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteFile })
      });

      if (response.ok) {
        toast.success(deleteFile ? '楽曲とファイルを削除しました' : 'ライブラリから削除しました');
        onDelete?.();
        onClose();
      } else {
        toast.error('削除に失敗しました');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('削除中にエラーが発生しました');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* オーバーレイ */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* メニュー */}
      <AnimatePresence>
        {!showDeleteConfirm ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 w-64 glass-dark rounded-xl border border-white/10 shadow-2xl overflow-hidden"
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
            }}
          >
            {/* トラック情報 */}
            <div className="p-3 border-b border-white/10">
              <div className="font-medium text-white text-sm truncate">{track.title}</div>
              <div className="text-xs text-gray-400 truncate">{track.artist}</div>
            </div>

            {/* メニュー項目 */}
            <div className="py-1">
              <button
                onClick={() => {
                  onAddToPlaylist?.();
                  onClose();
                }}
                className="w-full px-4 py-2 flex items-center space-x-3 hover:bg-white/5 transition-colors text-left"
              >
                <ListPlus className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-white">プレイリストに追加</span>
              </button>

              <button
                onClick={() => {
                  onEdit?.();
                  onClose();
                }}
                className="w-full px-4 py-2 flex items-center space-x-3 hover:bg-white/5 transition-colors text-left"
              >
                <Edit2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-white">メタデータを編集</span>
              </button>

              <button
                onClick={() => {
                  // TODO: 共有機能
                  toast.success('共有リンクをコピーしました');
                  onClose();
                }}
                className="w-full px-4 py-2 flex items-center space-x-3 hover:bg-white/5 transition-colors text-left"
              >
                <Share2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-white">共有</span>
              </button>

              <button
                onClick={() => {
                  // TODO: 詳細情報表示
                  onClose();
                }}
                className="w-full px-4 py-2 flex items-center space-x-3 hover:bg-white/5 transition-colors text-left"
              >
                <Info className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-white">詳細情報</span>
              </button>

              <div className="my-1 border-t border-white/10" />

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full px-4 py-2 flex items-center space-x-3 hover:bg-red-500/10 transition-colors text-left"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-500">ライブラリから削除</span>
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-50 w-80 glass-dark rounded-xl border border-white/10 shadow-2xl overflow-hidden"
            style={{
              left: `${position.x}px`,
              top: `${position.y}px`,
            }}
          >
            {/* 削除確認 */}
            <div className="p-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">楽曲を削除</h3>
                  <p className="text-xs text-gray-400">この操作は取り消せません</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-300 mb-3">
                  「{track.title}」を削除しますか？
                </p>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteFile}
                    onChange={(e) => setDeleteFile(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-red-500 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-300">
                    ファイルも削除する（PC上から完全に削除）
                  </span>
                </label>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-sm text-white transition-colors"
                >
                  削除
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
