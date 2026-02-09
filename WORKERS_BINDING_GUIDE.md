# 🔧 Workers KV Binding 設定ガイド

## 問題

コードは更新されているが、KV Bindingが設定されていないため動作していません。

## 解決手順

### ステップ1: Settings タブを開く

1. Cloudflare Dashboard で **music** Worker を開く
2. 上部の **Settings** タブをクリック

### ステップ2: KV Namespace Bindings を追加

1. 下にスクロールして **Variables** セクションを探す
2. **KV Namespace Bindings** の **Add binding** をクリック
3. 以下を入力:
   - **Variable name**: `TUNNEL_KV`
   - **KV namespace**: `TUNNEL_KV` を選択（ドロップダウンから）
4. **Save** をクリック

### ステップ3: 確認

PowerShellで実行:

```powershell
Invoke-WebRequest -Uri "https://music-tunnel-api.haka01xx.workers.dev/tunnel" -UseBasicParsing
```

期待される出力:
```json
{"url":null,"message":"トンネルURLが設定されていません"}
```

---

## 📸 画像で確認

Settings タブ → Variables セクション → KV Namespace Bindings

以下のように表示されるはずです:

```
KV Namespace Bindings
Variable name: TUNNEL_KV
KV namespace: TUNNEL_KV
```

---

## 🛠️ トラブルシューティング

### まだ "Hello World!" が返ってくる

**原因1**: コードが更新されていない

**解決策**:
1. **Quick edit** を再度開く
2. コードを確認
3. **Save and Deploy** を再度クリック
4. 数秒待ってから再テスト

**原因2**: キャッシュの問題

**解決策**:
```powershell
# キャッシュを無視してリクエスト
Invoke-WebRequest -Uri "https://music-tunnel-api.haka01xx.workers.dev/tunnel?nocache=$(Get-Date -Format 'yyyyMMddHHmmss')" -UseBasicParsing
```

### KV Bindingが保存できない

**原因**: KV Namespaceが作成されていない

**解決策**:
1. 左サイドバーの **KV** をクリック
2. `TUNNEL_KV` が存在するか確認
3. なければ **Create a namespace** で作成

---

## ✅ 成功の確認

以下のコマンドで確認:

```powershell
# GET テスト
Invoke-WebRequest -Uri "https://music-tunnel-api.haka01xx.workers.dev/tunnel" -UseBasicParsing

# 期待される出力
# {"url":null,"message":"トンネルURLが設定されていません"}
```

```powershell
# POST テスト
$body = '{"url":"https://test.trycloudflare.com"}'
Invoke-WebRequest -Uri "https://music-tunnel-api.haka01xx.workers.dev/tunnel" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body -UseBasicParsing

# 期待される出力
# {"success":true,"url":"https://test.trycloudflare.com","updatedAt":"...","message":"URLを保存しました"}
```

両方成功したら完了です！🎉
