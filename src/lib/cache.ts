// キャッシュ管理システム - パフォーマンス最適化版

// 🎯 統一キャッシュインターフェース
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
}

// 🔧 最適化されたメモリキャッシュクラス
class OptimizedCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private accessOrder = new Map<string, number>();
  private accessCounter = 0;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
    this.startCleanupScheduler();
  }

  set(key: string, data: T, customTTL?: number): void {
    // キャッシュサイズ制限（LRU）
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    const ttl = customTTL || this.config.defaultTTL;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    this.accessOrder.set(key, ++this.accessCounter);
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // TTLチェック（非同期クリーンアップ）
    if (Date.now() - item.timestamp > item.ttl) {
      requestIdleCallback(() => {
        this.cache.delete(key);
        this.accessOrder.delete(key);
      });
      return null;
    }

    // アクセス順序更新
    this.accessOrder.set(key, ++this.accessCounter);
    
    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    this.accessOrder.delete(key);
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
  }

  // LRU削除
  private evictLRU(): void {
    let oldestKey = '';
    let oldestAccess = Infinity;

    this.accessOrder.forEach((access, key) => {
      if (access < oldestAccess) {
        oldestAccess = access;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  // 定期的なクリーンアップスケジューラー
  private startCleanupScheduler(): void {
    if (typeof window === 'undefined') return;

    setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];

      this.cache.forEach((item, key) => {
        if (now - item.timestamp > item.ttl) {
          keysToDelete.push(key);
        }
      });

      keysToDelete.forEach(key => this.delete(key));
    }, 60000); // 1分ごとにクリーンアップ
  }

  // キャッシュ統計
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: this.calculateHitRate()
    };
  }

  private calculateHitRate(): number {
    // 簡単なヒット率計算（実装は省略）
    return 0;
  }
}

// 🖼️ 画像キャッシュマネージャー
class ImageCacheManager {
  private imageCache: OptimizedCache<string>;
  private metadataCache: OptimizedCache<any>;
  
  constructor() {
    this.imageCache = new OptimizedCache<string>({
      maxSize: 100,
      defaultTTL: 5 * 60 * 1000 // 5分
    });
    
    this.metadataCache = new OptimizedCache<any>({
      maxSize: 200,
      defaultTTL: 10 * 60 * 1000 // 10分
    });
  }

  // 画像URLキャッシュ
  cacheImageUrl(key: string, url: string): void {
    this.imageCache.set(key, url);
  }

  getImageUrl(key: string): string | null {
    return this.imageCache.get(key);
  }

  // メタデータキャッシュ
  cacheMetadata(key: string, metadata: any): void {
    this.metadataCache.set(key, metadata);
  }

  getMetadata(key: string): any | null {
    return this.metadataCache.get(key);
  }

  // プリロード状態管理
  private preloadedImages = new Set<string>();

  markAsPreloaded(url: string): void {
    this.preloadedImages.add(url);
    
    // サイズ制限
    if (this.preloadedImages.size > 50) {
      const firstItem = this.preloadedImages.values().next().value;
      if (firstItem) {
        this.preloadedImages.delete(firstItem);
      }
    }
  }

  isPreloaded(url: string): boolean {
    return this.preloadedImages.has(url);
  }

  clearPreloaded(): void {
    this.preloadedImages.clear();
  }

  // キャッシュクリア
  clearAll(): void {
    this.imageCache.clear();
    this.metadataCache.clear();
    this.clearPreloaded();
  }

  // 統計情報
  getStats() {
    return {
      images: this.imageCache.getStats(),
      metadata: this.metadataCache.getStats(),
      preloaded: this.preloadedImages.size
    };
  }
}

// 🎣 最適化されたキャッシュフック
export const useOptimizedCache = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  return imageCacheManager;
};

// 📊 グローバルキャッシュインスタンス
export const imageCacheManager = new ImageCacheManager();

// 🔄 キャッシュキー生成ユーティリティ
export const generateCacheKey = (prefix: string, ...parts: (string | number)[]): string => {
  return `${prefix}:${parts.join(':')}`;
};

// 🧹 キャッシュクリーンアップユーティリティ
export const cleanupExpiredCache = (): void => {
  if (typeof window !== 'undefined') {
    imageCacheManager.clearAll();
  }
};

// メモリ監視とアダプティブキャッシュ
if (typeof window !== 'undefined' && 'memory' in performance) {
  const checkMemoryUsage = () => {
    const memory = (performance as any).memory;
    if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.8) {
      // メモリ使用量が80%を超えたらキャッシュクリア
      cleanupExpiredCache();
    }
  };

  setInterval(checkMemoryUsage, 30000); // 30秒ごとにチェック
} 