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
    const url = `http://${localIP}:${port}`;

    return NextResponse.json({
      localIP,
      port,
      url
    });
  } catch (error) {
    console.error('Network info error:', error);
    return NextResponse.json(
      { error: 'Failed to get network info' },
      { status: 500 }
    );
  }
}
