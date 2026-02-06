# Design Document: Real-time Music Synchronization

## Overview

This design addresses three critical issues in the music player application:

1. **Metadata Update Detection**: Implementing file watching to detect changes to music files and automatically re-scan them
2. **Real-time Synchronization**: Broadcasting library updates to all connected clients via WebSocket
3. **Audio Playback Display**: Properly extracting and displaying audio duration and playback progress

The solution builds upon the existing Socket.io infrastructure and music-metadata library, adding file watching capabilities and enhancing the client-side update handling.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Browser                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Track List  │  │    Player    │  │  Home Screen │     │
│  │  Component   │  │  Component   │  │  Component   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                       │
│                    │  useSocket Hook │                       │
│                    │  (Socket.io     │                       │
│                    │   Client)       │                       │
│                    └───────┬────────┘                       │
└────────────────────────────┼──────────────────────────────┘
                             │ WebSocket
                             │
┌────────────────────────────▼──────────────────────────────┐
│                     Next.js Server                         │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              Socket.io Server                        │ │
│  │  (Broadcasts: track-added, track-updated,           │ │
│  │   track-deleted, scan-complete)                     │ │
│  └──────────────────┬───────────────────────────────────┘ │
│                     │                                       │
│  ┌──────────────────▼───────────────────────────────────┐ │
│  │           File Watcher (chokidar)                    │ │
│  │  - Monitors music directory                          │ │
│  │  - Detects file changes (add/change/unlink)         │ │
│  │  - Triggers re-scan on changes                      │ │
│  └──────────────────┬───────────────────────────────────┘ │
│                     │                                       │
│  ┌──────────────────▼───────────────────────────────────┐ │
│  │           Music Scanner                              │ │
│  │  - Extracts metadata (including duration)           │ │
│  │  - Generates cache-busting URLs for artwork         │ │
│  │  - Updates Prisma database                          │ │
│  └──────────────────┬───────────────────────────────────┘ │
│                     │                                       │
│  ┌──────────────────▼───────────────────────────────────┐ │
│  │           Prisma Database (SQLite)                   │ │
│  │  - Stores track metadata                            │ │
│  │  - Includes duration, artwork path, timestamps      │ │
│  └──────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

**File Change Detection Flow:**
```
File System Change → Chokidar Event → Music Scanner → Database Update → Socket.io Broadcast → All Clients Update UI
```

**Client Connection Flow:**
```
Client Loads → Socket.io Connect → Subscribe to Events → Receive Updates → Update React State → Re-render UI
```

## Components and Interfaces

### 1. File Watcher Service

**Location**: `lib/file-watcher.ts`

**Purpose**: Monitor the music directory for file system changes and trigger re-scans.

**Interface**:
```typescript
interface FileWatcherConfig {
  musicDirectory: string;
  socketIo: Server;
  debounceMs?: number; // Default: 1000ms
}

interface FileChangeEvent {
  type: 'add' | 'change' | 'unlink';
  path: string;
  timestamp: number;
}

class FileWatcher {
  constructor(config: FileWatcherConfig);
  
  // Start watching the music directory
  start(): void;
  
  // Stop watching
  stop(): void;
  
  // Handle file change events
  private handleFileChange(event: FileChangeEvent): Promise<void>;
  
  // Check if file is a music file
  private isMusicFile(filePath: string): boolean;
}
```

**Implementation Details**:
- Uses `chokidar` library for efficient file watching
- Debounces rapid changes (e.g., batch file operations) to avoid excessive scans
- Filters for music file extensions only
- Triggers `scanMusicLibrary` for individual files on change
- Emits events through Socket.io after successful scan

### 2. Enhanced Music Scanner

**Location**: `lib/music-scanner.ts` (existing, to be enhanced)

**Enhancements**:
1. **Duration Extraction**: Already implemented via `music-metadata` library
2. **Cache-Busting**: Already implemented with timestamp query parameters
3. **Single File Scan**: Add method to scan individual files

