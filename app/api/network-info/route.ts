import { NextResponse } from 'next/server';
import { networkInterfaces } from 'os';

export async function GET() {
  try {
    const nets = networkInterfaces();
    let localIP = 'localhost';
    
    // ローカルIPアドレスを取得
    for (const name of Object.keys(nets)) {
      const netInfo = nets[name];
      if (netInfo) {
        for (const net of netInfo) {
          // IPv4でプライベートアドレスを探す
          if (net.family === 'IPv4' && !net.internal) {
            if (net.address.startsWith('192.168.') || 
                net.address.startsWith('10.') || 
                net.address.startsWith('172.')) {
              localIP = net.address;
              break;
            }
          }
        }
      }
    }

    const port = process.env.PORT || '3001';
    const localUrl = `http://${localIP}:${port}`;

    // 外部IPアドレスを取得
    let externalIP = null;
    let externalUrl = null;
    
    try {
      // 複数のサービスを試す
      const ipServices = [
        'https://api.ipify.org?format=json',
        'https://api.my-ip.io/ip.json',
        'https://ipapi.co/json/'
      ];

      for (const service of ipServices) {
        try {
          const response = await fetch(service, { 
            signal: AbortSignal.timeout(3000) // 3秒タイムアウト
          });
          
          if (response.ok) {
            const data = await response.json();
            externalIP = data.ip || data.IP || data.query;
            if (externalIP) {
              externalUrl = `http://${externalIP}:${port}`;
              break;
            }
          }
        } catch (err) {
          // 次のサービスを試す
          continue;
        }
      }
    } catch (error) {
      console.log('External IP fetch failed:', error);
      // 外部IPが取得できなくてもエラーにしない
    }

    return NextResponse.json({
      localIP,
      externalIP,
      port,
      localUrl,
      externalUrl,
      // ポートフォワーディング設定が必要かどうか
      needsPortForwarding: externalIP !== null
    });
  } catch (error) {
    console.error('Network info error:', error);
    return NextResponse.json(
      { error: 'Failed to get network info' },
      { status: 500 }
    );
  }
}
