import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// プレイリストに曲を追加
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { trackId } = body;

    // 既存の曲数を取得して順序を決定
    const existingTracks = await prisma.playlistTrack.findMany({
      where: { playlistId: params.id }
    });

    const playlistTrack = await prisma.playlistTrack.create({
      data: {
        playlistId: params.id,
        trackId,
        order: existingTracks.length
      }
    });

    return NextResponse.json({ playlistTrack });
  } catch (error) {
    console.error('Add track to playlist error:', error);
    return NextResponse.json(
      { error: 'Failed to add track to playlist' },
      { status: 500 }
    );
  }
}

// プレイリストから曲を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const trackId = searchParams.get('trackId');

    if (!trackId) {
      return NextResponse.json(
        { error: 'Track ID required' },
        { status: 400 }
      );
    }

    await prisma.playlistTrack.deleteMany({
      where: {
        playlistId: params.id,
        trackId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove track from playlist error:', error);
    return NextResponse.json(
      { error: 'Failed to remove track from playlist' },
      { status: 500 }
    );
  }
}
