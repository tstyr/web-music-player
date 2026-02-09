# Testing Checklist - Sync Playback System

## 🎯 Pre-Testing Setup

### Environment Setup
- [ ] Server is running on port 3000
- [ ] Database is initialized (Prisma)
- [ ] Music files are uploaded
- [ ] At least one playlist is created
- [ ] Multiple devices are available for testing

### Device Setup
- [ ] Device A: Primary computer (Master)
- [ ] Device B: Secondary computer/laptop (Slave)
- [ ] Device C: Mobile phone/tablet (Slave)
- [ ] All devices on same network
- [ ] Firewall allows port 3000

## 🎨 UI Testing

### Playlist Header
- [ ] Large circular play button is visible
- [ ] Button is 56x56px with green background
- [ ] Button has hover scale effect
- [ ] Button plays playlist from first track
- [ ] "..." menu button is visible in top-right
- [ ] Menu contains delete option

### Track List
- [ ] Track numbers are visible by default
- [ ] Hover shows play/pause icon
- [ ] Current track shows music note (♪)
- [ ] Click on number plays that track
- [ ] Hover effect is smooth

### Sidebar
- [ ] "Music Folder" section is removed
- [ ] Playlists show hover play button
- [ ] Hover play button is green circular
- [ ] Click plays playlist immediately
- [ ] Delete button is NOT in sidebar

## 🔄 Synchronization Testing

### Time Sync
- [ ] Open browser console (F12)
- [ ] Check for `[Socket] Connected` message
- [ ] Check for `[Time Sync] Offset: XXms` message
- [ ] Offset is within ±10ms
- [ ] RTT (round-trip time) is < 50ms

### Basic Playback Sync
- [ ] Device A: Play a track
- [ ] Device B: Automatically starts playing
- [ ] Both devices play same track
- [ ] Audio is synchronized (±10ms)
- [ ] Progress bars move in sync

### Pause/Resume Sync
- [ ] Device A: Pause playback
- [ ] Device B: Automatically pauses
- [ ] Device B: Resume playback
- [ ] Device A: Automatically resumes
- [ ] Sync is maintained after resume

### Track Change Sync
- [ ] Device A: Skip to next track
- [ ] Device B: Automatically skips
- [ ] Both devices play same track
- [ ] Transition is smooth
- [ ] No audio gap or overlap

### Seek Sync
- [ ] Device A: Drag progress bar
- [ ] Device B: Automatically seeks
- [ ] Both devices at same position
- [ ] Playback continues in sync

### Volume Sync (if enabled)
- [ ] Device A: Change volume
- [ ] Device B: Volume changes
- [ ] Both devices have same volume
- [ ] 300ms debounce works

## 🎵 Playlist Testing

### Play from Header Button
- [ ] Click large play button
- [ ] Playlist starts from first track
- [ ] All devices sync immediately
- [ ] Progress bars are synchronized

### Play from Sidebar
- [ ] Hover over playlist in sidebar
- [ ] Green play button appears
- [ ] Click play button
- [ ] Playlist starts playing
- [ ] All devices sync

### Play from Track Number
- [ ] Hover over track number
- [ ] Play icon appears
- [ ] Click play icon
- [ ] Track starts playing
- [ ] Playlist continues from that track

### Delete Playlist
- [ ] Open playlist detail view
- [ ] Click "..." menu button
- [ ] Click delete option
- [ ] Confirm deletion
- [ ] Playlist is removed
- [ ] Redirected to home

## 🚀 Performance Testing

### Sync Precision
- [ ] Open console on all devices
- [ ] Check `[Sync Play] Scheduled in XXms`
- [ ] Delay is consistent (±5ms)
- [ ] Check `[Sync] Drift detected`
- [ ] Drift corrections are < 50ms

### Progress Bar Smoothness
- [ ] Progress bar updates at 60fps
- [ ] No stuttering or jumping
- [ ] Smooth animation
- [ ] Synchronized across devices

