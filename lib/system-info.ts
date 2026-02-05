import si from 'systeminformation';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface SystemInfo {
  cpu: {
    usage: number;
    cores: number;
    model: string;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  network: {
    upload: number;
    download: number;
    ping: number; // ping追加
  };
  uptime: number;
}

let startTime = Date.now();
let lastNetworkStats: { rx_bytes: number; tx_bytes: number } | null = null;
let lastNetworkTime = Date.now();

async function getPing(): Promise<number> {
  try {
    const { stdout } = await execAsync('ping -n 1 8.8.8.8');
    const match = stdout.match(/時間[<=](\d+)ms/);
    if (match) {
      return parseInt(match[1]);
    }
    // 英語版Windows用
    const englishMatch = stdout.match(/time[<=](\d+)ms/);
    if (englishMatch) {
      return parseInt(englishMatch[1]);
    }
    return 0;
  } catch (error) {
    console.error('Ping error:', error);
    return 0;
  }
}

export async function getSystemInfo(): Promise<SystemInfo> {
  try {
    // CPU情報
    const cpuUsage = await si.currentLoad();
    const cpuInfo = await si.cpu();

    // メモリ情報
    const memInfo = await si.mem();

    // ディスク情報（Cドライブ）
    const diskInfo = await si.fsSize();
    const cDrive = diskInfo.find(d => d.mount === 'C:\\') || diskInfo[0];

    // ネットワーク情報
    const networkStats = await si.networkStats();
    const now = Date.now();
    const timeDiff = (now - lastNetworkTime) / 1000; // 秒

    let uploadSpeed = 0;
    let downloadSpeed = 0;

    if (lastNetworkStats && timeDiff > 0) {
      const totalRx = networkStats.reduce((sum, stat) => sum + stat.rx_bytes, 0);
      const totalTx = networkStats.reduce((sum, stat) => sum + stat.tx_bytes, 0);
      
      downloadSpeed = (totalRx - lastNetworkStats.rx_bytes) / timeDiff;
      uploadSpeed = (totalTx - lastNetworkStats.tx_bytes) / timeDiff;
    }

    lastNetworkStats = {
      rx_bytes: networkStats.reduce((sum, stat) => sum + stat.rx_bytes, 0),
      tx_bytes: networkStats.reduce((sum, stat) => sum + stat.tx_bytes, 0),
    };
    lastNetworkTime = now;

    // Ping取得
    const ping = await getPing();

    // サーバー起動時間
    const uptime = Math.floor((Date.now() - startTime) / 1000);

    return {
      cpu: {
        usage: cpuUsage.currentLoad || 0,
        cores: cpuInfo.cores || 1,
        model: (cpuInfo.manufacturer || '') + ' ' + (cpuInfo.brand || 'Unknown'),
      },
      memory: {
        total: memInfo.total,
        used: memInfo.used,
        free: memInfo.free,
        usage: memInfo.total > 0 ? (memInfo.used / memInfo.total) * 100 : 0,
      },
      disk: {
        total: cDrive?.size || 0,
        used: cDrive?.used || 0,
        free: cDrive?.available || 0,
        usage: cDrive && cDrive.size > 0 ? (cDrive.used / cDrive.size) * 100 : 0,
      },
      network: {
        upload: uploadSpeed,
        download: downloadSpeed,
        ping: ping,
      },
      uptime,
    };
  } catch (error) {
    console.error('Error getting system info:', error);
    throw error;
  }
}
