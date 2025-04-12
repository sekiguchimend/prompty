import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import PromptSection from './PromptSection';
import { featuredPrompts, aiGeneratedPrompts } from '../data/mockPrompts';
import { useResponsive } from '../hooks/use-responsive';

const HomePage: React.FC = () => {
  // より詳細な画面サイズ情報を取得
  const { isMobile, isTablet, isDesktop, width } = useResponsive();
  
  // 画面幅に応じてカード数を調整する関数
  const getDisplayCount = () => {
    if (isDesktop) {
      if (width >= 1280) return 5; // xl以上
      return 4; // lg
    }
    if (isTablet) return 3; // md
    return 6; // スマホは横スクロール表示のため、多めに表示
  };

  // 横スクロール表示の条件（タブレット以下で適用）
  const shouldUseHorizontalScroll = isMobile || (isTablet && width < 900);
  
  // 表示するプロンプト数
  const displayCount = getDisplayCount();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 pb-12">
          <div className="container px-4 py-6 sm:px-6 md:px-8">
            {/* Featured prompts section */}
            <PromptSection 
              title="今日の注目プロンプト" 
              prompts={featuredPrompts}
              showMoreLink={true}
              showRssIcon={true}
              horizontalScroll={shouldUseHorizontalScroll}
              maxVisible={displayCount}
            />

            {/* AI Generated prompts section */}
            <PromptSection 
              title="生成AI" 
              prompts={aiGeneratedPrompts}
              showMoreLink={true}
              horizontalScroll={shouldUseHorizontalScroll}
              maxVisible={displayCount}
            />

            {/* Contest prompts section */}
            <PromptSection 
              title="コンテスト・コラボ企画" 
              prompts={featuredPrompts}
              showMoreLink={true}
              sectionPrefix="contest"
              horizontalScroll={shouldUseHorizontalScroll}
              maxVisible={Math.min(4, displayCount)}
            />
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default HomePage;
