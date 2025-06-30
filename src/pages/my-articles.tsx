// pages/my-articles.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Footer from '../components/footer';
import MyArticlesList from '../components/myArticle/MyArticlesList';
import LikedArticles from '../components/myArticle/LikedArticles';
import PurchasedArticles from '../components/myArticle/PurchasedArticles';
import BookmarkedArticles from '../components/myArticle/BookmarkedArticles';
import RecentlyViewedArticles from '../components/myArticle/RecentlyViewedArticles';
import SidebarTabs from '../components/myArticle/SidebarTabs';

type ArticleTab = 'myArticles' | 'likedArticles' | 'purchasedArticles' | 'bookmarkedArticles' | 'recentlyViewedArticles';

const MyArticles: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ArticleTab>('myArticles');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const { tab } = router.query;
    if (tab && typeof tab === 'string') {
      // URLクエリパラメータからタブを設定
      switch (tab) {
        case 'likedArticles':
          setActiveTab('likedArticles');
          break;
        case 'purchasedArticles':
          setActiveTab('purchasedArticles');
          break;
        case 'bookmarkedArticles':
          setActiveTab('bookmarkedArticles');
          break;
        case 'recentlyViewedArticles':
          setActiveTab('recentlyViewedArticles');
          break;
        default:
          setActiveTab('myArticles');
      }
    }
  }, [router.query]);

  // アクティブなタブに応じてコンポーネントを表示
  const renderTabContent = () => {
    switch (activeTab) {
      case 'myArticles':
        return <MyArticlesList />;
      case 'likedArticles':
        return <LikedArticles />;
      case 'purchasedArticles':
        return <PurchasedArticles />;
      case 'bookmarkedArticles':
        return <BookmarkedArticles />;
      case 'recentlyViewedArticles':
        return <RecentlyViewedArticles />;
      default:
        return <MyArticlesList />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="flex gap-6">
            {/* サイドバー */}
            <div className="w-64 flex-shrink-0">
              <SidebarTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
              />
            </div>
            
            {/* メインコンテンツ */}
            <div className="flex-1">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyArticles; 