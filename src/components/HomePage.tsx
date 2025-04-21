"use client";

import { useState, useEffect, useMemo } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import PromptSection from './PromptSection';
import { getBatchPrompts } from '../lib/api';
import { useResponsive } from '../hooks/use-responsive';
import { PromptItem } from '../pages/prompts/[id]';

const HomePage: React.FC = () => {
  // より詳細な画面サイズ情報を取得
  const { isMobile, isTablet, isDesktop, width } = useResponsive();
  
  // 画面幅に応じてカード数を調整する関数
  const getDisplayCount = useMemo(() => {
    if (isDesktop) {
      if (width >= 1280) return 5; // xl以上
      return 4; // lg
    }
    if (isTablet) return 3; // md
    return 6; // スマホは横スクロール表示のため、多めに表示
  }, [isDesktop, isTablet, width]);

  // 横スクロール表示の条件（タブレット以下で適用）
  const shouldUseHorizontalScroll = useMemo(() => isMobile || (isTablet && width < 900), [isMobile, isTablet, width]);
  
  // Supabaseから取得したプロンプトデータ
  const [processingFeaturedPrompts, setProcessingFeaturedPrompts] = useState<PromptItem[]>([]);
  const [processingAIGeneratedPrompts, setProcessingAIGeneratedPrompts] = useState<PromptItem[]>([]);
  const [processingPopularPosts, setProcessingPopularPosts] = useState<PromptItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // データを一度に取得するuseEffect
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        const { featuredPrompts, aiGeneratedPrompts, popularPrompts } = await getBatchPrompts(getDisplayCount + 2); // 表示数より少し多めに取得
        
        setProcessingFeaturedPrompts(featuredPrompts);
        setProcessingAIGeneratedPrompts(aiGeneratedPrompts);
        setProcessingPopularPosts(popularPrompts);
      } catch (error) {
        console.error('データ取得エラー:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
    // getDisplayCountは依存配列に含めない（画面サイズ変更のたびにAPIが呼ばれるのを防ぐため）
  }, []);

  // ローディング状態をチェック
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <Sidebar />
        <div className="flex-1 md:ml-[240px]">
          <main className="pb-12 pt-2 md:mt-0 mt-6">
            <div className="container px-4 sm:px-6 md:px-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {Array(8).fill(0).map((_, index) => (
                    <div key={index} className="bg-gray-200 h-64 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

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
                maxVisible={getDisplayCount}
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
              maxVisible={getDisplayCount}
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
              maxVisible={getDisplayCount}
              className="mt-12"
              categoryUrl="/AIGenerated"
              moreLinkUrl="/AIGenerated"
            />

            {/* Contest prompts section */}
            <PromptSection 
              title="コンテスト・コラボ企画" 
              prompts={processingFeaturedPrompts} /* 注目プロンプトを再利用 */
              showMoreLink={true}
              sectionPrefix="contest"
              horizontalScroll={shouldUseHorizontalScroll}
              maxVisible={Math.min(4, getDisplayCount)}
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

// メモ化してコンポーネントの不要な再レンダリングを防止
export default HomePage;
