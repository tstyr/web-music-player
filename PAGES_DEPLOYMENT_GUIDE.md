# 🚀 Cloudflare Pages デプロイガイド（完全版）

固定URLでアクセスできる音楽プレイヤーをCloudflare Pagesにデプロイする手順です。

## 🎯 構成

```
[iPad/PC]
    ↓
[Cloudflare Pages] ← 固定URL: https://music-player.pages.dev
    ↓ (Workers経由でトンネルURL取得)
[Cloudflare Workers] ← https://music-tunnel-api.haka01xx.workers.dev/tunnel
    ↓ (トンネルURL取得)
[Cloudflare Tunnel] ← https://abc-123.trycloudflare.com
    ↓
[ローカルサーバー] ← localhost:3000
    ↓
[音楽ファイル]
```

## 📋 前提条件

- ✅ Cloudflareアカウント
- ✅ GitHubアカウント
- ✅ Node.js (v18以上)
- ✅ cloudflared インストール済み

---

## 🔧 ステップ1: Workersのデプロイ

### 1-1. Workersプロジェクトを作成

別のディレクトリで：

```bash
mkdir music-tunnel-api
cd music-tunnel-api
npm create cloudflare@latest
```

プロンプトで選択：
- Name: `music-tunnel-api`
- Type: `"Hello World" Worker`
- TypeScript: `No`
- Git: `Yes`
- Deploy: `No`（後でデプロイ）

### 1-2. Workers実装

`WORKERS_SIMPLE_PROMPT.txt` の内容をAIに渡して実装するか、手動で実装：

```javascript
// src/index.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // GET /tunnel
    if (url.pathname === '/tunnel' && request.method === 'GET') {
      try {
        const data = await env.TUNNEL_KV.get('current_tunnel_url', 'json');
        
        if (!data) {
          return new Response(JSON.stringify({
            url: null,
            message: 'トンネルURLが設定されていません'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'KV読み取りエラー',
          message: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    // POST /tunnel
    if (url.pathname === '/tunnel' && request.method === 'POST') {
      try {
        const body = await request.json();
        const tunnelUrl = body.url;
        
        if (!tunnelUrl || typeof tunnelUrl !== 'string') {
          return new Response(JSON.stringify({
            error: 'URLが必要です'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const isValid = 
          tunnelUrl.startsWith('https://') && tunnelUrl.includes('.trycloudflare.com') ||
          tunnelUrl.startsWith('http://localhost:');
        
        if (!isValid) {
          return new Response(JSON.stringify({
            error: '不正なURL形式です'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        const data = {
          url: tunnelUrl,
          updatedAt: new Date().toISOString()
        };
        
        await env.TUNNEL_KV.put('current_tunnel_url', JSON.stringify(data));
        
        return new Response(JSON.stringify({
          success: true,
          ...data,
          message: 'URLを保存しました'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'KV書き込みエラー',
          message: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response('Not Found', { 
      status: 404,
      headers: corsHeaders
    });
  }
};
```

### 1-3. KV Namespaceを作成

```bash
wrangler kv:namespace create "TUNNEL_KV"
```

出力されたIDをメモ。

### 1-4. wrangler.toml設定

```toml
name = "local-music-on-everyone-devices"
main = "src/index.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "TUNNEL_KV"
id = "YOUR_KV_NAMESPACE_ID"  # ← 上でメモしたID
```

### 1-5. デプロイ

```bash
wrangler deploy
```

デプロイ後のURL:
```
https://music-tunnel-api.haka01xx.workers.dev
```

### 1-6. 動作確認

```bash
# PowerShell
Invoke-WebRequest -Uri "https://music-tunnel-api.haka01xx.workers.dev/tunnel" -UseBasicParsing
```

---

## 🌐 ステップ2: Pagesのデプロイ

### 2-1. GitHubにプッシュ

```bash
git add .
git commit -m "Cloudflare Pages対応"
git push origin main
```

### 2-2. Cloudflare Pagesプロジェクト作成

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. **Pages** → **Create a project**
3. **Connect to Git** → GitHubリポジトリを選択
4. **Set up builds and deployments**:

```
Project name: music-player
Production branch: main
Build command: npm run build
Build output directory: .next
Root directory: (空欄)
```

