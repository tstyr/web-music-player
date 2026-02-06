# Quick Tunnel 使い方ガイド

Cloudflare Quick Tunnelを使用すると、**設定不要**で即座にアプリを外部公開できます。

## 🚀 超簡単スタート

### Windows（自動ブラウザ起動版）⭐ 推奨

1. **ダブルクリックで起動**
   ```
   start-with-tunnel-simple.bat
   ```

2. **自動的に実行されること**
   - Cloudflare Tunnelが起動
   - 公開URLが生成される
   - **ブラウザが自動で開く** 🎉
   - サーバーが起動

3. **スマホでアクセス**
   - コンソールに表示されたURLをコピー
   - スマホのブラウザで開く
   - または、QRコード生成サイトでQRコード化してスキャン

### Windows（通常版）

1. **ダブルクリックで起動**
   ```
   start-with-tunnel.bat
   ```

2. **2つのウィンドウが開きます**
   - メインウィンドウ: サーバーログ
   - Cloudflare Tunnelウィンドウ: トンネルURL表示

3. **URLを確認**
   - Cloudflare Tunnelウィンドウに表示される
   - `https://xxxxx-xxxx-xxxx.trycloudflare.com` のような形式

4. **スマホでアクセス**
   - 表示されたURLをスマホのブラウザで開く
   - または、QRコード生成サイトでQRコード化してスキャン

### macOS/Linux

1. **ターミナルで実行**
   ```bash
   chmod +x start-with-tunnel.sh
   ./start-with-tunnel.sh
   ```

2. **URLを確認**
   - ターミナルに表示される
   - `https://xxxxx-xxxx-xxxx.trycloudflare.com` のような形式
   - QRコードも自動表示（curlが利用可能な場合）

3. **スマホでアクセス**
   - 表示されたURLをスマホのブラウザで開く
   - または、QRコードをスキャン

## 📱 スマホでアクセスする方法

### 方法1: URLを手入力

1. Cloudflare TunnelウィンドウまたはターミナルでURLを確認
2. スマホのブラウザでURLを入力
3. アクセス完了

### 方法2: QRコード（推奨）

#### オンラインQRコード生成サイトを使用:

1. 以下のサイトにアクセス:
   - https://www.qr-code-generator.com/
   - https://qrcode.tec-it.com/
   - https://www.the-qrcode-generator.com/

2. トンネルURLを入力

3. QRコードを生成

4. スマホでスキャン

#### ターミナルでQRコード表示（macOS/Linux）:

```bash
# トンネルURLを取得
TUNNEL_URL=$(grep -oP 'https://[^\s]+trycloudflare.com' /tmp/cloudflared-tunnel.log | head -1)

# QRコードを表示
curl qrenco.de/$TUNNEL_URL
```

### 方法3: メッセージアプリで送信

1. トンネルURLをコピー
2. 自分宛にメッセージ送信（LINE、Slack、メールなど）
3. スマホでメッセージを開いてURLをタップ

## 🔧 トラブルシューティング

### cloudflaredが見つからない

**エラー**: `cloudflared not found`

**解決策**:

#### Windows:
```powershell
# 方法1: wingetでインストール
winget install --id Cloudflare.cloudflared

# 方法2: 手動ダウンロード
# 1. https://github.com/cloudflare/cloudflared/releases にアクセス
# 2. cloudflared-windows-amd64.exe をダウンロード
# 3. Downloadsフォルダに保存（スクリプトが自動検出）
```

#### macOS:
```bash
brew install cloudflare/cloudflare/cloudflared
```

#### Linux:
```bash
# Debian/Ubuntu
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# または直接実行
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
mv cloudflared-linux-amd64 ~/Downloads/cloudflared
```

### トンネルURLが表示されない

**原因**: トンネルの起動に時間がかかっている

**解決策**:
1. 10-15秒待つ
2. Cloudflare Tunnelウィンドウを確認
3. ログファイルを確認:
   - Windows: Cloudflare Tunnelウィンドウ
   - macOS/Linux: `/tmp/cloudflared-tunnel.log`

### ポート3001が使用中

**エラー**: `Port 3001 is already in use`

**解決策**:
1. 既存のサーバーを停止
2. または、別のポートを使用:
   ```bash
   # .envファイルを編集
   PORT=3002
   
   # トンネルも変更
   cloudflared tunnel --url http://localhost:3002
   ```

### スマホからアクセスできない

**確認事項**:
1. ✅ HTTPSで始まるURLか確認（`https://`）
2. ✅ トンネルが起動しているか確認
3. ✅ サーバーが起動しているか確認（`http://localhost:3001`にアクセス）
4. ✅ スマホがインターネットに接続されているか確認

## 📊 Quick Tunnel vs Named Tunnel

| 機能 | Quick Tunnel | Named Tunnel |
|------|--------------|--------------|
| 設定 | 不要 | 必要 |
| URL | 毎回変わる | 固定 |
| アカウント | 不要 | 必要 |
| カスタムドメイン | ❌ | ✅ |
| 永続性 | 一時的 | 永続的 |
| 用途 | テスト・一時使用 | 本格運用 |

## 💡 使い分け

### Quick Tunnelが適している場合:
- ✅ 初めて試す
- ✅ 一時的に外部公開したい
- ✅ テスト・デモ用
- ✅ 設定が面倒

### Named Tunnelが適している場合:
- ✅ 固定URLが必要
- ✅ カスタムドメインを使いたい
- ✅ 長期運用
- ✅ 複数人で共有

## 🔐 セキュリティ

Quick Tunnelは安全ですが、以下に注意:

1. **URLを共有しない**: トンネルURLは誰でもアクセス可能
2. **認証を追加**: 重要なデータがある場合は認証を実装
3. **一時的な使用**: 長期運用にはNamed Tunnelを推奨
4. **ログを確認**: 不審なアクセスがないか確認

## 📚 次のステップ

Quick Tunnelで動作確認ができたら、Named Tunnelへの移行を検討:

1. [CLOUDFLARE_TUNNEL_SETUP.md](./CLOUDFLARE_TUNNEL_SETUP.md) を参照
2. Cloudflareアカウントを作成
3. Named Tunnelを設定
4. 固定URLで運用開始

## 🆘 サポート

問題が解決しない場合:

1. [GitHub Issues](https://github.com/tstyr/web-music-player/issues) で報告
2. [Cloudflare公式ドキュメント](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) を参照
3. ログファイルを確認して詳細を調査

## 📝 よくある質問

### Q: Quick TunnelのURLはどのくらい有効？
A: サーバーを停止するまで有効です。再起動すると新しいURLが生成されます。

### Q: 複数のデバイスから同時にアクセスできる？
A: はい、同じURLを使用すれば複数デバイスから同時アクセス可能です。

### Q: 帯域制限はある？
A: Cloudflareの無料プランの制限内で使用できます。通常の音楽再生には十分です。

### Q: カスタムドメインは使える？
A: Quick Tunnelでは使えません。Named Tunnelを使用してください。

### Q: 商用利用できる？
A: Cloudflareの利用規約に従ってください。本格的な商用利用にはNamed Tunnelを推奨します。
