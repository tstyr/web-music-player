# Cloudflare Pages デプロイメントガイド

## 概要

このガイドでは、フロントエンドをCloudflare Pagesにデプロイし、自宅のNode.jsサーバー（Cloudflare Tunnel経由）と通信する方法を説明します。

## アーキテクチャ

```
[ユーザー] 
    ↓
[Cloudflare Pages (フロントエンド)]
    ↓ (API リクエスト)
[Cloudflare Tunnel]
    ↓
[自宅サーバー (Node.js + Next.js API)]
    ↓
[ローカルファイルシステム (音楽ファイル)]
```

## 実装された機能

### 1. 動的API接続設定

**ファイル**: `lib/api-config.ts`

- `localStorage`を使用してサーバーURLを保存
- 初回アクセス時にサーバー接続モーダルを表示
- 接続テスト機能で疎通確認

**使用方法**:
```typescript
import { getApiUrl, setApiUrl, buildApiPath } from '@/lib/api-config';

// APIのベースURLを取得
const apiUrl = getApiUrl();

// APIのベースURLを設定
setApiUrl('https://your-tunnel.trycloudflare.com');

// フルAPIパスを構築
const fullPath = buildApiPath('/api/music/tracks');
```

### 2. サーバー接続モーダル

**ファイル**: `components/ServerConnectionModal.tsx`

初回アクセス時またはサーバー接続が必要な時に表示されるモーダル：

- Cloudflare Tunnel URLの入力
- 接続テスト機能
- 接続状態の視覚的フィードバック

### 3. CORS設定の最適化

**ファイル**: `server.js`

Cloudflare Pagesからのリクエストを許可：

```javascript
// 許可されるオリジン
- http://localhost:3000
- http://127.0.0.1:3000
- https://*.pages.dev
- https://*.trycloudflare.com
```

### 4. オーディオのプリバッファリング

**ファイル**: `components/AudioPlayer.tsx`

- `preload="auto"` に変更して事前バッファリングを有効化
- ネットワーク遅延を考慮した再生開始の最適化

### 5. スクロールパフォーマンスの最適化

**変更内容**:
- `framer-motion`のアニメーションを削除（スクロール時のカクつき解消）
- GPU加速を有効化（`transform: translateZ(0)`）
- スクロール中のアニメーション無効化

## デプロイ手順

### ステップ1: Cloudflare Pagesプロジェクトの作成

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログイン
2. "Pages" → "Create a project" をクリック
3. GitHubリポジトリを接続

### ステップ2: ビルド設定

```yaml
Build command: npm run build
Build output directory: .next
Root directory: /
Node version: 18
```

### ステップ3: 環境変数の設定

Cloudflare Pagesの設定で以下の環境変数を追加：

```
NODE_ENV=production
```

**注意**: データベースやファイルシステムにアクセスするAPIは自宅サーバーで実行されるため、Cloudflare Pagesには不要です。

### ステップ4: 自宅サーバーのCloudflare Tunnel設定

1. Cloudflare Tunnelをセットアップ（既存のガイドを参照）
2. サーバーを起動:
   ```bash
   npm run dev
   ```
3. Tunnel URLをメモ（例: `https://xxx.trycloudflare.com`）

### ステップ5: フロントエンドからの接続

1. Cloudflare PagesのURLにアクセス
2. サーバー接続モーダルが表示される
3. Cloudflare Tunnel URLを入力
4. "接続テスト" をクリック
5. 成功したら "接続" をクリック

## トラブルシューティング

### 問題1: CORS エラー

**症状**: ブラウザのコンソールに `CORS policy` エラーが表示される

**解決策**:
1. `server.js` のCORS設定を確認
2. Cloudflare PagesのドメインがCORS許可リストに含まれているか確認
3. サーバーを再起動

### 問題2: 音楽が再生されない

**症状**: トラックリストは表示されるが、再生ボタンを押しても音が出ない

**解決策**:
1. ブラウザの開発者ツールでネットワークタブを確認
2. `/api/music/stream/` へのリクエストが成功しているか確認
3. Cloudflare Tunnelが正常に動作しているか確認
4. サーバーのログを確認

### 問題3: 接続テストが失敗する

**症状**: "接続失敗" メッセージが表示される

**解決策**:
1. Tunnel URLが正しいか確認（末尾のスラッシュは不要）
2. 自宅サーバーが起動しているか確認
3. Cloudflare Tunnelが実行中か確認
4. ファイアウォールの設定を確認

### 問題4: 再生が遅い・ラグがある

**症状**: 再生ボタンを押してから音が出るまで時間がかかる

**解決策**:
1. インターネット接続速度を確認
2. 自宅サーバーのアップロード速度を確認
3. 音楽ファイルのビットレートを下げる（オプション）
4. Cloudflare Tunnelの設定を最適化

## パフォーマンス最適化

### 1. キャッシュ戦略

Cloudflare Pagesは自動的に静的アセットをキャッシュしますが、APIレスポンスはキャッシュされません。

### 2. 画像の最適化

アートワーク画像は自宅サーバーから配信されるため、以下を推奨：
- 画像サイズを適切に圧縮（500x500px程度）
- WebP形式を使用
- 遅延読み込み（lazy loading）を実装

### 3. ネットワーク最適化

- HTTP/2を有効化（Cloudflare Tunnelで自動）
- gzip/Brotli圧縮を有効化
- 不要なリクエストを削減

## セキュリティ考慮事項

### 1. 認証

現在、認証は実装されていません。公開する場合は以下を検討：
- NextAuth.jsによる認証
- Cloudflare Accessによるアクセス制御
- APIキーによる認証

### 2. レート制限

大量のリクエストを防ぐため、サーバー側でレート制限を実装することを推奨。

### 3. HTTPS

Cloudflare PagesとCloudflare Tunnelは自動的にHTTPSを使用します。

## コスト

- **Cloudflare Pages**: 無料プラン（月間500ビルド、無制限のリクエスト）
- **Cloudflare Tunnel**: 無料
- **自宅サーバー**: 電気代のみ

## まとめ

この構成により、以下が実現できます：

✅ 固定URLからのアクセス（Cloudflare Pages）
✅ 自宅PCの音楽ファイルへのアクセス（Cloudflare Tunnel）
✅ 低レイテンシーの再生（プリバッファリング）
✅ スムーズなUI（パフォーマンス最適化）
✅ セキュアな通信（HTTPS）

## 次のステップ

1. カスタムドメインの設定
2. 認証機能の追加
3. オフライン対応（PWA）
4. モバイルアプリ化（Capacitor）
