# Web Music Player

高品質な音楽再生とマルチデバイス同期機能を備えた、モダンなWebベースの音楽プレイヤー。

> **🚀 [クイックスタートガイド](./QUICKSTART.md)** - 5分で起動！

## 主な機能

### 🎵 音楽再生
- **Hi-Res対応**: FLAC、WAV、DSD等のロスレス形式をサポート（最大192kHz/32bit）
- **リアルタイムビジュアライザー**: Web Audio APIによる美しい音声可視化
- **日本語ファイル名対応**: UTF-8完全対応で文字化けなし
- **メタデータ編集**: ID3タグの編集とアルバムアート管理

### 🔄 マルチデバイス同期
- **Socket.io統合**: リアルタイムで複数デバイス間の再生状態を同期
- **マルチルーム再生**: 全デバイスで同時に音楽を再生（200msの同期精度）
- **リモコン機能**: スマホから他のデバイスの再生を制御

### 📚 ライブラリ管理
- **自動スキャン**: サーバー起動時に音楽ライブラリを自動スキャン
- **プレイリスト**: カスタムプレイリストの作成と管理
- **検索・フィルター**: Hi-Res、最近追加などのクイックフィルター
- **楽曲削除**: データベースとファイルの両方を削除可能

### 🎨 UI/UX
- **Spotify風デザイン**: モダンで直感的なインターフェース
- **ダークモード**: 目に優しいダークテーマ
- **レスポンシブ**: デスクトップ、タブレット、スマホに対応
- **キーボードショートカット**: スペースキーで再生/一時停止など

### 📱 PWA & モバイル最適化
- **Progressive Web App**: ホーム画面に追加してアプリのように使用可能
- **Media Session API**: ロック画面・通知センターから操作可能
- **オフライン対応**: Service Workerによるキャッシング
- **タッチ最適化**: スムーズなスライダー操作とタップ領域最適化
- **iOS Safari対応**: 100vh問題とセーフエリア対応済み

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router), React 18, TypeScript
- **スタイリング**: Tailwind CSS, Framer Motion
- **状態管理**: Zustand
- **データベース**: SQLite + Prisma ORM
- **リアルタイム通信**: Socket.io
- **音声処理**: Web Audio API, music-metadata
- **デスクトップアプリ**: Electron (オプション)

## セットアップ

### 🚀 超簡単スタート（推奨）

**1コマンドで完了！**

#### Windows:
```bash
start.bat
```

#### macOS/Linux:
```bash
chmod +x start.sh
./start.sh
```

自動的にセットアップと起動が完了します。

---

### 📝 手動セットアップ

#### 必要要件
- Node.js 18以上
- npm または yarn

#### インストール

```bash
# リポジトリをクローン
git clone https://github.com/tstyr/web-music-player.git
cd web-music-player

# セットアップスクリプトを実行
# Windows
setup.bat

# macOS/Linux
chmod +x setup.sh
./setup.sh
```

または手動で：

```bash
# 依存関係をインストール
npm install

# Prismaクライアントを生成
npm run db:generate

# データベースを初期化
npm run db:push
```

### 環境変数

`.env.example`をコピーして`.env`を作成：

```bash
cp .env.example .env
```

必要に応じて以下の環境変数を設定：

```env
# 音楽ライブラリのパス（オプション）
MUSIC_LIBRARY_PATH=/path/to/your/music

# NextAuth設定（オプション）
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key

# Google OAuth（オプション）
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### 起動

```bash
# 開発サーバーを起動
npm run dev

# ブラウザで開く
# http://localhost:3001
```

#### Cloudflare Tunnelと一緒に起動:

**Windows:**
```bash
start-with-tunnel.bat
```

**macOS/Linux:**
```bash
chmod +x start-with-tunnel.sh
./start-with-tunnel.sh
```

### Electronアプリとして起動（オプション）

```bash
# Electronで起動
npm run electron-dev
```

## 外部ネットワークからのアクセス

### 方法1: Cloudflare Tunnel（推奨）⭐

**最も簡単で安全な方法です。ポート開放不要！**

#### メリット：
- ✅ ポートフォワーディング不要
- ✅ 無料で利用可能
- ✅ HTTPS自動設定
- ✅ DDoS保護付き
- ✅ 5分でセットアップ完了

#### 超簡単スタート（Quick Tunnel）：

**🌟 自動ブラウザ起動版（推奨）:**

**Windows:**
```bash
start-with-tunnel-simple.bat
```

このスクリプトは自動的に：
1. cloudflaredを検出（Downloadsフォルダも確認）
2. Quick Tunnelで一時的な公開URLを生成
3. **ブラウザを自動で開く** 🚀
4. サーバーを起動
5. スマホでアクセスする方法を表示

**通常版（手動でURLを確認）:**

**Windows:**
```bash
start-with-tunnel.bat
```

**macOS/Linux:**
```bash
chmod +x start-with-tunnel.sh
./start-with-tunnel.sh
```

**注意**: Quick TunnelのURLは一時的です。固定URLが必要な場合は下記の手順でNamed Tunnelを設定してください。

#### Named Tunnel（固定URL）のセットアップ：

```bash
# 1. cloudflaredをインストール
winget install --id Cloudflare.cloudflared

