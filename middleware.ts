import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Cloudflare Tunnelからのリクエストを検出してログ出力
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIp = request.headers.get('x-real-ip');
  
  // リクエスト情報をコンソールに出力
  if (process.env.NODE_ENV === 'development') {
    const timestamp = new Date().toISOString();
    const method = request.method;
    const url = request.url;
    const ip = cfConnectingIp || xForwardedFor || xRealIp || 'unknown';
    
    console.log(`[Middleware ${timestamp}] ${method} ${url}`);
    
    if (cfConnectingIp) {
      console.log(`  └─ Cloudflare IP: ${cfConnectingIp}`);
    }
    if (xForwardedFor) {
      console.log(`  └─ X-Forwarded-For: ${xForwardedFor}`);
    }
  }
  
  // レスポンスヘッダーにCloudflare情報を追加
  const response = NextResponse.next();
  
  if (cfConnectingIp) {
    response.headers.set('X-Via-Cloudflare', 'true');
  }
  
  return response;
}

// ミドルウェアを適用するパス
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
