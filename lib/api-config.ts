// API接続設定の管理

const API_URL_KEY = 'music_server_api_url';
const DEFAULT_API_URL = typeof window !== 'undefined' ? window.location.origin : '';

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
