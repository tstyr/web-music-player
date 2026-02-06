'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Wifi, Copy, Check, Globe, AlertCircle, ExternalLink, Router } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NetworkInfo() {
  const [networkInfo, setNetworkInfo] = useState<{
    localIP: string;
    externalIP: string | null;
    port: string;
    localUrl: string;
    externalUrl: string | null;
    needsPortForwarding: boolean;
  } | null>(null);
  const [copiedLocal, setCopiedLocal] = useState(false);
  const [copiedExternal, setCopiedExternal] = useState(false);
  const [showExternal, setShowExternal] = useState(false);

  useEffect(() => {
    fetch('/api/network-info')
      .then(res => res.json())
      .then(data => {
        setNetworkInfo(data);
        // 外部IPが取得できた場合は外部タブを表示
        if (data.externalIP) {
          setShowExternal(true);
        }
      })
      .catch(err => console.error('Failed to fetch network info:', err));
  }, []);

  const copyToClipboard = (text: string, isExternal: boolean = false) => {
    navigator.clipboard.writeText(text);
    if (isExternal) {
      setCopiedExternal(true);
      setTimeout(() => setCopiedExternal(false), 2000);
    } else {
      setCopiedLocal(true);
      setTimeout(() => setCopiedLocal(false), 2000);
    }
    toast.success('URLをコピーしました');
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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Wifi className="w-6 h-6 text-green-500" />
          <h3 className="text-xl font-bold">ネットワークアクセス</h3>
        </div>
        {networkInfo.externalIP && (
          <div className="flex items-center space-x-2 text-xs">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-400">外部アクセス可能</span>
          </div>
        )}
      </div>

      {/* タブ切り替え */}
      <div className="flex space-x-2 border-b border-white/10">
        <button
          onClick={() => setShowExternal(false)}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            !showExternal
              ? 'text-green-500 border-b-2 border-green-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Wifi className="w-4 h-4" />
            <span>ローカルネットワーク</span>
          </div>
        </button>
        <button
          onClick={() => setShowExternal(true)}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            showExternal
              ? 'text-green-500 border-b-2 border-green-500'
              : 'text-gray-400 hover:text-white'
          }`}
          disabled={!networkInfo.externalIP}
        >
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4" />
            <span>外部ネットワーク</span>
          </div>
        </button>
      </div>

      {/* Cloudflare Tunnel推奨バナー */}
      <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Globe className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-orange-500 mb-1">
              🚀 Cloudflare Tunnelを推奨
            </h4>
            <p className="text-sm text-orange-400/80 mb-2">
              ポート開放不要で安全に外部公開できます（無料・HTTPS自動・DDoS保護）
            </p>
            <a
              href="/CLOUDFLARE_TUNNEL_SETUP.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-sm text-orange-500 hover:text-orange-400 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>セットアップガイドを見る</span>
            </a>
          </div>
        </div>
      </div>

      {/* ローカルネットワーク */}
      {!showExternal && (
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
              <div className="flex-1 text-sm sm:text-base font-mono bg-gray-800 rounded-lg p-3 truncate">
                {networkInfo.localUrl}
              </div>
              <button
                onClick={() => copyToClipboard(networkInfo.localUrl)}
                className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
              >
                {copiedLocal ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg">
            <QRCodeSVG
              value={networkInfo.localUrl}
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
      )}

      {/* 外部ネットワーク */}
      {showExternal && networkInfo.externalIP && (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400">外部IP（グローバルIP）</label>
            <div className="text-lg font-mono bg-gray-800 rounded-lg p-3 mt-1">
              {networkInfo.externalIP}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400">外部アクセスURL</label>
            <div className="flex items-center space-x-2 mt-1">
              <div className="flex-1 text-sm sm:text-base font-mono bg-gray-800 rounded-lg p-3 truncate">
                {networkInfo.externalUrl}
              </div>
              <button
                onClick={() => copyToClipboard(networkInfo.externalUrl!)}
                className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
              >
                {copiedExternal ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {networkInfo.externalUrl && (
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG
                value={networkInfo.externalUrl}
                size={200}
                level="H"
                className="mx-auto"
              />
              <p className="text-center text-sm text-gray-600 mt-2">
                外部からアクセス用QRコード
              </p>
            </div>
          )}

          {/* ポートフォワーディング設定ガイド */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 space-y-3">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-500 mb-2">
                  ⚠️ ポートフォワーディング設定が必要です
                </h4>
                <p className="text-sm text-yellow-400/80 mb-3">
                  外部ネットワークからアクセスするには、ルーターでポート{networkInfo.port}を開放する必要があります。
                </p>
                
                <div className="space-y-2 text-sm text-yellow-400/80">
                  <div className="flex items-center space-x-2">
                    <Router className="w-4 h-4" />
                    <span className="font-medium">設定手順:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 ml-6">
                    <li>ルーターの管理画面にアクセス（通常 192.168.1.1）</li>
                    <li>「ポートフォワーディング」または「仮想サーバー」を開く</li>
                    <li>以下の設定を追加:
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>外部ポート: {networkInfo.port}</li>
                        <li>内部IP: {networkInfo.localIP}</li>
                        <li>内部ポート: {networkInfo.port}</li>
                        <li>プロトコル: TCP</li>
                      </ul>
                    </li>
                    <li>設定を保存して再起動</li>
                  </ol>
                </div>

                <a
                  href="https://portforward.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 mt-3 text-sm text-yellow-500 hover:text-yellow-400 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>ルーター別の詳細設定ガイド</span>
                </a>
              </div>
            </div>
          </div>

          {/* セキュリティ警告 */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-500 mb-1">
                  🔒 セキュリティに注意
                </h4>
                <ul className="text-sm text-red-400/80 space-y-1">
                  <li>• 外部公開する場合は、強力なパスワードを設定してください</li>
                  <li>• HTTPSの使用を推奨（Let&apos;s Encryptなど）</li>
                  <li>• 信頼できるユーザーのみにURLを共有してください</li>
                  <li>• 定期的にアクセスログを確認してください</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 外部IPが取得できない場合 */}
      {showExternal && !networkInfo.externalIP && (
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <Globe className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <h4 className="font-semibold text-white mb-2">外部IPを取得できませんでした</h4>
          <p className="text-sm text-gray-400">
            インターネット接続を確認してください
          </p>
        </div>
      )}
    </div>
  );
}
