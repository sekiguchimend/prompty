import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, Eye, MessageSquare, Heart, HelpCircle, Menu, X, Award, DollarSign, CreditCard, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import Footer from '../components/footer';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import Announcements from '../components/announcements';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/auth-context';
import { useToast } from '../components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

// 記事データの型定義
interface ArticleData {
  id: string;
  title: string;
  views: number;
  comments: number;
  likes: number;
  status?: string;
}

// バッジデータの型定義
interface BadgeData {
  id: string;
  name: string;
  description: string;
  acquired: boolean;
  icon: React.ReactNode;
}

// 売上サマリーの型定義
interface SalesSummary {
  title: string;
  amount: number;
  icon: React.ReactNode;
}

// 振込履歴の型定義
interface PaymentHistory {
  id: number;
  month: string;
  amount: number;
  status: string;
  scheduledDate: string;
}

// 販売履歴の型定義
interface SalesHistory {
  id: number;
  date: string;
  itemName: string;
  price: number;
  buyer: string;
  status: string;
}

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('analytics');
  const [timePeriod, setTimePeriod] = useState('全期間');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileHelpOpen, setIsMobileHelpOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // データ状態
  const [isLoading, setIsLoading] = useState(true);
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // 売上・振込関連の状態
  const [salesData, setSalesData] = useState<SalesSummary[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [salesHistory, setSalesHistory] = useState<SalesHistory[]>([]);
  
  // 画面サイズを検出
  useEffect(() => {
    // クライアントサイドでのみwindowオブジェクトを使用
    if (typeof window !== 'undefined') {
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
    }
  }, [isMobileMenuOpen]);
  
  // データを取得する
  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchBadgesData();
      fetchSalesData();
      fetchPaymentData();
      fetchSalesHistoryData();
    }
  }, [user, timePeriod]);
  
  // ダッシュボードデータを取得する
  const fetchDashboardData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // 投稿データを取得
      const { data: promptsData, error: promptsError } = await supabase
        .from('prompts')
        .select(`
          id,
          title,
          view_count,
          created_at,
          likes:likes(count),
          comments:comments(count)
        `)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });
      
      if (promptsError) throw promptsError;
      
      // データを変換
      const formattedArticles: ArticleData[] = promptsData.map(prompt => ({
        id: prompt.id as string,
        title: prompt.title as string,
        views: prompt.view_count as number || 0,
        comments: Array.isArray(prompt.comments) && prompt.comments.length > 0 
          ? (prompt.comments[0].count as number) || 0 
          : 0,
        likes: Array.isArray(prompt.likes) && prompt.likes.length > 0 
          ? (prompt.likes[0].count as number) || 0 
          : 0,
        status: '' // ステータスは必要に応じて設定
      }));
      
      // 合計値を計算
      const views = formattedArticles.reduce((sum, article) => sum + article.views, 0);
      const comments = formattedArticles.reduce((sum, article) => sum + article.comments, 0);
      const likes = formattedArticles.reduce((sum, article) => sum + article.likes, 0);
      
      // 状態を更新
      setArticles(formattedArticles);
      setTotalViews(views);
      setTotalComments(comments);
      setTotalLikes(likes);
      setLastUpdated(new Date());
      
    } catch (error) {
      toast({
        title: "データ取得エラー",
        description: "ダッシュボード情報の取得に失敗しました。",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // バッジアイコンを取得するヘルパー関数（URL対応）
  const getBadgeIcon = (iconUrl: string, acquired: boolean) => {
    // URLの場合は画像を表示
    if (iconUrl && iconUrl.startsWith('http')) {
      return (
        <div className={`h-12 w-12 sm:h-14 sm:w-14 relative ${acquired ? 'opacity-100' : 'opacity-30 grayscale'}`}>
          <Image 
            src={iconUrl} 
            alt="バッジアイコン" 
            width={56}
            height={56}
            className="object-contain rounded-lg"
            quality={95}
            priority={false}
            unoptimized={true}
            onError={(e) => {
              // 画像の読み込みに失敗した場合のフォールバック
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      );
    }
    
    // 文字列の場合は従来のアイコンを表示（フォールバック）
    const iconClass = acquired ? 'text-yellow-500' : 'text-gray-300';
    return <Award className={`h-12 w-12 sm:h-14 sm:w-14 ${iconClass}`} />;
  };

  // バッジデータを取得する
  const fetchBadgesData = async () => {
    if (!user) return;
    
    try {
      // 全バッジを取得
      const { data: allBadges, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .order('name');
      
      if (badgesError) throw badgesError;

      // ユーザーが獲得したバッジを取得
      const { data: userBadges, error: userBadgesError } = await supabase
        .from('user_badges')
        .select('badge_id')
        .eq('user_id', user.id);
      
      if (userBadgesError) throw userBadgesError;

      // 獲得済みバッジIDのセットを作成
      const acquiredBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || []);

      // バッジデータを整形
      const formattedBadges: BadgeData[] = (allBadges || []).map(badge => ({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        acquired: acquiredBadgeIds.has(badge.id),
        icon: getBadgeIcon(badge.icon, acquiredBadgeIds.has(badge.id))
      }));

      setBadges(formattedBadges);
      
    } catch (error) {
      console.error('バッジデータ取得エラー:', error);
      toast({
        title: "バッジデータ取得エラー",
        description: "バッジ情報の取得に失敗しました。",
        variant: "destructive"
      });
    }
  };

  // 売上データを取得する
  const fetchSalesData = async () => {
    if (!user) return;
    
    try {
      // 購入データから売上を計算（promptのauthor_idを通じて取得）
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select(`
          amount, 
          created_at,
          prompt:prompts!inner(author_id)
        `)
        .eq('prompt.author_id', user.id);
      
      if (purchasesError) throw purchasesError;

      // 今月の売上計算
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const monthlyAmount = (purchases || [])
        .filter(purchase => {
          const purchaseDate = new Date(purchase.created_at);
          return purchaseDate.getMonth() === currentMonth && 
                 purchaseDate.getFullYear() === currentYear;
        })
        .reduce((sum, purchase) => sum + (purchase.amount || 0), 0);

      // 累計売上計算
      const totalAmount = (purchases || [])
        .reduce((sum, purchase) => sum + (purchase.amount || 0), 0);

      // 売上サマリーデータを設定
      const salesSummary: SalesSummary[] = [
        { 
          title: '今月の売上', 
          amount: monthlyAmount,
          icon: <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
        },
        { 
          title: '累計売上', 
          amount: totalAmount,
          icon: <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
        },
        { 
          title: '売上可能額', 
          amount: totalAmount, // TODO: 実際の振込可能額計算
          icon: <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-500" />
        }
      ];

      setSalesData(salesSummary);
      
    } catch (error) {
      console.error('売上データ取得エラー:', error);
      setSalesData([
        { title: '今月の売上', amount: 0, icon: <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" /> },
        { title: '累計売上', amount: 0, icon: <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" /> },
        { title: '売上可能額', amount: 0, icon: <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-500" /> }
      ]);
    }
  };

  // 振込データを取得する
  const fetchPaymentData = async () => {
    if (!user) return;
    
    try {
      const { data: payouts, error: payoutsError } = await supabase
        .from('payouts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (payoutsError) throw payoutsError;

      // データが空の場合のデフォルト表示
      if (!payouts || payouts.length === 0) {
        setPaymentHistory([
          { id: 1, month: '2025年5月', amount: 0, status: '準備中', scheduledDate: '2025/05/15' }
        ]);
        return;
      }

      // 振込データを整形
      const formattedPayments: PaymentHistory[] = payouts.map((payout, index) => ({
        id: index + 1,
        month: new Date(payout.created_at).toLocaleDateString('ja-JP', { 
          year: 'numeric', 
          month: 'long' 
        }),
        amount: payout.amount || 0,
        status: payout.status === 'completed' ? '完了' : 
                payout.status === 'pending' ? '処理中' : '準備中',
        scheduledDate: payout.completed_at 
          ? new Date(payout.completed_at).toLocaleDateString('ja-JP')
          : new Date(payout.created_at).toLocaleDateString('ja-JP')
      }));

      setPaymentHistory(formattedPayments);
      
    } catch (error) {
      console.error('振込データ取得エラー:', error);
      setPaymentHistory([
        { id: 1, month: '2025年5月', amount: 0, status: '準備中', scheduledDate: '2025/05/15' }
      ]);
    }
  };

  // 販売履歴を取得する
  const fetchSalesHistoryData = async () => {
    if (!user) return;
    
    try {
      const { data: purchases, error: purchasesError } = await supabase
        .from('purchases')
        .select(`
          id,
          amount,
          created_at,
          status,
          prompt:prompts!inner(title, author_id),
          buyer:profiles!purchases_buyer_id_fkey(username, display_name)
        `)
        .eq('prompt.author_id', user.id)
        .order('created_at', { ascending: false });
      
      if (purchasesError) throw purchasesError;

      // データが空の場合のデフォルト表示
      if (!purchases || purchases.length === 0) {
        setSalesHistory([
          { id: 1, date: '----/--/--', itemName: 'まだ販売履歴はありません', price: 0, buyer: '-', status: '-' }
        ]);
        return;
      }

      // 販売履歴を整形
      const formattedHistory: SalesHistory[] = purchases.map(purchase => ({
        id: purchase.id,
        date: new Date(purchase.created_at).toLocaleDateString('ja-JP'),
        itemName: Array.isArray(purchase.prompt) && purchase.prompt.length > 0 
          ? purchase.prompt[0].title 
          : (purchase.prompt as any)?.title || '不明なコンテンツ',
        price: purchase.amount || 0,
        buyer: Array.isArray(purchase.buyer) && purchase.buyer.length > 0
          ? (purchase.buyer[0].display_name || purchase.buyer[0].username)
          : (purchase.buyer as any)?.display_name || (purchase.buyer as any)?.username || '匿名ユーザー',
        status: purchase.status === 'completed' ? '完了' : 
                purchase.status === 'pending' ? '処理中' : '未確定'
      }));

      setSalesHistory(formattedHistory);
      
    } catch (error) {
      console.error('販売履歴取得エラー:', error);
      setSalesHistory([
        { id: 1, date: '----/--/--', itemName: 'まだ販売履歴はありません', price: 0, buyer: '-', status: '-' }
      ]);
    }
  };
  
  // 画面サイズに基づくブレイクポイント
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;
  
  // 動的バッジデータ
  const [badges, setBadges] = useState<BadgeData[]>([]);
  
  // 削除: ハードコードされたダミーデータは状態管理に移行
  
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
  
  // 日付をフォーマットする
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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
              
              {isLoading ? (
                <div className="p-8 flex justify-center">
                  <div className="animate-pulse text-center">
                    <p className="text-gray-500">データを読み込み中...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* 統計カード */}
                  <div className="p-4 sm:p-6 lg:p-8 bg-gray-50">
                    <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-6">
                      {/* 全体ビュー */}
                      <div className="bg-white p-3 sm:p-6 rounded-md flex flex-col items-center justify-center shadow-sm">
                        <Eye className="h-4 w-4 sm:h-6 sm:w-6 text-emerald-500 mb-1 sm:mb-3" />
                        <div className="text-xl sm:text-3xl md:text-4xl font-bold text-emerald-500">{totalViews}</div>
                        <div className="text-[10px] sm:text-sm text-gray-500 mt-1 sm:mt-2">全体ビュー</div>
                      </div>
                      
                      {/* コメント */}
                      <div className="bg-white p-3 sm:p-6 rounded-md flex flex-col items-center justify-center shadow-sm">
                        <MessageSquare className="h-4 w-4 sm:h-6 sm:w-6 text-gray-500 mb-1 sm:mb-3" />
                        <div className="text-xl sm:text-3xl md:text-4xl font-bold text-gray-500">{totalComments}</div>
                        <div className="text-[10px] sm:text-sm text-gray-500 mt-1 sm:mt-2">コメント</div>
                      </div>
                      
                      {/* スキ */}
                      <div className="bg-white p-3 sm:p-6 rounded-md flex flex-col items-center justify-center relative shadow-sm">
                        <Heart className="h-4 w-4 sm:h-6 sm:w-6 text-pink-500 mb-1 sm:mb-3" />
                        <div className="text-xl sm:text-3xl md:text-4xl font-bold text-pink-500">{totalLikes}</div>
                        <div className="text-[10px] sm:text-sm text-gray-500 mt-1 sm:mt-2">イイね</div>
                        <div className="absolute top-1 right-1 sm:top-2 sm:right-2">
                          <HelpCircle className="h-3 w-3 sm:h-5 sm:w-5 text-gray-300" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4 text-right text-xs text-gray-500">
                    最新集計時刻 {formatDate(lastUpdated)}
                  </div>
                  
                  {articles.length > 0 ? (
                    <>
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
                                {article.status && (
                                  <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-500">
                                    {article.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-center items-center py-12">
                      <div className="text-center">
                        <Eye className="h-10 w-10 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2">まだ投稿がありません</p>
                        <button 
                          onClick={() => router.push('/create-post')}
                          className="mt-4 px-4 py-2 bg-black text-white rounded-md text-sm">
                          新しい投稿を作成する
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
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
                    className={`p-3 sm:p-4 rounded-lg border ${badge.acquired ? 'border-gray-200 bg-transparent' : 'border-gray-100 bg-transparent opacity-60'}`}
                  >
                    <div className="flex items-center mb-3">
                      <div className="mr-3 flex-shrink-0">
                        {badge.icon}
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
                {salesData.map((item, index) => (
                  <div key={index} className="bg-white rounded-md p-3 sm:p-4 flex items-center shadow-sm border border-gray-100">
                    <div className="bg-gray-100 p-2 sm:p-3 rounded-full mr-3 sm:mr-4 flex-shrink-0">
                      {item.icon}
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
                  <Link href="/">
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
              
              {/* モバイル表示 */}
              <div className="sm:hidden space-y-3 mb-6">
                {salesHistory.length > 0 && salesHistory[0].itemName !== 'まだ販売履歴はありません' ? (
                  salesHistory.map((sale) => (
                    <div key={sale.id} className="bg-white rounded-md shadow-sm p-3 border border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">{sale.itemName}</span>
                        <span className="text-sm font-bold">¥{sale.price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{sale.date}</span>
                        <span>購入者: {sale.buyer}</span>
                      </div>
                      <div className="mt-2">
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          {sale.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-center items-center py-6 sm:py-8">
                    <div className="text-center">
                      <Clock className="h-8 w-8 sm:h-10 sm:w-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500 mb-2">販売履歴はまだありません</p>
                      <p className="text-xs text-gray-400">有料コンテンツを公開すると、ここに販売履歴が表示されます</p>
                    </div>
                  </div>
                )}
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
      
      <main className="flex-1 pb-16">
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