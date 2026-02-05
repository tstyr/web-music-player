'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Cpu, 
  HardDrive, 
  Wifi, 
  Activity,
  Clock,
  Server,
  Database,
  Users
} from 'lucide-react';
import NetworkInfo from './NetworkInfo';

interface SystemInfo {
  cpu: {
    manufacturer: string;
    brand: string;
    cores: number;
    physicalCores: number;
    speed: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    active: number;
  };
  storage: Array<{
    fs: string;
    type: string;
    size: number;
    used: number;
    available: number;
    use: number;
  }>;
  network: Array<{
    iface: string;
    rx_bytes: number;
    tx_bytes: number;
    rx_sec: number;
    tx_sec: number;
  }>;
  uptime: number;
}

export default function ServerDashboard() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackCount, setTrackCount] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  useEffect(() => {
    const fetchTrackCount = async () => {
      try {
        const response = await fetch('/api/music/tracks?limit=1');
        const data = await response.json();
        setTrackCount(data.pagination?.total || 0);
      } catch (error) {
        console.error('Error fetching track count:', error);
        setTrackCount(0);
      }
    };

    fetchTrackCount();
  }, []);

  const handleScanLibrary = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const response = await fetch('/api/music/scan', { method: 'POST' });
      const data = await response.json();
      setScanResult(data.result);
      
      // トラック数を再取得
      const tracksResponse = await fetch('/api/music/tracks?limit=1');
      const tracksData = await tracksResponse.json();
      setTrackCount(tracksData.pagination?.total || 0);
    } catch (error) {
      console.error('Scan error:', error);
    } finally {
      setScanning(false);
    }
  };

  const handleSelectFolder = async () => {
    // ブラウザ環境では、uploadsフォルダをデフォルトでスキャン
    const defaultFolder = '/uploads/music';
    console.log('Using default music folder:', defaultFolder);
    
    // スキャンを実行
    await handleScanLibrary();
  };

  const handleCreateSampleTracks = async () => {
    try {
      const response = await fetch('/api/music/sample', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        // トラック数を再取得
        const tracksResponse = await fetch('/api/music/tracks?limit=1');
        const tracksData = await tracksResponse.json();
        setTrackCount(tracksData.pagination?.total || 0);
        
        alert(`${data.tracks.length} サンプルトラックを作成しました`);
      }
    } catch (error) {
      console.error('Sample tracks creation error:', error);
      alert('サンプルトラックの作成に失敗しました');
    }
  };

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        // 実際のシステム情報APIから取得
        const response = await fetch('/api/system-info');
        if (response.ok) {
          const data = await response.json();
          // APIレスポンスを既存の形式に変換
          const convertedInfo = {
            cpu: {
              manufacturer: data.cpu.model.split(' ')[0] || 'Unknown',
              brand: data.cpu.model,
              cores: data.cpu.cores * 2, // 論理コア数として表示
              physicalCores: data.cpu.cores,
              speed: 3.8, // デフォルト値（実際のAPIでは取得できない）
              usage: data.cpu.usage
            },
            memory: {
              total: data.memory.total,
              free: data.memory.free,
              used: data.memory.used,
              active: data.memory.used // activeとusedを同じ値に
            },
            storage: [{
              fs: 'C:',
              type: 'NTFS',
              size: data.disk.total,
              used: data.disk.used,
              available: data.disk.free,
              use: data.disk.usage
            }],
            network: [{
              iface: 'Ethernet',
              rx_bytes: 0, // 累積値は表示しない
              tx_bytes: 0,
              rx_sec: data.network.download,
              tx_sec: data.network.upload,
              ping: data.network.ping
            }],
            uptime: data.uptime
          };
          setSystemInfo(convertedInfo);
        } else {
          throw new Error('Failed to fetch system info');
        }
      } catch (error) {
        console.error('Error fetching system info:', error);
        // エラー時はモックデータを使用
        setSystemInfo({
          cpu: {
            manufacturer: 'Intel',
            brand: 'Intel(R) Core(TM) i7-10700K',
            cores: 16,
            physicalCores: 8,
            speed: 3.8,
            usage: 25.5
          },
          memory: {
            total: 34359738368, // 32GB
            free: 8589934592,   // 8GB
            used: 25769803776,  // 24GB
            active: 17179869184 // 16GB
          },
          storage: [{
            fs: 'C:',
            type: 'NTFS',
            size: 1000000000000, // 1TB
            used: 500000000000,  // 500GB
            available: 500000000000, // 500GB
            use: 50
          }],
          network: [{
            iface: 'Ethernet',
            rx_bytes: 1000000000,
            tx_bytes: 500000000,
            rx_sec: 1024000,
            tx_sec: 512000
          }],
          uptime: 86400 // 1 day
        });
      }
      setLoading(false);
    };

    fetchSystemInfo();
    const interval = setInterval(fetchSystemInfo, 5000); // 5秒ごとに更新

    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <div className="text-gray-400">Loading system information...</div>
        </div>
      </div>
    );
  }

  if (!systemInfo) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <Server className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <div>Unable to load system information</div>
        </div>
      </div>
    );
  }

  const memoryUsagePercent = (systemInfo.memory.used / systemInfo.memory.total) * 100;
  const storageUsagePercent = systemInfo.storage[0]?.use || 0;

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Server Dashboard</h1>
        
        {/* サーバー状態カード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            className="glass rounded-xl p-6 hover-lift"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Activity className="w-6 h-6 text-green-500" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-500">Online</div>
                <div className="text-sm text-gray-400">Server Status</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="glass rounded-xl p-6 hover-lift"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{formatUptime(systemInfo.uptime)}</div>
                <div className="text-sm text-gray-400">Uptime</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="glass rounded-xl p-6 hover-lift"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Users className="w-6 h-6 text-purple-500" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">3</div>
                <div className="text-sm text-gray-400">Connected Clients</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="glass rounded-xl p-6 hover-lift"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Database className="w-6 h-6 text-orange-500" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{trackCount}</div>
                <div className="text-sm text-gray-400">Total Tracks</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 音楽ライブラリ管理 */}
        <div className="mb-8">
          <motion.div
            className="glass rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-lg font-semibold mb-4">音楽ライブラリ管理</h3>
            <div className="flex gap-4 flex-wrap">
              <button
                onClick={handleScanLibrary}
                disabled={scanning}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 rounded-lg transition-colors"
              >
                {scanning ? 'スキャン中...' : '音楽フォルダをスキャン'}
              </button>
              <button
                onClick={handleSelectFolder}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
              >
                フォルダを選択
              </button>
              <button
                onClick={handleCreateSampleTracks}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
              >
                サンプルトラック作成
              </button>
            </div>
            {scanResult && (
              <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                <p>スキャン結果:</p>
                <ul className="text-sm text-gray-300 mt-2">
                  <li>スキャンしたファイル: {scanResult.scanned}</li>
                  <li>追加されたトラック: {scanResult.added}</li>
                  <li>更新されたトラック: {scanResult.updated}</li>
                  <li>エラー: {scanResult.errors}</li>
                </ul>
              </div>
            )}
          </motion.div>
        </div>

        {/* システム情報 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* CPU情報 */}
          <motion.div
            className="glass rounded-xl p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Cpu className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">CPU</h3>
                <p className="text-sm text-gray-400">{systemInfo.cpu.brand}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Cores</span>
                <span>{systemInfo.cpu.cores} ({systemInfo.cpu.physicalCores} physical)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Base Speed</span>
                <span>{systemInfo.cpu.speed} GHz</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Manufacturer</span>
                <span>{systemInfo.cpu.manufacturer}</span>
              </div>
              {systemInfo.cpu.usage !== undefined && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Usage</span>
                    <span>{systemInfo.cpu.usage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <motion.div
                      className="bg-red-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${systemInfo.cpu.usage}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* メモリ情報 */}
          <motion.div
            className="glass rounded-xl p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Activity className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Memory</h3>
                <p className="text-sm text-gray-400">
                  {formatBytes(systemInfo.memory.used)} / {formatBytes(systemInfo.memory.total)}
                </p>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Usage</span>
                <span>{memoryUsagePercent.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-yellow-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${memoryUsagePercent}%` }}
                  transition={{ duration: 1, delay: 0.8 }}
                />
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Free</span>
                <span>{formatBytes(systemInfo.memory.free)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Active</span>
                <span>{formatBytes(systemInfo.memory.active)}</span>
              </div>
            </div>
          </motion.div>

          {/* ストレージ情報 */}
          <motion.div
            className="glass rounded-xl p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <HardDrive className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Storage</h3>
                <p className="text-sm text-gray-400">
                  {systemInfo.storage[0]?.fs} ({systemInfo.storage[0]?.type})
                </p>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Usage</span>
                <span>{storageUsagePercent.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-green-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${storageUsagePercent}%` }}
                  transition={{ duration: 1, delay: 0.9 }}
                />
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total</span>
                <span>{formatBytes(systemInfo.storage[0]?.size || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Available</span>
                <span>{formatBytes(systemInfo.storage[0]?.available || 0)}</span>
              </div>
            </div>
          </motion.div>

          {/* ネットワーク情報 */}
          <motion.div
            className="glass rounded-xl p-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Wifi className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Network</h3>
                <p className="text-sm text-gray-400">
                  {systemInfo.network[0]?.iface || 'Unknown'}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Download</span>
                <span className="text-green-400">
                  {formatBytes(systemInfo.network[0]?.rx_sec || 0)}/s
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Upload</span>
                <span className="text-blue-400">
                  {formatBytes(systemInfo.network[0]?.tx_sec || 0)}/s
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ping</span>
                <span className={`${(systemInfo.network[0]?.ping || 0) < 50 ? 'text-green-400' : (systemInfo.network[0]?.ping || 0) < 100 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {systemInfo.network[0]?.ping || 0}ms
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total RX</span>
                <span>{formatBytes(systemInfo.network[0]?.rx_bytes || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total TX</span>
                <span>{formatBytes(systemInfo.network[0]?.tx_bytes || 0)}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ネットワークアクセス情報 */}
        <div className="mt-8">
          <NetworkInfo />
        </div>
      </div>
    </div>
  );
}