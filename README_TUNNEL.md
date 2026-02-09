# 🌐 トンネル機能 完全ガイド

iPadのPWAから音楽サーバーに接続するための完全ガイドです。

## 🎯 2つの方法

### 方法1: 手動設定（簡単・推奨）

**メリット:**
- Workersのデプロイ不要
- すぐに使える
- 設定UIで簡単

**デメリット:**
- トンネル再起動時に手動で再設定が必要

**ガイド:** [EASY_SETUP_GUIDE.md](./EASY_SETUP_GUIDE.md)

### 方法2: 完全自動化（上級者向け）

**メリット:**
- トンネルURL自動取得
- 再起動時も自動更新
- 完全自動化

**デメリット:**
- Workersのデプロイが必要
- 初期設定がやや複雑

**ガイド:** [WORKERS_INTEGRATION_GUIDE.md](./WORKERS_INTEGRATION_GUIDE.md)

---

## 🚀 クイックスタート（方法1）

### 1. サーバー起動

```bash
npm run start:all
```

### 2. トンネルURLをコピー

```
✅ トンネルURL取得成功!
   URL: https://abc-123-def.trycloudflare.com
```

### 3. 設定UIで貼り付け

1. ブラウザで `http://localhost:3000` を開く
2. 右下の **サーバーアイコン** (🖥️) をクリック
3. トンネルURLを貼り付け
4. 「保存して再読み込み」

### 4. iPadでアクセス

同じ手順でiPadでも設定できます！

---

## 📚 詳細ドキュメント

### 基本ガイド
- **[EASY_SETUP_GUIDE.md](./EASY_SETUP_GUIDE.md)** - 簡単セットアップ（推奨）
- **[MANUAL_TUNNEL_SETUP.md](./MANUAL_TUNNEL_SETUP.md)** - 手動設定の詳細
- **[QUICK_START_TUNNEL.md](./QUICK_START_TUNNEL.md)** - 最速スタート

### 自動化ガイド
- **[AUTO_TUNNEL_GUIDE.md](./AUTO_TUNNEL_GUIDE.md)** - トンネル自動起動
- **[TUNNEL_AUTO_CONFIG.md](./TUNNEL_AUTO_CONFIG.md)** - URL自動設定
- **[WORKERS_INTEGRATION_GUIDE.md](./WORKERS_INTEGRATION_GUIDE.md)** - Workers統合

### Workers実装
- **[WORKERS_FIXED_TUNNEL_PROMPT.md](./WORKERS_FIXED_TUNNEL_PROMPT.md)** - 詳細プロンプト
- **[WORKERS_SIMPLE_PROMPT.txt](./WORKERS_SIMPLE_PROMPT.txt)** - 簡易プロンプト

---

## 🎨 新機能: 設定UI

### 場所
右下のサーバーアイコン (🖥️)

### 機能
- 現在のURL表示
- トンネルURL入力
- 保存して再読み込み
- リセット（localhostに戻す）

### 使い方
1. アイコンをクリック
2. URLを入力
3. 保存

---

## 🔧 コマンド一覧

### サーバー起動
```bash
# サーバー+トンネル同時起動
npm run start:all

# サーバーのみ
npm run dev

# トンネルのみ
npm run tunnel:auto
```

### Windows用スクリプト
```bash
# 別ウィンドウで起動
start-server.bat
```

### Mac/Linux用スクリプト
```bash
# 同時起動
./start-server.sh
```

---

## 💡 よくある質問

### Q: Workersは必須ですか？
A: いいえ。設定UIで手動設定できます。

### Q: トンネルURLは毎回変わりますか？
A: はい。トンネル再起動時に変わります。

### Q: iPadから設定できますか？
A: はい。設定UIはタッチ対応です。

### Q: 複数デバイスで使えますか？
A: はい。各デバイスで設定してください。

### Q: セキュリティは大丈夫ですか？
A: Cloudflare Tunnelは暗号化されています。

---

## 🎯 推奨フロー

### 初めての方
1. [EASY_SETUP_GUIDE.md](./EASY_SETUP_GUIDE.md) を読む
2. `npm run start:all` で起動
3. 設定UIでURL設定
4. 完了！

### 自動化したい方
1. [WORKERS_SIMPLE_PROMPT.txt](./WORKERS_SIMPLE_PROMPT.txt) をコピー
2. WorkersプロジェクトのAIに貼り付け
3. デプロイ
4. 完全自動化！

---

## 🎉 まとめ

### 手動設定（推奨）
- ✅ 簡単
- ✅ すぐ使える
- ✅ Workers不要
- ⚠️ 再起動時に再設定

### 自動化
- ✅ 完全自動
- ✅ 再起動も自動
- ⚠️ Workers必要
- ⚠️ 初期設定やや複雑

**どちらでも音楽は楽しめます！** 🎵

Happy listening!
