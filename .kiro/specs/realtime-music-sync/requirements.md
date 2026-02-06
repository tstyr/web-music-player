# Requirements Document: Real-time Music Synchronization

## Introduction

This feature addresses critical issues in the music player application related to metadata updates, real-time synchronization across devices, and audio playback display. The system will detect file changes, push updates to all connected clients via WebSocket, and properly display audio duration and playback progress.

## Glossary

- **Music_Scanner**: The component responsible for scanning music files and extracting metadata
- **Metadata_Store**: The Prisma database that persists track information
- **WebSocket_Server**: The Socket.io server that manages real-time connections
- **Client**: A browser tab or device running the music player application
- **Track**: A music file with associated metadata (title, artist, duration, artwork)
- **File_Watcher**: The component that monitors the music directory for changes
- **Player_Component**: The React component that renders audio playback controls
- **Track_List**: The UI component displaying collections of tracks

## Requirements

### Requirement 1: File Change Detection

**User Story:** As a user, I want the system to detect when music files are modified, so that updated metadata appears in the application without manual intervention.

#### Acceptance Criteria

1. WHEN a music file's modification time changes, THE Music_Scanner SHALL re-scan that file and update the Metadata_Store
2. WHEN a music file's content hash changes, THE Music_Scanner SHALL extract new metadata even if the filename is unchanged
3. WHEN artwork is updated for a track, THE System SHALL append a cache-busting query parameter to the image URL
4. THE File_Watcher SHALL monitor the music directory continuously for file modifications
5. WHEN a file modification is detected, THE System SHALL complete the metadata update within 5 seconds

### Requirement 2: Metadata Extraction and Storage

**User Story:** As a user, I want accurate metadata including duration to be extracted from my music files, so that I can see complete track information.

#### Acceptance Criteria

1. WHEN scanning a music file, THE Music_Scanner SHALL extract duration in seconds using the music-metadata library
2. WHEN scanning a music file, THE Music_Scanner SHALL extract title, artist, album, and artwork
3. THE Music_Scanner SHALL store all extracted metadata in the Metadata_Store
4. WHEN metadata extraction fails, THE System SHALL log the error and continue processing other files
5. THE Music_Scanner SHALL handle common audio formats including MP3, FLAC, M4A, and WAV

### Requirement 3: Real-time Update Broadcasting

**User Story:** As a user with multiple devices, I want changes to my music library to appear on all devices immediately, so that I don't need to manually refresh.

#### Acceptance Criteria

1. WHEN a track is added to the Metadata_Store, THE WebSocket_Server SHALL broadcast a "track-added" event to all connected Clients
2. WHEN track metadata is updated, THE WebSocket_Server SHALL broadcast a "track-updated" event with the changed track data
3. WHEN a track is deleted, THE WebSocket_Server SHALL broadcast a "track-deleted" event with the track identifier
4. THE WebSocket_Server SHALL maintain persistent connections with all active Clients
5. WHEN a Client connects, THE WebSocket_Server SHALL acknowledge the connection within 1 second

### Requirement 4: Client-side Update Handling

**User Story:** As a user, I want my track lists to update automatically when changes occur, so that I always see current information without page reloads.

#### Acceptance Criteria

1. WHEN a Client receives a "track-added" event, THE Track_List SHALL add the new track to the display
2. WHEN a Client receives a "track-updated" event, THE Track_List SHALL update the corresponding track in place
3. WHEN a Client receives a "track-deleted" event, THE Track_List SHALL remove the track from the display
4. THE Client SHALL update artwork images by appending timestamp query parameters to prevent cache issues
5. WHEN the Player_Component is displaying an updated track, THE System SHALL refresh the player view with new metadata

### Requirement 5: Audio Duration Display

**User Story:** As a user, I want to see the total duration of each track, so that I know how long songs are before playing them.

#### Acceptance Criteria

1. THE Track_List SHALL display duration for each track in MM:SS format
2. WHEN duration metadata is unavailable, THE Track_List SHALL display "--:--" as a placeholder
3. THE System SHALL format durations correctly for tracks longer than 60 minutes (HH:MM:SS)
4. THE Player_Component SHALL display total track duration in the playback controls
5. WHEN a track is loading, THE System SHALL show the duration once metadata is loaded

### Requirement 6: Playback Progress Display

**User Story:** As a user, I want to see real-time playback progress, so that I know where I am in the current track.

#### Acceptance Criteria

1. WHEN audio is playing, THE Player_Component SHALL update the current time display at least once per second
2. THE Player_Component SHALL display current playback time in MM:SS format
3. THE Player_Component SHALL render a progress bar showing percentage of track completed
4. WHEN the user seeks to a new position, THE System SHALL update the progress bar and time display immediately
5. THE Player_Component SHALL implement onLoadedMetadata handler to capture total duration
6. THE Player_Component SHALL implement onTimeUpdate handler to capture current playback position

### Requirement 7: WebSocket Connection Management

**User Story:** As a system administrator, I want robust WebSocket connection handling, so that the real-time features work reliably.

#### Acceptance Criteria

1. WHEN a Client loses connection, THE System SHALL attempt to reconnect automatically
2. THE WebSocket_Server SHALL handle connection errors gracefully without crashing
3. WHEN a Client reconnects, THE System SHALL re-establish event subscriptions
4. THE WebSocket_Server SHALL support multiple simultaneous Client connections
5. WHEN the server restarts, THE System SHALL allow Clients to reconnect without page reload

### Requirement 8: Cache Management

**User Story:** As a user, I want updated artwork to display immediately, so that I see the correct images for my tracks.

#### Acceptance Criteria

1. WHEN artwork is updated, THE System SHALL append a timestamp query parameter to the image URL
2. THE Client SHALL use the cache-busting URL when rendering artwork in Track_List components
3. THE Client SHALL use the cache-busting URL when rendering artwork in the Player_Component
4. WHEN multiple updates occur to the same track, THE System SHALL use the latest timestamp
5. THE System SHALL preserve the original image file path while adding query parameters
