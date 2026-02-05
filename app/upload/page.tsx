'use client';

import { useState } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/music/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'アップロードが完了しました' });
        setFile(null);
        // ファイル入力のリセット
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setMessage({ type: 'error', text: data.error || 'アップロードに失敗しました' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'アップロード中にエラーが発生しました' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">ファイルアップロード</h1>

        <div className="bg-gray-800 rounded-lg p-8">
          <div className="mb-6">
            <label htmlFor="file-input" className="block text-sm font-medium text-gray-300 mb-2">
              音楽ファイルを選択
            </label>
            <input
              id="file-input"
              type="file"
              accept="audio/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-500 file:text-white hover:file:bg-green-600 cursor-pointer"
            />
            {file && (
              <div className="mt-2 text-sm text-gray-400">
                選択されたファイル: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-full transition-colors"
          >
            {uploading ? 'アップロード中...' : 'アップロード'}
          </button>

          {message && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}
        </div>

        <div className="mt-8 text-sm text-gray-400">
          <p>サポートされている形式: MP3, FLAC, M4A, AAC, OGG, WAV, WMA</p>
        </div>
      </div>
    </div>
  );
}
