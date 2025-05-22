// components/SidebarTabs.jsx
import React from 'react';
import { useRouter } from 'next/router';
import { 
  FileText, 
  ThumbsUp, 
  ShoppingBag, 
  Heart, 
  Clock,
  Bookmark
} from 'lucide-react';

interface SidebarTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const SidebarTabs: React.FC<SidebarTabsProps> = ({ activeTab, setActiveTab }) => {
  const router = useRouter();

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    // URLクエリパラメータを更新する
    router.push({
      pathname: router.pathname,
      query: { tab }
    }, undefined, { shallow: true });
  };

  // タブリスト定義（アイコン付き）
  const tabs = [
    { id: 'myArticles', label: '自分の記事', icon: <FileText className="h-4 w-4" /> },
    { id: 'likedArticles', label: 'イイねした', icon: <Heart className="h-4 w-4" /> },
    { id: 'purchasedArticles', label: '購入した', icon: <ShoppingBag className="h-4 w-4" /> },
    { id: 'bookmarkedArticles', label: 'ブックマークした', icon: <Bookmark className="h-4 w-4" /> },
    { id: 'recentlyViewedArticles', label: '最近みた', icon: <Clock className="h-4 w-4" /> },
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
            {tab.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SidebarTabs;