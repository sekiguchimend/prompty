// インメモリキャッシュシステム
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expires: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5分

  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expires = now + (ttl || this.defaultTTL);
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expires
    });
    
    // メモリ使用量制限（最大100件）
    if (this.cache.size > 100) {
      const keys = Array.from(this.cache.keys());
      if (keys.length > 0) {
        this.cache.delete(keys[0]);
      }
    }
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    // 期限切れチェック
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // 期限切れアイテムを削除
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, item] of Array.from(this.cache.entries())) {
      if (now > item.expires) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// グローバルキャッシュインスタンス
export const cache = new MemoryCache();

// 定期的なクリーンアップ（5分ごと）
if (typeof window !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000);
}

// キャッシュ付きフェッチ関数
export async function cachedFetch<T>(
  url: string, 
  options?: RequestInit, 
  ttl?: number
): Promise<T> {
  const cacheKey = `${url}-${JSON.stringify(options || {})}`;
  
  // キャッシュから取得を試行
  const cached = cache.get<T>(cacheKey);
  if (cached) {
    return cached;
  }
  
  // キャッシュにない場合はフェッチ
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // キャッシュに保存
    cache.set(cacheKey, data, ttl);
    
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

// キャッシュキーを生成するヘルパー関数
export function generateCacheKey(...parts: (string | number | boolean | undefined)[]): string {
  return parts.filter(part => part !== undefined).map(String).join('-');
}

// 特定のパターンのキャッシュを削除
export function invalidateCache(pattern: string): void {
  const keysToDelete: string[] = [];
  
  for (const key of Array.from(cache['cache'].keys())) {
    if (key.includes(pattern)) {
      keysToDelete.push(key);
    }
  }
  
  keysToDelete.forEach(key => cache.delete(key));
}

// キャッシュ統計
export function getCacheStats() {
  const cacheMap = cache['cache'];
  const now = Date.now();
  let validItems = 0;
  let expiredItems = 0;
  
  for (const item of Array.from(cacheMap.values())) {
    if (now > item.expires) {
      expiredItems++;
    } else {
      validItems++;
    }
  }
  
  return {
    total: cacheMap.size,
    valid: validItems,
    expired: expiredItems
  };
} 