**New Interface**:
```typescript
interface ScanOptions {
  cleanup?: boolean;
  socketIo?: Server;
  singleFile?: string; // Path to single file to scan
}

// Add to existing scanner
export async function scanSingleFile(
  filePath: string, 
  socketIo?: Server
): Promise<Track | null>;
```

**Implementation Details**:
- Extract `processMusicFile` logic into reusable function
- Support both full directory scans and single file scans
- Emit appropriate Socket.io events based on operation type
- Handle file deletion detection

### 3. Socket.io Server Enhancement

**Location**: `server.ts` or Next.js API route

**Purpose**: Manage WebSocket connections and broadcast library updates.

**Events to Broadcast**:
```typescript
interface LibraryUpdateEvent {
  type: 'track-added' | 'track-updated' | 'track-deleted' | 'scan-complete';
  track?: Track; // For added/updated
  trackId?: string; // For deleted
  result?: ScanResult; // For scan-complete
  timestamp: number;
}
```

**Implementation Details**:
- Initialize Socket.io server in Next.js custom server or API route
- Maintain connection pool of all active clients
- Broadcast events to all connected clients
- Handle connection/disconnection gracefully
- Log events for debugging

### 4. Enhanced useSocket Hook

**Location**: `hooks/useSocket.ts` (existing, to be enhanced)

**Enhancements**:
Add handlers for library update events that trigger UI refreshes.

**New Interface**:
```typescript
interface UseSocketOptions {
  onLibraryUpdate?: (event: LibraryUpdateEvent) => void;
  onTrackAdded?: (track: Track) => void;
  onTrackUpdated?: (track: Track) => void;
  onTrackDeleted?: (trackId: string) => void;
  onScanComplete?: (result: ScanResult) => void;
}

export function useSocket(options?: UseSocketOptions): {
  socket: Socket | null;
  isConnected: boolean;
  // ... existing methods
}
```

**Implementation Details**:
- Subscribe to `library-update` events on connection
- Parse event type and call appropriate callback
- Provide default handlers that update global state
- Handle reconnection logic

### 5. Client-Side Update Handlers

**Location**: Various components (`components/MainContent.tsx`, `components/PlayerBar.tsx`, etc.)

**Purpose**: React to library update events and refresh UI.

**Implementation Pattern**:
```typescript
// In MainContent.tsx
const handleLibraryUpdate = useCallback((event: LibraryUpdateEvent) => {
  switch (event.type) {
    case 'track-added':
      // Add track to local state
      setTracks(prev => [...prev, event.track!]);
      break;
    case 'track-updated':
      // Update track in local state
      setTracks(prev => prev.map(t => 
        t.id === event.track!.id ? event.track! : t
      ));
      break;
    case 'track-deleted':
      // Remove track from local state
      setTracks(prev => prev.filter(t => t.id !== event.trackId));
      break;
    case 'scan-complete':
      // Refresh entire track list
      fetchTracks();
      break;
  }
}, []);

useSocket({ onLibraryUpdate: handleLibraryUpdate });
```

**Cache-Busting for Artwork**:
```typescript
// When rendering artwork
const artworkUrl = track.artwork 
  ? `${track.artwork}${track.artwork.includes('?') ? '&' : '?'}v=${Date.now()}`
  : null;
```

### 6. Player Component Enhancements

**Location**: `components/PlayerBar.tsx` (existing, to be enhanced)

**Current Issues**:
- Duration display works but needs verification
- Progress bar updates via `requestAnimationFrame` (good)
- Time formatting exists

**Enhancements Needed**:
1. Ensure `onLoadedMetadata` handler captures duration
2. Verify `onTimeUpdate` handler updates progress
3. Add fallback for missing duration metadata

**Implementation**:
```typescript
// Already implemented in existing code:
const handleLoadedMetadata = () => {
  console.log('Audio metadata loaded:', {
    duration: audio.duration,
    src: audio.src
  });
  // Duration is available in currentTrack from database
};

const handleTimeUpdate = () => {
  if (currentTrack && currentTrack.duration > 0) {
    const progressPercent = (audio.currentTime / currentTrack.duration) * 100;
    setLocalProgress(progressPercent);
    setProgress(progressPercent);
    setCurrentTime(audio.currentTime);
  }
};

// Time formatting (already exists)
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
```

