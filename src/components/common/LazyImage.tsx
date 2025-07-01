import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '../../lib/utils';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  priority?: boolean;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  fallbackSrc = '/images/default-thumbnail.svg',
  placeholder,
  onLoad,
  onError,
  loading = 'lazy',
  sizes,
  priority = false
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(priority ? src : placeholder || '');
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 最適化されたロード処理
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setError(true);
    setCurrentSrc(fallbackSrc);
    onError?.();
  }, [fallbackSrc, onError]);

  useEffect(() => {
    // 優先度の高い画像は即座に読み込み
    if (priority) {
      setCurrentSrc(src);
      return;
    }

    // Intersection Observer API を使用した最適化された遅延読み込み
    if (imgRef.current && 'IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setCurrentSrc(src);
              observerRef.current?.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: '100px', // 200pxから100pxに削減してパフォーマンス向上
          threshold: 0.01
        }
      );

      observerRef.current.observe(imgRef.current);
    } else {
      // Intersection Observer 非対応の場合は通常読み込み
      setCurrentSrc(src);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [src, priority]);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* 最適化されたプレースホルダー表示 */}
      {!isLoaded && !error && (
        <div 
          className={cn(
            'absolute inset-0 bg-gray-200 flex items-center justify-center',
            className
          )}
        >
          {/* シンプルなプレースホルダー（アニメーション削除でパフォーマンス向上） */}
          <div className="w-8 h-8 bg-gray-300 rounded opacity-50" />
        </div>
      )}
      
      {/* メイン画像 */}
      {currentSrc && (
        <img
          ref={imgRef}
          src={currentSrc}
          alt={alt}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-200',
            isLoaded ? 'opacity-100' : 'opacity-0',
            className
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading={loading}
          sizes={sizes}
          decoding="async"
          style={{
            ...(isLoaded ? {} : { visibility: 'hidden' })
          }}
        />
      )}
      
      {/* エラー時のフォールバック */}
      {error && currentSrc === fallbackSrc && (
        <div className={cn(
          'absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400',
          className
        )}>
          <span className="text-sm">画像を読み込めませんでした</span>
        </div>
      )}
    </div>
  );
};

export default LazyImage; 