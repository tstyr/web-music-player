'use client';

import { useState, useEffect } from 'react';
import { X, Server, CheckCircle, AlertCircle } from 'lucide-react';
import { getApiUrl, setApiUrl, hasCustomApiUrl } from '@/lib/api-config';

interface ServerConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
}

export default function ServerConnectionModal({
  isOpen,
  onClose,
  onConnect
}: ServerConnectionModalProps) {
  const [serverUrl, setServerUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      const currentUrl = getApiUrl();
      setServerUrl(currentUrl || '');
      setTestResult(null);
      setErrorMessage('');
    }
  }, [isOpen]);

  const testConnection = async () => {
    if (!serverUrl.trim()) {
      setErrorMessage('URLを入力してください');
      return;
    }

    setTesting(true);
    setTestResult(null);
    setErrorMessage('');

    try {
      const normalizedUrl = serverUrl.replace(/\/$/, '');
      const response = await fetch(`${normalizedUrl}/api/system-info`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setTestResult('success');
        setApiUrl(normalizedUrl);
      } else {
        setTestResult('error');
        setErrorMessage(`接続エラー: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      setTestResult('error');
      setErrorMessage(`接続に失敗しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setTesting(false);
    }
  };

  const handleConnect = () => {
    if (testResult === 'success') {
      onConnect();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="glass-dark rounded-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Server className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-bold">サーバー接続設定</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              サーバーURL（Cloudflare Tunnel URL）
            </label>
            <input
              type="url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="https://your-tunnel.trycloudflare.com"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-400 mt-2">
              Cloudflare Tunnelで生成されたURLを入力してください
            </p>
          </div>

          {testResult === 'success' && (
            <div className="flex items-center space-x-2 text-green-500 bg-green-500/10 rounded-lg p-3">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">接続成功！サーバーに接続できます。</span>
            </div>
          )}

          {testResult === 'error' && (
            <div className="flex items-start space-x-2 text-red-500 bg-red-500/10 rounded-lg p-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-medium">接続失敗</div>
                <div className="text-xs mt-1">{errorMessage}</div>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={testConnection}
              disabled={testing || !serverUrl.trim()}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 rounded-lg transition-colors"
            >
              {testing ? '接続テスト中...' : '接続テスト'}
            </button>
            <button
              onClick={handleConnect}
              disabled={testResult !== 'success'}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 rounded-lg transition-colors"
            >
              接続
            </button>
          </div>

          <div className="text-xs text-gray-400 space-y-1">
            <p>💡 ヒント:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>ローカル環境: http://localhost:3000</li>
              <li>Cloudflare Tunnel: https://xxx.trycloudflare.com</li>
              <li>カスタムドメイン: https://music.example.com</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
