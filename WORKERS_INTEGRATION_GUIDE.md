# 🔗 Workers統合ガイド

音楽サーバーとCloudflare Workersの統合手順です。

## 📋 目次

1. [Workersプロジェクトのセットアップ](#workersプロジェクトのセットアップ)
2. [音楽サーバー側の設定](#音楽サーバー側の設定)
3. [動作確認](#動作確認)
4. [トラブルシューティング](#トラブルシューティング)

---

## 🚀 Workersプロジェクトのセットアップ

### ステップ1: AIプロンプトを使用

`WORKERS_FIXED_TUNNEL_PROMPT.md` または `WORKERS_SIMPLE_PROMPT.txt` の内容を、
Cloudflare WorkersプロジェクトのAIアシスタントに渡してください。

### ステップ2: KV Namespaceの作成

Workersプロジェクトで実行:

```bash
wrangler kv:namespace create "TUNNEL_KV"
```

出力例:
```
🌀 Creating namespace with title "music-tunnel-api-TUNNEL_KV"
✨ Success!
Add the following to your configuration file in your kv_namespaces array:
{ binding = "TUNNEL_KV", id = "abc123def456" }
```

### ステップ3: wrangler.tomlの設定

```toml
name = "music-tunnel-api"
main = "src/index.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "TUNNEL_KV"
id = "abc123def456"  # ← ステップ2で取得したID
```

### ステップ4: デプロイ

```bash
wrangler deploy
```

出力例:
```
✨ Built successfully!
🌍 Deploying to Cloudflare Workers...
✨ Success! Deployed to https://music-tunnel-api.haka01xx.workers.dev
```

---

## 🎵 音楽サーバー側の設定

### 現在の設定を確認

音楽サーバープロジェクトでは、すでに以下が設定されています:

#### 1. scripts/auto-tunnel.js
```javascript
const WORKERS_URL = 'https://music-tunnel-api.haka01xx.workers.dev/tunnel';
```

#### 2. app/layout.tsx
```javascript
const WORKERS_URL = 'https://music-tunnel-api.haka01xx.workers.dev/tunnel';
```

### Workers URLの変更（必要な場合）

デプロイしたWorkersのURLが異なる場合、以下のファイルを更新:

#### scripts/auto-tunnel.js
```javascript
const WORKERS_URL = 'https://YOUR-WORKERS.workers.dev/tunnel';
```

#### app/layout.tsx
```javascript
const WORKERS_URL = 'https://YOUR-WORKERS.workers.dev/tunnel';
```

---

## ✅ 動作確認

### 1. Workersのテスト

#### GET リクエスト
```bash
# PowerShell
Invoke-WebRequest -Uri "https://music-tunnel-api.haka01xx.workers.dev/tunnel" -UseBasicParsing

# curl
curl https://music-tunnel-api.haka01xx.workers.dev/tunnel
```

期待される出力（初回）:
```json
{
  "url": null,
  "message": "トンネルURLが設定されていません"
}
```

#### POST リクエスト
```bash
# PowerShell
$body = '{"url":"https://test-123.trycloudflare.com"}'
Invoke-WebRequest -Uri "https://music-tunnel-api.haka01xx.workers.dev/tunnel" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body `
  -UseBasicParsing

# curl
curl -X POST https://music-tunnel-api.haka01xx.workers.dev/tunnel \
  -H "Content-Type: application/json" \
  -d '{"url":"https://test-123.trycloudflare.com"}'
```

期待される出力:
```json
{
  "success": true,
  "url": "https://test-123.trycloudflare.com",
  "updatedAt": "2026-02-09T12:34:56.789Z",
  "message": "URLを保存しました"
}
```

#### GET で確認
```bash
Invoke-WebRequest -Uri "https://music-tunnel-api.haka01xx.workers.dev/tunnel" -UseBasicParsing
```

期待される出力:
```json
{
  "url": "https://test-123.trycloudflare.com",
  "updatedAt": "2026-02-09T12:34:56.789Z"
}
```

### 2. 音楽サーバーとの統合テスト

#### ステップ1: サーバーとトンネルを起動
```bash
npm run start:all
```

コンソール出力を確認:
```
✅ トンネルURL取得成功!
   URL: https://abc-123.trycloudflare.com

📤 WorkersにURL送信中...
✅ Workers更新成功!

╔═══════════════════════════════════════════╗
║  🎉 準備完了！トンネルが稼働中です  ║
╚═══════════════════════════════════════════╝
```

#### ステップ2: Workersで確認
```bash
Invoke-WebRequest -Uri "https://music-tunnel-api.haka01xx.workers.dev/tunnel" -UseBasicParsing
```

出力に実際のトンネルURLが表示されるはず:
```json
{
  "url": "https://abc-123.trycloudflare.com",
  "updatedAt": "2026-02-09T12:34:56.789Z"
}
```

#### ステップ3: サイトで確認

1. ブラウザで `http://localhost:3000` を開く

2. 開発者ツール > Console を確認:
   ```
   [Tunnel] トンネルURLを自動設定: https://abc-123.trycloudflare.com
   ```

3. 開発者ツール > Application > Local Storage:
   ```
   music_server_api_url: https://abc-123.trycloudflare.com
   ```

4. 開発者ツール > Network タブで、APIリクエストがトンネル経由になっているか確認

---

## 🔄 完全な動作フロー

```
1. npm run start:all
   ├─ 音楽サーバー起動 (localhost:3000)
   └─ Cloudflare Tunnel起動
      ↓
2. トンネルがURLを出力
   例: https://abc-123.trycloudflare.com
      ↓
3. scripts/auto-tunnel.js がURLを抽出
      ↓
4. WorkersにPOST送信
   POST https://music-tunnel-api.haka01xx.workers.dev/tunnel
   Body: {"url": "https://abc-123.trycloudflare.com"}
      ↓
5. Workers KVに保存
   Key: current_tunnel_url
   Value: {"url": "...", "updatedAt": "..."}
      ↓
6. ユーザーがサイトにアクセス
   http://localhost:3000
      ↓
7. app/layout.tsx のスクリプトが実行
   GET https://music-tunnel-api.haka01xx.workers.dev/tunnel
      ↓
8. Workers KVから取得
   Response: {"url": "https://abc-123.trycloudflare.com", ...}
      ↓
9. localStorageに保存
   music_server_api_url = "https://abc-123.trycloudflare.com"
      ↓
10. 全てのAPIリクエストがトンネル経由に！
    例: https://abc-123.trycloudflare.com/api/music/tracks
```

---

## 🛠️ トラブルシューティング

### Workers KVが見つからない

**エラー:**
```
Error: KV namespace binding "TUNNEL_KV" not found
```

**解決策:**
1. KV Namespaceを作成:
   ```bash
   wrangler kv:namespace create "TUNNEL_KV"
   ```

2. `wrangler.toml` に追加:
   ```toml
   [[kv_namespaces]]
   binding = "TUNNEL_KV"
   id = "YOUR_KV_ID"
   ```

3. 再デプロイ:
   ```bash
   wrangler deploy
   ```

### Workers URLが404

**原因:**
- エンドポイントが `/tunnel` ではない
- デプロイに失敗している

**解決策:**
1. Workersのログを確認:
   ```bash
   wrangler tail
   ```

2. ルーティングを確認:
   ```javascript
   if (url.pathname === '/tunnel' && request.method === 'GET') {
     // ...
   }
   ```

### CORSエラー

**エラー:**
```
Access to fetch at 'https://music-tunnel-api.haka01xx.workers.dev/tunnel' has been blocked by CORS policy
```

**解決策:**

Workers側でCORSヘッダーを確認:
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
```

### トンネルURLが保存されない

**原因:**
- URL検証で弾かれている
- KV書き込み権限がない

**解決策:**

1. URL形式を確認:
   ```javascript
   // 有効なURL
   https://abc-123.trycloudflare.com
   http://localhost:3000
   
   // 無効なURL
   http://abc-123.trycloudflare.com  // httpsではない
   https://example.com  // trycloudflare.comではない
   ```

2. Workers KVの権限を確認:
   ```bash
   wrangler kv:key list --binding=TUNNEL_KV
   ```

---

## 📚 関連ドキュメント

- [AUTO_TUNNEL_GUIDE.md](./AUTO_TUNNEL_GUIDE.md) - トンネル自動起動ガイド
- [TUNNEL_AUTO_CONFIG.md](./TUNNEL_AUTO_CONFIG.md) - URL自動設定ガイド
- [WORKERS_FIXED_TUNNEL_PROMPT.md](./WORKERS_FIXED_TUNNEL_PROMPT.md) - Workers実装プロンプト（詳細版）
- [WORKERS_SIMPLE_PROMPT.txt](./WORKERS_SIMPLE_PROMPT.txt) - Workers実装プロンプト（簡易版）

---

## 🎉 まとめ

### セットアップ手順

1. **Workersプロジェクト**:
   - AIプロンプトを使用して実装
   - KV Namespaceを作成
   - デプロイ

2. **音楽サーバー**:
   - すでに設定済み（変更不要）
   - 必要に応じてWorkers URLを更新

3. **動作確認**:
   - `npm run start:all` で起動
   - ブラウザで確認

### 完全自動化

✅ トンネル起動  
✅ URL抽出  
✅ Workers保存  
✅ サイト取得  
✅ 自動設定  

**たった1コマンド:**
```bash
npm run start:all
```

Happy coding! 🎵
