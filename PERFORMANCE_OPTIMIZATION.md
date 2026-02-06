# パフォーマンス最適化ガイド

## 実施した最適化

### 1. Socket.IO接続の最適化
**問題**: 複数のコンポーネントが独立したSocket.IO接続を作成し、大量のネットワークリクエストが発生

**解決策**:
- シングルトンパターンを実装し、全コンポーネントで1つの接続を共有
- 再接続の試行回数を5回→3回に削減
- 再接続の遅延時間を1秒→2秒に増加
- イベントリスナーの重複登録を防止

**変更ファイル**: `hooks/useSocket.ts`

### 2. ビジュアライザーのフレームレート制限
**問題**: `AudioVisualizer`が60FPSで描画し、CPUリソースを過剰に消費

**解決策**:
- フレームレートを60FPS→30FPSに制限
- 全画面時のバー数を256→128に削減
- バー幅を3px→4pxに増加してレンダリング負荷を軽減

**変更ファイル**: `components/AudioVisualizer.tsx`

### 3. 推奨される追加最適化

#### Zustandストアのセレクター使用
現在、コンポーネントがストア全体を購読しているため、不要な再レンダリングが発生する可能性があります。

**悪い例**:
```typescript
const { currentTrack, isPlaying, volume } = useMusicStore();
```

**良い例**:
```typescript
const currentTrack = useMusicStore(state => state.currentTrack);
const isPlaying = useMusicStore(state => state.isPlaying);
const volume = useMusicStore(state => state.volume);
```

#### React.memoの使用
頻繁に再レンダリングされるコンポーネントには`React.memo`を使用:

```typescript
export default React.memo(AudioVisualizer);
```

#### useCallbackとuseMemoの適切な使用
イベントハンドラーやコンピューテッド値をメモ化:

```typescript
const handlePlay = useCallback(() => {
  setIsPlaying(true);
}, [setIsPlaying]);

const trackInfo = useMemo(() => ({
  title: currentTrack?.title,
  artist: currentTrack?.artist
}), [currentTrack?.title, currentTrack?.artist]);
```

## パフォーマンス測定

### Chrome DevToolsでの確認方法

1. **Network タブ**
   - Socket.IO接続が1つだけであることを確認
   - リクエスト数が大幅に減少していることを確認

2. **Performance タブ**
   - フレームレートが安定していることを確認
   - JavaScriptの実行時間が短縮されていることを確認

3. **React DevTools Profiler**
   - コンポーネントの再レンダリング回数を確認
   - 不要な再レンダリングを特定

## 期待される改善

- ネットワークリクエスト: 116リクエスト → 10リクエスト以下
- CPU使用率: 30-40%削減
- フレームレート: より安定した60FPS
- メモリ使用量: 20-30%削減
