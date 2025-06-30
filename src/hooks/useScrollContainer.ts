import { useRef, useState, useEffect, useCallback } from 'react';

export const useScrollContainer = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // スクロール可能性をチェック
  const checkScrollability = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const { scrollLeft, scrollWidth, clientWidth } = container;

    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  // スクロール処理
  const handleScroll = useCallback((direction: 'left' | 'right') => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const scrollAmount = container.clientWidth * 0.8; // 80%分スクロール

    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }, []);

  // ResizeObserverでコンテナサイズ変更を監視
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    // 初期チェック
    checkScrollability();

    // スクロールイベントリスナー
    const handleScrollEvent = () => checkScrollability();
    container.addEventListener('scroll', handleScrollEvent);

    // ResizeObserver（最適化: windowリサイズイベントは不要、ResizeObserverで十分）
    const resizeObserver = new ResizeObserver(() => {
      checkScrollability();
    });
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScrollEvent);
      resizeObserver.disconnect();
    };
  }, [checkScrollability]);

  return {
    containerRef,
    canScrollLeft,
    canScrollRight,
    handleScroll,
    checkScrollability,
  };
}; 