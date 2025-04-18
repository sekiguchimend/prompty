"use client";

import { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import PromptSection from './PromptSection';
import { getFeaturedPrompts, getAIGeneratedPrompts, getPopularPrompts } from '../lib/api';
import { useResponsive } from '../hooks/use-responsive';
import { PromptItem } from '../pages/prompts/[id]';

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

  // Supabaseから取得したプロンプトデータ
  const [processingFeaturedPrompts, setProcessingFeaturedPrompts] = useState<PromptItem[]>([]);
  const [processingAIGeneratedPrompts, setProcessingAIGeneratedPrompts] = useState<PromptItem[]>([]);
  const [processingPopularPosts, setProcessingPopularPosts] = useState<PromptItem[]>([]);

  useEffect(() => {
    // Supabaseからデータ取得
    getFeaturedPrompts().then(setProcessingFeaturedPrompts);
    getAIGeneratedPrompts().then(setProcessingAIGeneratedPrompts);
    getPopularPrompts().then(setProcessingPopularPosts);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Sidebar />
      
      <div className="flex-1 md:ml-[240px]">
        <main className="pb-12 pt-2 md:mt-0 mt-6">
          <div className="container px-4 sm:px-6 md:px-8">
            {/* Featured prompts section */}
            <div className="mt-0">
              <PromptSection 
                title="今日の注目プロンプト" 
                prompts={processingFeaturedPrompts}
                showMoreLink={true}
                showRssIcon={false}
                horizontalScroll={shouldUseHorizontalScroll}
                maxVisible={displayCount}
                className="mt-0"
                categoryUrl="/Featured"
                moreLinkUrl="/Featured"
              />
            </div>

            {/* Popular posts section */}
            <PromptSection 
              title="人気の記事" 
              prompts={processingPopularPosts}
              showMoreLink={true}
              horizontalScroll={shouldUseHorizontalScroll}
              maxVisible={displayCount}
              className="mt-12"
              categoryUrl="/Popular"
              moreLinkUrl="/Popular"
            />

            {/* AI Generated prompts section */}
            <PromptSection 
              title="生成AI" 
              prompts={processingAIGeneratedPrompts}
              showMoreLink={true}
              horizontalScroll={shouldUseHorizontalScroll}
              maxVisible={displayCount}
              className="mt-12"
              categoryUrl="/AIGenerated"
              moreLinkUrl="/AIGenerated"
            />

            {/* Contest prompts section */}
            <PromptSection 
              title="コンテスト・コラボ企画" 
              prompts={processingFeaturedPrompts}
              showMoreLink={true}
              sectionPrefix="contest"
              horizontalScroll={shouldUseHorizontalScroll}
              maxVisible={Math.min(4, displayCount)}
              className="mt-12"
              categoryUrl="/ContestPage"
              moreLinkUrl="/ContestPage"
            />
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
};

export default HomePage;