# 2. Cloudflareにログイン
cloudflared tunnel login

# 3. トンネルを作成
cloudflared tunnel create music-player

# 4. 設定ファイルを作成（~/.cloudflared/config.yml）
tunnel: music-player
credentials-file: /path/to/credentials.json
ingress:
  - hostname: music.yourdomain.com
    service: http://localhost:3001
  - service: http_status:404

# 5. DNSを設定
cloudflared tunnel route dns music-player music.yourdomain.com

# 6. トンネルを起動
cloudflared tunnel run music-player
```

詳細は [CLOUDFLARE_TUNNEL_SETUP.md](./CLOUDFLARE_TUNNEL_SETUP.md) を参照してください。

---

### 方法2: ポートフォワーディング（従来の方法）

### 概要
デフォルトではローカルネットワーク内のデバイスからのみアクセス可能ですが、以下の設定で外部（インターネット）からもアクセスできます。

### 1. ネットワーク情報の確認

1. サーバーを起動後、「Server Status」ページにアクセス
2. 「ネットワークアクセス」セクションで以下を確認：
   - **ローカルIP**: 同じWi-Fi内のデバイス用
   - **外部IP**: インターネット経由のアクセス用

### 2. ポートフォワーディング設定

外部からアクセスするには、ルーターでポート転送を設定する必要があります：

#### 一般的な手順：

1. **ルーターの管理画面にアクセス**
   - ブラウザで `http://192.168.1.1` または `http://192.168.0.1` を開く
   - ルーターのユーザー名とパスワードでログイン

2. **ポートフォワーディング設定を開く**
   - 「ポートフォワーディング」「仮想サーバー」「NAT設定」などの項目を探す

3. **新しいルールを追加**
   ```
   サービス名: Music Player
   外部ポート: 3001
   内部IP: [ローカルIP] (例: 192.168.1.100)
   内部ポート: 3001
   プロトコル: TCP
   ```

4. **設定を保存して再起動**

