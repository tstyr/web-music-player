# ログ出力トラブルシューティングガイド

Cloudflare Tunnel経由でアクセスした際にログが表示されない問題の解決方法

## 実装した修正内容

### 1. server.js の修正

#### 標準出力のバッファリング無効化
```javascript
// 標準出力のバッファリングを無効化
if (process.stdout.isTTY) {
  process.stdout._handle.setBlocking(true);
}
```

#### リクエストロガーの追加
```javascript
function logRequest(req) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.headers['cf-connecting-ip'] || 
             req.headers['x-forwarded-for'] || 
             req.headers['x-real-ip'] || 
             req.socket.remoteAddress;
  
  // 即座に標準出力へ書き出し
  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);
  
  // Cloudflare経由かどうかを判定
  if (req.headers['cf-connecting-ip']) {
    console.log(`  └─ Via Cloudflare Tunnel`);
  }
}
```

#### Socket.ioのログ強化
```javascript
io.on('connection', (socket) => {
  const clientIp = socket.handshake.headers['cf-connecting-ip'] || 
                   socket.handshake.headers['x-forwarded-for'] || 
                   socket.handshake.address;
  console.log(`[Socket.io] Client connected: ${socket.id} (IP: ${clientIp})`);
  // ...
});
```

### 2. Cloudflare Tunnel設定の修正

#### 127.0.0.1を使用
```bash
# 修正前
cloudflared tunnel --url http://localhost:3001

# 修正後
cloudflared tunnel --url http://127.0.0.1:3001
```

**理由**: `localhost`は場合によってIPv6（::1）に解決される可能性があるため、明示的にIPv4の`127.0.0.1`を使用します。

### 3. Next.js Middleware の追加

`middleware.ts`を作成してリクエストをインターセプト:

```typescript
export function middleware(request: NextRequest) {
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Middleware] ${request.method} ${request.url}`);
    if (cfConnectingIp) {
      console.log(`  └─ Cloudflare IP: ${cfConnectingIp}`);
    }
  }
  
  return NextResponse.next();
}
```

### 4. next.config.js の修正

プロキシ対応ヘッダーを追加:

```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'X-Forwarded-Host',
          value: 'localhost',
        },
      ],
    },
  ];
}
```

## ログの種類と確認方法

### 1. HTTPリクエストログ

**期待される出力**:
```
[2026-02-06T12:34:56.789Z] GET / - IP: 192.168.1.100
[2026-02-06T12:34:56.890Z] GET /_next/static/... - IP: 192.168.1.100
```

**Cloudflare経由の場合**:
```
[2026-02-06T12:34:56.789Z] GET / - IP: 203.0.113.1
  └─ Via Cloudflare Tunnel
```

### 2. Socket.ioログ

**期待される出力**:
```
[Socket.io] Client connected: abc123xyz (IP: 192.168.1.100)
[Socket.io] Play event from abc123xyz: { trackId: '123', timestamp: 1234567890 }
[Socket.io] Client disconnected: abc123xyz
```

### 3. APIリクエストログ

**期待される出力**:
```
[2026-02-06T12:34:56.789Z] GET /api/music/tracks - IP: 192.168.1.100
[2026-02-06T12:34:57.123Z] POST /api/music/scan - IP: 192.168.1.100
```

## トラブルシューティング

### 問題1: ログが全く表示されない

**原因**: 標準出力がバッファリングされている

**解決策**:
1. server.jsの先頭に以下を追加:
   ```javascript
   if (process.stdout.isTTY) {
     process.stdout._handle.setBlocking(true);
   }
   ```

2. または、環境変数を設定:
   ```bash
   # Windows
   set NODE_ENV=development
   
   # macOS/Linux
   export NODE_ENV=development
   ```

### 問題2: ローカルアクセスではログが出るが、Cloudflare経由では出ない

**原因**: リクエストがサーバーに到達していない

**確認事項**:
1. ✅ Cloudflare Tunnelが起動しているか
   ```bash
   # Cloudflare Tunnelウィンドウを確認
   # "Connection established" のようなメッセージがあるか
   ```

2. ✅ トンネルのターゲットが正しいか
   ```bash
   # 127.0.0.1:3001 を指しているか確認
   cloudflared tunnel --url http://127.0.0.1:3001
   ```

3. ✅ サーバーが起動しているか
   ```bash
   # ブラウザで http://localhost:3001 にアクセス
   ```

### 問題3: ログは出るが、IPアドレスが表示されない

**原因**: Cloudflareのヘッダーが取得できていない

**解決策**:
1. server.jsのlogRequest関数を確認:
   ```javascript
   const ip = req.headers['cf-connecting-ip'] || 
              req.headers['x-forwarded-for'] || 
              req.headers['x-real-ip'] || 
              req.socket.remoteAddress;
   ```

2. ヘッダーをデバッグ:
   ```javascript
   console.log('All headers:', req.headers);
   ```

### 問題4: Socket.ioのログが表示されない

**原因**: Socket.io接続が確立されていない

**確認事項**:
1. ✅ ブラウザのコンソールでエラーを確認
   ```javascript
   // F12 > Console
   // Socket.io関連のエラーがないか確認
   ```

2. ✅ CORSエラーがないか確認
   ```javascript
   // server.jsのSocket.io設定を確認
   const io = new Server(server, {
     cors: {
       origin: '*',
       methods: ['GET', 'POST']
     }
   });
   ```

3. ✅ トランスポート設定を確認
   ```javascript
   transports: ['websocket', 'polling'],
   allowEIO3: true
   ```

### 問題5: ログの出力が遅い

**原因**: バッファリングまたはネットワーク遅延

**解決策**:
1. 標準出力のバッファリングを無効化（上記参照）

2. ログレベルを調整:
   ```javascript
   // 開発モードでのみ詳細ログ
   if (dev && url.includes('/api/')) {
     console.log(`  └─ User-Agent: ${userAgent}`);
   }
   ```

3. ログを即座にフラッシュ:
   ```javascript
   console.log('message');
   process.stdout.write(''); // フラッシュ
   ```

## テスト手順

### 1. ローカルアクセステスト

```bash
# サーバーを起動
npm run dev

