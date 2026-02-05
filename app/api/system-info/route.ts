import { NextResponse } from 'next/server';
import { getSystemInfo } from '@/lib/system-info';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const systemInfo = await getSystemInfo();
    return NextResponse.json(systemInfo);
  } catch (error) {
    console.error('System info API error:', error);
    return NextResponse.json(
      { error: 'システム情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}