5. **Environment variables**:

```
NODE_VERSION=18
```

6. **Save and Deploy**

### 2-3. デプロイ完了

デプロイが完了すると、固定URLが発行されます：

```
https://music-player.pages.dev
```

---

## 🎵 ステップ3: ローカルサーバー起動

### 3-1. サーバーとトンネルを起動

```bash
npm run start:all
```

### 3-2. トンネルURL確認

コンソールに表示されます：

```
✅ トンネルURL取得成功!
   URL: https://abc-123-def.trycloudflare.com

✅ Workers更新成功!
```

これでWorkersに自動的にトンネルURLが保存されます。

---

## 📱 ステップ4: iPadでアクセス

### 4-1. Pagesにアクセス

iPadのSafariで：

```
https://music-player.pages.dev
```

### 4-2. 自動接続

ページが読み込まれると：

1. Workersから最新のトンネルURLを自動取得
2. localStorageに保存
3. トンネル経由でローカルサーバーに接続
4. 音楽再生可能！🎉

---

## 🔄 日常の使い方

### PCで毎回やること

```bash
npm run start:all
```

これだけ！トンネルURLは自動的にWorkersに送信され、Pagesから自動取得されます。

### iPadでやること

```
https://music-player.pages.dev にアクセス
```

これだけ！自動的にトンネル経由で接続されます。

---

## 🛠️ トラブルシューティング

### Pages: 音楽が再生されない

**確認事項:**

1. **ローカルサーバーが起動しているか**
   ```bash
   # PowerShell
   Get-Process -Name node
   ```

2. **トンネルが起動しているか**
   ```bash
   # PowerShell
   Get-Process -Name cloudflared
   ```

3. **WorkersにURLが保存されているか**
   ```bash
   Invoke-WebRequest -Uri "https://music-tunnel-api.haka01xx.workers.dev/tunnel" -UseBasicParsing
   ```

4. **ブラウザのコンソールを確認**
   - F12 → Console
   - `[Tunnel] トンネルURLを自動設定:` が表示されるか確認

### Pages: ビルドエラー

**よくあるエラー:**

```
Error: Cannot find module 'next'
```

**解決策:**
- `package.json` に `next` が含まれているか確認
- Pagesの環境変数に `NODE_VERSION=18` を設定

### Workers: KVエラー

**エラー:**
```
KV namespace binding "TUNNEL_KV" not found
```

**解決策:**
1. KV Namespaceを作成:
   ```bash
   wrangler kv:namespace create "TUNNEL_KV"
   ```
2. `wrangler.toml` にIDを追加
3. 再デプロイ:
   ```bash
   wrangler deploy
   ```

---

## 🎨 カスタマイズ

### カスタムドメイン設定

Cloudflare Pagesで：

1. **Settings** → **Custom domains**
2. **Set up a custom domain**
3. ドメインを入力（例: `music.example.com`）
4. DNS設定を確認
5. 完了！

### 認証追加（オプション）

NextAuth.jsを使用：

```bash
npm install next-auth
```

詳細は [NextAuth.js ドキュメント](https://next-auth.js.org/) を参照。

---

## 📊 パフォーマンス

### Pages（フロントエンド）
- ✅ グローバルCDN
- ✅ 自動キャッシュ
- ✅ HTTP/2
- ✅ 無制限リクエスト

### Tunnel（バックエンド）
- ✅ 暗号化通信
- ✅ 自動再接続
- ⚠️ アップロード速度に依存

---

## 💰 コスト

- **Cloudflare Pages**: 無料
- **Cloudflare Workers**: 無料（10万リクエスト/日まで）
- **Cloudflare Tunnel**: 無料
- **合計**: **完全無料！** 🎉

---

## 🎉 まとめ

### 実現できること

✅ 固定URLでアクセス（`https://music-player.pages.dev`）  
✅ iPadから直接アクセス  
✅ トンネルURL自動取得  
✅ 完全自動化  
✅ 完全無料  

### 必要な作業

**初回のみ:**
1. Workersデプロイ（5分）
2. Pagesデプロイ（5分）

**毎回:**
1. `npm run start:all`（1コマンド）

**iPad:**
1. URLにアクセス（自動接続）

Happy listening! 🎵