### Network Latency
- [ ] Test on Wi-Fi
- [ ] Test on wired LAN
- [ ] Test on mobile hotspot
- [ ] Sync works in all scenarios
- [ ] Latency is compensated

### Multiple Devices
- [ ] Test with 2 devices
- [ ] Test with 3 devices
- [ ] Test with 4+ devices
- [ ] All devices stay in sync
- [ ] No performance degradation

## 🐛 Error Handling

### Connection Loss
- [ ] Disconnect Device B from network
- [ ] Device A continues playing
- [ ] Reconnect Device B
- [ ] Device B re-syncs automatically
- [ ] Playback continues

### Server Restart
- [ ] Restart server while playing
- [ ] Clients attempt reconnection
- [ ] Clients reconnect successfully
- [ ] Time sync is re-established
- [ ] Playback can resume

### Invalid Track
- [ ] Try to play deleted track
- [ ] Error is handled gracefully
- [ ] User sees error message
- [ ] App doesn't crash

### Empty Playlist
- [ ] Open empty playlist
- [ ] Play button is disabled/hidden
- [ ] Message shows "Playlist is empty"
- [ ] No errors in console

## 📊 Console Logging

### Expected Logs (Device A)
```
[Socket] Connected: abc123
[Time Sync] Offset: 5.23ms (RTT: 12.45ms)
[Socket] Emitting play event
[Sync Play] Scheduled in 145ms (server offset: 5.23ms)
```

### Expected Logs (Device B)
```
[Socket] Connected: def456
[Time Sync] Offset: 4.87ms (RTT: 11.23ms)
[Sync Play] Scheduled in 146ms (server offset: 4.87ms)
```

### Expected Server Logs
```
[Socket.io] Client connected: abc123 (IP: 192.168.1.100)
[Socket.io] Client connected: def456 (IP: 192.168.1.101)
[Socket.io] Play event from abc123
[Socket.io] Sync play request from abc123: scheduling at 1234567890 (in 150ms)
```

## 🎯 Acceptance Criteria

### Must Pass
- [ ] Sync precision is ±10ms or better
- [ ] All UI elements are functional
- [ ] No console errors
- [ ] Works with 3+ devices
- [ ] Smooth playback, no stuttering

### Should Pass
- [ ] Sync precision is ±5ms
- [ ] Works on mobile devices
- [ ] Handles network issues gracefully
- [ ] Progress bars are perfectly smooth

### Nice to Have
- [ ] Sync precision is ±2ms
- [ ] Works with 10+ devices
- [ ] Auto-recovery from all errors
- [ ] Real-time sync metrics display

## 📝 Test Results Template

```
Test Date: _______________
Tester: _______________

Environment:
- Server: Windows/Mac/Linux
- Device A: _______________
- Device B: _______________
- Device C: _______________
- Network: Wi-Fi/LAN/Mobile

Results:
UI Testing: PASS / FAIL
Sync Testing: PASS / FAIL
Performance: PASS / FAIL
Error Handling: PASS / FAIL

Sync Precision:
- Average: _____ ms
- Best: _____ ms
- Worst: _____ ms

Issues Found:
1. _______________
2. _______________
3. _______________

Notes:
_______________
_______________
_______________
```

## 🔧 Debugging Tips

### If Sync Fails
1. Check browser console for errors
2. Verify Socket.io connection
3. Check server logs
4. Verify `isSyncMode` is true
5. Re-run time sync

### If Audio Stutters
1. Check network bandwidth
2. Reduce sync check frequency
3. Increase buffer size
4. Check CPU usage

### If UI Doesn't Update
1. Check React DevTools
2. Verify Zustand state
3. Check component re-renders
4. Clear browser cache

## ✅ Final Checklist

Before marking as complete:
- [ ] All tests passed
- [ ] No critical bugs
- [ ] Performance is acceptable
- [ ] Documentation is updated
- [ ] Code is committed
- [ ] Ready for production

---

**Happy Testing!** 🎵✨
