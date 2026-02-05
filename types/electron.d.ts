export interface ElectronAPI {
  selectMusicFolder: () => Promise<string | null>;
  onMusicFolderSelected: (callback: (path: string) => void) => void;
  setMusicFolder: (folderPath: string) => Promise<{ success: boolean }>;
  getMusicFolder: () => Promise<string>;
  startWebServer: () => Promise<{ success: boolean; message: string }>;
  stopWebServer: () => Promise<{ success: boolean; message: string }>;
  getServerStatus: () => Promise<{ running: boolean }>;
  onServerLog: (callback: (data: { type: string; data: string }) => void) => void;
  onServerStatus: (callback: (status: { running: boolean; code?: number; error?: string }) => void) => void;
  getSystemInfo: () => Promise<any>;
  onSystemInfoUpdate: (callback: (data: any) => void) => void;
  removeAllListeners: (channel: string) => void;
  platform: string;
  version: string;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}