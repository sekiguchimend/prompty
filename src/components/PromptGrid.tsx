import React, { useRef, useEffect } from 'react';
import PromptCard from './PromptCard';

export interface PromptItem {
  id: string;
  title: string;
  thumbnailUrl: string;
  user: {
    name: string;
    avatarUrl: string;
  };
  postedAt: string;
  likeCount: number;
}

interface PromptGridProps {
  prompts: PromptItem[];
  sectionPrefix?: string;
  horizontalScroll?: boolean;
}

const PromptGrid: React.FC<PromptGridProps> = ({ prompts, sectionPrefix = '', horizontalScroll = false }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 横スクロール時に最後の記事まで確実にスクロールできるようにする
  useEffect(() => {
    if (!horizontalScroll || !scrollContainerRef.current) return;

    // スクロール領域を調整する関数
    const adjustScrollArea = () => {
      const container = scrollContainerRef.current;
      if (!container || prompts.length === 0) return;
      
      // コンテナの幅を取得
      const containerWidth = container.clientWidth;
      
      // ダミーエレメントを探す
      const dummyElement = container.querySelector('.scroll-end-spacer') as HTMLElement;
      if (dummyElement) {
        // モバイル表示かどうかを判定
        const isMobile = window.innerWidth < 768;
        
        // モバイル表示時は画面幅の半分程度の余白を確保
        // これにより最後の要素まで確実にスクロールできる
        const spacerWidth = isMobile ? Math.floor(containerWidth * 0.5) : 100;
        dummyElement.style.minWidth = `${spacerWidth}px`;
      }
    };
    
    // 初回と画面サイズ変更時に実行
    adjustScrollArea();
    window.addEventListener('resize', adjustScrollArea);
    
    // 少し遅れて再度実行（レイアウト完了後に）
    const timer = setTimeout(adjustScrollArea, 300);
    
    return () => {
      window.removeEventListener('resize', adjustScrollArea);
      clearTimeout(timer);
    };
  }, [horizontalScroll, prompts.length]);

  const gridClasses = horizontalScroll
    ? "flex overflow-x-auto pb-4 space-x-4 hide-scrollbar scroll-smooth"
    : "grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5";

  const cardClasses = horizontalScroll
    ? "w-[80%] max-w-[280px] flex-shrink-0"
    : "";

  const scrollbarHideStyle = `
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .hide-scrollbar {
      -ms-overflow-style: none;  /* IE and Edge */
      scrollbar-width: none;     /* Firefox */
    }
    
    .scroll-smooth {
      -webkit-overflow-scrolling: touch;
    }
  `;

  return (
    <>
      <style>{scrollbarHideStyle}</style>
      
      <div className={gridClasses} ref={scrollContainerRef}>
        {prompts.map((prompt, index) => (
          <div 
            key={`${sectionPrefix}${prompt.id}`} 
            className={`${cardClasses}`}
          >
            <PromptCard
              id={sectionPrefix ? `${sectionPrefix}-${prompt.id}` : prompt.id}
              title={prompt.title}
              thumbnailUrl={prompt.thumbnailUrl}
              user={prompt.user}
              postedAt={prompt.postedAt}
              likeCount={prompt.likeCount}
            />
          </div>
        ))}
        
        {/* スクロール可能領域を拡張するためのスペーサー */}
        {horizontalScroll && (
          <div className="flex-shrink-0 scroll-end-spacer" aria-hidden="true"></div>
        )}
      </div>
    </>
  );
};

export default PromptGrid;
