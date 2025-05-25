import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Settings, MoreHorizontal, Eye, Heart, MessageSquare, BarChart, Home, BookOpen, Users, Bookmark, Calendar, PenSquare } from 'lucide-react';
import { Button } from '../ui/button';
import { Link } from 'react-router-dom';
import { UnifiedAvatar } from '../index';

// タブの型定義
export type DashboardTab = 'home' | 'articles' | 'membership' | 'magazine' | 'likes' | 'monthly' | 'analytics';

// タブのラベル定義
export const TabLabels: Record<DashboardTab, string> = {
  home: 'ホーム',
  articles: 'コンテンツ',
  membership: 'メンバーシップ',
  magazine: 'マガジン',
  likes: 'イイね',
  monthly: '月別',
  analytics: 'アクセス状況'
};

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  isMobile: boolean;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  isMobile
}) => {
  const [periodTab, setPeriodTab] = useState<'week' | 'month' | 'year' | 'all'>('all');
  
  // モバイル用レイアウト
  const MobileLayout = () => (
    <>
      {/* プロフィールセクション */}
      <div className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="py-8 flex flex-col md:flex-row md:items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-16 h-16 rounded-full overflow-hidden mr-4 border-2 border-white/20 shadow-sm">
                <UnifiedAvatar
                  src="https://source.unsplash.com/random/100x100?face"
                  displayName="ユーザー"
                  size="md"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold">しゅんや@勤勉的なアプリ運営</h1>
                <p className="text-sm text-gray-300">18歳/フロントエンジニア/生徒のためのアプリKrat/webアプリ制作/</p>
              </div>
            </div>
            
            <div className="md:ml-auto flex items-center gap-4">
              <Button variant="outline" size="sm" className="rounded-md text-sm h-8 bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Settings className="h-3.5 w-3.5 mr-1.5" />
                設定
              </Button>
              <Button variant="outline" size="sm" className="rounded-md text-sm h-8 w-8 p-0 bg-white/10 border-white/20 text-white hover:bg-white/20">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          
          {/* フォロー情報 */}
          <div className="flex items-center py-3 space-x-6 text-sm mb-2">
            <div className="flex items-center">
              <span className="font-bold">3</span>
              <span className="ml-1 text-gray-300">フォロー</span>
            </div>
            <div className="flex items-center">
              <span className="font-bold">2</span>
              <span className="ml-1 text-gray-300">フォロワー</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* タブナビゲーション */}
      <div className="border-b border-gray-200 bg-white shadow-sm sticky top-16 z-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex overflow-x-auto scrollbar-none">
            {(Object.entries(TabLabels) as [DashboardTab, string][]).map(([id, label]) => (
              <button
                key={id}
                className={`py-3 px-5 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === id 
                    ? 'border-gray-900 text-gray-900' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => onTabChange(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* コンテンツ部分 */}
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {activeTab === 'analytics' ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">アクセス状況</h2>
              <Button variant="outline" size="sm" className="text-xs rounded-md border-gray-300">
                CSVダウンロード
              </Button>
            </div>
            
            {/* 期間タブ */}
            <div className="flex mb-6 bg-white rounded-md shadow-sm p-1 w-fit">
              <button 
                onClick={() => setPeriodTab('week')}
                className={`py-2 px-4 text-sm rounded-md transition-colors ${periodTab === 'week' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                週
              </button>
              <button 
                onClick={() => setPeriodTab('month')}
                className={`py-2 px-4 text-sm rounded-md transition-colors ${periodTab === 'month' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                月
              </button>
              <button 
                onClick={() => setPeriodTab('year')}
                className={`py-2 px-4 text-sm rounded-md transition-colors ${periodTab === 'year' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                年
              </button>
              <button 
                onClick={() => setPeriodTab('all')}
                className={`py-2 px-4 text-sm rounded-md transition-colors ${periodTab === 'all' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                全期間
              </button>
            </div>
            
            {/* 統計カード */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200 transition-transform hover:translate-y-[-2px]">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 rounded-full bg-blue-50 text-blue-600">
                    <Eye className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-center text-4xl font-bold text-gray-800">349</h3>
                <p className="text-center text-gray-600 mt-2">全体ビュー</p>
              </div>
              
              <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200 transition-transform hover:translate-y-[-2px]">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 rounded-full bg-gray-50 text-gray-600">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-center text-4xl font-bold text-gray-800">0</h3>
                <p className="text-center text-gray-600 mt-2">コメント</p>
              </div>
              
              <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200 transition-transform hover:translate-y-[-2px]">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 rounded-full bg-red-50 text-red-500">
                    <Heart className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-center text-4xl font-bold text-gray-800">11</h3>
                <p className="text-center text-gray-600 mt-2">イイね</p>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-md shadow-sm">
              <div className="border-b border-gray-200 p-4 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">投稿パフォーマンス</h3>
                <p className="text-sm text-gray-500">最新集計時刻 2025年4月14日 09:30</p>
              </div>
              
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left p-4 text-gray-600 font-medium">コンテンツ</th>
                    <th className="p-4 text-center text-gray-600 font-medium">ビュー</th>
                    <th className="p-4 text-center text-gray-600 font-medium">コメント</th>
                    <th className="p-4 text-center text-gray-600 font-medium">イイね</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-800">ビジネスの根幹は営業である（削除済み）</td>
                    <td className="p-4 text-center text-gray-800">95</td>
                    <td className="p-4 text-center text-gray-800">0</td>
                    <td className="p-4 text-center text-gray-800">0</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-800">アプリを作るだけならプログラミングの知識いりません（削除済み）</td>
                    <td className="p-4 text-center text-gray-800">58</td>
                    <td className="p-4 text-center text-gray-800">0</td>
                    <td className="p-4 text-center text-gray-800">1</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-800">学生起業オススメの分野（削除済み）</td>
                    <td className="p-4 text-center text-gray-800">49</td>
                    <td className="p-4 text-center text-gray-800">0</td>
                    <td className="p-4 text-center text-gray-800">0</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ) : (
          children
        )}
      </div>
    </>
  );
  
  // デスクトップ用レイアウト
  const DesktopLayout = () => (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* サイドバー */}
      <DashboardSidebar activeTab={activeTab} onTabChange={onTabChange} />

      {/* メインコンテンツ */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {activeTab === 'analytics' ? (
          <div className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">アクセス状況</h2>
              <Button variant="outline" size="sm" className="text-xs rounded-md border-gray-300">
                CSVダウンロード
              </Button>
            </div>
            
            {/* 期間タブ */}
            <div className="flex mb-6 bg-white rounded-md shadow-sm p-1 w-fit">
              <button 
                onClick={() => setPeriodTab('week')}
                className={`py-2 px-4 text-sm rounded-md transition-colors ${periodTab === 'week' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                週
              </button>
              <button 
                onClick={() => setPeriodTab('month')}
                className={`py-2 px-4 text-sm rounded-md transition-colors ${periodTab === 'month' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                月
              </button>
              <button 
                onClick={() => setPeriodTab('year')}
                className={`py-2 px-4 text-sm rounded-md transition-colors ${periodTab === 'year' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                年
              </button>
              <button 
                onClick={() => setPeriodTab('all')}
                className={`py-2 px-4 text-sm rounded-md transition-colors ${periodTab === 'all' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                全期間
              </button>
            </div>
            
            {/* 統計カード */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200 transition-transform hover:translate-y-[-2px]">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 rounded-full bg-blue-50 text-blue-600">
                    <Eye className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-center text-4xl font-bold text-gray-800">349</h3>
                <p className="text-center text-gray-600 mt-2">全体ビュー</p>
              </div>
              
              <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200 transition-transform hover:translate-y-[-2px]">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 rounded-full bg-gray-50 text-gray-600">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-center text-4xl font-bold text-gray-800">0</h3>
                <p className="text-center text-gray-600 mt-2">コメント</p>
              </div>
              
              <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200 transition-transform hover:translate-y-[-2px]">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 rounded-full bg-red-50 text-red-500">
                    <Heart className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-center text-4xl font-bold text-gray-800">11</h3>
                <p className="text-center text-gray-600 mt-2">イイね</p>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-md shadow-sm">
              <div className="border-b border-gray-200 p-4 flex justify-between items-center">
                <h3 className="font-semibold text-gray-800">投稿パフォーマンス</h3>
                <p className="text-sm text-gray-500">最新集計時刻 2025年4月14日 09:30</p>
              </div>
              
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left p-4 text-gray-600 font-medium">記事</th>
                    <th className="p-4 text-center text-gray-600 font-medium">ビュー</th>
                    <th className="p-4 text-center text-gray-600 font-medium">コメント</th>
                    <th className="p-4 text-center text-gray-600 font-medium">イイね</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-800">ビジネスの根幹は営業である（削除済み）</td>
                    <td className="p-4 text-center text-gray-800">95</td>
                    <td className="p-4 text-center text-gray-800">0</td>
                    <td className="p-4 text-center text-gray-800">0</td>
                  </tr>
                  <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-800">アプリを作るだけならプログラミングの知識いりません（削除済み）</td>
                    <td className="p-4 text-center text-gray-800">58</td>
                    <td className="p-4 text-center text-gray-800">0</td>
                    <td className="p-4 text-center text-gray-800">1</td>
                  </tr>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-gray-800">学生起業オススメの分野（削除済み）</td>
                    <td className="p-4 text-center text-gray-800">49</td>
                    <td className="p-4 text-center text-gray-800">0</td>
                    <td className="p-4 text-center text-gray-800">0</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <>
            {/* タブコンテンツのタイトル */}
            <div className="bg-white border-b border-gray-200 py-4 px-8 shadow-sm">
              <h1 className="text-xl font-bold text-gray-800">{TabLabels[activeTab]}</h1>
            </div>
            
            <div className="p-8">
              {children}
            </div>
          </>
        )}
      </div>
    </div>
  );

  return isMobile ? <MobileLayout /> : <DesktopLayout />;
};

// サイドバーコンポーネント
const DashboardSidebar: React.FC<{
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}> = ({ activeTab, onTabChange }) => {
  return (
    <div className="w-72 h-full bg-gray-900 text-white flex-shrink-0 shadow-md">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-10">
          <UnifiedAvatar
            src="https://source.unsplash.com/random/100x100?face"
            displayName="ユーザー"
            size="md"
          />
          <div>
            <h2 className="font-bold text-white">クリエイターダッシュボード</h2>
            <p className="text-xs text-gray-400">しゅんや@勤勉的なアプリ運営</p>
          </div>
        </div>
        
        <nav className="space-y-1">
          <SidebarButton 
            icon={<BarChart className="h-5 w-5" />} 
            label="アクセス状況" 
            isActive={activeTab === 'analytics'} 
            onClick={() => onTabChange('analytics')}
          />
          
          <SidebarButton 
            icon={<BookOpen className="h-5 w-5" />} 
            label="コンテンツ" 
            isActive={activeTab === 'articles'} 
            onClick={() => onTabChange('articles')}
          />
          
          <SidebarButton 
            icon={<Users className="h-5 w-5" />} 
            label="メンバーシップ" 
            isActive={activeTab === 'membership'} 
            onClick={() => onTabChange('membership')}
          />
          
          <SidebarButton 
            icon={<Bookmark className="h-5 w-5" />} 
            label="マガジン" 
            isActive={activeTab === 'magazine'} 
            onClick={() => onTabChange('magazine')}
          />
          
          <SidebarButton 
            icon={<Heart className="h-5 w-5" />} 
            label="イイね" 
            isActive={activeTab === 'likes'} 
            onClick={() => onTabChange('likes')}
          />
          
          <SidebarButton 
            icon={<Calendar className="h-5 w-5" />} 
            label="月別" 
            isActive={activeTab === 'monthly'} 
            onClick={() => onTabChange('monthly')}
          />
        </nav>
      </div>
      
      <div className="mt-auto p-6 border-t border-gray-800">
        <Link to="/create-post">
          <Button className="w-full bg-gray-800 hover:bg-gray-700 text-white shadow-sm transition-all hover:shadow-md rounded-md">
            <PenSquare className="h-4 w-4 mr-2" />
            新規投稿を作成
          </Button>
        </Link>
        
        <Button variant="ghost" className="w-full mt-4 text-gray-400 hover:text-white hover:bg-gray-800">
          <Settings className="h-4 w-4 mr-2" />
          設定
        </Button>
      </div>
    </div>
  );
};

// サイドバーボタンコンポーネント
const SidebarButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
  return (
    <button 
      className={`w-full flex items-center py-3 px-4 rounded-md transition-all ${
        isActive 
          ? 'bg-gray-800 text-white font-medium shadow-sm' 
          : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
      }`}
      onClick={onClick}
    >
      <span className="mr-3">{icon}</span>
      {label}
    </button>
  );
};

export default DashboardLayout; 