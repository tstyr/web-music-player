import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';

const prisma = new PrismaClient();

// プレイリスト一覧の取得
export async function GET(request: NextRequest) {
  try {
    // 認証チェックをスキップ（開発用）
    // const session = await getServerSession();
    
    // デフォルトユーザーを使用または作成
    let user = await prisma.user.findFirst();
    
    if (!user) {
      // デフォルトユーザーを作成
      user = await prisma.user.create({
        data: {
          email: 'default@localhost',
          name: 'Default User'
        }
      });
    }

    const playlists = await prisma.playlist.findMany({
      where: { userId: user.id },
      include: {
        tracks: {
          include: {
            track: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ playlists });
  } catch (error) {
    console.error('Playlist fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlists' },
      { status: 500 }
    );
  }
}

// プレイリストの作成
export async function POST(request: NextRequest) {
  try {
    // 認証チェックをスキップ（開発用）
    // const session = await getServerSession();
    
    // デフォルトユーザーを使用または作成
    let user = await prisma.user.findFirst();
    
    if (!user) {
      // デフォルトユーザーを作成
      user = await prisma.user.create({
        data: {
          email: 'default@localhost',
          name: 'Default User'
        }
      });
    }

    const body = await request.json();
    const { name, description } = body;

    const playlist = await prisma.playlist.create({
      data: {
        name,
        description: description || '',
        userId: user.id
      }
    });

    console.log('[Playlist API] Created playlist:', playlist);

    return NextResponse.json({ playlist });
  } catch (error) {
    console.error('Playlist creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create playlist', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
