// Service Worker for PWA
const CACHE_NAME = 'music-player-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
];

// インストール時
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache).catch((err) => {
          console.warn('[SW] Failed to cache some resources:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// アクティベーション時
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// フェッチ時（ネットワーク優先、フォールバックでキャッシュ）
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // 音楽ストリーミングはキャッシュしない
  if (url.pathname.includes('/api/music/stream')) {
    return;
  }

  // APIリクエストはキャッシュしない
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // POSTリクエストはキャッシュしない
  if (event.request.method !== 'GET') {
    return;
  }

  // Socket.ioリクエストはキャッシュしない
  if (url.pathname.includes('/socket.io')) {
    return;
  }

  // Next.jsの内部リクエストはキャッシュしない
  if (url.pathname.startsWith('/_next/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // レスポンスが有効な場合のみキャッシュ
        if (response && response.status === 200 && response.type === 'basic') {
          try {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache).catch((err) => {
                // キャッシュエラーを静かに処理
              });
            });
          } catch (err) {
            // クローンエラーを静かに処理
          }
        }
        return response;
      })
      .catch(() => {
        // ネットワークエラー時はキャッシュから返す
        return caches.match(event.request);
      })
  );
});

// バックグラウンド同期（オプション）
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  if (event.tag === 'sync-playback') {
    event.waitUntil(syncPlayback());
  }
});

async function syncPlayback() {
  // プレイバック状態の同期処理
  console.log('[SW] Syncing playback state...');
}

// プッシュ通知（オプション）
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || '新しい通知があります',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: data
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Music Player', options)
  );
});

// 通知クリック時
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});
