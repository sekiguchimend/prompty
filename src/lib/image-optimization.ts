// 画像最適化ユーティリティ
import { ImageProps } from 'next/image';

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

// 画像のプリロードとキャッシュ戦略
export const preloadCriticalImages = (imageUrls: string[]): void => {
  if (typeof window === 'undefined') return;
  
  const preloadedImages = new Set(JSON.parse(localStorage.getItem('preloadedImages') || '[]'));
  
  imageUrls.slice(0, 4).forEach((url) => {
    if (!preloadedImages.has(url)) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
      
      preloadedImages.add(url);
    }
  });
  
  // 最大100個まで保存（メモリ使用量制御）
  if (preloadedImages.size > 100) {
    const array = Array.from(preloadedImages);
    preloadedImages.clear();
    array.slice(-50).forEach(url => preloadedImages.add(url));
  }
  
  localStorage.setItem('preloadedImages', JSON.stringify(Array.from(preloadedImages)));
};

// 画像エラー時の処理
export const handleImageError = (
  event: React.SyntheticEvent<HTMLImageElement>,
  fallbackUrl: string = '/images/default-thumbnail.svg'
): void => {
  const target = event.currentTarget;
  if (target.src !== fallbackUrl) {
    target.src = fallbackUrl;
  }
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