import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const trackId = formData.get('trackId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // アップロードディレクトリを作成
    const uploadDir = join(process.cwd(), 'public', 'artwork');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // ファイル名を生成
    const ext = file.name.split('.').pop();
    const filename = `${trackId}.${ext}`;
    const filepath = join(uploadDir, filename);

    // ファイルを保存
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // URLを返す
    const url = `/artwork/${filename}`;

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Artwork upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload artwork' },
      { status: 500 }
    );
  }
}
