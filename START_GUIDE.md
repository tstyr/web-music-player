# 🎵 Spotify Music Server - 起動ガイド

## 起動方法

このプロジェクトには4つの起動用batファイルがあります。用途に応じて選択してください。

### 1. `start-music-server.bat` ⭐ 推奨
**リアルタイムログ表示版**

```bash
start-music-server.bat
```

**特徴:**
- コマンドプロンプトを開いたまま
- すべてのサーバーログをリアルタイム表示
- データベース初期化を自動実行
- カラフルな表示

**使用シーン:**
- 開発中のデバッグ
- エラーの確認
- 通常の起動


### 2. `start-with-browser.bat` 🌐
**ブラウザ自動起動版**

```bash
start-with-browser.bat
```

**特徴:**
- サーバー起動後、自動的にブラウザを開く
- バックグラウンドで実行
- 初回起動に便利

**使用シーン:**
- 初めて使う時
- すぐにブラウザで確認したい時


### 3. `start-verbose.bat` 🔍
**詳細ログ版**

```bash
start-verbose.bat
```

**特徴:**
- 最も詳細なログを表示
- システム情報も表示
- デバッグモード有効
- すべてのアクセスURLを表示

**使用シーン:**
- 問題のトラブルシューティング
- 詳細な情報が必要な時
- 開発者向け


### 4. `start-simple.bat` ⚡
**シンプル版**

```bash
start-simple.bat
```

**特徴:**
- 最小限の出力
- 高速起動
- シンプルな表示

**使用シーン:**
- 素早く起動したい時
- ログが不要な時


## アクセスURL

サーバー起動後、以下のURLにアクセスできます：

- **ホーム**: http://localhost:3000
- **管理ダッシュボード**: http://localhost:3000/admin/dashboard
- **アップロード**: http://localhost:3000/upload
- **音楽ライブラリ**: http://localhost:3000/music

### 別端末からのアクセス

同じネットワーク内の別端末からアクセスする場合：

```
http://[サーバーのIPアドレス]:3000
```

例: `http://192.168.1.100:3000`


## サーバーの停止方法

コマンドプロンプトで `Ctrl + C` を押してください。


## トラブルシューティング

### ポート3000が既に使用されている

別のアプリケーションがポート3000を使用している場合：

1. 他のアプリケーションを停止
2. または、`package.json`の`dev`スクリプトを編集してポートを変更

```json
"dev": "next dev -p 3001 -H 0.0.0.0"
```

### データベースエラー

データベースに問題がある場合：

```bash
npm run db:push
```

### 依存関係のエラー

依存関係を再インストール：

```bash
npm install
```


## 初回セットアップ

1. **依存関係のインストール**
   ```bash
   npm install
   ```

2. **データベースの初期化**
   ```bash
   npm run db:generate
   npm run db:push
   ```

3. **サーバー起動**
   ```bash
   start-music-server.bat
   ```

4. **音楽ファイルのスキャン**
   - 管理ダッシュボードにアクセス
   - 「音楽フォルダをスキャン」をクリック


## 開発コマンド

### データベース管理
```bash
npm run db:studio    # Prisma Studioを開く
npm run db:generate  # Prismaクライアントを生成
npm run db:push      # データベーススキーマを更新
```

### ビルド
```bash
npm run build        # プロダクションビルド
npm run start        # プロダクションサーバー起動
```

### Electron
```bash
npm run electron-dev # Electronアプリとして起動
```


## ログの見方

### 正常な起動ログ

```
✓ Ready in 1640ms
- Local:   http://localhost:3000
- Network: http://0.0.0.0:3000
```

### エラーログ

エラーが発生した場合、コマンドプロンプトに詳細が表示されます。

**よくあるエラー:**

1. **EADDRINUSE**: ポートが既に使用中
2. **ENOENT**: ファイルが見つからない
3. **Database error**: データベース接続エラー


## サポート

問題が解決しない場合は、`start-verbose.bat`を使用して詳細ログを確認してください。
