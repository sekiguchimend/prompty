import { ApiResponse, ApiError, FetchOptions } from '../types/api';
import { cachedFetch, generateCacheKey } from './cache';

// 基本設定
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const DEFAULT_TIMEOUT = 30000; // 30秒

// エラークラス
export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

// APIクライアントクラス
class ApiClient {
  private baseURL: string;
  private defaultTimeout: number;

  constructor(baseURL: string = API_BASE_URL, timeout: number = DEFAULT_TIMEOUT) {
    this.baseURL = baseURL;
    this.defaultTimeout = timeout;
  }

  // 基本的なフェッチメソッド
  private async request<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<T> {
    const {
      timeout = this.defaultTimeout,
      retries = 0,
      useCache = false,
      cacheTTL,
      ...fetchOptions
    } = options;

    const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
    
    // キャッシュを使用する場合
    if (useCache && fetchOptions.method === 'GET') {
      try {
        return await cachedFetch<T>(url, fetchOptions, cacheTTL);
      } catch (error) {
      }
    }

    // タイムアウト制御
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiClientError(
          errorData.message || `HTTP Error: ${response.status}`,
          response.status,
          errorData.code,
          errorData.details
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ApiClientError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiClientError(
          'Request timeout',
          408,
          'TIMEOUT'
        );
      }

      // リトライ処理
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
        return this.request<T>(endpoint, { ...options, retries: retries - 1 });
      }

      throw new ApiClientError(
        error instanceof Error ? error.message : 'Unknown error',
        500,
        'NETWORK_ERROR'
      );
    }
  }

  // GET リクエスト
  async get<T>(endpoint: string, options: Omit<FetchOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  // POST リクエスト
  async post<T>(endpoint: string, data?: any, options: Omit<FetchOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT リクエスト
  async put<T>(endpoint: string, data?: any, options: Omit<FetchOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PATCH リクエスト
  async patch<T>(endpoint: string, data?: any, options: Omit<FetchOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE リクエスト
  async delete<T>(endpoint: string, options: Omit<FetchOptions, 'method'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // キャッシュ付きGET（便利メソッド）
  async getCached<T>(endpoint: string, cacheTTL?: number, options: Omit<FetchOptions, 'method' | 'useCache' | 'cacheTTL'> = {}): Promise<T> {
    return this.get<T>(endpoint, { ...options, useCache: true, cacheTTL });
  }
}

// デフォルトのAPIクライアントインスタンス
export const apiClient = new ApiClient();

// プロンプト関連のAPIメソッド
export const promptApi = {
  // 人気記事と特集記事を取得
  getFeaturedAndPopular: (limit: number = 10) =>
    apiClient.getCached<any>(`/api/prompts/featured-and-popular?limit=${limit}`, 5 * 60 * 1000), // 5分キャッシュ

  // カテゴリ別記事を取得
  getByCategory: () =>
    apiClient.getCached<any>('/api/prompts/by-category', 5 * 60 * 1000), // 5分キャッシュ

  // 特定カテゴリの記事を取得
  getCategoryPrompts: (slug: string) =>
    apiClient.getCached<any>(`/api/prompts/category?slug=${slug}`, 3 * 60 * 1000), // 3分キャッシュ

  // プロンプト詳細を取得
  getPromptById: (id: string) =>
    apiClient.getCached<any>(`/api/prompts/${id}`, 10 * 60 * 1000), // 10分キャッシュ

  // 検索
  search: (query: string, options?: any) =>
    apiClient.get<any>(`/api/search?q=${encodeURIComponent(query)}&${new URLSearchParams(options).toString()}`),
};

// ユーザー関連のAPIメソッド
export const userApi = {
  // プロフィール取得
  getProfile: (userId: string) =>
    apiClient.getCached<any>(`/api/users/${userId}`, 5 * 60 * 1000), // 5分キャッシュ

  // プロフィール更新
  updateProfile: (userId: string, data: any) =>
    apiClient.put<any>(`/api/users/${userId}`, data),

  // フォロー/アンフォロー
  toggleFollow: (userId: string) =>
    apiClient.post<any>(`/api/users/${userId}/follow`),
};

// いいね・ブックマーク関連のAPIメソッド
export const interactionApi = {
  // いいね
  toggleLike: (promptId: string) =>
    apiClient.post<any>(`/api/prompts/${promptId}/like`),

  // ブックマーク
  toggleBookmark: (promptId: string) =>
    apiClient.post<any>(`/api/prompts/${promptId}/bookmark`),

  // ブックマーク一覧
  getBookmarks: (userId: string) =>
    apiClient.getCached<any>(`/api/users/${userId}/bookmarks`, 2 * 60 * 1000), // 2分キャッシュ
};

// エラーハンドリングヘルパー
export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiClientError) {
    switch (error.code) {
      case 'TIMEOUT':
        return 'リクエストがタイムアウトしました。再度お試しください。';
      case 'NETWORK_ERROR':
        return 'ネットワークエラーが発生しました。接続を確認してください。';
      default:
        return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return '不明なエラーが発生しました。';
}; 