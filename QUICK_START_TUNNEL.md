# 🚀 トンネル機能クイックスタート

iPadのPWAから音楽サーバーに接続するための最速セットアップガイドです。

## ⚡ 3ステップで完了

### ステップ1: サーバーとトンネルを起動

```bash
npm run start:all
```

または

```bash
# Windows
start-server.bat

# Mac/Linux
./start-server.sh
```

### ステップ2: コンソール出力を確認

以下のメッセージが表示されればOK:

```
╔═══════════════════════════════════════════╗
║  🎉 準備完了！トンネルが稼働中です  ║
╚═══════════════════════════════════════════╝

💡 トンネルURL: https://abc-123.trycloudflare.com
💡 Workers URL: https://music-tunnel-api.haka01xx.workers.dev/tunnel
```

### ステップ3: iPadでアクセス

1. iPadのSafariで任意のURLを開く（例: `https://example.com`）
2. サイトが自動的にトンネルURLを取得
3. 音楽サーバーに接続完了！

## 🎯 仕組み

```
PC側:
  npm run start:all
    ↓
  トンネルURL取得: https://abc-123.trycloudflare.com
    ↓
  Workersに自動送信
    ↓
  保存完了

iPad側:
  サイトにアクセス
    ↓
  Workersから自動取得
    ↓
  トンネル経由で接続
    ↓
  音楽再生！🎵
```

## 🔧 トラブルシューティング

### cloudflaredがない

```bash
# Windows
winget install cloudflare.cloudflared

# Mac
brew install cloudflared
```

### ポートが使用中

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Workers URLを確認

```bash
# PowerShell
Invoke-WebRequest -Uri "https://music-tunnel-api.haka01xx.workers.dev/tunnel" -UseBasicParsing

# 期待される出力
# {"url":"https://abc-123.trycloudflare.com","updatedAt":"..."}
```

## 📚 詳細ドキュメント

- [AUTO_TUNNEL_GUIDE.md](./AUTO_TUNNEL_GUIDE.md) - 詳細な使い方
- [TUNNEL_AUTO_CONFIG.md](./TUNNEL_AUTO_CONFIG.md) - 自動設定の仕組み
- [WORKERS_INTEGRATION_GUIDE.md](./WORKERS_INTEGRATION_GUIDE.md) - Workers統合手順

## 🎉 完了！

たった1コマンドで、iPadから音楽サーバーに接続できます：

```bash
npm run start:all
```

Happy listening! 🎵
