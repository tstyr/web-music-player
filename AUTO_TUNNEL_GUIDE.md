# 🚇 Cloudflare Tunnel 自動起動ガイド

音楽サーバーとCloudflare Tunnelを自動起動し、トンネルURLを自動的にWorkersに送信する機能です。

## 📋 目次

- [機能概要](#機能概要)
- [前提条件](#前提条件)
- [使い方](#使い方)
- [仕組み](#仕組み)
- [トラブルシューティング](#トラブルシューティング)

---

## 🎯 機能概要

この機能は以下を自動化します:

1. **音楽サーバーの起動** (localhost:3000)
2. **Cloudflare Tunnelの起動**
3. **トンネルURLの自動抽出**
4. **WorkersへのURL自動送信** (`https://music-tunnel-api.haka01xx.workers.dev/tunnel`)

## ✅ 前提条件

### 必須ソフトウェア

- **Node.js** (v18以上推奨)
- **cloudflared** (Cloudflare Tunnel CLI)

### cloudflaredのインストール

#### Windows
```bash
winget install cloudflare.cloudflared
```

#### Mac
```bash
brew install cloudflared
```

#### Linux
```bash
# Debian/Ubuntu
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# その他のディストリビューション
# https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
```

---

## 🚀 使い方

### 方法1: npmスクリプト（推奨）

```bash
npm run start:all
```

- サーバーとトンネルが同時に起動します
- Ctrl+Cで両方を停止できます

### 方法2: 起動スクリプト

#### Windows
```bash
start-server.bat
```

- 2つの別ウィンドウが開きます
  1. 音楽サーバー
  2. Cloudflare Tunnel
- 各ウィンドウでCtrl+Cを押すと停止できます

#### Mac/Linux
```bash
./start-server.sh
```

または

```bash
bash start-server.sh
```

- サーバーとトンネルが同時に起動します
- Ctrl+Cで両方を停止できます

### 方法3: 個別起動

#### サーバーのみ
```bash
npm run dev
```

#### トンネルのみ（自動URL送信）
```bash
npm run tunnel:auto
```

---

## 🔧 仕組み

### 1. トンネル起動

`scripts/auto-tunnel.js` が以下を実行:

```javascript
cloudflared tunnel --url http://localhost:3000
```

### 2. URL抽出

トンネルの出力から正規表現でURLを抽出:

```javascript
/https:\/\/[a-z0-9-]+\.trycloudflare\.com/
```

例: `https://abc-def-123.trycloudflare.com`

### 3. Workers送信

抽出したURLをPOST:

```javascript
POST https://music-tunnel-api.haka01xx.workers.dev/tunnel
Content-Type: application/json

{
  "url": "https://abc-def-123.trycloudflare.com"
}
```

### 4. 完了通知

コンソールに以下を表示:

```
╔═══════════════════════════════════════════╗
║  🎉 準備完了！トンネルが稼働中です  ║
╚═══════════════════════════════════════════╝

💡 トンネルURL: https://abc-def-123.trycloudflare.com
💡 Workers URL: https://music-tunnel-api.haka01xx.workers.dev/tunnel

⚠️  終了するには Ctrl+C を押してください
```

---

## 🛠️ トラブルシューティング

### cloudflaredが見つからない

**エラー:**
```
❌ cloudflared がインストールされていません
```

**解決策:**
[前提条件](#cloudflaredのインストール)を参照してインストールしてください。

### ポートが使用中

**エラー:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解決策:**

1. 既存のプロセスを停止:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # Mac/Linux
   lsof -ti:3000 | xargs kill -9
   ```

2. または環境変数でポート変更:
   ```bash
   # Windows
   set PORT=3001 && npm run start:all
   
   # Mac/Linux
   PORT=3001 npm run start:all
   ```

### Workers更新失敗

**エラー:**
```
❌ Workers更新失敗: connect ETIMEDOUT
```

**原因:**
- ネットワーク接続の問題
- Workersエンドポイントの問題

**解決策:**

1. トンネルは稼働しているので、手動でURLを設定:
   - コンソールに表示されたトンネルURLをコピー
   - Workersの管理画面で手動設定

2. ネットワーク接続を確認:
   ```bash
   curl https://music-tunnel-api.haka01xx.workers.dev/tunnel
   ```

### トンネルが起動しない

**エラー:**
```
❌ トンネル起動エラー
```

**解決策:**

1. cloudflaredのバージョン確認:
   ```bash
   cloudflared --version
   ```

2. 手動でトンネルをテスト:
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

3. ファイアウォール設定を確認

---

## 📝 設定のカスタマイズ

### ポート変更

環境変数 `PORT` で変更可能:

```bash
# Windows
set PORT=3001
npm run start:all

# Mac/Linux
PORT=3001 npm run start:all
```

### Workers URL変更

`scripts/auto-tunnel.js` の `WORKERS_URL` を編集:

```javascript
const WORKERS_URL = 'https://your-workers.dev/tunnel';
```

---

## 📚 関連ドキュメント

- [Cloudflare Tunnel公式ドキュメント](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [CLOUDFLARE_TUNNEL_SETUP.md](./CLOUDFLARE_TUNNEL_SETUP.md) - 詳細なセットアップガイド
- [QUICK_TUNNEL_GUIDE.md](./QUICK_TUNNEL_GUIDE.md) - クイックスタートガイド

---

## 🎉 まとめ

この機能により、以下が自動化されます:

✅ サーバー起動  
✅ トンネル起動  
✅ URL抽出  
✅ Workers更新  

**たった1コマンドで全て完了:**

```bash
npm run start:all
```

または

```bash
start-server.bat  # Windows
./start-server.sh # Mac/Linux
```

Happy coding! 🎵
