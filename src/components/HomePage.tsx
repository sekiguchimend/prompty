import { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import PromptSection from './PromptSection';
import { featuredPrompts, aiGeneratedPrompts } from '../data/mockPrompts';

const HomePage: React.FC = () => {
  // モバイル画面かどうかを判定するステート
  const [isMobile, setIsMobile] = useState(false);

  // 画面サイズの変更を検知
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint (768px)より小さい場合はモバイル
    };

    // 初期チェック
    checkIfMobile();

    // リサイズイベントのリスナー登録
    window.addEventListener('resize', checkIfMobile);

    // クリーンアップ
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

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
              horizontalScroll={isMobile} // モバイル画面の場合のみ横スクロール
            />

            {/* AI Generated prompts section */}
            <PromptSection 
              title="生成AI" 
              prompts={aiGeneratedPrompts}
              showMoreLink={true}
              horizontalScroll={isMobile} // モバイル画面の場合のみ横スクロール
            />

            {/* Contest prompts section */}
            <PromptSection 
              title="コンテスト・コラボ企画" 
              prompts={featuredPrompts.slice(0, 4)}
              showMoreLink={true}
              sectionPrefix="contest"
              horizontalScroll={isMobile} // モバイル画面の場合のみ横スクロール
            />
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default HomePage;
