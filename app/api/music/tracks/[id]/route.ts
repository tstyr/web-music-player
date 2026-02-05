import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

// トラックの取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const track = await prisma.track.findUnique({
      where: { id }
    });

    if (!track) {
      return NextResponse.json(
        { error: 'トラックが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({ track });
  } catch (error: any) {
    console.error('Track fetch error:', error);
    return NextResponse.json(
      { error: 'トラックの取得に失敗しました', details: error.message },
      { status: 500 }
    );
  }
}

// トラックの更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const { title, artist, album, genre, year, artwork } = body;

    const track = await prisma.track.update({
      where: { id },
      data: {
        title: title || undefined,
        artist: artist || undefined,
        album: album || undefined,
        genre: genre || undefined,
        year: year || undefined,
        artwork: artwork || undefined,
      }
    });

    return NextResponse.json({ track });
  } catch (error: any) {
    console.error('Track update error:', error);
    return NextResponse.json(
      { error: 'トラックの更新に失敗しました', details: error.message },
      { status: 500 }
    );
  }
}

// トラックの削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { deleteFile } = body;

    // トラック情報を取得
    const track = await prisma.track.findUnique({
      where: { id }
    });

    if (!track) {
      return NextResponse.json(
        { error: 'トラックが見つかりません' },
        { status: 404 }
      );
    }

    // データベースから削除
    await prisma.track.delete({
      where: { id }
    });

    // ファイルも削除する場合
    if (deleteFile && track.filePath) {
      try {
        const normalizedPath = path.normalize(track.filePath);
        await fs.unlink(normalizedPath);
        console.log(`[Track Delete] File deleted: ${normalizedPath}`);
      } catch (fileError: any) {
        console.error('[Track Delete] File deletion error:', fileError.message);
        // ファイル削除に失敗してもDBからは削除済みなので続行
      }
    }

    return NextResponse.json({ 
      success: true,
      message: deleteFile ? 'トラックとファイルを削除しました' : 'トラックを削除しました'
    });
  } catch (error: any) {
    console.error('Track deletion error:', error);
    return NextResponse.json(
      { error: 'トラックの削除に失敗しました', details: error.message },
      { status: 500 }
    );
  }
}
