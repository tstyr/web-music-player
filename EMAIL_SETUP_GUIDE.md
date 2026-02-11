# 📧 メール通知セットアップガイド

トンネルURL自動通知機能の設定方法です。

## 🎯 機能

サーバー起動時に、CloudflareトンネルのURLを指定したメールアドレスに自動送信します。

## 📋 前提条件

- Gmailアカウント
- Googleアカウントの2段階認証が有効

## 🔧 セットアップ手順

### 1. Googleアプリパスワードを取得

1. [Googleアカウント](https://myaccount.google.com/) にアクセス
2. **セキュリティ** → **2段階認証プロセス** を有効化（まだの場合）
3. **セキュリティ** → **アプリパスワード** にアクセス
4. アプリを選択: **メール**
5. デバイスを選択: **Windowsパソコン** または **その他**
6. **生成** をクリック
7. 表示された16桁のパスワードをコピー（例: `abcd efgh ijkl mnop`）

### 2. 環境変数を設定

`.env`ファイルを編集（なければ`.env.example`をコピー）:

```bash
# メール送信設定
EMAIL_USER=your-gmail@gmail.com          # 送信元Gmailアドレス
EMAIL_PASS=abcd efgh ijkl mnop           # アプリパスワード（スペース含む）
TUNNEL_EMAIL=kenta4126.2201@gmail.com    # 送信先メールアドレス
```

### 3. サーバーを起動

```bash
npm run start:all
```

トンネルURLが取得されると、自動的にメールが送信されます！

## 📧 メール内容

送信されるメールには以下が含まれます:

- ✅ CloudflareトンネルURL
- ✅ アクセス方法の説明
- ✅ 注意事項

## 🔍 トラブルシューティング

### メールが送信されない

**確認事項:**

1. **環境変数が正しく設定されているか**
   ```bash
   echo %EMAIL_USER%
   echo %EMAIL_PASS%
   ```

2. **アプリパスワードが正しいか**
   - スペースを含めてコピーしたか確認
   - 新しいアプリパスワードを生成して再試行

3. **2段階認証が有効か**
   - Googleアカウントのセキュリティ設定を確認

4. **Gmailの送信制限**
   - 1日の送信上限: 500通
   - 短時間に大量送信すると制限される可能性あり

### エラーメッセージ

**"Invalid login"**
- アプリパスワードが間違っています
- 新しいアプリパスワードを生成してください

**"Authentication failed"**
- 2段階認証が有効になっていません
- Googleアカウントで2段階認証を有効化してください

**"Connection timeout"**
- ネットワーク接続を確認してください
- ファイアウォールがSMTP（ポート587）をブロックしていないか確認

## 🎨 カスタマイズ

### 送信先メールアドレスを変更

`.env`ファイルで変更:

```bash
TUNNEL_EMAIL=your-email@example.com
```

### メール送信を無効化

環境変数を設定しなければ、メール送信はスキップされます:

```bash
# EMAIL_USER=...  # コメントアウト
# EMAIL_PASS=...  # コメントアウト
```

### メールテンプレートをカスタマイズ

`scripts/send-tunnel-email.js`を編集してHTMLテンプレートを変更できます。

## 🔒 セキュリティ

- ✅ アプリパスワードは`.env`ファイルに保存（Gitにコミットしない）
- ✅ `.gitignore`に`.env`が含まれていることを確認
- ✅ アプリパスワードは定期的に再生成を推奨
- ⚠️ アプリパスワードを他人と共有しない

## 💡 ヒント

### 複数の送信先に送る

`scripts/send-tunnel-email.js`の`to`フィールドを配列に変更:

```javascript
to: ['email1@example.com', 'email2@example.com'],
```

### 他のメールサービスを使用

Gmailの代わりに他のSMTPサービスも使用可能:

```javascript
const transporter = nodemailer.createTransport({
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

## 📚 参考リンク

- [Googleアプリパスワード](https://support.google.com/accounts/answer/185833)
- [Nodemailer公式ドキュメント](https://nodemailer.com/)
- [Gmail SMTP設定](https://support.google.com/mail/answer/7126229)

---

Happy listening! 🎵
