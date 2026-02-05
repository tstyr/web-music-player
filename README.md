# Web Music Player

高品質な音楽再生とマルチデバイス同期機能を備えた、モダンなWebベースの音楽プレイヤー。

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

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router), React 18, TypeScript
- **スタイリング**: Tailwind CSS, Framer Motion
- **状態管理**: Zustand
- **データベース**: SQLite + Prisma ORM
- **リアルタイム通信**: Socket.io
- **音声処理**: Web Audio API, music-metadata
- **デスクトップアプリ**: Electron (オプション)

## セットアップ

### 必要要件
- Node.js 18以上
- npm または yarn

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/tstyr/web-music-player.git
cd web-music-player

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

### Electronアプリとして起動（オプション）

```bash
# Electronで起動
npm run electron-dev

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
