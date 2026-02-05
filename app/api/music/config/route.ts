import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    musicLibraryPath: process.env.MUSIC_LIBRARY_PATH || 'C:/Music',
  });
}
