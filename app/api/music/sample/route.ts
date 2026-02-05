import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // サンプル音楽データを作成
    const sampleTracks = [
      {
        title: 'Sample Track 1',
        artist: 'Sample Artist',
        album: 'Sample Album',
        duration: 180,
        filePath: '/sample/track1.mp3',
        fileName: 'track1.mp3',
        fileSize: 5000000,
        format: 'MP3',
        sampleRate: 44100,
        bitDepth: 16,
        bitrate: 320,
        channels: 2,
        isHighRes: false,
        quality: 'CD Quality',
        genre: 'Pop',
        year: 2024,
        trackNumber: 1,
        isLiked: false,
      },
      {
        title: 'Hi-Res Sample',
        artist: 'Audiophile Artist',
        album: 'Hi-Res Collection',
        duration: 240,
        filePath: '/sample/hires.flac',
        fileName: 'hires.flac',
        fileSize: 50000000,
        format: 'FLAC',
        sampleRate: 96000,
        bitDepth: 24,
        bitrate: 2304,
        channels: 2,
        isHighRes: true,
        quality: 'Hi-Res 96kHz',
        genre: 'Classical',
        year: 2024,
        trackNumber: 1,
        isLiked: false,
      },
      {
        title: 'Electronic Beats',
        artist: 'Synth Master',
        album: 'Digital Dreams',
        duration: 300,
        filePath: '/sample/electronic.wav',
        fileName: 'electronic.wav',
        fileSize: 30000000,
        format: 'WAV',
        sampleRate: 48000,
        bitDepth: 24,
        bitrate: 2304,
        channels: 2,
        isHighRes: false,
        quality: 'Studio 48kHz',
        genre: 'Electronic',
        year: 2024,
        trackNumber: 1,
        isLiked: true,
      },
    ];

    // 既存のサンプルトラックを削除
    await prisma.track.deleteMany({
      where: {
        filePath: {
          startsWith: '/sample/'
        }
      }
    });

    // 新しいサンプルトラックを作成
    const createdTracks = await Promise.all(
      sampleTracks.map(track => 
        prisma.track.create({ data: track })
      )
    );

    return NextResponse.json({
      success: true,
      message: `${createdTracks.length} sample tracks created`,
      tracks: createdTracks,
    });
  } catch (error) {
    console.error('Sample tracks creation error:', error);
    return NextResponse.json(
      { error: 'サンプルトラックの作成に失敗しました' },
      { status: 500 }
    );
  }
}