## Data Models

### Track Model (Existing)

The Prisma schema already includes all necessary fields:

```prisma
model Track {
  id          String    @id @default(cuid())
  title       String
  artist      String?
  album       String?
  duration    Int       // ✓ Already exists (seconds)
  filePath    String    @unique
  artwork     String?   // ✓ Already exists
  // ... other fields
  updatedAt   DateTime  @updatedAt // ✓ For change detection
}
```

**No schema changes required** - all necessary fields exist.

### File Change Tracking

For detecting file modifications, we'll use:
1. File system `mtime` (modification time)
2. Compare with `Track.updatedAt` in database
3. Re-scan if `mtime > updatedAt`

This logic already exists in `music-scanner.ts`:
```typescript
const fileModifiedTime = stats.mtime.getTime();
const dbUpdatedTime = existingTrack.updatedAt.getTime();

if (fileModifiedTime > dbUpdatedTime) {
  needsUpdate = true;
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: File Modification Detection

*For any* music file in the monitored directory, when its modification time is newer than the database timestamp, the Music_Scanner should detect the change and re-scan the file, updating the database with new metadata.

**Validates: Requirements 1.1**

### Property 2: Content Change Detection

*For any* music file, when its content changes (even if the filename remains the same), the Music_Scanner should extract and update the metadata in the database.

**Validates: Requirements 1.2**

### Property 3: Cache-Busting URL Format

*For any* track with artwork, the artwork URL should contain a cache-busting query parameter (timestamp or version), and the base file path should remain unchanged with only query parameters appended.

**Validates: Requirements 1.3, 4.4, 8.1, 8.2, 8.3, 8.5**

### Property 4: Duration Extraction

*For any* valid music file in a supported format (MP3, FLAC, M4A, WAV), the Music_Scanner should extract a non-negative duration value in seconds using the music-metadata library.

**Validates: Requirements 2.1**

### Property 5: Metadata Storage Round-Trip

*For any* music file, after scanning and storing metadata in the database, querying the database should return all extracted metadata fields (title, artist, album, duration, artwork).

**Validates: Requirements 2.2, 2.3**

### Property 6: Error Handling Continuity

*For any* batch of music files containing at least one invalid file, when metadata extraction fails for the invalid file, the Music_Scanner should log the error and continue processing the remaining valid files without crashing.

**Validates: Requirements 2.4**

### Property 7: WebSocket Event Broadcasting

*For any* database operation (track added, updated, or deleted), the WebSocket_Server should broadcast the corresponding event to all connected clients with the appropriate event type and data.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 8: Client UI State Synchronization

*For any* library update event received by a client (track-added, track-updated, track-deleted), the Track_List component should update its local state to reflect the change, resulting in the correct tracks being displayed.

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 9: Player Metadata Refresh

*For any* track currently playing in the Player_Component, when a track-updated event is received for that track, the player should refresh its display with the new metadata.

**Validates: Requirements 4.5**

### Property 10: Time Formatting Consistency

*For any* duration or current time value in seconds, the formatted display string should follow the pattern MM:SS for durations under 60 minutes, and HH:MM:SS for durations of 60 minutes or longer, with proper zero-padding.

**Validates: Requirements 5.1, 5.3, 6.2**

### Property 11: Progress Percentage Calculation

*For any* current playback time and track duration (where duration > 0), the progress percentage should equal (currentTime / duration) * 100, bounded between 0 and 100.

**Validates: Requirements 6.3**

### Property 12: WebSocket Error Resilience

*For any* connection error or invalid message received by the WebSocket_Server, the server should handle the error gracefully, log it, and continue serving other clients without crashing.

**Validates: Requirements 7.2**

### Property 13: Timestamp Monotonicity

*For any* sequence of updates to the same track, each subsequent update should have a timestamp greater than or equal to the previous update's timestamp.

**Validates: Requirements 8.4**

## Error Handling

### File System Errors

**Scenario**: Music directory is inaccessible or file permissions prevent reading

**Handling**:
- File watcher should log error and attempt to reconnect periodically
- Music scanner should skip inaccessible files and continue with others
- Return appropriate error messages to API callers

### Metadata Extraction Errors

**Scenario**: Corrupted music file or unsupported format

**Handling**:
- Log detailed error with file path and error message
- Continue processing other files in batch
- Store partial metadata (filename, file size) with error flag
- Do not crash the scanning process

### WebSocket Connection Errors

**Scenario**: Client loses network connection or server restarts

**Handling**:
- Client: Implement exponential backoff reconnection strategy
- Client: Queue events during disconnection and replay on reconnect
- Server: Handle disconnections gracefully without affecting other clients
- Server: Maintain connection state and clean up on disconnect

### Database Errors

**Scenario**: Database connection fails or constraint violation

**Handling**:
- Retry database operations with exponential backoff
- Log errors with full context
- Return appropriate HTTP error codes to API callers
- Do not broadcast events if database operation fails

### Audio Playback Errors

**Scenario**: Audio file cannot be loaded or decoded

**Handling**:
- Display user-friendly error message in player
- Log technical details to console
- Allow user to skip to next track
- Do not crash the player component

## Testing Strategy

### Dual Testing Approach

This feature requires both **unit tests** and **property-based tests** for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing Configuration

**Library Selection**: 
- **JavaScript/TypeScript**: Use `fast-check` library for property-based testing
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property

**Test Tagging Format**:
```typescript
// Feature: realtime-music-sync, Property 1: File Modification Detection
test('file modification detection property', async () => {
  await fc.assert(
    fc.asyncProperty(
      // generators here
      async (track, newMtime) => {
        // property test implementation
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing Focus Areas

Unit tests should focus on:

1. **Specific Examples**:
   - Test scanning a known MP3 file with specific metadata
   - Test formatting duration of exactly 65 seconds → "1:05"
   - Test WebSocket event with specific track data

2. **Edge Cases**:
   - Duration of 0 seconds
   - Missing artwork
   - Empty metadata fields
   - Very long track titles (>255 characters)
   - Unicode characters in filenames

3. **Error Conditions**:
   - Corrupted audio file
   - Missing file permissions
   - Database connection failure
   - WebSocket disconnection during broadcast

4. **Integration Points**:
   - File watcher triggers scanner correctly
   - Scanner updates database and emits Socket.io event
   - Client receives event and updates UI

### Property Testing Focus Areas

Property tests should verify:

1. **Universal Invariants**:
   - All cache-busting URLs have query parameters (Property 3)
   - All time formats match the pattern (Property 10)
   - Progress percentage always between 0-100 (Property 11)

2. **Round-Trip Properties**:
   - Scan file → Store metadata → Query database → Get same metadata (Property 5)

3. **Behavioral Properties**:
   - File modification always triggers re-scan (Property 1)
   - All clients receive broadcast events (Property 7)
   - UI state matches received events (Property 8)

4. **Error Handling Properties**:
   - Invalid files don't crash scanner (Property 6)
   - Connection errors don't crash server (Property 12)

### Test Data Generation

For property-based tests, generate:

- **Random track metadata**: titles, artists, albums with various lengths and character sets
- **Random durations**: 0 to 10,000 seconds
- **Random timestamps**: Unix timestamps in valid range
- **Random file paths**: with various extensions and special characters
- **Random artwork URLs**: with and without existing query parameters
- **Invalid inputs**: null values, negative numbers, malformed data

### Mocking Strategy

- **File System**: Mock `fs` operations for predictable test behavior
- **Database**: Use in-memory SQLite or mock Prisma client
- **WebSocket**: Mock Socket.io server and client connections
- **Audio Elements**: Mock HTML5 Audio API for player tests
- **Time**: Mock `Date.now()` for timestamp testing

### Test Coverage Goals

- **Line Coverage**: Minimum 80% for all new code
- **Branch Coverage**: Minimum 75% for conditional logic
- **Property Coverage**: 100% of correctness properties must have tests
- **Error Paths**: All error handling paths must be tested
