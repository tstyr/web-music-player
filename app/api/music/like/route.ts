import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { trackId, isLiked } = await request.json();

    if (!trackId) {
      return NextResponse.json(
        { error: 'Track ID is required' },
        { status: 400 }
      );
    }

    const updatedTrack = await prisma.track.update({
      where: { id: trackId },
      data: { isLiked: isLiked },
    });

    return NextResponse.json({
      success: true,
      track: updatedTrack,
    });
  } catch (error) {
    console.error('Like API error:', error);
    return NextResponse.json(
      { error: 'いいね機能でエラーが発生しました' },
      { status: 500 }
    );
  }
}