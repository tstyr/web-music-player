# Cloudflare Tunnel セットアップガイド

Cloudflare Tunnelを使用すると、ポートフォワーディング不要で安全にアプリを外部公開できます。

## メリット

- ✅ **ポート開放不要**: ルーター設定が不要
- ✅ **無料**: Cloudflareの無料プランで利用可能
- ✅ **HTTPS自動**: SSL証明書が自動で設定される
- ✅ **DDoS保護**: Cloudflareのセキュリティ機能を利用
- ✅ **簡単設定**: 数分でセットアップ完了

## 🚀 クイックスタート（推奨）

**最も簡単な方法**: Quick Tunnelを使用（設定不要）

### Windows:
```bash
start-with-tunnel.bat
```

### macOS/Linux:
```bash
chmod +x start-with-tunnel.sh
./start-with-tunnel.sh
```

このスクリプトは：
1. 自動的にcloudflaredを検出
2. Quick Tunnelで一時的な公開URLを生成
3. サーバーを起動

**注意**: Quick Tunnelは一時的なURLです。サーバーを再起動すると新しいURLが生成されます。

---

## 📋 2つの方法

### 方法1: Quick Tunnel（初心者向け）⭐

**メリット**:
- 設定不要
- すぐに使える
- アカウント不要

**デメリット**:
- URLが毎回変わる
- 一時的な使用のみ

**使い方**:
```bash
# Windows
start-with-tunnel.bat

# macOS/Linux
./start-with-tunnel.sh
```

### 方法2: Named Tunnel（本格運用向け）

**メリット**:
- 固定URL
- カスタムドメイン使用可能
- 永続的

**デメリット**:
- 初期設定が必要
- Cloudflareアカウント必要

以下、Named Tunnelのセットアップ手順です。

---

## セットアップ手順（Named Tunnel）

### 1. Cloudflareアカウント作成

1. [Cloudflare](https://dash.cloudflare.com/sign-up)にアクセス
2. 無料アカウントを作成
3. ドメインを追加（無料のサブドメインも利用可能）

### 2. cloudflaredのインストール

#### Windows:
```powershell
# PowerShellで実行
winget install --id Cloudflare.cloudflared
```

または[公式サイト](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)からダウンロード

#### macOS:
```bash
brew install cloudflare/cloudflare/cloudflared
```

#### Linux:
```bash
# Debian/Ubuntu
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# または
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
```

### 3. Cloudflareにログイン

```bash
cloudflared tunnel login
```

ブラウザが開くので、Cloudflareアカウントでログインして認証します。

### 4. トンネルを作成

```bash
# トンネルを作成（music-playerは任意の名前）
cloudflared tunnel create music-player

# トンネルIDが表示されるのでメモしておく
# 例: Created tunnel music-player with id xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 5. 設定ファイルを作成

#### Windows:
`C:\Users\<ユーザー名>\.cloudflared\config.yml` を作成

#### macOS/Linux:
`~/.cloudflared/config.yml` を作成

```yaml
tunnel: music-player
credentials-file: C:\Users\<ユーザー名>\.cloudflared\xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.json

ingress:
  - hostname: music.yourdomain.com
    service: http://localhost:3001
  - service: http_status:404
```

**注意**: 
- `tunnel`: 作成したトンネル名
- `credentials-file`: トンネル作成時に生成されたJSONファイルのパス
- `hostname`: 使用するドメイン（Cloudflareで管理しているドメイン）

### 6. DNSレコードを設定

```bash
cloudflared tunnel route dns music-player music.yourdomain.com
```

これで `music.yourdomain.com` が自動的にトンネルにルーティングされます。

### 7. トンネルを起動

#### 手動起動:
```bash
cloudflared tunnel run music-player
```

#### サービスとして起動（推奨）:

**Windows:**
```powershell
cloudflared service install
cloudflared service start
```

**macOS/Linux:**
```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

### 8. アプリケーションを起動

```bash
npm run dev
```

これで `https://music.yourdomain.com` でアクセスできます！

## 無料サブドメインを使用する場合

Cloudflareの無料サブドメインを使用する場合：

1. Cloudflare Dashboardで「Zero Trust」→「Access」→「Tunnels」を開く
2. 「Create a tunnel」をクリック
3. トンネル名を入力（例: music-player）
4. コネクタをインストール（上記の手順と同じ）
5. 「Public Hostname」を追加
   - Subdomain: `music`
   - Domain: `<your-team>.cloudflareaccess.com`（自動生成）
   - Service: `http://localhost:3001`

これで `https://music.<your-team>.cloudflareaccess.com` でアクセスできます。

## トラブルシューティング

### トンネルが起動しない

```bash
# トンネルのステータスを確認
cloudflared tunnel info music-player

# ログを確認
cloudflared tunnel run music-player --loglevel debug
```

### アクセスできない

1. アプリケーションが起動しているか確認
   ```bash
   curl http://localhost:3001
   ```

2. トンネルが実行中か確認
   ```bash
   # Windows
   Get-Service cloudflared
   
   # Linux/macOS
   sudo systemctl status cloudflared
   ```

3. DNSが正しく設定されているか確認
   ```bash
   nslookup music.yourdomain.com
   ```

### ポート3001が使用中

別のポートを使用する場合は、`config.yml`と`server.js`の両方を変更：

```yaml
# config.yml
ingress:
  - hostname: music.yourdomain.com
    service: http://localhost:3002  # ポート変更
```

```bash
# 環境変数でポート指定
PORT=3002 npm run dev
```

## セキュリティ設定（オプション）

### Cloudflare Accessで認証を追加

1. Cloudflare Dashboard → Zero Trust → Access → Applications
2. 「Add an application」をクリック
3. 「Self-hosted」を選択
4. アプリケーション名とドメインを設定
5. ポリシーを追加（例: メールアドレスで制限）

これで、指定したユーザーのみがアクセスできるようになります。

### IP制限

Cloudflare Dashboardで特定のIPアドレスのみ許可：

1. Security → WAF → Custom rules
2. 「Create rule」をクリック
3. 条件を設定（例: IP is not in [許可するIP]）
4. アクションを「Block」に設定

## 便利なコマンド

```bash
# トンネル一覧を表示
cloudflared tunnel list

# トンネルを削除
cloudflared tunnel delete music-player

# トンネルを停止
cloudflared tunnel stop music-player

# サービスを再起動
# Windows
Restart-Service cloudflared

# Linux/macOS
sudo systemctl restart cloudflared
```

## 料金

- **Cloudflare Tunnel**: 完全無料
- **帯域幅**: 無制限
- **接続数**: 無制限
- **SSL証明書**: 無料で自動更新

## 参考リンク

- [Cloudflare Tunnel公式ドキュメント](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [cloudflaredダウンロード](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)
- [Cloudflare Zero Trust](https://www.cloudflare.com/products/zero-trust/)
