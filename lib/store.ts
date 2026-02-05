import { create } from 'zustand';

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  filePath: string;
  format?: string;
  sampleRate?: number;
  bitDepth?: number;
  bitrate?: number;
  isHighRes?: boolean;
  quality?: string;
  fileSize?: number;
  fileName?: string;
  isLiked?: boolean;
  artwork?: string;
}

interface MusicStore {
  // 再生状態
  currentTrack: Track | null;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  
  // UI状態
  isFullscreenPlayer: boolean;
  currentView: string;
  
  // プレイリスト
  currentPlaylist: Track[];
  playlists: Playlist[];
  likedSongs: string[]; // track IDs
  
  // マルチルーム
  isSyncMode: boolean;
  connectedDevices: number;
  
  // アクション
  setCurrentTrack: (track: Track | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setProgress: (progress: number) => void;
  setCurrentTime: (time: number) => void;
  setVolume: (volume: number) => void;
  setIsMuted: (muted: boolean) => void;
  setIsFullscreenPlayer: (fullscreen: boolean) => void;
  setCurrentView: (view: string) => void;
  setCurrentPlaylist: (playlist: Track[]) => void;
  setPlaylists: (playlists: Playlist[]) => void;
  addPlaylist: (playlist: Playlist) => void;
  removePlaylist: (playlistId: string) => void;
  toggleLike: (trackId: string) => void;
  playPause: () => void;
  setIsSyncMode: (sync: boolean) => void;
  setConnectedDevices: (count: number) => void;
}

interface Playlist {
  id: string;
  name: string;
  description?: string;
  tracks: Track[];
}

export const useMusicStore = create<MusicStore>((set) => ({
  // 初期状態
  currentTrack: null,
  isPlaying: false,
  progress: 0,
  currentTime: 0,
  volume: 75,
  isMuted: false,
  isFullscreenPlayer: false,
  currentView: 'home',
  currentPlaylist: [],
  playlists: [],
  likedSongs: [],
  isSyncMode: false,
  connectedDevices: 0,
  
  // アクション
  setCurrentTrack: (track) => set({ currentTrack: track }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setProgress: (progress) => set({ progress }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setVolume: (volume) => set({ volume }),
  setIsMuted: (muted) => set({ isMuted: muted }),
  setIsFullscreenPlayer: (fullscreen) => set({ isFullscreenPlayer: fullscreen }),
  setCurrentView: (view) => set({ currentView: view }),
  setCurrentPlaylist: (playlist) => set({ currentPlaylist: playlist }),
  setPlaylists: (playlists) => set({ playlists }),
  
  addPlaylist: (playlist) => set((state) => ({
    playlists: [...state.playlists, playlist]
  })),
  
  removePlaylist: (playlistId) => set((state) => ({
    playlists: state.playlists.filter(p => p.id !== playlistId)
  })),
  
  toggleLike: (trackId) => set((state) => {
    const isLiked = state.likedSongs.includes(trackId);
    return {
      likedSongs: isLiked
        ? state.likedSongs.filter(id => id !== trackId)
        : [...state.likedSongs, trackId]
    };
  }),
  
  playPause: () => set((state) => ({ isPlaying: !state.isPlaying })),
  
  setIsSyncMode: (sync) => set({ isSyncMode: sync }),
  setConnectedDevices: (count) => set({ connectedDevices: count }),
}));
