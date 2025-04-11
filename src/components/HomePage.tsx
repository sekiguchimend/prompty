
import React from 'react';
import Header from './Header';
import Footer from './Footer';
import PromptSection from './PromptSection';
import MobileCategories from './MobileCategories';
import { featuredPrompts, aiGeneratedPrompts } from '../data/mockPrompts';
import { useIsMobile } from '../hooks/use-mobile';

const HomePage: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      
      {isMobile && <MobileCategories />}
      
      <main className="flex-1 pb-6">
        <div className="container px-4 py-4 mx-auto">
          {/* Featured prompts section */}
          <PromptSection 
            title="今日の注目記事" 
            prompts={featuredPrompts}
            showMoreLink={true}
            showRssIcon={isMobile ? false : true}
          />

          {/* AI Generated prompts section */}
          <PromptSection 
            title="生成AI" 
            prompts={aiGeneratedPrompts}
            showMoreLink={true}
          />

          {/* Contest prompts section */}
          <PromptSection 
            title="コンテスト・コラボ企画" 
            prompts={featuredPrompts.slice(0, 4)}
            showMoreLink={true}
            sectionPrefix="contest"
          />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default HomePage;
