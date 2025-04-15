import React, { useRef, useEffect, useState } from 'react';
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
  isLiked?: boolean;
}

interface PromptGridProps {
  prompts: PromptItem[];
  sectionPrefix?: string;
  horizontalScroll?: boolean;
}

const PromptGrid: React.FC<PromptGridProps> = ({ prompts, sectionPrefix = '', horizontalScroll = false }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [visiblePrompts, setVisiblePrompts] = useState<PromptItem[]>(prompts);

  // プロンプトを非表示にする関数
  const handleHidePrompt = (id: string) => {
    setVisiblePrompts(prev => prev.filter(prompt => 
      sectionPrefix ? `${sectionPrefix}-${prompt.id}` !== id : prompt.id !== id
    ));
  };

  // propsが変わったら表示中のプロンプトを更新
  useEffect(() => {
    setVisiblePrompts(prompts);
  }, [prompts]);

  // 横スクロール時に最後の記事まで確実にスクロールできるようにする
  useEffect(() => {
    if (!horizontalScroll || !scrollContainerRef.current) return;

    // スクロール領域を調整する関数
    const adjustScrollArea = () => {
      const container = scrollContainerRef.current;
      if (!container || visiblePrompts.length === 0) return;
      
      // コンテナの幅を取得
      const containerWidth = container.clientWidth;
      
      // ダミーエレメントを探す
      const dummyElement = container.querySelector('.scroll-end-spacer') as HTMLElement;
      if (dummyElement) {
        // モバイル表示かどうかを判定
        const isMobile = window.innerWidth < 768;
        
        // モバイル表示時は画面幅の5%程度の余白を確保
        // これにより最後の要素まで確実にスクロールできる
        const spacerWidth = isMobile ? Math.floor(containerWidth * 0.05) : 100;
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
  }, [horizontalScroll, visiblePrompts.length]);

  const gridClasses = horizontalScroll
    ? "flex overflow-x-auto pb-4 space-x-4 hide-scrollbar scroll-smooth"
    : "grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5";

  const cardClasses = horizontalScroll
    ? "w-[65%] max-w-[260px] flex-shrink-0"
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

  // 表示するプロンプトがない場合
  if (visiblePrompts.length === 0) {
    return <div className="text-gray-500 text-center py-6">表示するコンテンツがありません</div>;
  }

  return (
    <>
      <style>{scrollbarHideStyle}</style>
      
      <div className={gridClasses} ref={scrollContainerRef}>
        {visiblePrompts.map((prompt, index) => (
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
              isLiked={prompt.isLiked}
              onHide={handleHidePrompt}
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
