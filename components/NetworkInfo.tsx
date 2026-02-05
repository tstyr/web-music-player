'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Wifi, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NetworkInfo() {
  const [networkInfo, setNetworkInfo] = useState<{
    localIP: string;
    port: string;
    url: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/network-info')
      .then(res => res.json())
      .then(data => setNetworkInfo(data))
      .catch(err => console.error('Failed to fetch network info:', err));
  }, []);

  const copyToClipboard = () => {
    if (networkInfo) {
      navigator.clipboard.writeText(networkInfo.url);
      setCopied(true);
      toast.success('URLをコピーしました');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!networkInfo) {
    return (
      <div className="glass rounded-xl p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Wifi className="w-6 h-6 text-green-500" />
        <h3 className="text-xl font-bold">ネットワークアクセス</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-400">ローカルIP</label>
          <div className="text-lg font-mono bg-gray-800 rounded-lg p-3 mt-1">
            {networkInfo.localIP}
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-400">アクセスURL</label>
          <div className="flex items-center space-x-2 mt-1">
            <div className="flex-1 text-lg font-mono bg-gray-800 rounded-lg p-3">
              {networkInfo.url}
            </div>
            <button
              onClick={copyToClipboard}
              className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg">
          <QRCodeSVG
            value={networkInfo.url}
            size={200}
            level="H"
            className="mx-auto"
          />
          <p className="text-center text-sm text-gray-600 mt-2">
            スマホでスキャンしてアクセス
          </p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-sm text-blue-400">
            💡 同じWi-Fiネットワークに接続されたデバイスからアクセスできます
          </p>
        </div>
      </div>
    </div>
  );
}