#### ルーター別の詳細ガイド：
- [PortForward.com](https://portforward.com/) - 各メーカーの詳細手順

### 3. 動的DNS（DDNS）の設定（推奨）

外部IPアドレスは変わる可能性があるため、DDNSサービスの利用を推奨：

- **No-IP**: https://www.noip.com/
- **DuckDNS**: https://www.duckdns.org/
- **Dynu**: https://www.dynu.com/

設定後、`http://your-domain.ddns.net:3001` のような固定URLでアクセス可能になります。

### 4. PWA（Progressive Web App）として使用

Cloudflare Tunnel経由でHTTPSアクセスすると、スマホやタブレットでPWAとして使用できます：

#### iOS（iPhone/iPad）:
1. Safariでアプリを開く
2. 共有ボタン（□↑）をタップ
3. 「ホーム画面に追加」を選択
4. アプリ名を確認して「追加」

#### Android:
1. Chromeでアプリを開く
2. メニュー（⋮）をタップ
3. 「ホーム画面に追加」を選択
4. アプリ名を確認して「追加」

#### PWA機能:
- ✅ ブラウザの枠なしでアプリのように起動
- ✅ ロック画面から再生コントロール
- ✅ 通知センターでの操作
- ✅ イヤホンのリモコン対応
- ✅ オフラインキャッシング
- ✅ ホーム画面アイコン

**注意**: PWA機能を使用するにはHTTPS接続が必要です（Cloudflare Tunnelを推奨）。

### 4. セキュリティ対策

外部公開する場合は、以下のセキュリティ対策を実施してください：

#### 基本認証の追加（推奨）

`server.js`に以下を追加：

```javascript
const basicAuth = require('express-basic-auth');

app.use(basicAuth({
  users: { 'admin': 'your-strong-password' },
  challenge: true,
  realm: 'Music Player'
}));
```

#### HTTPS化（強く推奨）

Let's Encryptで無料のSSL証明書を取得：

```bash
# Certbotをインストール
sudo apt-get install certbot

# 証明書を取得
sudo certbot certonly --standalone -d your-domain.com
```

`server.js`でHTTPSを有効化：

```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/your-domain.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/your-domain.com/fullchain.pem')
};

https.createServer(options, app).listen(443);
```

#### ファイアウォール設定

```bash
# UFWを使用する場合
sudo ufw allow 3001/tcp
sudo ufw enable
```

### 5. QRコードでアクセス

1. 「Server Status」ページの「外部ネットワーク」タブを開く
2. QRコードをスマホでスキャン
3. 自動的にブラウザでアプリが開きます

### トラブルシューティング

#### 外部からアクセスできない場合：

1. **ポート転送が正しく設定されているか確認**
   ```bash
   # ポートが開いているかテスト
   telnet your-external-ip 3001
   ```

2. **ファイアウォールを確認**
   - Windows: Windows Defenderファイアウォール
   - Linux: `sudo ufw status`

3. **ISPの制限を確認**
   - 一部のISPはポート80/443以外をブロックしている場合があります

4. **ルーターの再起動**
   - 設定変更後はルーターを再起動してください

### セキュリティ上の注意

⚠️ **重要**: 外部公開する場合は以下に注意してください：

- 強力なパスワードを設定する
- HTTPSを使用する（HTTP通信は暗号化されません）
- 信頼できるユーザーのみにURLを共有する
- 定期的にアクセスログを確認する
- 不要な場合はポート転送を無効にする

# ビルド
npm run electron-build
```

## 使い方

### 音楽の追加

1. **自動スキャン**: `uploads/music`フォルダに音楽ファイルを配置してサーバーを再起動
2. **手動スキャン**: ホーム画面の「ライブラリをスキャン」ボタンをクリック
3. **アップロード**: アップロード画面からドラッグ&ドロップ

### プレイリストの作成

1. サイドバーの「Playlists」セクションの「+」ボタンをクリック
2. プレイリスト名を入力
3. 楽曲の「...」メニューから「プレイリストに追加」を選択

### マルチデバイス同期

1. 複数のデバイスで同じURLにアクセス
2. PlayerBar右側のMonitorアイコンをクリック
3. 「全デバイスで同時再生」をオンにする

### キーボードショートカット

- `Space`: 再生/一時停止
- `→`: 次の曲
- `←`: 前の曲
- `↑`: 音量アップ
- `↓`: 音量ダウン

## 対応フォーマット

### ロスレス
- FLAC (最大192kHz/32bit)
- WAV (最大192kHz/32bit)
- DSD (DSD64, DSD128)
- ALAC (Apple Lossless)

### 圧縮
- MP3 (最大320kbps)
- AAC/M4A (最大320kbps)
- OGG Vorbis
- WMA

## API エンドポイント

### 音楽
- `GET /api/music/tracks` - トラック一覧取得
- `GET /api/music/tracks/[id]` - トラック詳細取得
- `PATCH /api/music/tracks/[id]` - トラック更新
- `DELETE /api/music/tracks/[id]` - トラック削除
- `POST /api/music/scan` - ライブラリスキャン
- `GET /api/music/stream/[...path]` - 音楽ストリーミング

### プレイリスト
- `GET /api/playlists` - プレイリスト一覧
- `POST /api/playlists` - プレイリスト作成
- `GET /api/playlists/[id]` - プレイリスト詳細
- `PATCH /api/playlists/[id]` - プレイリスト更新
- `DELETE /api/playlists/[id]` - プレイリスト削除

## トラブルシューティング

### 音が出ない
- ブラウザの自動再生ポリシーにより、最初のクリックが必要な場合があります
- 音量がミュートになっていないか確認してください

### 楽曲が表示されない
- データベースをリセット: `npm run db:push`
- ライブラリを再スキャン: ホーム画面の「ライブラリをスキャン」ボタン

### 日本語ファイル名が文字化けする
- ファイルシステムがUTF-8をサポートしているか確認
- Windowsの場合、ファイル名が正しくエンコードされているか確認

### Cloudflare Tunnel経由でログが表示されない
- 詳細は [LOGGING_TROUBLESHOOTING.md](./LOGGING_TROUBLESHOOTING.md) を参照
- server.jsが最新版か確認
- トンネルのターゲットが `http://127.0.0.1:3001` になっているか確認
- ブラウザのコンソール（F12）でエラーを確認

## ライセンス

MIT License

## 貢献

プルリクエストを歓迎します！大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## 作者

[@tstyr](https://github.com/tstyr)

## 謝辞

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [Socket.io](https://socket.io/)
- [music-metadata](https://github.com/Borewit/music-metadata)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
