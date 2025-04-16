import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Sidebar from '../components/Sidebar';
import PromptGrid from '../components/PromptGrid';
import { getPopularPosts } from '../data/posts';
import { useResponsive } from '../hooks/use-responsive';
import { Helmet } from 'react-helmet';
import { PromptItem } from '../components/PromptGrid';

const Popular: React.FC = () => {
  const { isMobile, isTablet } = useResponsive();
  const [prompts, setPrompts] = useState<PromptItem[]>([]);

  useEffect(() => {
    // 人気記事を取得
    const popularPosts = getPopularPosts();
    
    // ランダムにいいね状態を追加する関数
    const addRandomLikeState = (items: PromptItem[]): PromptItem[] => {
      return items.map(item => ({
        ...item,
        isLiked: Math.random() > 0.5 // 50%の確率でいいね済みにする
      }));
    };

    setPrompts(addRandomLikeState(popularPosts));
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Helmet>
        <title>人気の記事 | prompty</title>
      </Helmet>
      <Header />
      <Sidebar />
      
      <div className="flex flex-1 pt-10">
        {/* PC画面でのみサイドバーのスペースを確保 */}
        <div className="hidden md:block w-[240px] flex-shrink-0">
          {/* この空のdivはサイドバーのスペースを確保するためのもの */}
        </div>
        
        <main className="flex-1 pb-12 overflow-x-hidden md:mt-0 mt-5">
          <div className="container px-4 py-6 sm:px-6 md:px-8">
            <h1 className="text-2xl font-bold mb-6">人気の記事</h1>
            <p className="text-gray-600 mb-8">
              多くのユーザーに読まれている人気記事を集めました。過去に投稿された中からトレンドの記事をご紹介します。
            </p>
            
            <PromptGrid 
              prompts={prompts} 
              horizontalScroll={false} 
            />
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default Popular; 