import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const MUSIC_LIBRARY_PATH = process.env.MUSIC_LIBRARY_PATH || path.join(process.cwd(), 'uploads', 'music');

// 文字列をUTF-8で正規化
function normalizeString(str: string): string {
  return str.normalize('NFC');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathArray } = await params;
    
    // パス全体を結合
    const fullPath = pathArray.join('/');
    
    // URLデコードを複数回試行（二重エンコード対策）
    let decodedPath = fullPath;
    try {
      decodedPath = decodeURIComponent(fullPath);
      // 二重エンコードされている場合に備えて再度デコード
      if (decodedPath.includes('%')) {
        decodedPath = decodeURIComponent(decodedPath);
      }
    } catch (e) {
      console.warn('[Stream] Decode error, using original path:', e);
    }
    
    // UTF-8正規化
    decodedPath = normalizeString(decodedPath);
    
    console.log('[Stream] Request:', { 
      original: fullPath, 
      decoded: decodedPath,
      bytes: Buffer.from(decodedPath).toString('hex').substring(0, 100)
    });
    
    // セキュリティ対策: パストラバーサルを防ぐ
    if (decodedPath.includes('..')) {
      console.error('[Stream] Invalid path (contains ..):', decodedPath);
      return NextResponse.json(
        { error: '無効なパスです' },
        { status: 403 }
      );
    }
    
    // 絶対パスの場合はそのまま使用、相対パスの場合はMUSIC_LIBRARY_PATHと結合
    let filePath: string;
    if (path.isAbsolute(decodedPath)) {
      filePath = decodedPath;
    } else {
      filePath = path.join(MUSIC_LIBRARY_PATH, decodedPath);
    }
    
    // パスを正規化
    const normalizedPath = normalizeString(path.normalize(filePath));
    console.log('[Stream] Normalized path:', normalizedPath);

    // ファイルの存在確認
    if (!fs.existsSync(normalizedPath)) {
      console.error('[Stream] File not found:', normalizedPath);
      
      // デバッグ: ディレクトリ内のファイル一覧を表示
      const dir = path.dirname(normalizedPath);
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        console.log('[Stream] Files in directory:', files.slice(0, 5));
      }
      
      return NextResponse.json(
        { error: 'ファイルが見つかりません', path: normalizedPath },
        { status: 404 }
      );
    }

    const stat = fs.statSync(normalizedPath);
    const fileSize = stat.size;

    console.log('[Stream] Streaming file:', path.basename(normalizedPath), 'Size:', fileSize);

    // Rangeリクエストの処理
    const range = request.headers.get('range');
    
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(normalizedPath, { start, end });
      
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize.toString(),
        'Content-Type': getContentType(normalizedPath),
        'Cache-Control': 'public, max-age=31536000',
      };

      return new NextResponse(file as any, {
        status: 206,
        headers: head,
      });
    } else {
      // 全体を返す
      const file = fs.createReadStream(normalizedPath);
      const head = {
        'Content-Length': fileSize.toString(),
        'Content-Type': getContentType(normalizedPath),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000',
      };

      return new NextResponse(file as any, {
        status: 200,
        headers: head,
      });
    }
  } catch (error: any) {
    console.error('[Stream] API error:', error.message);
    return NextResponse.json(
      { error: 'ストリーミングエラーが発生しました', details: error.message },
      { status: 500 }
    );
  }
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes: Record<string, string> = {
    '.mp3': 'audio/mpeg',
    '.flac': 'audio/flac',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
    '.ogg': 'audio/ogg',
    '.wav': 'audio/wav',
    '.wma': 'audio/x-ms-wma',
  };
  return contentTypes[ext] || 'application/octet-stream';
}
