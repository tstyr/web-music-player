# PWA（Progressive Web App）セットアップガイド

このガイドでは、Web Music PlayerをPWAとしてスマホやタブレットで使用する方法を説明します。

## 前提条件

PWA機能を使用するには、**HTTPS接続**が必要です。以下のいずれかの方法でHTTPSアクセスを設定してください：

### 推奨: Cloudflare Tunnel
- [CLOUDFLARE_TUNNEL_SETUP.md](./CLOUDFLARE_TUNNEL_SETUP.md) を参照
- 無料でHTTPS接続が可能
- ポート開放不要

### または: Let's Encryptなどの証明書を使用
- 自己署名証明書は一部のブラウザで動作しない可能性があります

## PWA機能

### 実装済み機能

#### 1. Media Session API
- ✅ ロック画面での再生コントロール
- ✅ 通知センターでの操作
- ✅ イヤホン・ヘッドホンのリモコン対応
- ✅ 曲名・アーティスト名・アルバムアートの表示
- ✅ シーク操作（早送り・巻き戻し）

#### 2. Service Worker
- ✅ オフラインキャッシング
- ✅ アプリシェルのキャッシュ
- ✅ ネットワーク優先戦略
- ✅ 自動更新

#### 3. モバイル最適化
- ✅ タッチ操作の最適化（touch-action: none）
- ✅ iOS Safari 100vh問題の解決
- ✅ セーフエリア対応（iPhone X以降のノッチ対応）
- ✅ 最小タップ領域（44x44px）
- ✅ バッファリングインジケーター
- ✅ ファイルサイズバリデーション（50MB制限）

#### 4. PWAマニフェスト
- ✅ アプリ名・アイコン設定
- ✅ スタンドアロンモード
- ✅ テーマカラー設定
- ✅ ショートカット機能

## インストール方法

### iOS（iPhone/iPad）

1. **Safariでアプリを開く**
   - Cloudflare Tunnelで設定したURLにアクセス
   - 例: `https://music.yourdomain.com`

2. **共有ボタンをタップ**
   - 画面下部の共有ボタン（□↑）をタップ

3. **ホーム画面に追加**
   - 「ホーム画面に追加」を選択
   - アプリ名を確認（必要に応じて変更）
   - 「追加」をタップ

4. **完了**
   - ホーム画面にアイコンが追加されます
   - タップするとブラウザの枠なしで起動します

### Android

1. **Chromeでアプリを開く**
   - Cloudflare Tunnelで設定したURLにアクセス
   - 例: `https://music.yourdomain.com`

2. **メニューを開く**
   - 画面右上のメニュー（⋮）をタップ

3. **ホーム画面に追加**
   - 「ホーム画面に追加」または「アプリをインストール」を選択
   - アプリ名を確認（必要に応じて変更）
   - 「追加」または「インストール」をタップ

4. **完了**
   - ホーム画面にアイコンが追加されます
   - タップするとブラウザの枠なしで起動します

## 使用方法

### ロック画面での操作

PWAとしてインストール後、音楽を再生すると：

1. **ロック画面に表示**
   - 曲名、アーティスト名、アルバムアートが表示されます
   - 再生/一時停止、前の曲、次の曲のボタンが表示されます

2. **通知センターに表示**
   - 通知センターを開くと再生コントロールが表示されます
   - スワイプダウンで簡単にアクセス可能

3. **イヤホンのリモコン**
   - イヤホンやヘッドホンのリモコンボタンで操作可能
   - 再生/一時停止、曲送り/曲戻しに対応

### オフライン機能

Service Workerにより、以下がキャッシュされます：

- アプリのUI（HTML、CSS、JavaScript）
- アイコンとマニフェスト
- 最近アクセスしたページ

**注意**: 音楽ファイル自体はキャッシュされません（ファイルサイズが大きいため）。

## トラブルシューティング

### PWAとしてインストールできない

**原因**: HTTPS接続が必要です

**解決策**:
1. Cloudflare Tunnelを使用してHTTPS接続を設定
2. または、Let's Encryptなどで証明書を取得

### ロック画面に表示されない

**原因**: Media Session APIが初期化されていない可能性があります

**解決策**:
1. 一度音楽を再生してみる
2. ブラウザを再起動
3. PWAを再インストール

### 音楽が途切れる

**原因**: ネットワーク接続が不安定

**解決策**:
1. Wi-Fi接続を確認
2. Cloudflare Tunnelの接続状態を確認
3. バッファリングインジケーターが表示される場合は、ネットワーク速度を確認

### アイコンが表示されない

**原因**: アイコンファイルが生成されていない

**解決策**:
```bash
npm run pwa:icons
```

## 技術詳細

### ファイル構成

```
public/
├── manifest.json          # PWAマニフェスト
├── sw.js                  # Service Worker
├── icon-192.svg           # アイコン（192x192）
└── icon-512.svg           # アイコン（512x512）

app/
└── layout.tsx             # Service Worker登録

components/
└── PlayerBar.tsx          # Media Session API実装

scripts/
└── generate-icons.js      # アイコン生成スクリプト
```

### Service Worker戦略

- **ネットワーク優先**: 常に最新のコンテンツを取得
- **フォールバック**: ネットワークエラー時はキャッシュから返す
- **音楽ストリーミング除外**: `/api/music/stream`はキャッシュしない

### Media Session API

実装されているアクション：
- `play`: 再生
- `pause`: 一時停止
- `previoustrack`: 前の曲（実装予定）
- `nexttrack`: 次の曲（実装予定）
- `seekbackward`: 10秒巻き戻し
- `seekforward`: 10秒早送り
- `seekto`: 指定位置にシーク

### モバイル最適化

#### タッチ操作
```css
/* スライダーのtouch-action最適化 */
[role="slider"] {
  touch-action: none !important;
}
```

#### iOS Safari対応
```javascript
// 100vh問題の解決
const vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', vh + 'px');
```

#### セーフエリア対応
```css
/* iPhone X以降のノッチ対応 */
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);
```

## 今後の改善予定

- [ ] プレイリストのオフラインキャッシング
- [ ] バックグラウンド同期
- [ ] プッシュ通知
- [ ] 音楽ファイルの選択的キャッシング
- [ ] オフライン再生機能

## 参考リンク

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [MDN: Media Session API](https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API)
- [MDN: Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web.dev: PWA](https://web.dev/progressive-web-apps/)
