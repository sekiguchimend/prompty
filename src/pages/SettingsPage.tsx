import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AccountSettings from '../components/settings/AccountSettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import ReactionsSettings from '../components/settings/ReactionsSettings';
import PurchaseSettings from '../components/settings/PurchaseSettings';
import PointsSettings from '../components/settings/PointsSettings';
import CardSettings from '../components/settings/CardSettings';
import PaymentSettings from '../components/settings/PaymentSettings';
import PremiumSettings from '../components/settings/PremiumSettings';
import { useLocation, useNavigate } from 'react-router-dom';

type SettingsTab = 
  | 'アカウント'
  | '通知'
  | 'リアクション'
  | '購入・チップ履歴'
  | 'ポイント管理'
  | 'カード情報'
  | 'お支払先'
  | 'プレミアム';

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('アカウント');
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // URLクエリパラメータからタブを取得
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    
    if (tabParam) {
      switch (tabParam) {
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
        case 'card':
          setActiveTab('カード情報');
          break;
        case 'payment':
          setActiveTab('お支払先');
          break;
        case 'premium':
          setActiveTab('プレミアム');
          break;
        default:
          setActiveTab('アカウント');
      }
    }
  }, [location]);
  
  // タブの設定
  const tabs: SettingsTab[] = [
    'アカウント',
    '通知',
    'リアクション',
    '購入・チップ履歴',
    'ポイント管理',
    'カード情報',
    'お支払先',
    'プレミアム'
  ];
  
  // タブの切り替え
  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    
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
      case 'カード情報':
        tabParam = 'card';
        break;
      case 'お支払先':
        tabParam = 'payment';
        break;
      case 'プレミアム':
        tabParam = 'premium';
        break;
    }
    
    navigate(`/settings?tab=${tabParam}`, { replace: true });
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
      case 'カード情報':
        return <CardSettings />;
      case 'お支払先':
        return <PaymentSettings />;
      case 'プレミアム':
        return <PremiumSettings />;
      default:
        return <AccountSettings />;
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-1 pt-28 md:pt-16">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="flex flex-col md:flex-row gap-6">
            {/* サイドナビゲーション */}
            <div className="w-full md:w-64 md:flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:sticky md:top-20">
                <h2 className="text-lg font-bold mb-4">設定</h2>
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      onClick={() => handleTabChange(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
            
            {/* コンテンツエリア */}
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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