# ブラウザで http://localhost:3001 にアクセス

# 期待されるログ:
# [timestamp] GET / - IP: ::1 または 127.0.0.1
```

### 2. Cloudflare Tunnel経由テスト

```bash
# Cloudflare Tunnelを起動
start-with-tunnel.bat  # Windows
./start-with-tunnel.sh  # macOS/Linux

# 表示されたURLにアクセス

# 期待されるログ:
# [timestamp] GET / - IP: xxx.xxx.xxx.xxx
#   └─ Via Cloudflare Tunnel
```

### 3. Socket.ioテスト

```bash
# サーバーを起動してアプリにアクセス

# 音楽を再生

# 期待されるログ:
# [Socket.io] Client connected: abc123xyz
# [Socket.io] Play event from abc123xyz
```

### 4. APIテスト

```bash
# ライブラリスキャンを実行

# 期待されるログ:
# [timestamp] POST /api/music/scan - IP: xxx.xxx.xxx.xxx
# [Server] Performing initial music library scan...
```

## ログ出力の最適化

### 開発モード vs 本番モード

```javascript
// 開発モードでのみ詳細ログ
if (process.env.NODE_ENV === 'development') {
  console.log('Detailed log');
}

// 本番モードでは最小限のログ
if (process.env.NODE_ENV === 'production') {
  console.log('Essential log only');
}
```

### ログレベルの設定

```javascript
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLogLevel = process.env.LOG_LEVEL || 'INFO';

function log(level, message) {
  if (LOG_LEVELS[level] <= LOG_LEVELS[currentLogLevel]) {
    console.log(`[${level}] ${message}`);
  }
}
```

### ログのフォーマット

```javascript
function formatLog(type, message, data = {}) {
  const timestamp = new Date().toISOString();
  const dataStr = Object.keys(data).length > 0 ? 
    JSON.stringify(data) : '';
  
  return `[${timestamp}] [${type}] ${message} ${dataStr}`;
}

console.log(formatLog('INFO', 'Server started', { port: 3001 }));
```

## パフォーマンスへの影響

### ログ出力のオーバーヘッド

- **最小限**: HTTPリクエストログのみ（推奨）
- **中程度**: HTTPリクエスト + Socket.ioイベント
- **最大**: すべてのイベント + デバッグ情報

### 推奨設定

```javascript
// 本番環境
const shouldLog = process.env.NODE_ENV === 'development';

if (shouldLog) {
  logRequest(req);
}
```

## まとめ

実装した修正により、以下が改善されました:

1. ✅ 標準出力のバッファリング無効化
2. ✅ Cloudflare Tunnelからのリクエスト検出
3. ✅ IPアドレスの正確な取得
4. ✅ Socket.ioログの強化
5. ✅ 127.0.0.1の明示的使用
6. ✅ Next.js Middlewareでのログ追加

これらの修正により、Cloudflare Tunnel経由でも正常にログが表示されるようになります。

## 参考リンク

- [Node.js Stream API](https://nodejs.org/api/stream.html)
- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Socket.io Logging](https://socket.io/docs/v4/logging-and-debugging/)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
