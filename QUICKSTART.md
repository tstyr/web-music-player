# 🚀 クイックスタートガイド

**たった1コマンドで起動！**

---

## 🎯 超簡単スタート（1分）

### Windows:
```bash
start.bat
```

### macOS/Linux:
```bash
chmod +x start.sh
./start.sh
```

**それだけ！** ブラウザで **http://localhost:3001** が自動で開きます 🎉

---

## 📱 スマホからアクセス（30秒）

1. PCで「Server Status」を開く
2. QRコードをスマホでスキャン
3. 完了！

---

## 🌐 外部公開（5分）

### Cloudflare Tunnel（推奨・無料）

```bash
# 1. インストール
winget install --id Cloudflare.cloudflared

# 2. ログイン
cloudflared tunnel login

# 3. セットアップ
cloudflared tunnel create music-player

# 4. 設定ファイル作成
# ~/.cloudflared/config.yml
```

**config.yml:**
```yaml
tunnel: music-player
credentials-file: /path/to/<tunnel-id>.json
ingress:
  - hostname: music.yourdomain.com
    service: http://localhost:3001
  - service: http_status:404
```

```bash
# 5. DNS設定
cloudflared tunnel route dns music-player music.yourdomain.com

# 6. 起動
cloudflared tunnel run music-player
```

**完了！** https://music.yourdomain.com でアクセス可能 ✨

詳細: [CLOUDFLARE_TUNNEL_SETUP.md](./CLOUDFLARE_TUNNEL_SETUP.md)

---

## 🎵 基本的な使い方

### 音楽を再生

1. **Home**タブで楽曲カードをクリック
2. スペースキーで再生/一時停止
3. 矢印キーで曲送り/戻し

### プレイリストを作成

1. サイドバーの「+」ボタンをクリック
2. プレイリスト名を入力
3. 楽曲の「...」メニューから「プレイリストに追加」

### マルチデバイス同期

1. 複数のデバイスで同じURLを開く
2. プレイヤーバーの「デバイス」アイコンをクリック
3. 「全デバイスで同時再生」をON

---

## 🔧 トラブルシューティング

### 音楽が再生されない

```bash
# ライブラリを再スキャン
Server Status → 音楽フォルダをスキャン
```

### ポート3001が使用中

```bash
# 別のポートで起動
PORT=3002 npm run dev
```

### Cloudflare Tunnelが起動しない

```bash
# トンネルの状態を確認
cloudflared tunnel info music-player

# ログを確認
cloudflared tunnel run music-player --loglevel debug
```

---

## 📱 スマホからアクセス

### 同じWi-Fi内:
1. PCで「Server Status」を開く
2. QRコードをスマホでスキャン

### 外部から（Cloudflare Tunnel使用時）:
1. `https://music.yourdomain.com` にアクセス
2. ブックマークに追加

---

## ⚙️ 便利なコマンド

```bash
# 開発サーバー起動
npm run dev

# Cloudflare Tunnelと同時起動
npm run dev:tunnel

# データベース管理画面
npm run db:studio

# Electronアプリとして起動
npm run electron-dev
```

---

## 🎯 次のステップ

- [README.md](./README.md) - 詳細な機能説明
- [CLOUDFLARE_TUNNEL_SETUP.md](./CLOUDFLARE_TUNNEL_SETUP.md) - Cloudflare Tunnelの詳細設定
- [Server Status] - システム情報とネットワーク設定

---

## 💡 ヒント

- **Hi-Res音源**: FLAC、WAV、DSDファイルに対応（最大192kHz/32bit）
- **日本語ファイル名**: 完全対応、文字化けなし
- **キーボードショートカット**: スペース（再生/一時停止）、矢印キー（曲送り）
- **ビジュアライザー**: クリックで全画面表示

---

## 🆘 サポート

問題が発生した場合:

1. [GitHub Issues](https://github.com/tstyr/web-music-player/issues)
2. ログを確認: ブラウザのコンソール（F12）
3. サーバーログを確認: ターミナルの出力

---

**楽しい音楽ライフを！** 🎵✨
