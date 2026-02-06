import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
// 100MBまでのファイルアップロードを許可
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
};

import { prisma } from '@/lib/prisma';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'music');
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // アップロードディレクトリを作成
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const results = [];

    for (const file of files) {
      try {
        // ファイルサイズチェック（100MB制限）
        if (file.size > MAX_FILE_SIZE) {
          results.push({
            success: false,
            fileName: file.name,
            error: `File size exceeds 100MB limit (${formatFileSize(file.size)})`
          });
          continue;
        }

        // ファイル拡張子のチェック
        const ext = path.extname(file.name).toLowerCase();
        const allowedExtensions = ['.mp3', '.flac', '.m4a', '.aac', '.ogg', '.wav', '.wma', '.dsd', '.dsf', '.dff'];
        
        if (!allowedExtensions.includes(ext)) {
          results.push({
            success: false,
            fileName: file.name,
            error: 'Unsupported file format'
          });
          continue;
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // ファイル名をサニタイズ
        const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        let filePath = path.join(UPLOAD_DIR, sanitizedName);
        
        // 同名ファイルが存在する場合はタイムスタンプを追加
        let counter = 1;
        while (existsSync(filePath)) {
          const nameWithoutExt = path.parse(sanitizedName).name;
          const newName = `${nameWithoutExt}_${counter}${ext}`;
          filePath = path.join(UPLOAD_DIR, newName);
          counter++;
        }
        
        // ファイルを保存
        await writeFile(filePath, buffer);
        
        // メタデータを取得
        let duration = 0;
        let title = path.basename(file.name, path.extname(file.name));
        let artist = 'Unknown Artist';
        let album = 'Unknown Album';
        let genre = 'Unknown';
        let year = null;
        let trackNumber = null;
        let sampleRate = 44100;
        let bitDepth = 16;
        let bitrate = null;
        let channels = 2;
        let artwork = null;

        try {
          // @ts-ignore - ESモジュールの動的インポート
          const { parseFile } = await import('music-metadata');
          const metadata = await parseFile(filePath, {
            skipCovers: false,
            includeChapters: false
          });
          
          const format = metadata.format;
          const common = metadata.common;

          duration = Math.floor(format.duration || 0);
          
          if (common.title) {
            title = common.title.normalize('NFC');
          }
          if (common.artist) {
            artist = common.artist.normalize('NFC');
          }
          if (common.album) {
            album = common.album.normalize('NFC');
          }
          if (common.genre && common.genre[0]) {
            genre = common.genre[0].normalize('NFC');
          }
          
          year = common.year || year;
          trackNumber = common.track?.no || trackNumber;
          sampleRate = format.sampleRate || sampleRate;
          bitrate = format.bitrate || bitrate;
          bitDepth = format.bitsPerSample || bitDepth;
          channels = format.numberOfChannels || channels;

          // アルバムアートを保存
          if (common.picture && common.picture[0]) {
            const crypto = await import('crypto');
            const artworkDir = path.join(process.cwd(), 'public', 'artwork');
            await mkdir(artworkDir, { recursive: true });
            const artworkFileName = `${crypto.createHash('md5').update(filePath).digest('hex')}.jpg`;
            const artworkPath = path.join(artworkDir, artworkFileName);
            await writeFile(artworkPath, common.picture[0].data);
            artwork = `/artwork/${artworkFileName}?v=${Date.now()}`;
          }

          console.log(`[Upload] Metadata extracted: ${title} by ${artist}, duration: ${duration}s`);
        } catch (metadataError: any) {
          console.warn(`[Upload] メタデータ取得エラー (${file.name}):`, metadataError.message);
        }

        // Hi-Res判定とクオリティラベル
        const isHighRes = sampleRate > 48000;
        const quality = getQualityLabel(sampleRate, bitDepth);
        
        // データベースに保存
        const track = await prisma.track.create({
          data: {
            title: title.normalize('NFC'),
            artist: artist.normalize('NFC'),
            album: album.normalize('NFC'),
            duration,
            filePath: filePath,
            fileName: path.basename(filePath),
            fileSize: buffer.length,
            format: ext.substring(1).toUpperCase(),
            sampleRate,
            bitDepth,
            bitrate,
            channels,
            isHighRes,
            quality,
            genre: genre.normalize('NFC'),
            year,
            trackNumber,
            albumArtist: artist.normalize('NFC'),
            artwork,
          }
        });
        
        results.push({
          success: true,
          fileName: file.name,
          track: track,
          metadata: {
            format: track.format,
            quality: track.quality,
            sampleRate: track.sampleRate,
            bitDepth: track.bitDepth,
            bitrate: track.bitrate,
            isHighRes: track.isHighRes,
            fileSize: formatFileSize(buffer.length),
            duration: track.duration
          }
        });
        
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        results.push({
          success: false,
          fileName: file.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Socket.ioで全クライアントに通知
    const io = (global as any).io;
    if (io && results.filter(r => r.success).length > 0) {
      io.emit('library-update', {
        type: 'tracks-uploaded',
        count: results.filter(r => r.success).length,
        timestamp: Date.now()
      });
    }
    
    return NextResponse.json({
      message: `Processed ${results.length} files`,
      results: results,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}

function getQualityLabel(sampleRate: number, bitDepth: number): string {
  if (sampleRate >= 192000) return 'Hi-Res 192kHz+';
  if (sampleRate >= 96000) return 'Hi-Res 96kHz';
  if (sampleRate >= 88200) return 'Hi-Res 88.2kHz';
  if (sampleRate >= 48000) return 'Studio 48kHz';
  if (sampleRate >= 44100) return 'CD Quality';
  return 'Standard';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
