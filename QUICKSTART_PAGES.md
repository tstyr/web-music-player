# ⚡ クイックスタート - Cloudflare Pages版

固定URLで音楽プレイヤーにアクセスできるようにする最速ガイドです。

## 🎯 ゴール

- **固定URL**: `https://music-player.pages.dev`
- **iPadからアクセス**: どこからでも
- **自動接続**: トンネルURL自動取得

---

## 📋 チェックリスト

### 事前準備
- [ ] Cloudflareアカウント作成済み
- [ ] GitHubアカウント作成済み
- [ ] Node.js インストール済み
- [ ] cloudflared インストール済み

### デプロイ
- [ ] Workersデプロイ完了
- [ ] Pagesデプロイ完了

### 動作確認
- [ ] ローカルサーバー起動
- [ ] トンネル起動
- [ ] iPadからアクセス成功

---

## 🚀 ステップ1: Workersデプロイ（5分）

### 1-1. 新しいディレクトリで作業

```bash
cd ..
mkdir music-tunnel-api
cd music-tunnel-api
npm create cloudflare@latest
```

選択:
- Name: `music-tunnel-api`
- Type: `"Hello World" Worker`
- TypeScript: `No`
- Deploy: `No`

### 1-2. コードをコピー

元のプロジェクトの `WORKERS_SIMPLE_PROMPT.txt` を開いて、内容をAIに渡すか、手動で `src/index.js` を作成。

### 1-3. KV作成

```bash
wrangler kv:namespace create "TUNNEL_KV"
```

出力されたIDをコピー。

### 1-4. wrangler.toml編集

```toml
name = "local-music-on-everyone-devices"
main = "src/index.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "TUNNEL_KV"
id = "YOUR_KV_ID_HERE"  # ← ここに貼り付け
```

### 1-5. デプロイ

```bash
wrangler deploy
```

成功すると:
```
https://music-tunnel-api.haka01xx.workers.dev
```

### 1-6. 確認

```bash
# PowerShell
Invoke-WebRequest -Uri "https://music-tunnel-api.haka01xx.workers.dev/tunnel" -UseBasicParsing
```

出力:
```json
{"url":null,"message":"トンネルURLが設定されていません"}
```

✅ これでOK！

---

## 🌐 ステップ2: Pagesデプロイ（5分）

### 2-1. GitHubにプッシュ

元のプロジェクトディレクトリに戻る:

```bash
cd ../[プロジェクト名]
git add .
git commit -m "Cloudflare Pages対応"
git push origin main
```

### 2-2. Cloudflare Pagesで設定

1. https://dash.cloudflare.com/ にログイン
2. **Pages** → **Create a project**
3. **Connect to Git** → リポジトリ選択
4. 設定:

```
Project name: music-player
Branch: main
Build command: npm run build
Build output: .next
```

5. **Environment variables** → **Add variable**:

```
NODE_VERSION = 18
```

6. **Save and Deploy**

### 2-3. デプロイ完了を待つ

3-5分でデプロイ完了。URLが表示されます:

```
https://music-player.pages.dev
```

---

## 🎵 ステップ3: ローカルサーバー起動

### 3-1. サーバー+トンネル起動

```bash
npm run start:all
```

### 3-2. 出力確認

```
✅ トンネルURL取得成功!
   URL: https://abc-123-def.trycloudflare.com

📤 WorkersにURL送信中...
✅ Workers更新成功!

╔═══════════════════════════════════════════╗
║  🎉 準備完了！トンネルが稼働中です  ║
╚═══════════════════════════════════════════╝
```

✅ これが表示されればOK！

---

## 📱 ステップ4: iPadでアクセス

### 4-1. Safariで開く

```
https://music-player.pages.dev
```

### 4-2. 自動接続

ページが読み込まれると:

1. Workersからトンネル URL自動取得
2. localStorageに保存
3. 音楽プレイヤー表示
4. 再生可能！🎉

### 4-3. 確認方法

Safari > 開発 > Webインスペクタ > Console:

```
[Tunnel] トンネルURLを自動設定: https://abc-123-def.trycloudflare.com
```

✅ これが表示されればOK！

---

## 🔄 日常の使い方

### PCで毎回やること

```bash
npm run start:all
```

**これだけ！**

### iPadでやること

```
https://music-player.pages.dev にアクセス
```

**これだけ！**

---

## 🛠️ トラブルシューティング

### Pages: 音楽が表示されない

**チェック:**

1. **ローカルサーバーが起動しているか**
   ```bash
   Get-Process -Name node
   ```

2. **トンネルが起動しているか**
   ```bash
   Get-Process -Name cloudflared
   ```

3. **WorkersにURLが保存されているか**
   ```bash
   Invoke-WebRequest -Uri "https://music-tunnel-api.haka01xx.workers.dev/tunnel" -UseBasicParsing
   ```

4. **ブラウザのコンソールを確認**
   - F12 → Console
   - エラーメッセージを確認

### Workers: デプロイエラー

**エラー:**
```
Error: KV namespace binding "TUNNEL_KV" not found
```

**解決:**
1. KV作成:
   ```bash
   wrangler kv:namespace create "TUNNEL_KV"
   ```
2. `wrangler.toml` にID追加
3. 再デプロイ:
   ```bash
   wrangler deploy
   ```

### Pages: ビルドエラー

**エラー:**
```
Error: Cannot find module 'next'
```

**解決:**
1. Pagesの設定 → Environment variables
2. `NODE_VERSION = 18` を追加
3. Retry deployment

---

## 📊 完了チェック

- [ ] Workersデプロイ成功
- [ ] Pagesデプロイ成功
- [ ] `npm run start:all` 実行中
- [ ] トンネルURL自動送信成功
- [ ] iPadからアクセス成功
- [ ] 音楽再生成功

**全てチェックできたら完了！** 🎉

---

## 🎉 まとめ

### 初回セットアップ
- Workersデプロイ: 5分
- Pagesデプロイ: 5分
- **合計: 10分**

### 毎回の使用
- PC: `npm run start:all`（1コマンド）
- iPad: URLにアクセス（自動接続）

### コスト
- **完全無料！** 🎉

Happy listening! 🎵
