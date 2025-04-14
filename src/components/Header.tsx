import React, { useState, useEffect, useRef } from 'react';
import { Search, PenSquare, Bell, ChevronRight, Heart, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useToast } from './ui/use-toast';
import NotificationDropdown from './NotificationDropdown';
import UserMenu from './UserMenu';
import { PostItem, getFollowingPosts, getTodayForYouPosts } from '../data/posts';

// カテゴリタブ
const categoryTabs = [
  { id: 'all', name: 'すべて', path: '/' },
  { id: 'following', name: 'フォロー中', path: '/following' },
  // { id: 'featured', name: '注目', path: '/featured' },
  { id: 'posts', name: '投稿企画', path: '/contests' },
];

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  // This would normally come from an auth context
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false); // モバイル検索表示状態
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [userMenuOpen, setUserMenuOpen] = useState(false); // ユーザーメニュー表示状態
  const tabButtonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  
  // データを取得
  const followingPosts = getFollowingPosts();
  const todayForYouPosts = getTodayForYouPosts();

  // 画面サイズを検出
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

  // URLパスに基づいてアクティブタブを更新
  useEffect(() => {
    const currentPath = location.pathname;
    
    // 現在のパスに一致するタブを検索
    const matchingTab = categoryTabs.find(tab => {
      if (tab.path === '/') {
        return currentPath === '/';
      }
      return currentPath.startsWith(tab.path);
    });
    
    if (matchingTab) {
      setActiveTab(matchingTab.id);
    }
  }, [location.pathname]);

  // モバイル向けタッチフィードバックを向上
  useEffect(() => {
    if (!isMobile) return;
    
    tabButtonsRef.current.forEach((button, index) => {
      if (!button) return;
      
      // タッチ開始時のエフェクト
      const handleTouchStart = () => {
        button.style.transform = 'scale(0.95)';
        button.style.opacity = '0.9';
      };
      
      // タッチ終了時のエフェクト
      const handleTouchEnd = () => {
        button.style.transform = 'scale(1)';
        button.style.opacity = '1';
      };
      
      button.addEventListener('touchstart', handleTouchStart, { passive: true });
      button.addEventListener('touchend', handleTouchEnd, { passive: true });
      button.addEventListener('touchcancel', handleTouchEnd, { passive: true });
      
      return () => {
        button.removeEventListener('touchstart', handleTouchStart);
        button.removeEventListener('touchend', handleTouchEnd);
        button.removeEventListener('touchcancel', handleTouchEnd);
      };
    });
  }, [isMobile, activeTab]);

  // Toggle login state (for demo purposes)
  const toggleLogin = () => {
    setIsLoggedIn(!isLoggedIn);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setMobileSearchOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    } else {
      toast({
        title: "検索キーワードを入力してください",
        description: "キーワードを入力して検索してください",
        variant: "destructive",
      });
    }
  };

  // モバイル検索を開く
  const openMobileSearch = () => {
    setMobileSearchOpen(true);
  };

  // モバイル検索を閉じる
  const closeMobileSearch = () => {
    setMobileSearchOpen(false);
    setSearchQuery('');
  };

  // タブを変更する
  const changeTab = (tabId: string) => {
    setActiveTab(tabId);
    
    // タブIDに対応するパスを取得
    const selectedTab = categoryTabs.find(tab => tab.id === tabId);
    if (!selectedTab) return;
    
    // 対応するパスに遷移
    navigate(selectedTab.path);
    
    // モバイル向けに、DOM操作で即座に選択状態を反映（React状態の更新を待たずに）
    if (isMobile) {
      tabButtonsRef.current.forEach((btn, idx) => {
        if (!btn) return;
        if (categoryTabs[idx].id === tabId) {
          btn.classList.remove('bg-white', 'text-gray-800', 'border', 'border-gray-800');
          btn.classList.add('bg-gray-800', 'text-white', 'shadow-sm');
        } else {
          btn.classList.remove('bg-gray-800', 'text-white', 'shadow-sm');
          btn.classList.add('bg-white', 'text-gray-800', 'border', 'border-gray-800');
        }
      });
    }
  };

  // Open search on keyboard shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isMobile) {
          setMobileSearchOpen(true);
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isMobile]);

  // ユーザーメニューを開く/閉じる
  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        {/* サイト名とナビゲーション */}
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* サイト名 */}
            <div className={`flex items-center ${mobileSearchOpen ? 'hidden' : ''}`}>
              <Link to="/" className="flex items-center">
                <img src="/prompty_logo.jpg" alt="Prompty" className="h-8" />
              </Link>
            </div>
            
            {/* モバイル検索バーが開いているときは通常のヘッダーコンテンツを隠す */}
            {mobileSearchOpen ? (
              <div className="flex w-full items-center">
                <form onSubmit={handleSearchSubmit} className="flex-1">
                  <div className="relative flex items-center">
                    <Search className="absolute left-3 h-5 w-5 text-gray-500" />
                    <Input
                      type="text"
                      placeholder="キーワードやクリエイターで検索"
                      className="w-full bg-gray-100 pl-10 rounded-md border-none h-10"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      autoFocus
                    />
                    {/* X (閉じる) ボタンを削除 */}
                  </div>
                </form>
              </div>
            ) : (
              <>
                {/* PC画面での検索バー - 中央配置 */}
                <div className="hidden md:flex md:flex-1 md:justify-center md:px-4 mx-4">
                  <div className="relative w-full max-w-md">
                    <form onSubmit={handleSearchSubmit} className="w-full">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        type="text"
                        placeholder="キーワードやクリエイターで検索"
                        className="w-full bg-gray-100 pl-9 rounded-md border-none"
                        value={searchQuery}
                        onChange={handleSearchChange}
                      />
                      <button 
                        type="submit" 
                        className="absolute right-2.5 top-2.5 hidden h-5 select-none items-center gap-1 rounded bg-transparent hover:bg-gray-200 px-1.5 text-xs text-gray-500 md:flex"
                      >
                        検索
                      </button>
                    </form>
                  </div>
                </div>
              
                {/* 右側のアイコングループ */}
                <div className="flex items-center gap-4">
                  {isLoggedIn ? (
                    <>
                      {/* PCでのみ表示する投稿ボタン */}
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="bg-black text-white hover:bg-gray-800 hidden md:flex shadow-sm"
                        onClick={() => navigate('/create-post')}
                      >
                        <PenSquare className="mr-2 h-4 w-4" />
                        投稿
                      </Button>
                      
                      {/* スマホ画面のアイコン群 - 右寄せ */}
                      <div className="flex items-center gap-3 md:hidden">
                        {/* 検索アイコン */}
                        <button 
                          className="text-gray-700 p-1.5 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                          onClick={openMobileSearch}
                          aria-label="検索"
                        >
                          <Search className="h-5 w-5" />
                        </button>
                        
                        {/* 通知ドロップダウン */}
                        <div className="p-1.5 flex items-center justify-center">
                          <NotificationDropdown />
                        </div>
                        
                        {/* 投稿アイコン */}
                        <button
                          className="bg-black text-white p-2 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-800 transition-colors"
                          onClick={() => navigate('/create-post')}
                          aria-label="投稿する"
                        >
                          <PenSquare className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {/* PC画面での通知ドロップダウン */}
                      <div className="hidden md:block">
                        <NotificationDropdown />
                      </div>
                      
                      {/* アバター */}
                      <div className="flex items-center">
                        <Button 
                          variant="ghost" 
                          className="p-0.5 ml-0 rounded-full hover:bg-gray-100 transition-colors"
                          onClick={toggleUserMenu} // ユーザーメニューを表示
                        >
                          <Avatar className="h-7 w-7 border border-gray-200">
                            <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                            <AvatarFallback className="bg-gray-100 text-gray-700 text-xs">U</AvatarFallback>
                          </Avatar>
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* 未ログイン時のモバイルアイコン */}
                      <div className="flex items-center gap-3 md:hidden">
                        {/* 検索アイコン */}
                        <button 
                          className="text-gray-700 p-1.5 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                          onClick={openMobileSearch}
                          aria-label="検索"
                        >
                          <Search className="h-5 w-5" />
                        </button>
                        
                        {/* モバイル表示のログインボタン類 */}
                        <div className="flex items-center gap-2">
                          <Link to="/login">
                            <Button variant="ghost" className="text-gray-700 text-xs px-2 py-1 hover:bg-gray-100 transition-colors">
                              ログイン
                            </Button>
                          </Link>
                          <Link to="/register">
                            <Button className="bg-black text-white hover:bg-gray-800 text-xs px-2 py-1 shadow-sm transition-colors">
                              会員登録
                            </Button>
                          </Link>
                        </div>
                      </div>
                      
                      {/* PC表示のログインボタン類 */}
                      <div className="hidden md:flex items-center gap-2">
                        <Link to="/login">
                          <Button variant="ghost" className="text-gray-700 text-sm px-3 py-1.5 hover:bg-gray-100 transition-colors">
                            ログイン
                          </Button>
                        </Link>
                        <Link to="/register">
                          <Button className="bg-black text-white hover:bg-gray-800 text-sm px-3 py-1.5 shadow-sm transition-colors">
                            会員登録
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          onClick={toggleLogin}
                          className="text-gray-700 text-sm px-3 py-1.5 hover:bg-gray-100 transition-colors"
                        >
                          デモ切替
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* カテゴリタブ（写真のようなUIに） - スマホ画面の時だけ表示 */}
        <div className={`md:hidden py-3 relative ${mobileSearchOpen ? 'hidden' : ''}`}>
          <div className="px-4 overflow-x-auto scrollbar-none">
            <div className="flex space-x-2.5 w-max">
              {categoryTabs.map((tab, index) => (
                <button
                  key={tab.id}
                  ref={el => tabButtonsRef.current[index] = el}
                  data-tab-id={tab.id}
                  className={`py-1.5 px-4 rounded-full text-xs font-medium transition-colors active:scale-95 touch-manipulation ${
                    tab.id === activeTab
                      ? 'bg-gray-800 text-white shadow-sm'
                      : 'bg-white text-gray-800 border border-gray-800 shadow-sm hover:bg-gray-100'
                  }`}
                  onClick={() => changeTab(tab.id)}
                  aria-pressed={tab.id === activeTab}
                >
                  {tab.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* メインのコンテンツエリア - ヘッダーの下にマージンを設ける */}
      <div className="pt-20 md:pt-16">
        {/* スマホ用タブコンテンツは削除 - フォロー中ページに移行 */}
      </div>

      {/* ユーザーメニュー */}
      <UserMenu 
        isOpen={userMenuOpen} 
        onClose={() => setUserMenuOpen(false)}
        username="しゅんや@準備中のアプリ運営"
        avatarUrl="https://github.com/shadcn.png"
        isDesktop={!isMobile}
        anchorPosition={{ top: 64, right: 16 }}
      />
    </>
  );
};

export default Header;