import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Footer from '../components/footer';
import AccountSettings from '../components/settings/AccountSettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import ReactionsSettings from '../components/settings/ReactionsSettings';
import PurchaseSettings from '../components/settings/PurchaseSettings';
import PointsSettings from '../components/settings/PointsSettings';
import PremiumSettings from '../components/settings/PremiumSettings';
import CommentSettings from '../components/settings/CommentSettings';
import { ChevronRight } from 'lucide-react';
import { User } from 'lucide-react';
import { Bell } from 'lucide-react';
import { Heart } from 'lucide-react';
import { ShoppingBag } from 'lucide-react';
import { MessageCircle } from 'lucide-react';
import { Menu } from 'lucide-react';
import { X } from 'lucide-react';

type SettingsTab = 
  | 'アカウント'
  | '通知'
  | 'リアクション'
  | '購入・チップ履歴'
  | 'ポイント管理'
  | 'プレミアム'
  | 'コメント';

// タブと対応するアイコンのマッピング
const tabIcons = {
  'アカウント': <User size={18} />,
  '通知': <Bell size={18} />,
  'リアクション': <Heart size={18} />,
  '購入・チップ履歴': <ShoppingBag size={18} />,
  'ポイント管理': <User size={18} />, // Coinアイコンの代わりにUserを使用
  'プレミアム': <User size={18} />, // Crownアイコンの代わりにUserを使用
  'コメント': <MessageCircle size={18} />
};

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('アカウント');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { tab } = router.query;
  
  useEffect(() => {
    // URLクエリパラメータからタブを取得
    if (tab && typeof tab === 'string') {
      switch (tab) {
        case 'account':
          setActiveTab('アカウント');
          break;
        case 'notification':
          setActiveTab('通知');
          break;
        case 'reaction':
          setActiveTab('リアクション');
          break;
        case 'purchase':
          setActiveTab('購入・チップ履歴');
          break;
        case 'points':
          setActiveTab('ポイント管理');
          break;
        case 'premium':
          setActiveTab('プレミアム');
          break;
        case 'comment':
          setActiveTab('コメント');
          break;
        default:
          setActiveTab('アカウント');
      }
    }
  }, [tab]);
  
  // タブの設定
  const tabs: SettingsTab[] = [
    'アカウント',
    '通知',
    'リアクション',
    'コメント',
    '購入・チップ履歴',
    'ポイント管理',
    'プレミアム'
  ];
  
  // タブの切り替え
  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false); // モバイルメニューを閉じる
    
    // URLクエリパラメータを更新
    let tabParam = '';
    switch (tab) {
      case 'アカウント':
        tabParam = 'account';
        break;
      case '通知':
        tabParam = 'notification';
        break;
      case 'リアクション':
        tabParam = 'reaction';
        break;
      case '購入・チップ履歴':
        tabParam = 'purchase';
        break;
      case 'ポイント管理':
        tabParam = 'points';
        break;
      case 'プレミアム':
        tabParam = 'premium';
        break;
      case 'コメント':
        tabParam = 'comment';
        break;
    }
    
    // Next.jsのルーターを使ってURLを更新
    router.push({
      pathname: router.pathname,
      query: { tab: tabParam }
    }, undefined, { shallow: true });
  };
  
  // アクティブなタブに対応するコンポーネントを表示
  const renderTabContent = () => {
    switch (activeTab) {
      case 'アカウント':
        return <AccountSettings />;
      case '通知':
        return <NotificationSettings />;
      case 'リアクション':
        return <ReactionsSettings />;
      case '購入・チップ履歴':
        return <PurchaseSettings />;
      case 'ポイント管理':
        return <PointsSettings />;
      case 'プレミアム':
        return <PremiumSettings />;
      case 'コメント':
        return <CommentSettings />;
      default:
        return <AccountSettings />;
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          {/* モバイルヘッダー */}
          <div className="flex items-center justify-between md:hidden mb-4">
            <h1 className="text-xl font-bold">設定</h1>
            <button 
              className="p-2 rounded-full hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          
          {/* 現在選択中のタブ表示（モバイル時） */}
          <div className="md:hidden mb-4">
            <div 
              className="bg-white rounded-lg shadow-sm  p-4 flex items-center justify-between"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <div className="flex items-center">
                <span className="text-gray-600 mr-3">
                  {tabIcons[activeTab]}
                </span>
                <span className="font-medium">{activeTab}</span>
              </div>
              <ChevronRight size={18} className="text-gray-400" />
            </div>
          </div>
          
          {/* モバイルメニュー */}
          {mobileMenuOpen && (
            <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40">
              <div className="bg-white h-full w-80 shadow-xl">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">設定</h2>
                    <button onClick={() => setMobileMenuOpen(false)}>
                      <X size={24} />
                    </button>
                  </div>
                </div>
                <div className="overflow-y-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => handleTabChange(tab)}
                      className={`w-full text-left p-4 flex items-center border-b border-gray-100 ${
                        activeTab === tab ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-gray-600 mr-3">
                        {tabIcons[tab]}
                      </span>
                      <span className="font-medium">{tab}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-6">
            {/* サイドバー（デスクトップ） */}
            <div className="hidden md:block w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold">設定</h2>
                </div>
                <nav className="p-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => handleTabChange(tab)}
                      className={`w-full text-left px-3 py-2 rounded-md mb-1 flex items-center transition-colors ${
                        activeTab === tab 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-gray-600 mr-3">
                        {tabIcons[tab]}
                      </span>
                      <span className="font-medium">{tab}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
            
            {/* メインコンテンツ */}
            <div className="flex-1">
              <div className="">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SettingsPage; 