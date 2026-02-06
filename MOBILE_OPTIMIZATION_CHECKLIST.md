# モバイル最適化チェックリスト

Cloudflare Tunnel経由での外部アクセスとモバイル最適化の実装状況

## ✅ 完了した項目

### 1. Media Session API の実装
- [x] `navigator.mediaSession.metadata` の設定
- [x] 曲名、アーティスト名、アルバムアートの表示
- [x] 再生/一時停止アクションハンドラー
- [x] 前の曲/次の曲アクションハンドラー（TODO実装）
- [x] シーク操作（早送り・巻き戻し）
- [x] 位置情報の更新（1秒ごと）
- [x] 再生状態の同期

**実装ファイル**: `components/PlayerBar.tsx`

### 2. PWA（Progressive Web App）化
- [x] `manifest.json` の作成
- [x] Service Worker (`sw.js`) の作成
- [x] Service Worker の登録（`app/layout.tsx`）
- [x] アイコンファイルの生成（SVG形式）
- [x] PWAメタデータの設定
- [x] スタンドアロンモードの設定
- [x] テーマカラーの設定

**実装ファイル**: 
- `public/manifest.json`
- `public/sw.js`
- `public/icon-192.svg`
- `public/icon-512.svg`
- `app/layout.tsx`
- `scripts/generate-icons.js`

### 3. ネットワーク接続とセキュリティ
- [x] 相対パスの使用（混合コンテンツ対策）
- [x] HTTPS対応（Cloudflare Tunnel推奨）
- [x] Service Worker用ヘッダー設定
- [x] manifest.json用ヘッダー設定

**実装ファイル**: `next.config.js`

### 4. モバイル向け UX 最適化
- [x] タッチ操作の最適化（`touch-action: none`）
- [x] スライダーのtouch-action設定
- [x] バッファリングインジケーター
- [x] iOS Safari 100vh問題の解決
- [x] セーフエリア対応（iPhone X以降のノッチ）
- [x] 最小タップ領域（44x44px）
- [x] タップハイライトの削除

**実装ファイル**: 
- `app/globals.css`
- `app/layout.tsx`
- `components/PlayerBar.tsx`

### 5. ファイルアップロード最適化
- [x] ファイルサイズバリデーション（50MB制限）
- [x] フロントエンドでの事前チェック
- [x] ユーザーへの通知

**実装ファイル**: `components/UploadZone.tsx`

### 6. ドキュメント
- [x] PWAセットアップガイド（`PWA_SETUP.md`）
- [x] モバイル最適化チェックリスト（このファイル）
- [x] README.mdへのPWA機能追加
- [x] package.jsonへのスクリプト追加

## 📋 実装詳細

### Media Session API

```typescript
// PlayerBar.tsx
useEffect(() => {
  if (!currentTrack || typeof window === 'undefined' || !('mediaSession' in navigator)) return;

  try {
    // メタデータを設定
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title || 'Unknown Track',
      artist: currentTrack.artist || 'Unknown Artist',
      album: currentTrack.album || 'Unknown Album',
      artwork: currentTrack.artwork ? [
        { src: currentTrack.artwork, sizes: '96x96', type: 'image/jpeg' },
        // ... 他のサイズ
      ] : []
    });

    // 再生状態を設定
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    // アクションハンドラーを設定
    navigator.mediaSession.setActionHandler('play', () => playPause());
    navigator.mediaSession.setActionHandler('pause', () => playPause());
    // ... 他のアクション
  } catch (error) {
    console.error('Media Session API error:', error);
  }
}, [currentTrack, isPlaying]);
```

### Service Worker

```javascript
// public/sw.js
const CACHE_NAME = 'music-player-v1';

// ネットワーク優先、フォールバックでキャッシュ
self.addEventListener('fetch', (event) => {
  // 音楽ストリーミングはキャッシュしない
  if (event.request.url.includes('/api/music/stream')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // レスポンスをキャッシュ
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // ネットワークエラー時はキャッシュから返す
        return caches.match(event.request);
      })
  );
});
```

### タッチ操作最適化

```css
/* app/globals.css */
/* スライダーのtouch-action最適化 */
[role="slider"],
input[type="range"],
.slider-root {
  touch-action: none !important;
}
```

