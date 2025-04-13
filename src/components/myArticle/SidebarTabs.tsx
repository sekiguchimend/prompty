// components/SidebarTabs.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../../styles/NotePage.css';
import { 
  FileText, 
  ThumbsUp, 
  ShoppingBag, 
  Heart, 
  Clock 
} from 'lucide-react';

interface SidebarTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const SidebarTabs: React.FC<SidebarTabsProps> = ({ activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    // URLクエリパラメータを更新する
    navigate(`${location.pathname}?tab=${tab}`);
  };

  // タブリスト定義（アイコン付き）
  const tabs = [
    { id: 'myArticles', label: '自分の記事', icon: <FileText className="h-4 w-4" /> },
    { id: 'likedArticles', label: '高評価した', icon: <ThumbsUp className="h-4 w-4" /> },
    { id: 'purchasedArticles', label: '購入した', icon: <ShoppingBag className="h-4 w-4" /> },
    { id: 'bookmarkedArticles', label: 'スキした', icon: <Heart className="h-4 w-4" /> },
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