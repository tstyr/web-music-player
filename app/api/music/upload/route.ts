import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'music');

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
        
        // データベースに保存 (without metadata parsing for now)
        const track = await prisma.track.create({
          data: {
            title: path.basename(file.name, path.extname(file.name)),
            artist: 'Unknown Artist',
            album: 'Unknown Album',
            duration: 0,
            filePath: filePath,
            fileName: path.basename(filePath),
            fileSize: buffer.length,
            format: ext.substring(1).toUpperCase(),
            sampleRate: 44100,
            bitDepth: 16,
            bitrate: 320,
            channels: 2,
            isHighRes: false,
            quality: 'CD Quality',
            genre: 'Unknown',
            year: null,
            track: null,
            albumArtist: 'Unknown Artist',
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
            fileSize: formatFileSize(buffer.length)
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
