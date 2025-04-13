import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { MoreHorizontal, Settings, Heart, MessageSquare, Home, BookText, Users, BookOpen, BookMarked, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// サンプル記事データ
const articles = [
  {
    id: '1',
    title: '18歳で未経験な自分でも案件を獲得できたわけ',
    imageUrl: 'https://source.unsplash.com/random/300x200?coding',
    publishedAt: '5ヶ月前',
    views: 1248,
    likes: 4,
    comments: 0,
    isPublished: true,
    isPremium: false
  },
  {
    id: '2',
    title: '塾の悩みを解決？！生徒の「遅刻、事故、授業の存在を忘れる」を事前に知れるアプリ',
    imageUrl: 'https://source.unsplash.com/random/300x200?school',
    publishedAt: '5ヶ月前',
    views: 967,
    likes: 5,
    comments: 2,
    isPublished: true,
    isPremium: false
  },
  {
    id: '3',
    title: 'フロントエンドエンジニアになるためのロードマップ',
    imageUrl: 'https://source.unsplash.com/random/300x200?programming',
    publishedAt: '下書き',
    views: 0,
    likes: 0,
    comments: 0,
    isPublished: false,
    isPremium: false
  },
  {
    id: '4',
    title: 'AIツールを活用した効率的な開発手法【有料記事】',
    imageUrl: 'https://source.unsplash.com/random/300x200?ai',
    publishedAt: '2ヶ月前',
    views: 512,
    likes: 12,
    comments: 3,
    isPublished: true,
    isPremium: true
  }
];

type TabType = 'ホーム' | '記事' | 'メンバーシップ' | 'マガジン' | 'スキ' | '月別';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('記事');
  const [selectedFilter, setSelectedFilter] = useState<'すべて' | '公開済み' | '下書き' | '有料'>('すべて');
  const [isMobile, setIsMobile] = useState(false);
  
  // 画面サイズを検出して、モバイルかPCかを判定
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // 初期チェック
    checkIfMobile();
    
    // リサイズイベントのリスナー
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  // 表示する記事をフィルタリング
  const getFilteredArticles = () => {
    switch (selectedFilter) {
      case '公開済み':
        return articles.filter(article => article.isPublished);
      case '下書き':
        return articles.filter(article => !article.isPublished);
      case '有料':
        return articles.filter(article => article.isPremium);
      default:
        return articles;
    }
  };
  
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };
  
  // モバイル用レイアウト
  const MobileLayout = () => (
    <>
      {/* プロフィールセクション */}
      <div className="border-b border-gray-200">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="py-6 flex flex-col md:flex-row md:items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden mr-4">
                <img 
                  src="https://source.unsplash.com/random/100x100?face" 
                  alt="ユーザーアバター" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold">しゅんや@勤勉的なアプリ運営</h1>
                <p className="text-sm text-gray-500">18歳/フロントエンジニア/生徒のためのアプリKrat/webアプリ制作/</p>
              </div>
            </div>
            
            <div className="md:ml-auto flex items-center gap-4">
              <Button variant="outline" size="sm" className="rounded-full text-sm h-8">
                <Settings className="h-3.5 w-3.5 mr-1.5" />
                設定
              </Button>
              <Button variant="outline" size="sm" className="rounded-full text-sm h-8">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          
          {/* フォロー情報 */}
          <div className="flex items-center py-3 space-x-6 text-sm">
            <div className="flex items-center">
              <span className="font-bold">3</span>
              <span className="ml-1 text-gray-600">フォロー</span>
            </div>
            <div className="flex items-center">
              <span className="font-bold">2</span>
              <span className="ml-1 text-gray-600">フォロワー</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* タブナビゲーション */}
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex overflow-x-auto scrollbar-none">
            {(['ホーム', '記事', 'メンバーシップ', 'マガジン', 'スキ', '月別'] as TabType[]).map(tab => (
              <button
                key={tab}
                className={`py-3 px-5 font-medium text-sm whitespace-nowrap border-b-2 ${
                  activeTab === tab 
                    ? 'border-black text-black' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => handleTabChange(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
  
  // デスクトップ用レイアウト
  const DesktopLayout = () => (
    <>
      <div className="flex h-[calc(100vh-64px)]">
        {/* サイドバー */}
        <div className="w-56 h-full border-r border-gray-200 bg-white flex-shrink-0">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden mr-3">
                <img 
                  src="https://source.unsplash.com/random/100x100?face" 
                  alt="ユーザーアバター" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="font-bold text-sm line-clamp-1">しゅんや@勤勉的なアプリ運営</h1>
                <p className="text-xs text-gray-500">@rattt774</p>
              </div>
            </div>
            
            <div className="flex items-center mt-3 space-x-4 text-xs">
              <div className="flex items-center">
                <span className="font-bold">3</span>
                <span className="ml-1 text-gray-600">フォロー</span>
              </div>
              <div className="flex items-center">
                <span className="font-bold">2</span>
                <span className="ml-1 text-gray-600">フォロワー</span>
              </div>
            </div>
          </div>
          
          <nav className="p-3 space-y-1">
            <button 
              className={`w-full flex items-center py-2 px-3 rounded-md text-sm ${activeTab === 'ホーム' ? 'bg-gray-100 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
              onClick={() => handleTabChange('ホーム')}
            >
              <Home className="h-4 w-4 mr-3 text-gray-500" />
              ホーム
            </button>
            
            <button 
              className={`w-full flex items-center py-2 px-3 rounded-md text-sm ${activeTab === '記事' ? 'bg-gray-100 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
              onClick={() => handleTabChange('記事')}
            >
              <BookText className="h-4 w-4 mr-3 text-gray-500" />
              記事
            </button>
            
            <button 
              className={`w-full flex items-center py-2 px-3 rounded-md text-sm ${activeTab === 'メンバーシップ' ? 'bg-gray-100 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
              onClick={() => handleTabChange('メンバーシップ')}
            >
              <Users className="h-4 w-4 mr-3 text-gray-500" />
              メンバーシップ
            </button>
            
            <button 
              className={`w-full flex items-center py-2 px-3 rounded-md text-sm ${activeTab === 'マガジン' ? 'bg-gray-100 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
              onClick={() => handleTabChange('マガジン')}
            >
              <BookOpen className="h-4 w-4 mr-3 text-gray-500" />
              マガジン
            </button>
            
            <button 
              className={`w-full flex items-center py-2 px-3 rounded-md text-sm ${activeTab === 'スキ' ? 'bg-gray-100 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
              onClick={() => handleTabChange('スキ')}
            >
              <BookMarked className="h-4 w-4 mr-3 text-gray-500" />
              スキ
            </button>
            
            <button 
              className={`w-full flex items-center py-2 px-3 rounded-md text-sm ${activeTab === '月別' ? 'bg-gray-100 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
              onClick={() => handleTabChange('月別')}
            >
              <Calendar className="h-4 w-4 mr-3 text-gray-500" />
              月別
            </button>
          </nav>
          
          <div className="mt-4 p-3">
            <div className="flex justify-between items-center mb-2">
              <Button variant="outline" size="sm" className="w-full text-sm">
                <Settings className="h-3.5 w-3.5 mr-1.5" />
                設定
              </Button>
            </div>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {/* タブコンテンツのタイトル */}
          <div className="bg-white border-b border-gray-200 py-4 px-6">
            <h1 className="text-xl font-bold">{activeTab}</h1>
          </div>
          
          <div className="p-6">
            {activeTab === '記事' && (
              <>
                {/* 記事一覧ヘッダー */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex space-x-4">
                    <button 
                      className={`px-3 py-1 text-sm rounded-full ${selectedFilter === 'すべて' ? 'bg-gray-900 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                      onClick={() => setSelectedFilter('すべて')}
                    >
                      すべて
                    </button>
                    <button 
                      className={`px-3 py-1 text-sm rounded-full ${selectedFilter === '公開済み' ? 'bg-gray-900 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                      onClick={() => setSelectedFilter('公開済み')}
                    >
                      公開済み
                    </button>
                    <button 
                      className={`px-3 py-1 text-sm rounded-full ${selectedFilter === '下書き' ? 'bg-gray-900 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                      onClick={() => setSelectedFilter('下書き')}
                    >
                      下書き
                    </button>
                    <button 
                      className={`px-3 py-1 text-sm rounded-full ${selectedFilter === '有料' ? 'bg-gray-900 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                      onClick={() => setSelectedFilter('有料')}
                    >
                      有料
                    </button>
                  </div>
                  
                  <Button variant="outline" size="sm" className="rounded-full text-sm h-8">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </div>
                
                {/* 記事リスト */}
                <div className="space-y-4">
                  {getFilteredArticles().length > 0 ? (
                    getFilteredArticles().map((article) => (
                      <div key={article.id} className="bg-white border border-gray-200 rounded-md overflow-hidden hover:bg-gray-50 transition-colors">
                        <div className="flex">
                          <div className="p-4 flex-1">
                            <h3 className="font-bold text-base mb-2">{article.title}</h3>
                            <div className="flex items-center mt-2 text-sm text-gray-500">
                              <span className="mr-4">{article.publishedAt}</span>
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center">
                                  <Heart className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                  <span>{article.likes}</span>
                                </div>
                                <div className="flex items-center">
                                  <MessageSquare className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                  <span>{article.comments}</span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 flex gap-2">
                              <Button variant="outline" size="sm" className="rounded-full text-xs h-7 px-3">
                                編集
                              </Button>
                              <Button variant="outline" size="sm" className="rounded-full text-xs h-7 px-3 border-none">
                                統計
                              </Button>
                              <Button variant="outline" size="sm" className="rounded-full text-xs h-7 px-3 border-none">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="w-32 h-24 flex-shrink-0 bg-gray-100">
                            <img 
                              src={article.imageUrl} 
                              alt={article.title} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-white border border-gray-200 rounded-md">
                      <p className="text-gray-500">該当する記事がありません</p>
                    </div>
                  )}
                </div>
              </>
            )}
            
            {activeTab !== '記事' && (
              <div className="py-12 text-center bg-white border border-gray-200 rounded-md">
                <p className="text-gray-500">現在、{activeTab}タブの内容は実装されていません。</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
  
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      
      <main className="flex-1 pt-16 overflow-hidden">
        {isMobile ? <MobileLayout /> : <DesktopLayout />}
        
        {/* 記事作成ボタン（固定） */}
        <div className="fixed bottom-6 right-6">
          <Button 
            className="h-14 w-14 rounded-full bg-black hover:bg-gray-800 shadow-md flex items-center justify-center"
            onClick={() => navigate('/create-post')}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Button>
        </div>
      </main>
      
      {isMobile && <Footer />}
    </div>
  );
};

export default DashboardPage; 