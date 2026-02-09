import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 共有プレイリストの取得（公開情報のみ）
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const playlist = await prisma.playlist.findUnique({
      where: { id: params.id },
      include: {
        tracks: {
          include: {
            track: {
              select: {
                id: true,
                title: true,
                artist: true,
                album: true,
                duration: true,
                format: true,
                sampleRate: true,
                bitDepth: true,
                bitrate: true,
                isHighRes: true,
                quality: true,
                artwork: true,
                genre: true,
                year: true,
                trackNumber: true,
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        user: {
          select: {
            name: true,
            email: false
          }
        }
      }
    });

    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      playlist: {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
        createdBy: playlist.user.name || 'Unknown User',
        trackCount: playlist.tracks.length,
        tracks: playlist.tracks.map(pt => pt.track)
      }
    });
  } catch (error) {
    console.error('Shared playlist fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlist' },
      { status: 500 }
    );
  }
}

// 共有プレイリストを自分のライブラリにコピー
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 元のプレイリストを取得
    const sourcePlaylist = await prisma.playlist.findUnique({
      where: { id: params.id },
      include: {
        tracks: {
          include: {
            track: true
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!sourcePlaylist) {
      return NextResponse.json(
        { error: 'Source playlist not found' },
        { status: 404 }
      );
    }

    // 新しいプレイリストを作成
    const newPlaylist = await prisma.playlist.create({
      data: {
        name: `${sourcePlaylist.name} (コピー)`,
        description: sourcePlaylist.description,
        userId: userId,
        tracks: {
          create: sourcePlaylist.tracks.map((pt, index) => ({
            trackId: pt.trackId,
            order: index
          }))
        }
      },
      include: {
        tracks: {
          include: {
            track: true
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true,
      playlist: newPlaylist
    });
  } catch (error) {
    console.error('Playlist copy error:', error);
    return NextResponse.json(
      { error: 'Failed to copy playlist' },
      { status: 500 }
    );
  }
}
