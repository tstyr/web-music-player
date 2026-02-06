# Quick Tunnel テストチェックリスト

## 前提条件

- [ ] Node.jsがインストールされている
- [ ] プロジェクトの依存関係がインストールされている（`npm install`）
- [ ] cloudflaredがインストールされている、またはDownloadsフォルダにある

## Windows テスト

### 1. cloudflaredの検出テスト

#### ケース1: PATHにcloudflaredがある場合
```bash
# cloudflaredをインストール
winget install --id Cloudflare.cloudflared

# スクリプトを実行
start-with-tunnel.bat
```

**期待される動作**:
- [ ] `[OK] cloudflared found in PATH` と表示される
- [ ] Cloudflare Tunnelウィンドウが別に開く
- [ ] サーバーが起動する

#### ケース2: Downloadsフォルダにcloudflaredがある場合
```bash
# cloudflared-windows-amd64.exeをDownloadsフォルダに配置

# スクリプトを実行
start-with-tunnel.bat
```

**期待される動作**:
- [ ] `[OK] Found cloudflared at: %USERPROFILE%\Downloads\` と表示される
- [ ] Cloudflare Tunnelウィンドウが別に開く
- [ ] サーバーが起動する

#### ケース3: cloudflaredがない場合
```bash
# cloudflaredをアンインストールまたは移動

# スクリプトを実行
start-with-tunnel.bat
```

**期待される動作**:
- [ ] `[WARNING] cloudflared not found!` と表示される
- [ ] インストール方法が表示される
- [ ] トンネルなしでサーバーが起動する

### 2. トンネルURL表示テスト

```bash
start-with-tunnel.bat
```

**期待される動作**:
- [ ] Cloudflare Tunnelウィンドウに `https://xxxxx.trycloudflare.com` のようなURLが表示される
- [ ] メインウィンドウにスマホでアクセスする方法が表示される
- [ ] QRコード生成サイトのリンクが表示される

### 3. サーバー起動テスト

```bash
start-with-tunnel.bat
```

**期待される動作**:
- [ ] `[INFO] Starting Music Player Server on http://localhost:3001` と表示される
- [ ] `npm run dev` が実行される
- [ ] ブラウザで `http://localhost:3001` にアクセスできる

### 4. 並列起動テスト

```bash
start-with-tunnel.bat
```

**期待される動作**:
- [ ] Cloudflare Tunnelウィンドウとメインウィンドウが同時に動作する
- [ ] メインウィンドウを閉じてもトンネルは動作し続ける
- [ ] トンネルウィンドウを閉じてもサーバーは動作し続ける

## macOS/Linux テスト

### 1. cloudflaredの検出テスト

#### ケース1: PATHにcloudflaredがある場合
```bash
# cloudflaredをインストール
# macOS: brew install cloudflare/cloudflare/cloudflared
# Linux: sudo dpkg -i cloudflared-linux-amd64.deb

# スクリプトを実行
chmod +x start-with-tunnel.sh
./start-with-tunnel.sh
```

**期待される動作**:
- [ ] `[OK] cloudflared found in PATH` と表示される
- [ ] トンネルがバックグラウンドで起動する
- [ ] サーバーが起動する

#### ケース2: Downloadsフォルダにcloudflaredがある場合
```bash
# cloudflaredをDownloadsフォルダに配置
# chmod +x ~/Downloads/cloudflared

# スクリプトを実行
./start-with-tunnel.sh
```

**期待される動作**:
- [ ] `[OK] Found cloudflared at: $HOME/Downloads/` と表示される
- [ ] トンネルがバックグラウンドで起動する
- [ ] サーバーが起動する

#### ケース3: cloudflaredがない場合
```bash
# cloudflaredをアンインストールまたは移動

# スクリプトを実行
./start-with-tunnel.sh
```

**期待される動作**:
- [ ] `[WARNING] cloudflared not found!` と表示される
- [ ] インストール方法が表示される
- [ ] トンネルなしでサーバーが起動する

### 2. トンネルURL表示テスト

```bash
./start-with-tunnel.sh
```

**期待される動作**:
- [ ] `🌐 Tunnel URL: https://xxxxx.trycloudflare.com` と表示される
- [ ] QRコードが表示される（curlが利用可能な場合）
- [ ] スマホでアクセスする方法が表示される

### 3. ログファイルテスト

```bash
./start-with-tunnel.sh

# 別のターミナルで
tail -f /tmp/cloudflared-tunnel.log
```

