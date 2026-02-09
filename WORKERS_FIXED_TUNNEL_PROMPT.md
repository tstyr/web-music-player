# Cloudflare Workers 固定トンネルURL機能 実装プロンプト

以下のプロンプトをCloudflare WorkersプロジェクトのAIに渡してください。

---

## 🎯 実装依頼

Cloudflare Workersに以下の機能を実装してください：

### 要件

1. **固定URLエンドポイント**: `/api/tunnel` または `/tunnel`
2. **GET リクエスト**: 保存されているトンネルURLを返す
3. **POST リクエスト**: トンネルURLを保存する
4. **KV ストレージ**: Cloudflare KV を使用してURLを永続化
5. **CORS対応**: すべてのオリジンからアクセス可能

### API仕様

#### GET /tunnel
最新のトンネルURLを取得

**レスポンス:**
```json
{
  "url": "https://abc-123.trycloudflare.com",
  "updatedAt": "2026-02-09T12:34:56.789Z"
}
```

URLが未設定の場合:
```json
{
  "url": null,
  "message": "トンネルURLが設定されていません"
}
```

#### POST /tunnel
トンネルURLを保存

**リクエスト:**
```json
{
  "url": "https://abc-123.trycloudflare.com"
}
```

**レスポンス:**
```json
{
  "success": true,
  "url": "https://abc-123.trycloudflare.com",
  "message": "URLを保存しました"
}
```

### 技術仕様

1. **KV Namespace**: `TUNNEL_KV` という名前で作成
2. **KVキー**: `current_tunnel_url`
3. **保存データ形式**:
   ```json
   {
     "url": "https://abc-123.trycloudflare.com",
     "updatedAt": "2026-02-09T12:34:56.789Z"
   }
   ```

4. **CORSヘッダー**:
   ```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: GET, POST, OPTIONS
   Access-Control-Allow-Headers: Content-Type
   ```

5. **エラーハンドリング**:
   - 不正なURL形式の場合は400エラー
   - KVエラーの場合は500エラー
   - 適切なエラーメッセージを返す

### セキュリティ

1. **URL検証**: 
   - `https://` で始まること
   - `.trycloudflare.com` ドメインであること
   - または `http://localhost:` で始まること（開発用）

2. **レート制限**: 
   - 同一IPから1分間に10リクエストまで（オプション）

### 実装例（参考）

```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // CORS対応
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    // OPTIONSリクエスト
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
        
        // URL検証
        if (!tunnelUrl || typeof tunnelUrl !== 'string') {
          return new Response(JSON.stringify({
            error: 'URLが必要です'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        // URL形式チェック
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
    
    // 404
    return new Response('Not Found', { 
      status: 404,
      headers: corsHeaders
    });
  }
};
```

### wrangler.toml 設定

```toml
name = "music-tunnel-api"
main = "src/index.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "TUNNEL_KV"
id = "YOUR_KV_NAMESPACE_ID"
```

### デプロイ手順

1. KV Namespaceを作成:
   ```bash
   wrangler kv:namespace create "TUNNEL_KV"
   ```

2. 出力されたIDを `wrangler.toml` に設定

3. デプロイ:
   ```bash
   wrangler deploy
   ```

4. テスト:
   ```bash
   # GET
   curl https://music-tunnel-api.haka01xx.workers.dev/tunnel
   
   # POST
   curl -X POST https://music-tunnel-api.haka01xx.workers.dev/tunnel \
     -H "Content-Type: application/json" \
     -d '{"url":"https://test.trycloudflare.com"}'
   ```

### 追加機能（オプション）

1. **履歴管理**: 過去のトンネルURLを保存
2. **認証**: API キーによるPOST保護
3. **Webhook**: URL更新時に通知
4. **統計**: アクセス回数の記録

---

## 📝 実装後の確認

以下のコマンドで動作確認してください:

```bash
# GET テスト
curl https://music-tunnel-api.haka01xx.workers.dev/tunnel

# POST テスト
curl -X POST https://music-tunnel-api.haka01xx.workers.dev/tunnel \
  -H "Content-Type: application/json" \
  -d '{"url":"https://abc-123.trycloudflare.com"}'

# GET で確認
curl https://music-tunnel-api.haka01xx.workers.dev/tunnel
```

期待される出力:
```json
{
  "url": "https://abc-123.trycloudflare.com",
  "updatedAt": "2026-02-09T12:34:56.789Z"
}
```
