# 🚀 Cloudflare Tunnel スクリプトガイド

このプロジェクトには、Cloudflare Tunnelを使用するための複数のスクリプトがあります。

## 📋 利用可能なスクリプト

### 1. `start-with-tunnel-simple.bat` ⭐ **最推奨**

**特徴:**
- ✅ **Cloudflareウィンドウが別に表示される**
- ✅ **ブラウザが自動で開く**
- ✅ シンプルで使いやすい
- ✅ 初心者に最適

**使い方:**
```
ダブルクリック: start-with-tunnel-simple.bat
```

**動作:**
1. Cloudflare Tunnelウィンドウが開く（URLが表示される）
2. 8秒待機
3. URLを自動抽出
4. ブラウザが自動で開く
5. サーバーが起動

---

### 2. `start-with-tunnel.bat` 📝 **標準版**

**特徴:**
- ✅ **Cloudflareウィンドウが別に表示される**
- ✅ URL自動抽出機能付き
- ✅ 詳細な情報表示
- ⚠️ ブラウザは手動で開く必要がある場合あり

**使い方:**
```
ダブルクリック: start-with-tunnel.bat
```

**動作:**
1. Cloudflare Tunnelウィンドウが開く
2. URLを抽出してメインウィンドウに表示
3. サーバーが起動

---

### 3. `start-with-tunnel-auto.bat` 🔧 **上級者向け**

**特徴:**
- ✅ PowerShellベース
- ✅ より詳細なログ
- ✅ カラフルな出力
- ⚠️ PowerShellの実行ポリシーが必要

**使い方:**
```
ダブルクリック: start-with-tunnel-auto.bat
```

**動作:**
1. PowerShellスクリプトを実行
2. Cloudflare Tunnelを起動（バックグラウンド）
3. URLを抽出してブラウザを開く
4. サーバーが起動

---

## 🎯 どれを使うべき？

### 初めて使う場合
→ **`start-with-tunnel-simple.bat`** を使用

### Cloudflareウィンドウを見たい場合
→ **`start-with-tunnel-simple.bat`** または **`start-with-tunnel.bat`**

### より詳細なログが必要な場合
→ **`start-with-tunnel-auto.bat`**

---

## 🔍 各スクリプトの比較

| 機能 | simple.bat | 標準.bat | auto.bat |
|------|-----------|---------|----------|
| Cloudflareウィンドウ表示 | ✅ | ✅ | ❌ |
| ブラウザ自動起動 | ✅ | ⚠️ | ✅ |
| URL自動抽出 | ✅ | ✅ | ✅ |
| ログファイル保存 | ✅ | ✅ | ✅ |
| カラフル出力 | ⚠️ | ❌ | ✅ |
| 初心者向け | ✅ | ✅ | ❌ |
| 上級者向け | ⚠️ | ⚠️ | ✅ |

---

## 📱 共通の使い方

### ステップ1: スクリプトを起動

ダブルクリックで起動

### ステップ2: Cloudflareウィンドウを確認

別ウィンドウに以下のようなURLが表示されます:
```
https://abc-123-xyz.trycloudflare.com
```

### ステップ3: ブラウザでアクセス

- **simple.bat**: 自動で開く
- **標準.bat**: メインウィンドウのURLをコピー
- **auto.bat**: 自動で開く

### ステップ4: スマホでアクセス

表示されたURLをスマホのブラウザで開く

---

## 🛠️ トラブルシューティング

### Cloudflareウィンドウが表示されない

**原因:** スクリプトが古いバージョン

**解決策:**
1. 最新の`start-with-tunnel-simple.bat`を使用
2. または、手動でCloudflareウィンドウを開く:
   ```
   cloudflared tunnel --url http://127.0.0.1:3000
   ```

### ブラウザが開かない

**原因:** URL抽出に失敗

**解決策:**
1. Cloudflareウィンドウを確認
2. URLを手動でコピーしてブラウザで開く
3. または、ログファイルを確認:
   ```
   %TEMP%\cloudflared-tunnel.log
   ```

### "cloudflared not found" エラー

**解決策:**
```powershell
winget install --id Cloudflare.cloudflared
```

### ポート3000が使用中

**解決策:**
```bash
# 既存のプロセスを停止
netstat -ano | findstr :3000
taskkill /F /PID <プロセスID>
```

---

## 💡 ヒント

### Cloudflareウィンドウを常に表示したい
→ **`start-with-tunnel-simple.bat`** を使用

### URLをすぐにコピーしたい
1. Cloudflareウィンドウでマウスで選択
2. 右クリック → コピー
3. または、メインウィンドウに表示されたURLをコピー

### QRコードを生成したい
1. URLをコピー
2. https://www.qr-code-generator.com/ にアクセス
3. URLを貼り付けてQRコード生成

---

## 📚 関連ドキュメント

- [クイックトンネルガイド](./QUICK_TUNNEL_GUIDE.md)
- [Cloudflareトンネルセットアップ](./CLOUDFLARE_TUNNEL_SETUP.md)
- [自動起動ガイド](./START_WITH_TUNNEL_AUTO.md)

---

## 🔄 スクリプトの更新履歴

### v2.0 (最新)
- ✅ Cloudflareウィンドウが別に表示されるように修正
- ✅ ログファイルにも同時出力
- ✅ ブラウザ自動起動機能追加
- ✅ ポート3000に統一

### v1.0
- 初期バージョン
- バックグラウンド起動のみ

---

**🎉 これで完璧です！音楽を楽しんでください！**
