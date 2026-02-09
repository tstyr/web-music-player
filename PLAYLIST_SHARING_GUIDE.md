# プレイリスト共有機能ガイド

## 概要

このガイドでは、新しく実装されたプレイリスト共有機能の使い方と技術仕様について説明します。

## 実装された機能

### 1. プレイリストメニュー ✅

プレイリスト詳細画面のタイトル横に「...」メニューボタンを追加しました。

**機能:**
- 共有リンクをコピー
- プレイリストを削除

**使い方:**
1. プレイリスト詳細画面を開く
2. タイトル横の「...」ボタンをクリック
3. メニューから操作を選択

### 2. 共有リンク生成 ✅

プレイリストを他のユーザーと共有できるリンクを生成します。

**URL形式:**
```
https://your-domain.com/playlist/share/[PlaylistID]
```

**使い方:**
1. プレイリストメニューを開く
2. 「共有リンクをコピー」をクリック
3. リンクがクリップボードにコピーされます
4. 友人にリンクを送信

### 3. プレイリストインポート ✅

共有されたプレイリストを自分のライブラリに追加できます。

**使い方:**
1. 共有リンクにアクセス
2. プレイリストの内容を確認
3. 「ライブラリに追加」ボタンをクリック
4. プレイリストが自分のライブラリにコピーされます

### 4. UIの改善 ✅

#### サイドバーの再生ボタン
- プレイリスト名に被らないように改善
- ホバー時のみ再生アイコンを表示
- アイコンサイズを最適化

#### 全画面プレイヤー
- コントロールボタンを完全中央揃え
- 音量スライダーの反応性を改善
- レスポンシブ対応を強化

## 技術仕様

### API エンドポイント

#### 1. 共有プレイリスト取得
```typescript
GET /api/playlists/share/[id]

Response:
{
  playlist: {
    id: string;
    name: string;
    description?: string;
    createdBy: string;
    trackCount: number;
    tracks: Track[];
  }
}
```

#### 2. プレイリストインポート
```typescript
POST /api/playlists/share/[id]

Body:
{
  userId: string;
}

Response:
{
  success: boolean;
  playlist: Playlist;
}
```

### データベーススキーマ

```prisma
model Playlist {
  id          String         @id @default(cuid())
  name        String
  description String?
  userId      String
  shareToken  String?        @unique // 共有用トークン（将来の拡張用）
  isPublic    Boolean        @default(false) // 公開設定
  user        User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  tracks      PlaylistTrack[]
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}
```

### コンポーネント構成

```
app/
├── playlist/
│   └── share/
│       └── [id]/
│           └── page.tsx          # 共有プレイリスト表示ページ
├── api/
│   └── playlists/
│       └── share/
│           └── [id]/
│               └── route.ts      # 共有API
components/
├── MainContent.tsx               # プレイリストメニュー追加
├── Sidebar.tsx                   # 再生ボタン改善
└── FullscreenPlayer.tsx          # 中央揃え・音量修正
```

## 使用例

### 1. プレイリストを共有する

```typescript
// MainContent.tsx
const handleSharePlaylist = async () => {
  if (!playlistId) return;
  
  try {
    const shareUrl = `${window.location.origin}/playlist/share/${playlistId}`;
    await navigator.clipboard.writeText(shareUrl);
    toast.success('共有リンクをコピーしました！');
  } catch (error) {
    toast.error('リンクのコピーに失敗しました');
  }
};
```

### 2. プレイリストをインポートする

```typescript
// app/playlist/share/[id]/page.tsx
const handleImportPlaylist = async () => {
  const response = await fetch(`/api/playlists/share/${playlistId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });

  if (response.ok) {
    toast.success('プレイリストをライブラリに追加しました！');
    router.push('/');
  }
};
```

## セキュリティ考慮事項

### 現在の実装
- プレイリストIDによる直接アクセス
- 公開情報のみを返す（ファイルパスは含まない）
- ユーザー情報は名前のみ公開

### 将来の拡張
- `shareToken`フィールドを使用した認証
- `isPublic`フラグによる公開制御
- アクセス権限の管理
- 共有リンクの有効期限設定

## トラブルシューティング

### 問題: 共有リンクが開けない

**原因:** プレイリストが削除された、またはIDが無効

**解決方法:**
- プレイリストの存在を確認
- 正しいURLかチェック

### 問題: プレイリストをインポートできない

**原因:** ユーザーIDが取得できない

**解決方法:**
- 認証システムを確認
- デモモードの場合は固定IDを使用

### 問題: 音量スライダーが反応しない

**原因:** z-indexまたはイベント伝播の問題

**解決方法:**
- `touchAction: 'none'`を設定
- スライダーの高さを`h-8`に拡大
- `cursor-pointer`クラスを追加

## パフォーマンス最適化

### 1. 共有ページの最適化
- 初回ロード時のみデータ取得
- トラックリストの仮想化（大量の曲がある場合）
- 画像の遅延読み込み

### 2. APIレスポンスの最適化
- 必要な情報のみを返す
- ファイルパスなどの機密情報を除外
- ページネーション（将来の拡張）

## 今後の改善案

### 短期（1週間以内）
- [ ] 共有リンクのQRコード生成
- [ ] プレイリストのプレビュー再生
- [ ] ソーシャルメディア共有ボタン

### 中期（1ヶ月以内）
- [ ] 共有トークンによる認証
- [ ] 公開/非公開の切り替え
- [ ] 共有統計（閲覧数、インポート数）

### 長期（3ヶ月以内）
- [ ] コラボレーションプレイリスト
- [ ] コメント機能
- [ ] いいね・フォロー機能

## テスト手順

### 1. 共有リンクのテスト

```bash
# 1. プレイリストを作成
# 2. プレイリスト詳細画面を開く
# 3. メニューから「共有リンクをコピー」を選択
# 4. 新しいタブでリンクを開く
# 5. プレイリストが正しく表示されることを確認
```

### 2. インポートのテスト

```bash
# 1. 共有リンクを開く
# 2. 「ライブラリに追加」ボタンをクリック
# 3. ホーム画面に戻る
# 4. サイドバーに新しいプレイリストが表示されることを確認
```

### 3. UIのテスト

```bash
# 1. サイドバーのプレイリストにホバー
# 2. 再生アイコンが表示されることを確認
# 3. 全画面プレイヤーを開く
# 4. コントロールボタンが中央に配置されていることを確認
# 5. 音量スライダーが正常に動作することを確認
```

## まとめ

✅ **実装完了した機能:**
1. プレイリストメニュー（共有・削除）
2. 共有リンク生成とコピー
3. プレイリストインポート機能
4. サイドバー再生ボタンの改善
5. 全画面プレイヤーの中央揃え
6. 音量スライダーの修正

**次のステップ:**
1. 実際のユーザー認証システムとの統合
2. 共有トークンによるセキュリティ強化
3. ソーシャル機能の追加

---

**作成日:** 2026年2月6日  
**バージョン:** 1.0.0  
**作成者:** Kiro AI Assistant
