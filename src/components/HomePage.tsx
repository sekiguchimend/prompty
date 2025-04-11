
import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import PromptSection from './PromptSection';
import { featuredPrompts, aiGeneratedPrompts } from '../data/mockPrompts';

const HomePage: React.FC = () => {
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
      </div>
      
      <Footer />
    </div>
  );
};

export default HomePage;
