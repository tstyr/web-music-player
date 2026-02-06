import fs from 'fs/promises';
import path from 'path';
import { prisma } from './prisma';
import crypto from 'crypto';

const MUSIC_EXTENSIONS = ['.mp3', '.flac', '.m4a', '.aac', '.ogg', '.wav', '.wma', '.dsd', '.dsf', '.dff'];

export interface ScanResult {
  scanned: number;
  added: number;
  updated: number;
  deleted: number;
  errors: number;
}

// 文字列をUTF-8で正規化
function normalizeString(str: string): string {
  return str.normalize('NFC');
}

// ファイルのハッシュ値を計算（メタデータ変更検出用）
async function calculateFileHash(filePath: string): Promise<string> {
  try {
    const fileBuffer = await fs.readFile(filePath);
    const hashSum = crypto.createHash('md5');
    hashSum.update(fileBuffer.slice(0, 1024 * 100)); // 最初の100KBのみハッシュ化（高速化）
    return hashSum.digest('hex');
  } catch (error) {
    console.error(`[Music Scanner] Hash calculation error for ${filePath}:`, error);
    return '';
  }
}

export async function scanMusicLibrary(libraryPath: string, cleanup: boolean = true, socketIo?: any): Promise<ScanResult> {
  const result: ScanResult = {
    scanned: 0,
    added: 0,
    updated: 0,
    deleted: 0,
    errors: 0,
  };

  console.log(`[Music Scanner] Starting scan of: ${libraryPath}`);
  console.log(`[Music Scanner] Cleanup mode: ${cleanup ? 'enabled' : 'disabled'}`);

  try {
    // ディレクトリが存在するか確認
    await fs.access(libraryPath);
  } catch (error) {
    throw new Error(`音楽ライブラリパスが見つかりません: ${libraryPath}`);
  }

  // クリーンアップ: DBに存在するが実際のファイルが存在しない曲を削除
  if (cleanup) {
    console.log('[Music Scanner] Starting cleanup...');
    try {
      const allTracks = await prisma.track.findMany({
        select: { id: true, filePath: true, title: true }
      });
      
      for (const track of allTracks) {
        try {
          await fs.access(track.filePath);
        } catch {
          // ファイルが存在しない場合は削除
          console.log(`[Music Scanner] Deleting missing track: ${track.title} (${track.filePath})`);
          await prisma.track.delete({ where: { id: track.id } });
          result.deleted++;
          
          // Socket.ioで削除通知
          if (socketIo) {
            socketIo.emit('library-update', {
              type: 'track-deleted',
              trackId: track.id,
              timestamp: Date.now()
            });
          }
        }
      }
      console.log(`[Music Scanner] Cleanup complete. Deleted ${result.deleted} missing tracks.`);
    } catch (error) {
      console.error('[Music Scanner] Cleanup error:', error);
    }
  }

  async function scanDirectory(dirPath: string): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          // 再帰的にディレクトリをスキャン
          await scanDirectory(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (MUSIC_EXTENSIONS.includes(ext)) {
            await processMusicFile(fullPath);
            result.scanned++;
          }
        }
      }
    } catch (error) {
      console.error(`ディレクトリスキャンエラー (${dirPath}):`, error);
      result.errors++;
    }
  }

  async function processMusicFile(filePath: string): Promise<void> {
    try {
      // ファイルパスをUTF-8で正規化
      const normalizedFilePath = normalizeString(filePath);
      const stats = await fs.stat(normalizedFilePath);

      // 既存のトラックを確認
      const existingTrack = await prisma.track.findUnique({
        where: { filePath: normalizedFilePath },
      });

      // メタデータ更新が必要かチェック
      let needsUpdate = false;
      
      if (existingTrack) {
        // ファイルの更新日時をチェック
        const fileModifiedTime = stats.mtime.getTime();
        const dbUpdatedTime = existingTrack.updatedAt.getTime();
        
        // ファイルが更新されている場合
        if (fileModifiedTime > dbUpdatedTime) {
          needsUpdate = true;
          console.log(`[Music Scanner] File modified detected: ${existingTrack.title}`);
        }
        
        // durationが0の場合は強制的に更新（メタデータが取得されていない）
        if (existingTrack.duration === 0) {
          needsUpdate = true;
          console.log(`[Music Scanner] Missing metadata detected: ${existingTrack.title}`);
        }
        
        // artworkがない場合も更新
        if (!existingTrack.artwork) {
          needsUpdate = true;
          console.log(`[Music Scanner] Missing artwork detected: ${existingTrack.title}`);
        }
      }

      // 新規追加または更新が必要な場合のみメタデータを取得
      if (!existingTrack || needsUpdate) {
        // 音楽メタデータを取得
        let duration = 0;
        let title = normalizeString(path.parse(normalizedFilePath).name);
        let artist = 'Unknown Artist';
        let album = 'Unknown Album';
        let genre = null;
        let year = null;
        let trackNumber = null;
        let sampleRate = 44100;
        let bitDepth = 16;
        let bitrate = null;
        let channels = 2;
        let artwork = null;

        try {
          // music-metadataでメタデータを取得（日本語対応）
          // @ts-ignore - ESモジュールの動的インポート
          const { parseFile } = await import('music-metadata');
          const metadata = await parseFile(normalizedFilePath, {
            skipCovers: false,
            includeChapters: false
          });
          
          const format = metadata.format;
          const common = metadata.common;

          duration = Math.floor(format.duration || 0);
          
          // メタデータから日本語タイトルを取得し、正規化
          if (common.title) {
            title = normalizeString(common.title);
          }
          if (common.artist) {
            artist = normalizeString(common.artist);
          }
          if (common.album) {
            album = normalizeString(common.album);
          }
          if (common.genre && common.genre[0]) {
            genre = normalizeString(common.genre[0]);
          }
          
          year = common.year || year;
          trackNumber = common.track?.no || trackNumber;
          sampleRate = format.sampleRate || sampleRate;
          bitrate = format.bitrate || bitrate;
          bitDepth = format.bitsPerSample || bitDepth;
          channels = format.numberOfChannels || channels;

          // アルバムアートを取得（ブラウザキャッシュ対策でタイムスタンプ付き）
          if (common.picture && common.picture[0]) {
            const artworkDir = path.join(process.cwd(), 'public', 'artwork');
            try {
              await fs.mkdir(artworkDir, { recursive: true });
              const artworkFileName = `${crypto.createHash('md5').update(normalizedFilePath).digest('hex')}.jpg`;
              const artworkPath = path.join(artworkDir, artworkFileName);
              await fs.writeFile(artworkPath, common.picture[0].data);
              // タイムスタンプをクエリパラメータとして追加（キャッシュ対策）
              artwork = `/artwork/${artworkFileName}?v=${Date.now()}`;
            } catch (artworkError) {
              console.warn(`[Music Scanner] Artwork save error:`, artworkError);
            }
          }

          console.log(`[Music Scanner] Metadata extracted: ${title} by ${artist}`);
        } catch (metadataError: any) {
          console.warn(`[Music Scanner] メタデータ取得エラー (${normalizedFilePath}):`, metadataError.message);
        }

        // Hi-Res判定とクオリティラベル
        const isHighRes = sampleRate > 48000;
        const quality = getQualityLabel(sampleRate, bitDepth);

        const trackData = {
          title: normalizeString(title),
          artist: normalizeString(artist),
          album: normalizeString(album),
          duration,
          filePath: normalizedFilePath,
          fileName: normalizeString(path.basename(normalizedFilePath)),
          fileSize: stats.size,
          sampleRate,
          bitDepth,
          bitrate,
          channels,
          isHighRes,
          quality,
          format: path.extname(normalizedFilePath).slice(1).toUpperCase() || null,
          year,
          genre: genre ? normalizeString(genre) : null,
          trackNumber,
          artwork,
        };

        if (existingTrack) {
          // 更新
          const updatedTrack = await prisma.track.update({
            where: { id: existingTrack.id },
            data: trackData,
          });
          result.updated++;
          console.log(`[Music Scanner] Updated: ${title}`);
          
          // Socket.ioで更新通知
          if (socketIo) {
            socketIo.emit('library-update', {
              type: 'track-updated',
              track: updatedTrack,
              timestamp: Date.now()
            });
          }
        } else {
          // 新規追加
          const newTrack = await prisma.track.create({
            data: trackData,
          });
          result.added++;
          console.log(`[Music Scanner] Added: ${title}`);
          
          // Socket.ioで追加通知
          if (socketIo) {
            socketIo.emit('library-update', {
              type: 'track-added',
              track: newTrack,
              timestamp: Date.now()
            });
          }
        }
      }
    } catch (error: any) {
      console.error(`[Music Scanner] ファイル処理エラー (${filePath}):`, error.message);
      result.errors++;
    }
  }

  await scanDirectory(libraryPath);
  
  console.log('[Music Scanner] Scan complete:', {
    scanned: result.scanned,
    added: result.added,
    updated: result.updated,
    deleted: result.deleted,
    errors: result.errors
  });
  
  // スキャン完了通知
  if (socketIo) {
    socketIo.emit('library-update', {
      type: 'scan-complete',
      result,
      timestamp: Date.now()
    });
  }
  
  return result;
}

function getQualityLabel(sampleRate: number, bitDepth: number): string {
  if (sampleRate >= 192000) return 'Hi-Res 192kHz+';
  if (sampleRate >= 96000) return 'Hi-Res 96kHz';
  if (sampleRate >= 88200) return 'Hi-Res 88.2kHz';
  if (sampleRate >= 48000) return 'Studio 48kHz';
  if (sampleRate >= 44100) return 'CD Quality';
  return 'Standard';
}
