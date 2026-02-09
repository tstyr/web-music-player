# 超低遅延同期再生システム - 実装ガイド

## 概要

このシステムは、複数デバイス間で**ミリ秒単位の精度**で音楽を同期再生する機能を提供します。Spotifyの「デバイス接続」機能のような、デバイス間で全くズレのない同時再生体験を実現します。

## アーキテクチャ

### 1. サーバー時刻同期（NTPライク方式）

各クライアントは接続時にサーバーとの時刻オフセットを計算します：

```
クライアント → サーバー: time-sync-request (t0)
サーバー → クライアント: time-sync-response (t1, t2)
クライアント受信: (t3)

往復遅延 = t3 - t0
オフセット = サーバー時刻 - クライアント時刻 + (往復遅延 / 2)
```

- 5回サンプリングして中央値を使用（外れ値の影響を軽減）
- 接続時に自動実行
- オフセットはZustandストアに保存

### 2. 予約時刻による同期再生

従来の「今すぐ再生」ではなく、「未来の特定時刻に再生」方式を採用：

```javascript
// マスターデバイスが再生リクエスト
socket.emit('sync-play-request', {
  trackId: 'track-123',
  currentTime: 0,
  delay: 150 // 150ms後に再生
});

// サーバーが全デバイスに同期時刻を配信
io.emit('sync-play-command', {
  trackId: 'track-123',
  currentTime: 0,
  syncTime: serverTime + 150, // 絶対時刻
  serverTime: serverTime
});

// 各デバイスが自身のオフセットを考慮して再生
const localServerTime = Date.now() + serverTimeOffset;
const delay = syncTime - localServerTime;
setTimeout(() => audio.play(), delay);
```

### 3. 高精度プログレスバー同期

`requestAnimationFrame`を使用して、UIのプログレスバーも同期：

```javascript
const syncProgress = () => {
  const expectedTime = audioElement.currentTime;
  const actualTime = store.currentTime;
  
  // 50ms以上のズレがあれば補正
  const drift = Math.abs(expectedTime - actualTime);
  if (drift > 0.05) {
    store.setCurrentTime(expectedTime);
    store.setProgress((expectedTime / duration) * 100);
  }
  
  requestAnimationFrame(syncProgress);
};
```

## 主要コンポーネント

### 1. `lib/store.ts`

- `serverTimeOffset`: サーバー時刻とのオフセット（ミリ秒）
- `playFromPlaylist()`: プレイリストから再生開始

### 2. `hooks/useSocket.ts`

- `performTimeSync()`: サーバー時刻同期
- `requestSyncPlay()`: 同期再生リクエスト
- `requestSyncNextTrack()`: 次の曲への同期切り替え
- `setAudioElement()`: オーディオ要素の登録

### 3. `components/SyncPlaybackController.tsx`

- オーディオ要素の管理
- 高精度プログレスバー同期
- トラック終了時の自動切り替え

### 4. `server.js` / `lib/socket.ts`

- `time-sync-request/response`: 時刻同期
- `sync-play-request`: 同期再生リクエスト受信
- `sync-play-command`: 同期再生コマンド配信
- `sync-next-track`: 次の曲への同期切り替え

## 使用方法

### 1. 同期モードの有効化

```javascript
const { isSyncMode, setIsSyncMode } = useMusicStore();

// 同期モードをON
setIsSyncMode(true);
```

### 2. プレイリストの同期再生

```javascript
const { playFromPlaylist } = useMusicStore();
const { requestSyncPlay } = useSocket();

// プレイリストを読み込んで最初の曲から再生
playFromPlaylist(tracks, 0);

// 全デバイスで同期再生をリクエスト
requestSyncPlay(tracks[0].id, 0, 150); // 150ms後に再生
```

### 3. 次の曲への同期切り替え

```javascript
const { requestSyncNextTrack } = useSocket();

// 次の曲へ切り替え（100ms後）
requestSyncNextTrack(nextTrackId, 100);
```

## UI実装

### プレイリストヘッダーの大きな再生ボタン

```tsx
<button
  onClick={handlePlaylistPlay}
  className="w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-all hover:scale-105 shadow-lg"
>
  <Play className="w-6 h-6 text-white fill-white ml-1" />
</button>
```

### トラック番号のホバー再生アイコン

```tsx
<div className="col-span-1 relative">
  <span className="group-hover:hidden">
    {isPlaying ? '♪' : index + 1}
  </span>
  <button className="hidden group-hover:block">
    {isPlaying ? <Pause /> : <Play />}
  </button>
</div>
```

### サイドバーのプレイリストホバー再生

```tsx
{hoveredPlaylist === playlist.id && (
  <button
    onClick={(e) => handlePlaylistPlay(e, playlist.id)}
    className="p-1.5 bg-green-500 rounded-full hover:scale-110 transition-transform"
  >
    <Play className="w-3 h-3 text-white fill-white" />
  </button>
)}
```

## パフォーマンス最適化

### 1. デバウンス

音量変更などの頻繁なイベントは300msデバウンス：

```javascript
useEffect(() => {
  const timeoutId = setTimeout(() => {
    socket.emit('volume-change', { volume });
  }, 300);
  return () => clearTimeout(timeoutId);
}, [volume]);
```

### 2. 同期チェック頻度

プログレスバー同期は100msごとにチェック（過度な同期を防ぐ）：

```javascript
if (now - lastSyncTime > 100) {
  // 同期チェック
}
```

### 3. ドリフト補正閾値

50ms以上のズレがある場合のみ補正：

```javascript
if (drift > 0.05) {
  // 補正実行
}
```

## トラブルシューティング

### 同期がズレる場合

1. ネットワーク遅延を確認
2. `delay`パラメータを増やす（150ms → 200ms）
3. サーバー時刻同期を再実行

### 音が途切れる場合

1. バッファサイズを確認
2. ネットワーク帯域を確認
3. 同期チェック頻度を下げる（100ms → 200ms）

### デバイスが同期しない場合

1. `isSyncMode`が有効か確認
2. Socket.io接続を確認
3. サーバーログでイベント受信を確認

## 今後の拡張

- [ ] ボリューム同期のオン/オフ切り替え
- [ ] マスターデバイスの指定
- [ ] 同期精度のリアルタイム表示
- [ ] ネットワーク遅延の自動補正
- [ ] グループ再生（複数のグループを作成）

## 参考資料

- [Socket.io Documentation](https://socket.io/docs/)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
- [NTP Protocol](https://en.wikipedia.org/wiki/Network_Time_Protocol)
