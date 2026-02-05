'use client';

import { useEffect, useState } from 'react';
import { SystemInfo } from '@/lib/system-info';
import { 
  Play, 
  Square, 
  Folder, 
  Server, 
  Activity, 
  Cpu, 
  HardDrive, 
  Wifi,
  Clock,
  Database,
  Users,
  Terminal,
  Settings
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ServerLog {
  type: 'stdout' | 'stderr' | 'error';
  data: string;
  timestamp: number;
}

interface ServerStatus {
  running: boolean;
  code?: number;
  error?: string;
}

interface ElectronSystemInfo {
  cpu: {
    manufacturer: string;
    brand: string;
    cores: number;
    physicalCores: number;
    speed: number;
    usage: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    active: number;
    usage: number;
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
  timestamp: number;
}

export default function AdminDashboard() {
  const [systemInfo, setSystemInfo] = useState<ElectronSystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState<ServerStatus>({ running: false });
  const [serverLogs, setServerLogs] = useState<ServerLog[]>([]);
  const [musicFolder, setMusicFolder] = useState<string>('');
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Check if running in Electron
    const checkElectron = typeof window !== 'undefined' && !!window.electronAPI;
    setIsElectron(checkElectron);

    if (checkElectron && window.electronAPI) {
      // Electron environment - use IPC
      initializeElectronData();
      setupElectronListeners();
    } else {
      // Browser environment - use API
      initializeBrowserData();
    }

    return () => {
      if (checkElectron && window.electronAPI) {
        // Clean up listeners
        window.electronAPI.removeAllListeners('system-info-update');
        window.electronAPI.removeAllListeners('server-log');
        window.electronAPI.removeAllListeners('server-status');
      }
    };
  }, []);

  const initializeElectronData = async () => {
    try {
      // Get initial system info
      const info = await window.electronAPI.getSystemInfo();
      setSystemInfo(info);
      
      // Get server status
      const status = await window.electronAPI.getServerStatus();
      setServerStatus(status);
      
      // Get music folder
      const folder = await window.electronAPI.getMusicFolder();
      setMusicFolder(folder);
      
      setLoading(false);
    } catch (error) {
      console.error('Error initializing Electron data:', error);
      setLoading(false);
    }
  };

  const initializeBrowserData = async () => {
    try {
      const response = await fetch('/api/system-info');
      const data = await response.json();
      
      // Convert browser API format to Electron format
      const electronFormat: ElectronSystemInfo = {
        cpu: {
          manufacturer: 'Intel',
          brand: data.cpu.model || 'Unknown CPU',
          cores: data.cpu.cores,
          physicalCores: data.cpu.cores,
          speed: 3.8,
          usage: data.cpu.usage
        },
        memory: {
          total: data.memory.total,
          free: data.memory.free,
          used: data.memory.used,
          active: data.memory.used,
          usage: data.memory.usage
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
          rx_bytes: 0,
          tx_bytes: 0,
          rx_sec: data.network.download,
          tx_sec: data.network.upload
        }],
        uptime: data.uptime,
        timestamp: Date.now()
      };
      
      setSystemInfo(electronFormat);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch system info:', error);
      setLoading(false);
    }
  };

  const setupElectronListeners = () => {
    // Real-time system info updates
    window.electronAPI.onSystemInfoUpdate((info: ElectronSystemInfo) => {
      setSystemInfo(info);
    });

    // Server log updates
    window.electronAPI.onServerLog((log: { type: string; data: string }) => {
      const newLog: ServerLog = {
        type: log.type as 'stdout' | 'stderr' | 'error',
        data: log.data,
        timestamp: Date.now()
      };
      setServerLogs(prev => [...prev.slice(-99), newLog]); // Keep last 100 logs
    });

    // Server status updates
    window.electronAPI.onServerStatus((status: ServerStatus) => {
      setServerStatus(status);
    });
  };

  const handleStartServer = async () => {
    if (!isElectron) return;
    
    try {
      const result = await window.electronAPI.startWebServer();
      if (result.success) {
        setServerLogs(prev => [...prev, {
          type: 'stdout',
          data: result.message,
          timestamp: Date.now()
        }]);
      } else {
        setServerLogs(prev => [...prev, {
          type: 'error',
          data: result.message,
          timestamp: Date.now()
        }]);
      }
    } catch (error) {
      console.error('Error starting server:', error);
    }
  };

  const handleStopServer = async () => {
    if (!isElectron) return;
    
    try {
      const result = await window.electronAPI.stopWebServer();
      setServerLogs(prev => [...prev, {
        type: 'stdout',
        data: result.message,
        timestamp: Date.now()
      }]);
    } catch (error) {
      console.error('Error stopping server:', error);
    }
  };

  const handleSelectMusicFolder = async () => {
    if (!isElectron) return;
    
    try {
      const folderPath = await window.electronAPI.selectMusicFolder();
      if (folderPath) {
        await window.electronAPI.setMusicFolder(folderPath);
        setMusicFolder(folderPath);
        setServerLogs(prev => [...prev, {
          type: 'stdout',
          data: `Music folder set to: ${folderPath}`,
          timestamp: Date.now()
        }]);
      }
    } catch (error) {
      console.error('Error selecting music folder:', error);
    }
  };

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
      <div className="min-h-screen p-8 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <div className="text-gray-400">Loading system information...</div>
        </div>
      </div>
    );
  }

  if (!systemInfo) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-center text-gray-400">
          <Server className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <div>Unable to load system information</div>
        </div>
      </div>
    );
  }

  const memoryUsagePercent = systemInfo.memory.usage;
  const storageUsagePercent = systemInfo.storage[0]?.use || 0;
  const cpuUsagePercent = systemInfo.cpu.usage || 0;

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-gray-900 to-black">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-white">Server Management Dashboard</h1>
        
        {/* Server Control Panel */}
        {isElectron && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Server Controls */}
            <motion.div
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Server className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Web Server Control</h3>
                  <p className="text-sm text-gray-400">
                    Status: <span className={serverStatus.running ? 'text-green-400' : 'text-red-400'}>
                      {serverStatus.running ? 'Running' : 'Stopped'}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={handleStartServer}
                  disabled={serverStatus.running}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>Start Server</span>
                </button>
                
                <button
                  onClick={handleStopServer}
                  disabled={!serverStatus.running}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop Server</span>
                </button>
              </div>
              
              <div className="border-t border-gray-700 pt-4">
                <button
                  onClick={handleSelectMusicFolder}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors w-full"
                >
                  <Folder className="w-4 h-4" />
                  <span>Select Music Folder</span>
                </button>
                {musicFolder && (
                  <p className="text-sm text-gray-400 mt-2 truncate">
                    Current: {musicFolder}
                  </p>
                )}
              </div>
            </motion.div>

            {/* Real-time Logs */}
            <motion.div
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Terminal className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-white">Real-time Logs</h3>
              </div>
              
              <div className="bg-black rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
                {serverLogs.length === 0 ? (
                  <div className="text-gray-500">No logs yet...</div>
                ) : (
                  serverLogs.map((log, index) => (
                    <div
                      key={index}
                      className={`mb-1 ${
                        log.type === 'error' ? 'text-red-400' :
                        log.type === 'stderr' ? 'text-yellow-400' :
                        'text-green-400'
                      }`}
                    >
                      <span className="text-gray-500">
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>{' '}
                      {log.data.trim()}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
        
        {/* System Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Cpu className="w-6 h-6 text-red-500" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{cpuUsagePercent.toFixed(1)}%</div>
                <div className="text-sm text-gray-400">CPU Usage</div>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-red-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${cpuUsagePercent}%` }}
                transition={{ duration: 1 }}
              />
            </div>
          </motion.div>

          <motion.div
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Activity className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{memoryUsagePercent.toFixed(1)}%</div>
                <div className="text-sm text-gray-400">Memory Usage</div>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-yellow-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${memoryUsagePercent}%` }}
                transition={{ duration: 1, delay: 0.1 }}
              />
            </div>
          </motion.div>

          <motion.div
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <HardDrive className="w-6 h-6 text-green-500" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{storageUsagePercent.toFixed(1)}%</div>
                <div className="text-sm text-gray-400">Storage Usage</div>
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-green-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${storageUsagePercent}%` }}
                transition={{ duration: 1, delay: 0.2 }}
              />
            </div>
          </motion.div>

          <motion.div
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">{formatUptime(systemInfo.uptime)}</div>
                <div className="text-sm text-gray-400">Uptime</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Detailed System Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* CPU Details */}
          <motion.div
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Cpu className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">CPU Information</h3>
                <p className="text-sm text-gray-400">{systemInfo.cpu.brand}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Cores</span>
                <span className="text-white">{systemInfo.cpu.cores} ({systemInfo.cpu.physicalCores} physical)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Base Speed</span>
                <span className="text-white">{systemInfo.cpu.speed} GHz</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Manufacturer</span>
                <span className="text-white">{systemInfo.cpu.manufacturer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Current Usage</span>
                <span className="text-white">{cpuUsagePercent.toFixed(1)}%</span>
              </div>
            </div>
          </motion.div>

          {/* Memory Details */}
          <motion.div
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Activity className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Memory Information</h3>
                <p className="text-sm text-gray-400">
                  {formatBytes(systemInfo.memory.used)} / {formatBytes(systemInfo.memory.total)}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Total</span>
                <span className="text-white">{formatBytes(systemInfo.memory.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Used</span>
                <span className="text-white">{formatBytes(systemInfo.memory.used)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Free</span>
                <span className="text-white">{formatBytes(systemInfo.memory.free)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Active</span>
                <span className="text-white">{formatBytes(systemInfo.memory.active)}</span>
              </div>
            </div>
          </motion.div>

          {/* Storage Details */}
          <motion.div
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <HardDrive className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Storage Information</h3>
                <p className="text-sm text-gray-400">
                  {systemInfo.storage[0]?.fs} ({systemInfo.storage[0]?.type})
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Total</span>
                <span className="text-white">{formatBytes(systemInfo.storage[0]?.size || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Used</span>
                <span className="text-white">{formatBytes(systemInfo.storage[0]?.used || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Available</span>
                <span className="text-white">{formatBytes(systemInfo.storage[0]?.available || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Usage</span>
                <span className="text-white">{storageUsagePercent.toFixed(1)}%</span>
              </div>
            </div>
          </motion.div>

          {/* Network Details */}
          <motion.div
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Wifi className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Network Information</h3>
                <p className="text-sm text-gray-400">
                  {systemInfo.network[0]?.iface || 'Unknown'}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Download Speed</span>
                <span className="text-green-400">
                  {formatBytes(systemInfo.network[0]?.rx_sec || 0)}/s
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Upload Speed</span>
                <span className="text-blue-400">
                  {formatBytes(systemInfo.network[0]?.tx_sec || 0)}/s
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Downloaded</span>
                <span className="text-white">{formatBytes(systemInfo.network[0]?.rx_bytes || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Total Uploaded</span>
                <span className="text-white">{formatBytes(systemInfo.network[0]?.tx_bytes || 0)}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}