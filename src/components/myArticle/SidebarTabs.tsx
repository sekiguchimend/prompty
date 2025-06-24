// components/SidebarTabs.jsx
import React from 'react';
import { useRouter } from 'next/router';
import { FileText } from 'lucide-react';
import { Heart } from 'lucide-react'; 
import { ShoppingBag } from 'lucide-react';
import { Bookmark } from 'lucide-react';
import { Clock, Settings } from 'lucide-react';

type ArticleTab = 'myArticles' | 'likedArticles' | 'purchasedArticles' | 'bookmarkedArticles' | 'recentlyViewedArticles' | 'manageArticles';

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
    { id: 'manageArticles' as ArticleTab, label: '記事管理', shortLabel: '管理', icon: <Settings className="h-4 w-4" /> },
    { id: 'likedArticles' as ArticleTab, label: 'イイねした', shortLabel: 'いいね', icon: <Heart className="h-4 w-4" /> },
    { id: 'purchasedArticles' as ArticleTab, label: '購入した', shortLabel: '購入', icon: <ShoppingBag className="h-4 w-4" /> },
    { id: 'bookmarkedArticles' as ArticleTab, label: 'ブックマークした', shortLabel: 'ブックマーク', icon: <Bookmark className="h-4 w-4" /> },
    { id: 'recentlyViewedArticles' as ArticleTab, label: '最近みた', shortLabel: '最近', icon: <Clock className="h-4 w-4" /> },
  ];

  return (
    <div>
      {/* デスクトップ用ナビゲーション */}
      <nav className="hidden md:block">
        <ul className="space-y-1">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <button
                onClick={() => handleTabClick(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className={`${activeTab === tab.id ? 'text-gray-700' : 'text-gray-400'}`}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* スマホ用ナビゲーション */}
      <div className="md:hidden">
        <div className="flex overflow-x-auto gap-1 pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md whitespace-nowrap text-sm transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-xs">{tab.icon}</span>
              <span>{tab.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SidebarTabs;