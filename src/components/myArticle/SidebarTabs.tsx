// components/SidebarTabs.jsx
import React from 'react';
import { useRouter } from 'next/router';
import { FileText } from 'lucide-react';
import { Heart } from 'lucide-react'; 
import { ShoppingBag } from 'lucide-react';
import { Bookmark } from 'lucide-react';
import { Clock } from 'lucide-react';

type ArticleTab = 'myArticles' | 'likedArticles' | 'purchasedArticles' | 'bookmarkedArticles' | 'recentlyViewedArticles';

interface SidebarTabsProps {
  activeTab: ArticleTab;
  setActiveTab: (tab: ArticleTab) => void;
}

const SidebarTabs: React.FC<SidebarTabsProps> = ({ activeTab, setActiveTab }) => {
  const router = useRouter();

  const handleTabClick = (tab: ArticleTab) => {
    setActiveTab(tab);
    // URLクエリパラメータを更新する
    router.push({
      pathname: router.pathname,
      query: { tab }
    }, undefined, { shallow: true });
  };

  // タブリスト定義（アイコン付き）
  const tabs = [
    { id: 'myArticles' as ArticleTab, label: '自分の記事', shortLabel: '記事', icon: <FileText className="h-4 w-4" /> },
    { id: 'likedArticles' as ArticleTab, label: 'イイねした', shortLabel: 'いいね', icon: <Heart className="h-4 w-4" /> },
    { id: 'purchasedArticles' as ArticleTab, label: '購入した', shortLabel: '購入', icon: <ShoppingBag className="h-4 w-4" /> },
    { id: 'bookmarkedArticles' as ArticleTab, label: 'ブックマークした', shortLabel: 'ブックマーク', icon: <Bookmark className="h-4 w-4" /> },
    { id: 'recentlyViewedArticles' as ArticleTab, label: '最近みた', shortLabel: '最近', icon: <Clock className="h-4 w-4" /> },
  ];

  return (
    <div className="sidebar-tabs">
      <ul>
        {tabs.map((tab) => (
          <li 
            key={tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => handleTabClick(tab.id)}
          >
            <span className="icon">{tab.icon}</span>
            <span className="hidden md:inline">{tab.label}</span>
            <span className="md:hidden">{tab.shortLabel}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SidebarTabs;