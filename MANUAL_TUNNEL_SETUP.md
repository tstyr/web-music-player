# 🔧 手動トンネルセットアップ（Workersなし）

Workersをデプロイせずに、手動でトンネルURLを設定する方法です。

## 📋 手順

### ステップ1: トンネルを起動

```bash
npm run tunnel:auto
```

または

```bash
cloudflared tunnel --url http://localhost:3000
```

### ステップ2: トンネルURLをコピー

コンソールに表示されるURLをコピー:
```
https://abc-123-def.trycloudflare.com
```

### ステップ3: ブラウザで設定

1. ブラウザで `http://localhost:3000` を開く

2. 開発者ツールを開く（F12）

3. Consoleタブで以下を実行:

```javascript
localStorage.setItem('music_server_api_url', 'https://abc-123-def.trycloudflare.com');
location.reload();
```

### ステップ4: 確認

ページがリロードされ、トンネル経由で接続されます。

## 🎯 iPadでの設定

### 方法1: QRコード経由

1. PC側でトンネルURLを含むQRコードを生成
2. iPadでQRコードをスキャン
3. 自動的に設定

### 方法2: 手動入力

1. iPadのSafariで `http://localhost:3000` を開く（PCと同じネットワーク）
2. Safari > 開発 > Webインスペクタ
3. Consoleで以下を実行:

```javascript
localStorage.setItem('music_server_api_url', 'https://abc-123-def.trycloudflare.com');
location.reload();
```

### 方法3: 設定UI追加（推奨）

サイトに設定画面を追加して、GUIでURLを入力できるようにします。

## 🔄 トンネルURL変更時

トンネルを再起動すると、URLが変わります。その場合：

```javascript
// 新しいURLに更新
localStorage.setItem('music_server_api_url', 'https://NEW-URL.trycloudflare.com');
location.reload();
```

## 💡 自動化のために

Workersをデプロイすると、この手順が自動化されます：

1. [WORKERS_SIMPLE_PROMPT.txt](./WORKERS_SIMPLE_PROMPT.txt) をWorkersプロジェクトのAIに渡す
2. デプロイ
3. 完全自動化！

---

## 🚀 クイックコマンド

```javascript
// 現在のAPI URLを確認
console.log(localStorage.getItem('music_server_api_url'));

// トンネルURLを設定
localStorage.setItem('music_server_api_url', 'https://YOUR-TUNNEL-URL.trycloudflare.com');
location.reload();

// 設定をクリア（localhostに戻す）
localStorage.removeItem('music_server_api_url');
location.reload();
```
