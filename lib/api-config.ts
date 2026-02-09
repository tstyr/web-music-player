// API接続設定の管理

const API_URL_KEY = 'music_server_api_url';
const DEFAULT_API_URL = typeof window !== 'undefined' ? window.location.origin : '';
const WORKERS_TUNNEL_URL = 'https://music.haka01xx.workers.dev/tunnel';
const TUNNEL_CHECK_INTERVAL = 30000; // 30秒ごとにチェック

/**
 * WorkersからトンネルURLを取得
 */
async function fetchTunnelUrl(): Promise<string | null> {
  try {
    const response = await fetch(WORKERS_TUNNEL_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.warn('[API Config] Workers tunnel URL fetch failed:', response.status);
      return null;
    }

    const data = await response.json();
    if (data.url && typeof data.url === 'string') {
      console.log('[API Config] Tunnel URL取得成功:', data.url);
      return data.url;
    }

    return null;
  } catch (error) {
    console.warn('[API Config] Workers tunnel URL fetch error:', error);
    return null;
  }
}

/**
 * トンネルURLを自動的に取得して設定
 */
export async function autoConfigureTunnelUrl(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const tunnelUrl = await fetchTunnelUrl();
  if (tunnelUrl) {
    setApiUrl(tunnelUrl);
    console.log('[API Config] トンネルURLを自動設定しました:', tunnelUrl);
    return true;
  }

  return false;
}

/**
 * 定期的にトンネルURLをチェックして更新
 */
export function startTunnelUrlAutoUpdate(): void {
  if (typeof window === 'undefined') return;

  // 初回チェック
  autoConfigureTunnelUrl();

  // 定期的にチェック
  setInterval(async () => {
    const currentUrl = getApiUrl();
    const tunnelUrl = await fetchTunnelUrl();
    
    if (tunnelUrl && tunnelUrl !== currentUrl) {
      setApiUrl(tunnelUrl);
      console.log('[API Config] トンネルURLを更新しました:', tunnelUrl);
      
      // ページをリロードして新しいURLを適用
      if (confirm('新しいサーバーURLが検出されました。ページを再読み込みしますか？')) {
        window.location.reload();
      }
    }
  }, TUNNEL_CHECK_INTERVAL);
}

/**
 * APIのベースURLを取得
 */
export function getApiUrl(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_API_URL;
  }

  // localStorageから取得
  const savedUrl = localStorage.getItem(API_URL_KEY);
  if (savedUrl) {
    return savedUrl;
  }

  // デフォルトは現在のオリジン
  return DEFAULT_API_URL;
}

/**
 * APIのベースURLを設定
 */
export function setApiUrl(url: string): void {
  if (typeof window === 'undefined') return;
  
  // URLの正規化（末尾のスラッシュを削除）
  const normalizedUrl = url.replace(/\/$/, '');
  localStorage.setItem(API_URL_KEY, normalizedUrl);
}

/**
 * 保存されたAPIのURLをクリア
 */
export function clearApiUrl(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(API_URL_KEY);
}

/**
 * APIのURLが設定されているかチェック
 */
export function hasCustomApiUrl(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(API_URL_KEY);
}

/**
 * フルAPIパスを構築
 */
export function buildApiPath(path: string): string {
  const baseUrl = getApiUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

/**
 * fetch用のヘルパー関数
 */
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const url = buildApiPath(path);
  
  const defaultOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include', // クッキーを含める
  };

  return fetch(url, defaultOptions);
}
