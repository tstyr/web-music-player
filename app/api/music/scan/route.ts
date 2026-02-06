import { NextResponse } from 'next/server';
import { scanMusicLibrary } from '@/lib/music-scanner';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    
    // デフォルトでuploadsフォルダをスキャン
    const defaultFolder = path.join(process.cwd(), 'uploads', 'music');
    const folderPath = body.folderPath || process.env.MUSIC_LIBRARY_PATH || defaultFolder;
    
    console.log('Scanning music folder:', folderPath);
    
    // Socket.ioインスタンスを取得（server.jsでグローバルに設定）
    const io = (global as any).io;
    
    // Socket.ioを渡してスキャン実行
    const result = await scanMusicLibrary(folderPath, true, io);
    
    return NextResponse.json({
      success: true,
      result,
      folderPath,
    });
  } catch (error: any) {
    console.error('Music scan API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || '音楽ライブラリのスキャンに失敗しました' 
      },
      { status: 500 }
    );
  }
}
