// 画像最適化ユーティリティ - 完全統合版
import { ImageProps } from 'next/image';
import { useState, useCallback } from 'react';

// 🎨 統一ブラーデータURL（重複削除）
export const DEFAULT_BLUR_DATA_URL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgo";

// 📁 統一フォールバック画像URL
export const DEFAULT_FALLBACK_URLS = {
  thumbnail: '/images/default-thumbnail.svg',
  avatar: '/images/default-avatar.svg',
  hero: '/images/default-thumbnail.svg',
  content: '/images/default-thumbnail.svg'
} as const;

// 画像読み込み優先度の判定
export const getImagePriority = (index: number, isFeatureSection: boolean = false): boolean => {
  if (isFeatureSection) {
    // 特集セクションでは最初の2枚を優先読み込み
    return index < 2;
  }
  // 通常セクションでは最初の4枚を優先読み込み
  return index < 4;
};

// 画像品質の最適化
export const getOptimizedQuality = (type: 'thumbnail' | 'avatar' | 'hero' | 'content'): number => {
  switch (type) {
    case 'thumbnail': return 70;
    case 'avatar': return 60;
    case 'hero': return 80;
    case 'content': return 75;
    default: return 70;
  }
};

// サイズ別の最適化設定
export const getOptimizedSizes = (type: 'thumbnail' | 'avatar' | 'hero' | 'content'): string => {
  switch (type) {
    case 'thumbnail': return '(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw';
    case 'avatar': return '(max-width: 768px) 32px, 40px';
    case 'hero': return '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px';
    case 'content': return '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px';
    default: return '100vw';
  }
};

// 統合ストレージサービスを使用したプリロード管理
export const preloadCriticalImages = (imageUrls: string[]): void => {
  if (typeof window === 'undefined') return;
  
  // 統合ストレージサービスを動的にインポート（循環参照回避）
  import('./storage-service').then(({ storageService }) => {
    imageUrls.slice(0, 4).forEach((url) => {
      if (!storageService.isImagePreloaded(url)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        document.head.appendChild(link);
        
        storageService.addPreloadedImage(url);
      }
    });
  });
};

// 🔧 強化された画像エラーハンドリング
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

// 📁 統合FileReader処理（重複削除）
export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
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

// 🖼️ 統合画像検証処理
export const validateImageFile = (file: File): Promise<{ width: number; height: number; valid: boolean }> => {
  return new Promise((resolve) => {
    const imageTest = new Image();
    imageTest.onload = () => {
      resolve({
        width: imageTest.width,
        height: imageTest.height,
        valid: imageTest.width > 0 && imageTest.height > 0
      });
    };
    imageTest.onerror = () => {
      resolve({ width: 0, height: 0, valid: false });
    };
    imageTest.src = URL.createObjectURL(file);
  });
};

// ブラウザがWebPをサポートしているかチェック
export const checkWebPSupport = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

// 画像の遅延読み込み設定を最適化
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

// 🎯 完全最適化された画像プロパティ生成（重複削除の決定版）
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

// 🎣 統合画像状態管理フック（重複削除）
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

// 📱 統合画像アップロードフック（重複削除）
export const useImageUpload = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    setUploadError(null);
    
    try {
      // ファイル検証
      const validation = await validateImageFile(file);
      if (!validation.valid) {
        throw new Error('無効な画像ファイルです');
      }
      
      // プレビューURL生成
      const dataUrl = await readFileAsDataURL(file);
      
      setUploadedFile(file);
      setPreviewUrl(dataUrl);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'ファイル処理に失敗しました');
      setUploadedFile(null);
      setPreviewUrl(null);
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  const clearFile = useCallback(() => {
    setUploadedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
    setIsProcessing(false);
  }, []);
  
  return {
    uploadedFile,
    previewUrl,
    isProcessing,
    uploadError,
    processFile,
    clearFile
  };
}; 