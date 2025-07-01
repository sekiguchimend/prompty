// 画像最適化ユーティリティ - パフォーマンス最適化版
import { ImageProps } from 'next/image';
import { useState, useCallback } from 'react';

// 🎨 統一ブラーデータURL
export const DEFAULT_BLUR_DATA_URL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgo";

// 📁 統一フォールバック画像URL
export const DEFAULT_FALLBACK_URLS = {
  thumbnail: '/images/default-thumbnail.svg',
  avatar: '/images/default-avatar.svg',
  hero: '/images/default-thumbnail.svg',
  content: '/images/default-thumbnail.svg'
} as const;

// プリロード済み画像キャッシュ（メモリリーク防止）
const preloadedImages = new Set<string>();
const MAX_PRELOAD_CACHE = 50;

// 画像読み込み優先度の判定（簡素化）
export const getImagePriority = (index: number, isFeatureSection: boolean = false): boolean => {
  return isFeatureSection ? index < 2 : index < 4;
};

// 画像品質の最適化（メモ化）
const qualityMap = {
  thumbnail: 70,
  avatar: 60,
  hero: 80,
  content: 75
} as const;

export const getOptimizedQuality = (type: keyof typeof qualityMap): number => {
  return qualityMap[type] || 70;
};

// サイズ別の最適化設定（メモ化）
const sizesMap = {
  thumbnail: '(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw',
  avatar: '(max-width: 768px) 32px, 40px',
  hero: '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px',
  content: '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px'
} as const;

export const getOptimizedSizes = (type: keyof typeof sizesMap): string => {
  return sizesMap[type] || '100vw';
};

// 最適化されたプリロード管理（非同期化）
export const preloadCriticalImages = (imageUrls: string[]): void => {
  if (typeof window === 'undefined' || !imageUrls?.length) return;
  
  // キャッシュサイズ制限
  if (preloadedImages.size >= MAX_PRELOAD_CACHE) {
    preloadedImages.clear();
  }
  
  // 重複チェックとプリロード（最初の4枚のみ）
  imageUrls.slice(0, 4).forEach((url) => {
    if (!preloadedImages.has(url)) {
      requestIdleCallback(() => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        document.head.appendChild(link);
        preloadedImages.add(url);
      });
    }
  });
};

// 🔧 最適化された画像エラーハンドリング
export const handleImageError = (
  event: React.SyntheticEvent<HTMLImageElement>,
  type: keyof typeof DEFAULT_FALLBACK_URLS = 'thumbnail',
  onError?: () => void
): void => {
  const target = event.currentTarget;
  const fallbackUrl = DEFAULT_FALLBACK_URLS[type];
  
  if (target.src !== fallbackUrl) {
    target.src = fallbackUrl;
    onError?.();
  }
};

// 📁 最適化されたFileReader処理（非同期）
export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file?.type.startsWith('image/')) {
      reject(new Error('有効な画像ファイルを選択してください'));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('ファイルの読み込みに失敗しました'));
      }
    };
    reader.onerror = () => reject(new Error('ファイルの読み込み中にエラーが発生しました'));
    reader.readAsDataURL(file);
  });
};

// 🖼️ 最適化された画像検証処理（非同期）
export const validateImageFile = (file: File): Promise<{ width: number; height: number; valid: boolean }> => {
  return new Promise((resolve) => {
    const imageTest = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    imageTest.onload = () => {
      URL.revokeObjectURL(objectUrl); // メモリリーク防止
      resolve({
        width: imageTest.width,
        height: imageTest.height,
        valid: imageTest.width > 0 && imageTest.height > 0
      });
    };
    
    imageTest.onerror = () => {
      URL.revokeObjectURL(objectUrl); // メモリリーク防止
      resolve({ width: 0, height: 0, valid: false });
    };
    
    imageTest.src = objectUrl;
  });
};

// WebPサポートチェック（キャッシュ機能付き）
let webpSupported: boolean | null = null;

export const checkWebPSupport = (): Promise<boolean> => {
  if (webpSupported !== null) {
    return Promise.resolve(webpSupported);
  }
  
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      webpSupported = webP.height === 2;
      resolve(webpSupported);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

// 最適化された読み込み設定
export const getOptimizedLoadingProps = (
  index: number,
  isFeatureSection: boolean = false
): Pick<ImageProps, 'priority' | 'loading'> => {
  const isPriority = getImagePriority(index, isFeatureSection);
  
  return {
    priority: isPriority,
    loading: isPriority ? 'eager' : 'lazy'
  };
};

// 🎯 最適化された画像プロパティ生成
export const getOptimizedImageProps = (
  type: keyof typeof DEFAULT_FALLBACK_URLS,
  index: number = 0,
  isFeatureSection: boolean = false
): Pick<ImageProps, 'quality' | 'sizes' | 'priority' | 'loading' | 'placeholder' | 'blurDataURL'> => {
  const loadingProps = getOptimizedLoadingProps(index, isFeatureSection);
  
  return {
    quality: getOptimizedQuality(type),
    sizes: getOptimizedSizes(type),
    placeholder: 'blur',
    blurDataURL: DEFAULT_BLUR_DATA_URL,
    ...loadingProps
  };
};

// 🎣 最適化された画像状態管理フック
export const useImageState = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);
  
  const handleError = useCallback((
    event: React.SyntheticEvent<HTMLImageElement>,
    type: keyof typeof DEFAULT_FALLBACK_URLS = 'thumbnail'
  ) => {
    setIsLoading(false);
    setHasError(true);
    handleImageError(event, type, () => setHasError(true));
  }, []);
  
  const reset = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
  }, []);
  
  return {
    isLoading,
    hasError,
    handleLoad,
    handleError,
    reset
  };
};

// 📱 最適化された画像アップロードフック
export const useImageUpload = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setUploadError(null);
    
    try {
      // 並列でファイル検証とプレビュー生成
      const [validation, dataUrl] = await Promise.all([
        validateImageFile(file),
        readFileAsDataURL(file)
      ]);
      
      if (!validation.valid) {
        throw new Error('無効な画像ファイルです');
      }
      
      setUploadedFile(file);
      setPreviewUrl(dataUrl);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'ファイル処理に失敗しました';
      setUploadError(errorMessage);
      setUploadedFile(null);
      setPreviewUrl(null);
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  const clearFile = useCallback(() => {
    // プレビューURLのクリーンアップ
    if (previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setUploadedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
    setIsProcessing(false);
  }, [previewUrl]);
  
  return {
    uploadedFile,
    previewUrl,
    isProcessing,
    uploadError,
    processFile,
    clearFile
  };
}; 