**期待される動作**:
- [ ] `/tmp/cloudflared-tunnel.log` が作成される
- [ ] トンネルのログが記録される
- [ ] URLが含まれている

### 4. クリーンアップテスト

```bash
./start-with-tunnel.sh

# Ctrl+Cで停止
```

**期待される動作**:
- [ ] `[INFO] Stopping Cloudflare Tunnel...` と表示される
- [ ] トンネルプロセスが停止する
- [ ] サーバープロセスが停止する

## 外部アクセステスト

### 1. スマホからアクセス

```bash
# スクリプトを起動
start-with-tunnel.bat  # または ./start-with-tunnel.sh

# 表示されたURLをスマホのブラウザで開く
```

**期待される動作**:
- [ ] スマホでアプリが表示される
- [ ] 音楽が再生できる
- [ ] PWAとしてインストールできる

### 2. QRコードテスト

```bash
# トンネルURLを取得
# Windows: Cloudflare Tunnelウィンドウから
# macOS/Linux: ターミナルに表示される

# QRコード生成サイトでQRコード化
# https://www.qr-code-generator.com/

# スマホでスキャン
```

**期待される動作**:
- [ ] QRコードが正しく生成される
- [ ] スキャンでアプリが開く
- [ ] 正常にアクセスできる

### 3. 複数デバイステスト

```bash
# 同じURLを複数のデバイスで開く
```

**期待される動作**:
- [ ] 複数デバイスから同時アクセスできる
- [ ] Socket.io同期が動作する
- [ ] 再生状態が同期される

## パフォーマンステスト

### 1. 起動時間

```bash
# 時間を計測
time ./start-with-tunnel.sh  # macOS/Linux
```

**期待される動作**:
- [ ] 5秒以内にトンネルが起動する
- [ ] 10秒以内にサーバーが起動する

### 2. 音楽再生

```bash
# スマホでアクセスして音楽を再生
```

**期待される動作**:
- [ ] 音楽がスムーズに再生される
- [ ] バッファリングが少ない
- [ ] 音質が良好

### 3. 同期テスト

```bash
# 複数デバイスで同時再生
```

**期待される動作**:
- [ ] 再生状態が同期される
- [ ] 遅延が200ms以内
- [ ] 音ズレが少ない

## エラーハンドリングテスト

### 1. ポート競合

```bash
# 既にポート3001を使用している状態で起動
```

**期待される動作**:
- [ ] エラーメッセージが表示される
- [ ] 適切な対処方法が提示される

### 2. ネットワークエラー

```bash
# インターネット接続を切断して起動
```

**期待される動作**:
- [ ] トンネルが起動できない旨のエラーが表示される
- [ ] ローカルサーバーは起動する

### 3. cloudflaredのバージョン不一致

```bash
# 古いバージョンのcloudflaredで起動
```

**期待される動作**:
- [ ] 警告が表示される（可能な場合）
- [ ] または正常に動作する

## ドキュメントテスト

### 1. README.md

- [ ] Quick Tunnelの説明が追加されている
- [ ] 使い方が明確
- [ ] リンクが正しい

### 2. CLOUDFLARE_TUNNEL_SETUP.md

- [ ] Quick Tunnelのセクションが追加されている
- [ ] Named Tunnelとの違いが説明されている
- [ ] 手順が明確

### 3. QUICK_TUNNEL_GUIDE.md

- [ ] 新規作成されている
- [ ] 詳細な使い方が記載されている
- [ ] トラブルシューティングが充実している

## 総合評価

### 必須項目
- [ ] cloudflaredの自動検出が動作する
- [ ] Quick Tunnelが起動する
- [ ] サーバーが起動する
- [ ] 外部からアクセスできる
- [ ] スマホで音楽が再生できる

### 推奨項目
- [ ] QRコードが表示される（macOS/Linux）
- [ ] エラーメッセージが適切
- [ ] ドキュメントが充実している
- [ ] パフォーマンスが良好

### オプション項目
- [ ] 複数デバイス同期が動作する
- [ ] PWAとしてインストールできる
- [ ] Media Session APIが動作する

## 問題が見つかった場合

1. エラーメッセージをコピー
2. ログファイルを確認
3. GitHub Issuesで報告
4. 以下の情報を含める:
   - OS（Windows/macOS/Linux）
   - cloudflaredのバージョン
   - Node.jsのバージョン
   - エラーメッセージ
   - 再現手順
