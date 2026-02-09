# 🎯 簡単セットアップガイド（Workers不要）

Cloudflare Workersをデプロイせずに、iPadから音楽サーバーに接続する方法です。

## 🚀 3ステップで完了

### ステップ1: サーバーとトンネルを起動

```bash
npm run start:all
```

または別々に起動:

```bash
# ターミナル1: サーバー
npm run dev

# ターミナル2: トンネル
npm run tunnel:auto
```

### ステップ2: トンネルURLをコピー

コンソールに表示されるURLをコピー:

```
✅ トンネルURL取得成功!
   URL: https://abc-123-def.trycloudflare.com
```

### ステップ3: サイトで設定

#### PC（localhost）の場合:

1. ブラウザで `http://localhost:3000` を開く
2. 右下の **サーバーアイコン** (🖥️) をクリック
3. トンネルURLを貼り付け
4. 「保存して再読み込み」をクリック

#### iPad/スマホの場合:

1. PCと同じWi-Fiに接続
2. Safariで `http://[PCのIPアドレス]:3000` を開く
   - PCのIPアドレスは `ipconfig`（Windows）または `ifconfig`（Mac）で確認
3. 右下の **サーバーアイコン** をタップ
4. トンネルURLを貼り付け
5. 「保存して再読み込み」をタップ

## 📱 iPadでの詳細手順

### 方法1: 設定UI使用（推奨）

1. **PCのIPアドレスを確認**
   ```bash
   # Windows
   ipconfig
   # IPv4アドレスを確認（例: 192.168.1.100）
   
   # Mac
   ifconfig | grep "inet "
   ```

2. **iPadでアクセス**
   - Safari で `http://192.168.1.100:3000` を開く

3. **トンネルURLを設定**
   - 右下のサーバーアイコンをタップ
   - トンネルURLを入力
   - 保存

4. **完了！**
   - iPadから音楽が再生できます

### 方法2: コンソール使用

1. iPadのSafariで設定 > Safari > 詳細 > Webインスペクタ を有効化

2. MacでSafari > 開発 > [iPadの名前] > [ページ]

3. Consoleで実行:
   ```javascript
   localStorage.setItem('music_server_api_url', 'https://abc-123-def.trycloudflare.com');
   location.reload();
   ```

## 🔄 トンネルURL変更時

トンネルを再起動すると、URLが変わります：

1. 新しいURLをコピー
2. サーバーアイコンをクリック
3. 新しいURLを貼り付けて保存

## 💡 便利な機能

### 現在のURLを確認

設定UIを開くと、現在使用中のURLが表示されます。

### localhostに戻す

設定UIで「リセット」ボタンをクリックすると、localhostに戻ります。

### 設定のクリア

ブラウザのコンソールで:
```javascript
localStorage.removeItem('music_server_api_url');
location.reload();
```

## 🎨 設定UIの使い方

### 開き方
- 右下の **サーバーアイコン** (🖥️) をクリック/タップ

### 機能
- **現在のURL表示**: 今使用中のサーバーURL
- **URL入力欄**: 新しいトンネルURLを入力
- **保存ボタン**: URLを保存してページをリロード
- **リセットボタン**: localhostに戻す

## 🔧 トラブルシューティング

### サーバーアイコンが表示されない

ページをリロードしてください:
```
Ctrl + R (Windows)
Cmd + R (Mac)
```

### iPadから接続できない

1. **同じWi-Fiに接続しているか確認**
2. **PCのファイアウォール設定を確認**
   - Windows: ポート3000を許可
   - Mac: システム環境設定 > セキュリティとプライバシー > ファイアウォール

3. **PCのIPアドレスが正しいか確認**

### トンネルURLが動作しない

1. **トンネルが起動しているか確認**
   ```bash
   # トンネルのプロセスを確認
   # Windows
   tasklist | findstr cloudflared
   
   # Mac/Linux
   ps aux | grep cloudflared
   ```

2. **URLが正しいか確認**
   - `https://` で始まる
   - `.trycloudflare.com` で終わる

3. **トンネルを再起動**
   ```bash
   # Ctrl+C で停止
   # 再起動
   npm run tunnel:auto
   ```

## 🎉 完全自動化（オプション）

Workersをデプロイすると、URL設定が完全自動化されます：

1. [WORKERS_SIMPLE_PROMPT.txt](./WORKERS_SIMPLE_PROMPT.txt) をWorkersプロジェクトのAIに渡す
2. デプロイ
3. 以降、自動的にURLが設定されます

---

## 📝 まとめ

### 必要なもの
- ✅ Node.js
- ✅ cloudflared
- ✅ 同じWi-Fi（iPadアクセス時）

### 手順
1. `npm run start:all` でサーバー+トンネル起動
2. トンネルURLをコピー
3. サイトの設定UIで貼り付け
4. 完了！

### 所要時間
- 初回: 5分
- 2回目以降: 1分

Happy listening! 🎵
