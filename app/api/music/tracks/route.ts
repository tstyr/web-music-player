import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs';
import { parseFile } from 'music-metadata';

export const dynamic = 'force-dynamic';

// 文字列をUTF-8で正規化
function normalizeString(str: string): string {
  return str.normalize('NFC');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const folder = searchParams.get('folder');

    if (folder) {
      // 指定されたフォルダから音楽ファイルをスキャン
      const tracks = await scanMusicFolder(folder);
      return NextResponse.json({ tracks, pagination: null });
    }

    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { artist: { contains: search, mode: 'insensitive' as const } },
            { album: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [tracks, total] = await Promise.all([
      prisma.track.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.track.count({ where }),
    ]);

    // トラックデータを正規化
    const normalizedTracks = tracks.map(track => ({
      ...track,
      title: normalizeString(track.title),
      artist: track.artist ? normalizeString(track.artist) : null,
      album: track.album ? normalizeString(track.album) : null,
      filePath: normalizeString(track.filePath),
      fileName: track.fileName ? normalizeString(track.fileName) : null,
    }));

    return NextResponse.json({
      tracks: normalizedTracks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Tracks API error:', error);
    return NextResponse.json(
      { error: 'トラックの取得に失敗しました', details: error.message },
      { status: 500 }
    );
  }
}

async function scanMusicFolder(folderPath: string): Promise<any[]> {
  const supportedFormats = ['.mp3', '.flac', '.wav', '.m4a', '.aac', '.ogg', '.wma', '.dsd', '.dsf', '.dff'];
  const tracks = [];

  try {
    if (!fs.existsSync(folderPath)) {
      return [];
    }

    const files = fs.readdirSync(folderPath, { withFileTypes: true });
    
    for (const file of files) {
      if (file.isFile()) {
        const filePath = path.join(folderPath, file.name);
        const ext = path.extname(file.name).toLowerCase();
        
        if (supportedFormats.includes(ext)) {
          try {
            const stats = fs.statSync(filePath);
            
            // 音楽メタデータを取得
            let duration = 0;
            let title = normalizeString(path.basename(file.name, ext));
            let artist = 'Unknown Artist';
            let album = 'Unknown Album';
            let genre = 'Unknown';
            let year = null;
            let trackNumber = null;
            let sampleRate = 44100;
            let bitDepth = 16;
            let bitrate = 320;
            let channels = 2;

            try {
              const metadata = await parseFile(filePath, {
                skipCovers: false,
                includeChapters: false
              });
              const format = metadata.format;
              const common = metadata.common;

              duration = Math.floor(format.duration || 0);
              
              // メタデータから日本語を正規化
              if (common.title) title = normalizeString(common.title);
              if (common.artist) artist = normalizeString(common.artist);
              if (common.album) album = normalizeString(common.album);
              if (common.genre && common.genre[0]) genre = normalizeString(common.genre[0]);
              
              year = common.year || year;
              trackNumber = common.track?.no || trackNumber;
              sampleRate = format.sampleRate || sampleRate;
              bitrate = format.bitrate || bitrate;
              bitDepth = format.bitsPerSample || bitDepth;
              channels = format.numberOfChannels || channels;
            } catch (metadataError: any) {
              console.warn(`メタデータ取得エラー (${filePath}):`, metadataError.message);
            }
            
            const track = {
              id: Buffer.from(normalizeString(filePath)).toString('base64'),
              title,
              artist,
              album,
              duration,
              filePath: normalizeString(filePath),
              fileName: normalizeString(file.name),
              fileSize: stats.size,
              format: ext.substring(1).toUpperCase(),
              sampleRate,
              bitDepth,
              bitrate,
              channels,
              isHighRes: sampleRate > 48000,
              quality: getQualityLabel(sampleRate, bitDepth),
              genre,
              year,
              track: trackNumber,
              albumArtist: artist,
              createdAt: stats.birthtime,
              modifiedAt: stats.mtime
            };
            
            tracks.push(track);
          } catch (error: any) {
            console.error(`Error parsing ${filePath}:`, error.message);
          }
        }
      } else if (file.isDirectory()) {
        // サブディレクトリも再帰的にスキャン（最大3階層まで）
        const subFolderPath = path.join(folderPath, file.name);
        const depth = folderPath.split(path.sep).length;
        if (depth < 5) { // 深すぎるディレクトリは避ける
          const subTracks = await scanMusicFolder(subFolderPath);
          tracks.push(...subTracks);
        }
      }
    }
  } catch (error: any) {
    console.error('Error scanning folder:', error.message);
  }
  
  return tracks;
}

function getQualityLabel(sampleRate: number, bitDepth: number): string {
  if (sampleRate >= 192000) return 'Hi-Res 192kHz+';
  if (sampleRate >= 96000) return 'Hi-Res 96kHz';
  if (sampleRate >= 88200) return 'Hi-Res 88.2kHz';
  if (sampleRate >= 48000) return 'Studio 48kHz';
  if (sampleRate >= 44100) return 'CD Quality';
  return 'Standard';
}
