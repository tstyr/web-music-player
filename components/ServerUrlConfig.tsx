'use client';

import { useState, useEffect } from 'react';
import { X, Check, RefreshCw, Server } from 'lucide-react';

export default function ServerUrlConfig() {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // 現在のURLを取得
    const savedUrl = localStorage.getItem('music_server_api_url');
    if (savedUrl) {
      setCurrentUrl(savedUrl);
      setUrl(savedUrl);
    } else {
      setCurrentUrl(window.location.origin);
    }
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    
    if (url.trim()) {
      // URLを正規化（末尾のスラッシュを削除）
      const normalizedUrl = url.trim().replace(/\/$/, '');
      localStorage.setItem('music_server_api_url', normalizedUrl);
      setCurrentUrl(normalizedUrl);
    } else {
      // 空の場合はクリア
      localStorage.removeItem('music_server_api_url');
      setCurrentUrl(window.location.origin);
    }

    setTimeout(() => {
      setIsSaving(false);
      setIsOpen(false);
      window.location.reload();
    }, 500);
  };

  const handleReset = () => {
    localStorage.removeItem('music_server_api_url');
    setUrl('');
    setCurrentUrl(window.location.origin);
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  return (
    <>
      {/* 設定ボタン */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50 p-3 bg-gray-800 hover:bg-gray-700 rounded-full shadow-lg transition-colors"
        title="サーバーURL設定"
      >
        <Server className="w-5 h-5 text-white" />
      </button>

      {/* モーダル */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6">
            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Server className="w-6 h-6" />
                サーバーURL設定
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-800 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* 現在のURL */}
            <div className="mb-4 p-3 bg-gray-800 rounded">
              <p className="text-sm text-gray-400 mb-1">現在のURL:</p>
              <p className="text-sm text-white font-mono break-all">
                {currentUrl}
              </p>
            </div>

            {/* URL入力 */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                新しいURL（Cloudflare Tunnel URL）:
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://abc-123.trycloudflare.com"
                className="w-full px-3 py-2 bg-gray-800 text-white rounded border border-gray-700 focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                空にするとlocalhostに戻ります
              </p>
            </div>

            {/* ボタン */}
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded transition-colors"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    保存して再読み込み
                  </>
                )}
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              >
                リセット
              </button>
            </div>

            {/* ヘルプ */}
            <div className="mt-4 p-3 bg-gray-800/50 rounded text-xs text-gray-400">
              <p className="font-semibold mb-1">💡 使い方:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>PCでトンネルを起動: <code className="text-blue-400">npm run tunnel:auto</code></li>
                <li>表示されたURLをコピー</li>
                <li>ここに貼り付けて保存</li>
                <li>iPadからアクセス可能に！</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