```typescript
// components/PlayerBar.tsx
<Slider.Root
  className="relative flex items-center select-none touch-none w-full h-8 sm:h-5"
  style={{ touchAction: 'none' }}
  value={[localProgress]}
  onValueChange={handleProgressChange}
  max={100}
  step={1}
>
```

### バッファリングインジケーター

```typescript
// components/PlayerBar.tsx
const [isBuffering, setIsBuffering] = useState(false);

const handleWaiting = () => {
  console.log('Audio waiting (buffering)');
  setIsBuffering(true);
};

const handleCanPlay = () => {
  console.log('Audio can play');
  setIsBuffering(false);
};

// 再生ボタン
<motion.button>
  {isBuffering ? (
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
  ) : isPlaying ? (
    <Pause />
  ) : (
    <Play />
  )}
</motion.button>
```

### ファイルサイズバリデーション

```typescript
// components/UploadZone.tsx
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const oversizedFiles = audioFiles.filter(file => file.size > MAX_FILE_SIZE);

if (oversizedFiles.length > 0) {
  const fileNames = oversizedFiles.map(f => 
    `${f.name} (${(f.size / 1024 / 1024).toFixed(1)}MB)`
  ).join('\n');
  alert(`以下のファイルはサイズが大きすぎます（最大50MB）:\n\n${fileNames}`);
}
```

## 🧪 テスト方法

### 1. ローカルテスト

```bash
# 開発サーバーを起動
npm run dev

# ブラウザで開く
# http://localhost:3001
```

### 2. Cloudflare Tunnelでテスト

```bash
# Cloudflare Tunnelを起動
npm run dev:tunnel

# または
cloudflared tunnel run music-player
```

### 3. モバイルデバイスでテスト

1. Cloudflare TunnelのURLにアクセス
2. PWAとしてインストール
3. 以下を確認：
   - [ ] ホーム画面にアイコンが追加される
   - [ ] ブラウザの枠なしで起動する
   - [ ] 音楽を再生してロック画面に表示される
   - [ ] ロック画面から操作できる
   - [ ] イヤホンのリモコンで操作できる
   - [ ] スライダーがスムーズに動く
   - [ ] バッファリング時にインジケーターが表示される

## 📱 対応ブラウザ

### iOS
- ✅ Safari 11.1+
- ✅ Chrome（Safari WebViewを使用）
- ✅ Firefox（Safari WebViewを使用）

### Android
- ✅ Chrome 67+
- ✅ Firefox 68+
- ✅ Edge 79+
- ✅ Samsung Internet 8.2+

### デスクトップ
- ✅ Chrome 67+
- ✅ Edge 79+
- ✅ Firefox 68+
- ✅ Safari 11.1+

## 🔧 トラブルシューティング

### PWAとしてインストールできない
- HTTPS接続を確認（Cloudflare Tunnel使用推奨）
- manifest.jsonが正しく読み込まれているか確認
- Service Workerが登録されているか確認（DevTools > Application > Service Workers）

### Media Session APIが動作しない
- HTTPS接続を確認
- ブラウザがMedia Session APIをサポートしているか確認
- 音楽を一度再生してみる

### スライダーがスムーズに動かない
- `touch-action: none`が適用されているか確認
- CSSの優先順位を確認（`!important`が必要な場合あり）

### バッファリングインジケーターが表示されない
- `waiting`イベントリスナーが登録されているか確認
- ネットワーク速度を確認

## 📚 参考資料

- [PWA_SETUP.md](./PWA_SETUP.md) - PWAセットアップガイド
- [CLOUDFLARE_TUNNEL_SETUP.md](./CLOUDFLARE_TUNNEL_SETUP.md) - Cloudflare Tunnelセットアップ
- [README.md](./README.md) - プロジェクト全体のドキュメント

## 🎯 今後の改善予定

- [ ] プレイリストのオフラインキャッシング
- [ ] バックグラウンド同期
- [ ] プッシュ通知
- [ ] 音楽ファイルの選択的キャッシング
- [ ] オフライン再生機能
- [ ] 前の曲/次の曲の実装
- [ ] プレイリスト再生機能
- [ ] シャッフル・リピート機能の強化
