# 🚀 Vercel デプロイガイド

このアプリをVercelにデプロイする手順です。

## 🎯 構成

```
[iPad/PC]
    ↓
[Vercel] ← 固定URL: https://your-app.vercel.app
    ↓ (Workers経由でトンネルURL取得)
[Cloudflare Workers] ← https://music-tunnel-api.haka01xx.workers.dev/tunnel
    ↓ (トンネルURL取得)
[Cloudflare Tunnel] ← https://abc-123.trycloudflare.com
    ↓
[ローカルサーバー] ← localhost:3000
    ↓
[音楽ファイル]
```

## 📋 前提条件

- ✅ Vercelアカウント（無料）
- ✅ GitHubアカウント
- ✅ Cloudflare Workers（トンネルURL管理用）
- ✅ cloudflared インストール済み

---

## 🌐 ステップ1: Vercelにデプロイ

### 1-1. GitHubにプッシュ

```bash
git add .
git commit -m "Add Vercel configuration"
git push origin main
```

### 1-2. Vercelプロジェクト作成

1. [Vercel Dashboard](https://vercel.com/dashboard) にアクセス
2. **Add New** → **Project**
3. GitHubリポジトリをインポート
4. **Configure Project**:

```
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

5. **Environment Variables** (必要に応じて):

```
NODE_VERSION=18
```

6. **Deploy** をクリック

### 1-3. デプロイ完了

数分後、デプロイが完了します：

```
✅ Deployment ready!
https://your-app.vercel.app
```

---

## 🎵 ステップ2: ローカルサーバー起動

### 2-1. サーバーとトンネルを起動

```bash
npm run start:all
```

### 2-2. トンネルURL確認

コンソールに表示されます：

```
✅ トンネルURL取得成功!
   URL: https://abc-123-def.trycloudflare.com

✅ Workers更新成功!
```

---

## 📱 ステップ3: デバイスでアクセス

### 3-1. Vercelアプリにアクセス

iPadやスマホのブラウザで：

```
https://your-app.vercel.app
```

### 3-2. 自動接続

ページが読み込まれると：

1. Workersから最新のトンネルURLを自動取得
2. localStorageに保存
3. トンネル経由でローカルサーバーに接続
4. 音楽再生可能！🎉

---

## 🔄 日常の使い方

### PCで毎回やること

```bash
npm run start:all
```

これだけ！トンネルURLは自動的にWorkersに送信されます。

### デバイスでやること

```
https://your-app.vercel.app にアクセス
```

これだけ！自動的にトンネル経由で接続されます。

---

## 🛠️ トラブルシューティング

### Vercel: ビルドエラー

**エラー例:**
```
Error: Command "npm run build" exited with 1
```

**解決策:**
1. ローカルでビルドが成功するか確認:
   ```bash
   npm run build
   ```
2. `package.json` の依存関係を確認
3. Vercelのログを確認

### Vercel: 音楽が再生されない

**確認事項:**

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
   Invoke-WebRequest -Uri "https://music-tunnel-api.haka01xx.workers.dev/tunnel"
   ```

4. **ブラウザのコンソールを確認**
   - F12 → Console
   - エラーメッセージを確認

### Vercel: 関数タイムアウト

**エラー:**
```
Function execution timed out
```

**解決策:**
- Vercel Pro プランにアップグレード（60秒まで延長可能）
- または、処理を最適化

---

## 🎨 カスタマイズ

### カスタムドメイン設定

Vercelで：

1. **Settings** → **Domains**
2. **Add Domain**
3. ドメインを入力（例: `music.example.com`）
4. DNS設定を確認
5. 完了！

### 環境変数追加

Vercelで：

1. **Settings** → **Environment Variables**
2. 変数を追加
3. **Save**
4. 再デプロイ

---

## 📊 Vercel vs Cloudflare Pages

| 機能 | Vercel | Cloudflare Pages |
|------|--------|------------------|
| Next.js SSR | ✅ 完全サポート | ❌ 制限あり |
| API Routes | ✅ サポート | ⚠️ Workers必要 |
| ファイルサイズ | ✅ 制限緩い | ❌ 25MB制限 |
| ビルド時間 | ✅ 高速 | ✅ 高速 |
| 無料プラン | ✅ 十分 | ✅ 十分 |

**結論**: このアプリにはVercelが最適！

---

## 💰 コスト

### Vercel Free プラン
- ✅ 100GB帯域幅/月
- ✅ 無制限デプロイ
- ✅ 自動HTTPS
- ✅ グローバルCDN
- ⚠️ 関数実行時間: 10秒

### Vercel Pro プラン ($20/月)
- ✅ 1TB帯域幅/月
- ✅ 関数実行時間: 60秒
- ✅ パスワード保護
- ✅ 優先サポート

**推奨**: まずは無料プランで試す！

---

## 🎉 まとめ

### Vercelのメリット

✅ Next.jsに最適化  
✅ 簡単デプロイ  
✅ 自動ビルド  
✅ プレビューデプロイ  
✅ 高速CDN  
✅ 無料プラン充実  

### 必要な作業

**初回のみ:**
1. Vercelにデプロイ（5分）

**毎回:**
1. `npm run start:all`（1コマンド）

**デバイス:**
1. URLにアクセス（自動接続）

Happy listening! 🎵
