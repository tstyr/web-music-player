/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  // PWA対応のヘッダー設定
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        // すべてのAPIルートにCloudflare対応ヘッダーを追加
        source: '/api/:path*',
        headers: [
          {
            key: 'X-Forwarded-Host',
            value: 'localhost',
          },
        ],
      },
    ];
  },
  // Cloudflare Tunnel対応の設定
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },
}

module.exports = nextConfig
