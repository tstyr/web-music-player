# 🔄 トンネルURL自動設定機能

サイトが自動的にCloudflare TunnelのURLをWorkersから取得して設定する機能です。

## 🎯 機能概要

1. **ページ読み込み時に自動取得**
   - サイトにアクセスすると、自動的にWorkersからトンネルURLを取得
   - localStorageに保存して、APIリクエストに使用

2. **URL変更の自動検出**
   - トンネルURLが変更された場合、自動的に検出
   - ページをリロードして新しいURLを適用

## 🔧 仕組み

### 1. ページ読み込み時

```javascript
// app/layout.tsx に実装
(async function() {
  const WORKERS_URL = 'https://music-tunnel-api.haka01xx.workers.dev/tunnel';
  const response = await fetch(WORKERS_URL);
  const data = await response.json();
  
  if (data.url) {
    localStorage.setItem('music_server_api_url', data.url);
    console.log('[Tunnel] トンネルURLを自動設定:', data.url);
  }
})();
```

### 2. API呼び出し時

```javascript
// lib/api-config.ts
export function getApiUrl(): string {
  // localStorageから取得
  const savedUrl = localStorage.getItem('music_server_api_url');
  if (savedUrl) {
    return savedUrl; // トンネルURLを使用
  }
  
  // デフォルトは現在のオリジン
  return window.location.origin;
}
```

## 📊 動作フロー

```
1. ユーザーがサイトにアクセス
   ↓
2. layout.tsx のスクリプトが実行
   ↓
3. Workers API (https://music-tunnel-api.haka01xx.workers.dev/tunnel) にGETリクエスト
   ↓
4. レスポンス: {"url": "https://abc-123.trycloudflare.com"}
   ↓
5. localStorageに保存: music_server_api_url = "https://abc-123.trycloudflare.com"
   ↓
6. 以降のAPIリクエストは全てこのURLを使用
```

## 🧪 テスト方法

### 1. トンネルを起動

```bash
npm run tunnel:auto
```

出力例:
```
✅ トンネルURL取得成功!
   URL: https://abc-123.trycloudflare.com

✅ Workers更新成功!
```

### 2. サイトにアクセス

ブラウザで `http://localhost:3000` を開く

### 3. 開発者ツールで確認

**コンソール:**
```
[Tunnel] トンネルURLを自動設定: https://abc-123.trycloudflare.com
```

**Application > Local Storage:**
```
music_server_api_url: https://abc-123.trycloudflare.com
```

### 4. API呼び出しを確認

**Network タブ:**
- `/api/music/tracks` などのリクエストが `https://abc-123.trycloudflare.com` に送信される

## 🔍 デバッグ方法

### Workers APIの確認

```bash
# PowerShell
Invoke-WebRequest -Uri "https://music-tunnel-api.haka01xx.workers.dev/tunnel" -UseBasicParsing

# 出力例
# {"url":"https://abc-123.trycloudflare.com"}
```

### localStorageの確認

ブラウザの開発者ツール:
1. Application タブ
2. Local Storage
3. `http://localhost:3000`
4. `music_server_api_url` の値を確認

### localStorageのクリア

```javascript
// ブラウザのコンソールで実行
localStorage.removeItem('music_server_api_url');
location.reload();
```

## ⚙️ カスタマイズ

### Workers URLの変更

`app/layout.tsx` の `WORKERS_URL` を編集:

```javascript
const WORKERS_URL = 'https://your-workers.dev/tunnel';
```

### 自動リロードの無効化

URL変更時の自動リロードを無効にする場合:

```javascript
// この部分をコメントアウト
if (currentUrl && currentUrl !== data.url) {
  console.log('[Tunnel] URLが変更されました。リロードします...');
  window.location.reload(); // ← この行をコメントアウト
}
```

## 🚨 トラブルシューティング

### サイトがトンネルURLを使用しない

**原因:**
- Workersからの取得に失敗
- localStorageが無効

**解決策:**

1. Workers APIを確認:
   ```bash
   Invoke-WebRequest -Uri "https://music-tunnel-api.haka01xx.workers.dev/tunnel" -UseBasicParsing
   ```

2. ブラウザのコンソールでエラーを確認:
   ```
   [Tunnel] URL取得エラー: ...
   ```

3. localStorageを手動で設定:
   ```javascript
   localStorage.setItem('music_server_api_url', 'https://your-tunnel.trycloudflare.com');
   location.reload();
   ```

### CORSエラー

**エラー:**
```
Access to fetch at 'https://music-tunnel-api.haka01xx.workers.dev/tunnel' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**解決策:**

Workers側でCORSヘッダーが設定されているか確認:
```javascript
// Workers側
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}
```

### トンネルURLが古い

**症状:**
- トンネルを再起動したが、サイトが古いURLを使用

**解決策:**

1. localStorageをクリア:
   ```javascript
   localStorage.removeItem('music_server_api_url');
   ```

2. ページをリロード:
   ```javascript
   location.reload();
   ```

3. または、ハードリロード:
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

## 📝 まとめ

この機能により:

✅ トンネルURLの手動設定が不要  
✅ トンネル再起動時も自動で新URLを取得  
✅ 複数デバイスで同じWorkersを参照可能  

**完全自動化:**

1. `npm run start:all` でサーバー+トンネル起動
2. サイトにアクセスするだけで自動設定完了
3. 何も設定不要！

Happy coding! 🎵
