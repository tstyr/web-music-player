# 🔧 Workers実装ガイド

`music-tunnel-api.haka01xx.workers.dev` にトンネルURL管理機能を実装します。

## 📋 現在の状態

Workers URL: `https://music-tunnel-api.haka01xx.workers.dev`

現在のレスポンス:
```
Hello World!
```

→ トンネルURL機能を実装する必要があります。

---

## 🚀 実装手順

### ステップ1: Workersプロジェクトを開く

```bash
cd [Workersプロジェクトのディレクトリ]
```

### ステップ2: KV Namespaceを作成

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

IDをコピーしてください。

### ステップ3: wrangler.toml を編集

```toml
name = "music-tunnel-api"
main = "src/index.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "TUNNEL_KV"
id = "YOUR_KV_ID_HERE"  # ← ここに貼り付け
```

### ステップ4: src/index.js を実装

以下のコードで `src/index.js` を置き換えてください:

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // CORS設定
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    // OPTIONSリクエスト（プリフライト）
    if (request.method === 'OPTIONS') {
      return new Response(null, { 
        status: 204,
        headers: corsHeaders 
      });
    }
    
    // GET /tunnel - トンネルURLを取得
    if (url.pathname === '/tunnel' && request.method === 'GET') {
      try {
        const data = await env.TUNNEL_KV.get('current_tunnel_url', 'json');
        
        if (!data) {
          return new Response(JSON.stringify({
            url: null,
            message: 'トンネルURLが設定されていません'
          }), {
            status: 200,
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            }
          });
        }
        
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'KV読み取りエラー',
          message: error.message
        }), {
          status: 500,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          }
        });
      }
    }
    
    // POST /tunnel - トンネルURLを保存
    if (url.pathname === '/tunnel' && request.method === 'POST') {
      try {
        const body = await request.json();
        const tunnelUrl = body.url;
        
        // URL検証
        if (!tunnelUrl || typeof tunnelUrl !== 'string') {
          return new Response(JSON.stringify({
            error: 'URLが必要です',
            message: 'リクエストボディに "url" フィールドが必要です'
          }), {
            status: 400,
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            }
          });
        }
        
        // URL形式チェック
        const isValid = 
          (tunnelUrl.startsWith('https://') && tunnelUrl.includes('.trycloudflare.com')) ||
          tunnelUrl.startsWith('http://localhost:');
        
        if (!isValid) {
          return new Response(JSON.stringify({
            error: '不正なURL形式です',
            message: 'URLは https://xxx.trycloudflare.com または http://localhost:xxxx の形式である必要があります'
          }), {
            status: 400,
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            }
          });
        }
        
        // KVに保存
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
          status: 200,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          }
        });
      } catch (error) {
        return new Response(JSON.stringify({
          error: 'エラーが発生しました',
          message: error.message
        }), {
          status: 500,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          }
        });
      }
    }
    
    // その他のパス
    return new Response(JSON.stringify({
      error: 'Not Found',
      message: '利用可能なエンドポイント: GET /tunnel, POST /tunnel'
    }), { 
      status: 404,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      }
    });
  }
};
```

### ステップ5: デプロイ

```bash
wrangler deploy
```

成功すると:
```
✨ Built successfully!
🌍 Deploying to Cloudflare Workers...
✨ Success! Deployed to https://music-tunnel-api.haka01xx.workers.dev
```

---

## ✅ 動作確認

### テスト1: GET（初回）

```bash
# PowerShell
Invoke-WebRequest -Uri "https://music-tunnel-api.haka01xx.workers.dev/tunnel" -UseBasicParsing
```

期待される出力:
```json
{
  "url": null,
  "message": "トンネルURLが設定されていません"
}
```

### テスト2: POST（URL保存）

```bash
# PowerShell
$body = '{"url":"https://test-123.trycloudflare.com"}'
Invoke-WebRequest -Uri "https://music-tunnel-api.haka01xx.workers.dev/tunnel" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body `
  -UseBasicParsing
```

期待される出力:
```json
{
  "success": true,
  "url": "https://test-123.trycloudflare.com",
  "updatedAt": "2026-02-09T...",
  "message": "URLを保存しました"
}
```

### テスト3: GET（保存後）

```bash
# PowerShell
Invoke-WebRequest -Uri "https://music-tunnel-api.haka01xx.workers.dev/tunnel" -UseBasicParsing
```

期待される出力:
```json
{
  "url": "https://test-123.trycloudflare.com",
  "updatedAt": "2026-02-09T..."
}
```

---

## 🔧 トラブルシューティング

### エラー: KV namespace binding "TUNNEL_KV" not found

**原因**: KV Namespaceが作成されていないか、`wrangler.toml` に設定されていない

**解決策**:
1. KV作成:
   ```bash
   wrangler kv:namespace create "TUNNEL_KV"
   ```
2. `wrangler.toml` にIDを追加
3. 再デプロイ:
   ```bash
   wrangler deploy
   ```

### エラー: CORS policy

**原因**: CORSヘッダーが正しく設定されていない

**解決策**: 上記のコードを使用（CORSヘッダーが含まれています）

### エラー: 400 Bad Request

**原因**: リクエストボディが不正

**解決策**: 
- Content-Typeが `application/json` であることを確認
- ボディが `{"url":"..."}` の形式であることを確認

---

## 🎉 完了後

Workersの実装が完了したら、音楽サーバープロジェクトで:

```bash
npm run start:all
```

コンソールに以下が表示されます:

```
✅ トンネルURL取得成功!
   URL: https://abc-123-def.trycloudflare.com

📤 WorkersにURL送信中...
✅ Workers更新成功!

╔═══════════════════════════════════════════╗
║  🎉 準備完了！トンネルが稼働中です  ║
╚═══════════════════════════════════════════╝

💡 トンネルURL: https://abc-123-def.trycloudflare.com
💡 Workers URL: https://music-tunnel-api.haka01xx.workers.dev/tunnel
```

これで完全自動化完了です！🎵

---

## 📝 次のステップ

1. ✅ Workers実装完了
2. → [Pagesデプロイ](./QUICKSTART_PAGES.md#ステップ2-pagesデプロイ5分)
3. → iPadからアクセス

Happy coding! 🚀
