import React, { useState, useEffect } from 'react';
import { ChevronDown, Eye, MessageSquare, Heart, HelpCircle, Menu, X, Award, DollarSign, CreditCard, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Announcements from '../components/Announcements';

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('analytics');
  const [timePeriod, setTimePeriod] = useState('全期間');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileHelpOpen, setIsMobileHelpOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  
  // 画面サイズを検出
  useEffect(() => {
    // クライアントサイドでのみwindowオブジェクトを使用
    setWindowWidth(window.innerWidth);
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      
      // 画面サイズが大きくなったらモバイルメニューを閉じる
      if (window.innerWidth >= 1024 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]);
  
  // 画面サイズに基づくブレイクポイント
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;
  
  // サンプルのコンテンツデータ
  const articles = [
  {
    id: '1',
      title: 'ビジネスの根幹は営業である（削除済み）',
      views: 95,
    comments: 0,
      likes: 0
  },
  {
    id: '2',
      title: 'アプリを作るだけならプログラミングの知識いりません（削除済み）',
      views: 58,
      comments: 0,
      likes: 1
  },
  {
    id: '3',
      title: '学生起業オススメの分野（削除済み）',
      views: 49,
    comments: 0,
      likes: 0
    }
  ];
  
  // サンプルのバッジデータ
  const badges = [
    { id: 1, name: 'ファーストポスト', description: '初めての投稿を行いました', acquired: true, icon: <Award className="h-8 w-8 text-yellow-500" /> },
    { id: 2, name: '10いいね達成', description: '投稿が合計10いいねを獲得しました', acquired: true, icon: <Heart className="h-8 w-8 text-pink-500" /> },
    { id: 3, name: '100ビュー達成', description: '投稿が合計100ビューを達成しました', acquired: true, icon: <Eye className="h-8 w-8 text-emerald-500" /> },
    { id: 4, name: '1000ビュー達成', description: '投稿が合計1000ビューを達成しました', acquired: false, icon: <Eye className="h-8 w-8 text-gray-300" /> },
    { id: 5, name: 'コメントゲッター', description: '5件以上のコメントを獲得しました', acquired: false, icon: <MessageSquare className="h-8 w-8 text-gray-300" /> }
  ];
  
  // サンプルの売上データ
  const salesSummary = [
    { title: '今月の売上', amount: 0, icon: <DollarSign className="h-6 w-6 text-green-500" /> },
    { title: '累計売上', amount: 0, icon: <DollarSign className="h-6 w-6 text-blue-500" /> },
    { title: '売上可能額', amount: 0, icon: <DollarSign className="h-6 w-6 text-indigo-500" /> }
  ];
  
  // サンプルの振込データ
  const paymentHistory = [
    { id: 1, month: '2025年5月', amount: 0, status: '準備中', scheduledDate: '2025/05/15' }
  ];
  
  // サンプルの販売履歴
  const salesHistory = [
    { id: 1, date: '----/--/--', itemName: 'まだ販売履歴はありません', price: 0, buyer: '-', status: '-' }
  ];
  
  // サイドバーのメニュー項目
  const sidebarItems = [
    { id: 'analytics', name: 'アクセス状況', icon: <Eye className="h-5 w-5 mr-3" /> },
    { id: 'badges', name: 'バッジ', icon: <Award className="h-5 w-5 mr-3" /> },
    { id: 'sales', name: '売上管理', icon: <DollarSign className="h-5 w-5 mr-3" /> },
    { id: 'payments', name: '振込管理', icon: <CreditCard className="h-5 w-5 mr-3" /> },
    { id: 'history', name: '販売履歴', icon: <Clock className="h-5 w-5 mr-3" /> }
  ];
  
  // ヘルプコンテンツ
  const helpContent = [
    { 
      title: 'promptyのはじめかた', 
      items: [
        'もっとも大事なこと',
        '本文を書くときのポイント', 
        'タイトルと見出し画像のコツ'
      ]
    },
    { 
      title: 'promptyをもっと使いこなそう', 
      items: [
        'SNSと連携してシェア',
        '読者へのお礼を設定する',
        'コンテンツをマガジンにまとめる',
        'コンテスト・お題に参加する',
        'クリエイターとしてのキャリアを伸ばすために'
      ]
    }
  ];
  
  // 期間選択のハンドラー
  const handlePeriodChange = (period: string) => {
    setTimePeriod(period);
  };

  // モバイルメニューの開閉
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };
  
  // モバイルヘルプの開閉
  const toggleMobileHelp = () => {
    setIsMobileHelpOpen(!isMobileHelpOpen);
  };
  
  // アクティブなタブを変更する
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    
    // モバイルメニューを閉じる（デスクトップでなければ）
    if (!isDesktop) {
      setIsMobileMenuOpen(false);
    }
    
    // スクロール位置をトップに戻す（モバイルでの体験改善のため）
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // タブコンテンツをレンダリングする関数
  const renderTabContent = () => {
    switch (activeTab) {
      case 'analytics':
        return (
          <div className="analytics-content">
            <div className="bg-white p-4 sm:p-6 shadow-sm">
              <h1 className="text-lg sm:text-xl font-bold">アクセス状況</h1>
            </div>
            
            <div className="bg-white shadow-sm">
              {/* 期間選択タブ */}
              <div className="flex overflow-x-auto scrollbar-hide">
                {['週', '月', '年', '全期間'].map((period) => (
                  <button 
                    key={period}
                    className={`py-2 px-3 sm:px-6 md:px-10 text-xs sm:text-sm whitespace-nowrap ${
                      period === timePeriod 
                        ? period === '全期間' 
                          ? 'bg-gray-900 text-white' 
                          : 'font-medium'
                        : 'text-gray-500'
                    }`}
                    onClick={() => handlePeriodChange(period)}
                  >
                    {period}
                  </button>
                ))}
              </div>
              
              {/* 統計カード */}
              <div className="p-4 sm:p-6 lg:p-8 bg-gray-50">
                <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-6">
                  {/* 全体ビュー */}
                  <div className="bg-white p-3 sm:p-6 rounded-md flex flex-col items-center justify-center shadow-sm">
                    <Eye className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-500 mb-1 sm:mb-3" />
                    <div className="text-xl sm:text-3xl md:text-4xl font-bold text-emerald-500">349</div>
                    <div className="text-[10px] sm:text-sm text-gray-500 mt-1 sm:mt-2">全体ビュー</div>
                  </div>
                  
                  {/* コメント */}
                  <div className="bg-white p-3 sm:p-6 rounded-md flex flex-col items-center justify-center shadow-sm">
                    <MessageSquare className="h-4 w-4 sm:h-6 sm:w-6 text-gray-500 mb-1 sm:mb-3" />
                    <div className="text-xl sm:text-3xl md:text-4xl font-bold text-gray-500">0</div>
                    <div className="text-[10px] sm:text-sm text-gray-500 mt-1 sm:mt-2">コメント</div>
                  </div>
                  
                  {/* スキ */}
                  <div className="bg-white p-3 sm:p-6 rounded-md flex flex-col items-center justify-center relative shadow-sm">
                    <Heart className="h-4 w-4 sm:h-6 sm:w-6 text-pink-500 mb-1 sm:mb-3" />
                    <div className="text-xl sm:text-3xl md:text-4xl font-bold text-pink-500">11</div>
                    <div className="text-[10px] sm:text-sm text-gray-500 mt-1 sm:mt-2">イイね</div>
                    <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
                      <HelpCircle className="h-3 w-3 sm:h-5 sm:w-5 text-gray-300" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 sm:p-4 text-right text-xs text-gray-500">
                最新集計時刻 2025年4月14日 14:54
              </div>
              
              {/* 記事一覧 - テーブル形式（デスクトップ） */}
              <div className="hidden sm:block px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="flex bg-gray-50 py-3">
                  <div className="px-3 text-sm text-gray-500 font-medium flex-1 text-left">コンテンツ</div>
                  <div className="px-3 text-sm text-gray-500 font-medium flex items-center justify-end w-24">
                    <span className="flex items-center">
                      ビュー 
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </span>
                  </div>
                  <div className="px-3 text-sm text-gray-500 font-medium w-24 text-center">コメント</div>
                  <div className="px-3 text-sm text-gray-500 font-medium w-24 text-center">イイね</div>
                </div>
                
                {articles.map((article, index) => (
                  <div key={article.id} className={`flex py-4 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}>
                    <div className="px-3 text-sm flex-1">{article.title}</div>
                    <div className="px-3 text-sm text-emerald-500 w-24 text-right">{article.views}</div>
                    <div className="px-3 text-sm w-24 text-center">{article.comments}</div>
                    <div className="px-3 text-sm text-pink-500 w-24 text-center">{article.likes}</div>
                  </div>
                ))}
              </div>
              
              {/* 記事一覧 - モバイル用カード表示 */}
              <div className="sm:hidden px-4 pb-4 space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-200">
                  <h3 className="text-sm font-medium">コンテンツ</h3>
                  <div className="flex items-center text-xs text-gray-500">
                    <span>並び替え:</span>
                    <button className="flex items-center ml-1 text-gray-700">
                      ビュー
                      <ChevronDown className="h-3 w-3 ml-0.5" />
                    </button>
                  </div>
                </div>
                
                {articles.map((article) => (
                  <div key={article.id} className="bg-white rounded-md shadow-sm p-3 border border-gray-100">
                    <h3 className="text-sm font-medium mb-2">{article.title}</h3>
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex space-x-3">
                        <div className="flex items-center text-emerald-500">
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          <span>{article.views}</span>
                        </div>
                        <div className="flex items-center text-gray-500">
                          <MessageSquare className="h-3.5 w-3.5 mr-1" />
                          <span>{article.comments}</span>
                        </div>
                        <div className="flex items-center text-pink-500">
                          <Heart className="h-3.5 w-3.5 mr-1" />
                          <span>{article.likes}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-500">削除済み</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 'badges':
        return (
          <div className="badges-content">
            <div className="bg-white p-4 sm:p-6 shadow-sm">
              <h1 className="text-lg sm:text-xl font-bold">バッジ</h1>
            </div>
            <div className="p-4 sm:p-6 lg:p-8 bg-white shadow-sm">
              <p className="text-sm text-gray-500 mb-6">バッジは、promptyでのあなたの活動に応じて獲得できる称号です。</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {badges.map((badge) => (
                  <div 
                    key={badge.id} 
                    className={`p-3 sm:p-4 rounded-md shadow-sm ${badge.acquired ? 'bg-white' : 'bg-gray-50 opacity-60'}`}
                  >
                    <div className="flex items-center mb-3">
                      <div className="mr-3 flex-shrink-0">
                        {React.cloneElement(badge.icon, {
                          className: `h-6 w-6 sm:h-8 sm:w-8 ${badge.acquired ? badge.icon.props.className : 'text-gray-300'}`
                        })}
                      </div>
                      <div>
                        <h3 className={`font-bold text-sm ${badge.acquired ? 'text-gray-900' : 'text-gray-400'}`}>
                          {badge.name}
                        </h3>
                        <p className="text-xs text-gray-500">{badge.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        badge.acquired 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {badge.acquired ? '獲得済み' : '未獲得'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 'sales':
        return (
          <div className="sales-content">
            <div className="bg-white p-4 sm:p-6 shadow-sm">
              <h1 className="text-lg sm:text-xl font-bold">売上管理</h1>
            </div>
            <div className="p-4 sm:p-6 lg:p-8 bg-white shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {salesSummary.map((item, index) => (
                  <div key={index} className="bg-white rounded-md p-3 sm:p-4 flex items-center shadow-sm border border-gray-100">
                    <div className="bg-gray-100 p-2 sm:p-3 rounded-full mr-3 sm:mr-4 flex-shrink-0">
                      {React.cloneElement(item.icon, {
                        className: `h-5 w-5 sm:h-6 sm:w-6 ${item.icon.props.className}`
                      })}
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500">{item.title}</p>
                      <p className="text-lg sm:text-xl font-bold">¥{item.amount.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="bg-gray-50 p-3 sm:p-4 rounded-md shadow-sm mb-6 flex items-center">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mr-2 sm:mr-3 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-gray-600">
                  売上が発生すると、ここに表示されます。有料コンテンツや購読プランを作成して、収益化を始めましょう。
                </p>
              </div>
              
              <div className="text-right">
                <button className="bg-black text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm">
                  有料コンテンツを作成する
                </button>
              </div>
            </div>
          </div>
        );
        
      case 'payments':
        return (
          <div className="payments-content">
            <div className="bg-white p-4 sm:p-6 shadow-sm">
              <h1 className="text-lg sm:text-xl font-bold">振込管理</h1>
            </div>
            <div className="p-4 sm:p-6 lg:p-8 bg-white shadow-sm">
              <div className="mb-6 sm:mb-8">
                <h2 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">振込予定</h2>
                
                {/* デスクトップ表示 */}
                <div className="hidden sm:block rounded-md overflow-hidden shadow-sm">
                  <div className="bg-gray-50 p-3 grid grid-cols-12">
                    <div className="col-span-3 text-sm font-medium text-left text-gray-500">対象月</div>
                    <div className="col-span-3 text-sm font-medium text-right text-gray-500">金額</div>
                    <div className="col-span-3 text-sm font-medium text-center text-gray-500">ステータス</div>
                    <div className="col-span-3 text-sm font-medium text-right text-gray-500">振込予定日</div>
                  </div>
                  
                  {paymentHistory.map((payment, index) => (
                    <div key={payment.id} className={`p-3 grid grid-cols-12 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <div className="col-span-3 text-sm">{payment.month}</div>
                      <div className="col-span-3 text-sm text-right">¥{payment.amount.toLocaleString()}</div>
                      <div className="col-span-3 text-sm text-center">
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {payment.status}
                        </span>
                      </div>
                      <div className="col-span-3 text-sm text-right">{payment.scheduledDate}</div>
                    </div>
                  ))}
                </div>
                
                {/* モバイル表示 */}
                <div className="sm:hidden space-y-3">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className="bg-white rounded-md shadow-sm p-3 border border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">{payment.month}</span>
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {payment.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 text-xs">振込予定日: {payment.scheduledDate}</span>
                        <span className="font-bold">¥{payment.amount.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 sm:p-4 rounded-md shadow-sm flex items-start">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-2">
                    振込先口座が登録されていません。売上が発生した場合に振込を受け取るには、振込先口座の登録が必要です。
                  </p>
                  <Link href="/settings?tab=payment">
                    <span className="text-blue-500 text-xs sm:text-sm font-medium hover:underline inline-flex items-center cursor-pointer">
                      振込先口座を登録する
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'history':
        return (
          <div className="history-content">
            <div className="bg-white p-4 sm:p-6 shadow-sm">
              <h1 className="text-lg sm:text-xl font-bold">販売履歴</h1>
            </div>
            <div className="p-4 sm:p-6 lg:p-8 bg-white shadow-sm">
              {/* デスクトップ表示 */}
              <div className="hidden sm:block rounded-md overflow-hidden mb-6 shadow-sm">
                <div className="bg-gray-50 p-3 grid grid-cols-12">
                  <div className="col-span-2 text-sm font-medium text-left text-gray-500">日付</div>
                  <div className="col-span-5 text-sm font-medium text-left text-gray-500">商品名</div>
                  <div className="col-span-2 text-sm font-medium text-right text-gray-500">価格</div>
                  <div className="col-span-2 text-sm font-medium text-left text-gray-500">購入者</div>
                  <div className="col-span-1 text-sm font-medium text-center text-gray-500">状態</div>
                </div>
                
                {salesHistory.map((sale, index) => (
                  <div key={sale.id} className={`p-3 grid grid-cols-12 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <div className="col-span-2 text-sm text-gray-500">{sale.date}</div>
                    <div className="col-span-5 text-sm text-gray-500">{sale.itemName}</div>
                    <div className="col-span-2 text-sm text-gray-500 text-right">¥{sale.price.toLocaleString()}</div>
                    <div className="col-span-2 text-sm text-gray-500">{sale.buyer}</div>
                    <div className="col-span-1 text-sm text-gray-500 text-center">{sale.status}</div>
                  </div>
                ))}
              </div>
              
              {/* モバイル表示 - 空の状態 */}
              <div className="flex justify-center items-center py-6 sm:py-8">
                <div className="text-center">
                  <Clock className="h-8 w-8 sm:h-10 sm:w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-2">販売履歴はまだありません</p>
                  <p className="text-xs text-gray-400">有料コンテンツを公開すると、ここに販売履歴が表示されます</p>
        </div>
        </div>
      </div>
    </div>
  );
  
      default:
        return (
          <div className="bg-white p-4 sm:p-6 shadow-sm">
            <p className="text-center text-sm text-gray-500">選択したタブのコンテンツを表示します</p>
          </div>
        );
    }
  };
  
  // モバイル用のヘルプセクションをレンダリング
  const renderMobileHelp = () => (
    <div className="bg-white rounded-md shadow-sm mb-4 overflow-hidden">
      <button 
        className="w-full px-4 py-3 flex items-center justify-between"
        onClick={toggleMobileHelp}
      >
        <h3 className="text-base font-bold">もっと読まれるには</h3>
        <ChevronRight className={`h-5 w-5 text-gray-400 transform transition-transform duration-200 ${isMobileHelpOpen ? 'rotate-90' : ''}`} />
      </button>
      
      {isMobileHelpOpen && (
        <div className="px-4 pb-4">
          <div className="py-3 px-4 bg-gray-100 rounded-md mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm mr-1">promptyで作品や体験を</span>
              <span className="text-sm font-bold">収益化してみよう</span>
            </div>
            <div className="bg-black text-white rounded-full p-1.5">
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
          
          {helpContent.map((section, index) => (
            <div key={index} className="mb-4">
              <h4 className="text-sm font-medium mb-2 text-gray-700">{section.title}</h4>
              <ul className="space-y-2">
                {section.items.map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-sm mr-2">•</span>
                    <span className="text-sm text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          
          <button className="w-full bg-gray-50 text-sm py-2 rounded-md hover:bg-gray-100 mt-2">
            すべて表示
          </button>
        </div>
      )}
    </div>
  );
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <Header />
      
      <main className="flex-1 pt-16 pb-16">
        <div className="containermx-auto px-4 sm:px-6 lg:px-8">
  {/* モバイルメニューボタン */}
  {!isDesktop && (
    <button
      className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-full z-50 shadow-lg"
      onClick={toggleMobileMenu}
      aria-label={isMobileMenuOpen ? "メニューを閉じる" : "メニューを開く"}
    >
      {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
    </button>
  )}

  {/* ページタイトル - モバイル表示 */}
  {!isDesktop && (
    <div className="py-4 flex items-center justify-between">
      <h1 className="text-xl font-bold">ダッシュボード</h1>
      <div className="flex space-x-3">
        {sidebarItems.slice(0, 3).map((item) => (
          <button
            key={item.id}
            onClick={() => handleTabChange(item.id)}
            className={`flex items-center justify-center p-3 rounded-md transition-colors ${
              activeTab === item.id 
                ? 'bg-gray-900 text-white shadow-md' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            aria-label={item.name}
            aria-pressed={activeTab === item.id}
          >
            {React.cloneElement(item.icon, { 
              className: `h-5 w-5 ${activeTab === item.id ? 'text-white' : 'text-gray-700'}` 
            })}
            <span className="sr-only">{item.name}</span>
          </button>
        ))}
      </div>
    </div>
  )}

  <div className="flex flex-col lg:flex-row mt-2 lg:mt-6 gap-4 lg:gap-6">
    {/* サイドバー - デスクトップでは常に表示 */}
    {isDesktop && (
      <aside className="w-64 bg-white rounded-lg shadow-sm self-start sticky top-24">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-6">ダッシュボード</h2>
          <nav>
            <ul className="space-y-2">
              {sidebarItems.map((item) => (
                <li key={item.id}>
                  <button 
                    onClick={() => handleTabChange(item.id)}
                    className={`flex items-center w-full py-2 px-3 text-sm rounded-md transition-colors ${
                      activeTab === item.id 
                        ? 'font-medium text-black bg-gray-100' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>
    )}

    {/* モバイルサイドバー - オーバーレイ */}
    {!isDesktop && (
      <aside 
        className={`fixed inset-0 z-40 bg-white transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out w-[85%] max-w-[300px] shadow-lg`}
        style={{ top: '64px', height: 'calc(100% - 64px)' }}
      >
        <div className="p-6">
          <h2 className="text-lg font-bold mb-6">ダッシュボード</h2>
          <nav>
            <ul className="space-y-3">
              {sidebarItems.map((item) => (
                <li key={item.id}>
                  <button 
                    onClick={() => handleTabChange(item.id)}
                    className={`flex items-center w-full py-3 px-4 text-sm rounded-md transition-colors ${
                      activeTab === item.id 
                        ? 'font-medium text-white bg-gray-900' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {React.cloneElement(item.icon, { className: "h-5 w-5 mr-3" })}
                    <span>{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>
    )}

    {/* オーバーレイの背景 - モバイルメニュー表示時 */}
    {!isDesktop && isMobileMenuOpen && (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-30"
        onClick={() => setIsMobileMenuOpen(false)}
      />
    )}

    {/* メインコンテンツエリア */}
    <div className="flex-1">
      <div className="rounded-lg overflow-hidden">
              {renderTabContent()}
      </div>

      {/* モバイル用ヘルプセクション */}
      {!isDesktop && renderMobileHelp()}
    </div>

    {/* 右サイドバー（デスクトップのみ） */}
    {isDesktop && (
      <aside className="w-80 bg-white p-6 rounded-lg shadow-sm self-start sticky top-24">
        <div className="mb-6">
          <Announcements />
          
          <Link href="/monetization">
            <div className="flex items-center justify-center bg-gray-100 rounded-md py-4 px-4 mb-6 cursor-pointer hover:bg-gray-200">
              <div className="flex items-center">
                <span className="text-sm mr-2">promptyで作品や体験を</span>
                <span className="text-base font-bold">収益化してみよう</span>
                <div className="bg-black text-white rounded-full p-1.5 ml-2">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </div>
          </Link>
          
          <h3 className="text-lg font-bold mb-4">もっと読まれるには</h3>
          
          {helpContent.map((section, index) => (
            <div key={index} className="mb-4">
              <h4 className="text-sm font-medium mb-2">{section.title}</h4>
              <ul className="space-y-2">
                {section.items.map((item, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-sm mr-2">•</span>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          
          <Link href="/help">
            <button className="w-full bg-gray-50 text-sm py-2 rounded-md hover:bg-gray-100 mt-2">
              すべて表示
            </button>
          </Link>
        </div>
      </aside>
    )}
  </div>
</div>
      </main>
      
{/* フッター */}
<Footer />
    </div>
  );
}
export default DashboardPage; 