import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Web Music Player",
  description: "高品質な音楽再生とマルチデバイス同期機能を備えた音楽プレイヤー",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Music Player",
  },
  icons: {
    icon: [
      { url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <script dangerouslySetInnerHTML={{
          __html: `
            // iOS Safari 100vh問題の解決
            function setVH() {
              const vh = window.innerHeight * 0.01;
              document.documentElement.style.setProperty('--vh', vh + 'px');
            }
            setVH();
            window.addEventListener('resize', setVH);
            window.addEventListener('orientationchange', setVH);
          `
        }} />
      </head>
      <body className="antialiased bg-black text-white overflow-hidden">
        <div className="h-screen flex flex-col">
          {children}
        </div>
        <script dangerouslySetInnerHTML={{
          __html: `
            // Service Worker の登録（本番環境のみ）
            if ('serviceWorker' in navigator && !window.location.hostname.includes('localhost')) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then(registration => {
                    console.log('[PWA] Service Worker registered:', registration.scope);
                  })
                  .catch(error => {
                    console.error('[PWA] Service Worker registration failed:', error);
                  });
              });
            } else {
              console.log('[PWA] Service Worker disabled (localhost detected)');
            }
          `
        }} />
      </body>
    </html>
  );
}
