"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, PenSquare, Bell, ChevronRight, Heart, MessageSquare, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useToast } from './ui/use-toast';
import NotificationDropdown from './NotificationDropdown';
import UserMenu from './UserMenu';
import { PostItem, getFollowingPosts, getTodayForYouPosts } from '../data/posts';
import { useAuth } from '../lib/auth-context'; // AuthContextからuseAuthをインポート

// カテゴリタブMen
const categoryTabs = [
  { id: 'all', name: 'すべて', path: '/' },
  { id: 'following', name: 'フォロー中', path: '/Following' },
  // { id: 'featured', name: '注目', path: '/featured' },
  { id: 'posts', name: '投稿企画', path: '/ContestPage' },
  { id: 'contact', name: 'お問い合わせ', path: '/contact' },
  { id: 'feedback', name: 'フィードバック', path: '/Feedback' },
];

// 管理者リストを定義
const ADMIN_EMAILS = ['queue@queuetech.jp', 'admin@queuetech.jp', 'queue@queue-tech.jp']; 

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  // useAuthフックを使用してログイン状態を取得
  const { user, isLoading, signOut } = useAuth();
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
    const currentPath = pathname || '/';
    
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
  }, [pathname]);

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

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setMobileSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
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
    router.push(selectedTab.path);
    
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

  // ログアウト処理を追加
  const handleLogout = async () => {
    try {
      console.log('🔄 Header: Logging out user...');
      
      // AuthContextのsignOut関数を呼び出し
      await signOut();
      
      console.log('🟢 Header: Logged out successfully!');
      
      // ログインページにリダイレクト
      setTimeout(() => {
        window.location.href = '/Login'; // 完全なページリロードのためlocation.hrefを使用
      }, 100);
    } catch (error) {
      console.error('🔴 Header: Logout error:', error);
      alert('ログアウト中にエラーが発生しました。ページをリロードしてください。');
    }
  };

  // 管理者かどうかをチェックする関数を追加
  const isAdminUser = (email: string | undefined) => {
    if (!email) return false;
    // 特定のメールアドレスリストに含まれるかチェック
    if (ADMIN_EMAILS.includes(email)) return true;
    // queuetech.jpドメインのメールアドレスかチェック
    return email.endsWith('@queuetech.jp') || email.endsWith('@queue-tech.jp');
  };

  const setTabButtonRef = useCallback((index: number) => (el: HTMLButtonElement | null) => {
    tabButtonsRef.current[index] = el;
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        {/* サイト名とナビゲーション */}
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* サイト名 */}
            <div className={`flex items-center ${mobileSearchOpen ? 'hidden' : ''}`}>
              <Link href="/" className="flex items-center">
                <img src="/prompty_logo.jpg" alt="Prompty" className="h-32" />
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
                    {/* 閉じるボタンを追加 */}
                    <button
                      type="button"
                      onClick={closeMobileSearch}
                      className="absolute right-3 text-gray-500 hover:text-gray-700 transition-colors"
                      aria-label="検索を閉じる"
                    >
                      <X className="h-5 w-5" />
                    </button>
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
                  {/* isLoadingを考慮してUIを表示 */}
                  {!isLoading && (
                    <>
                      {user ? (
                        <>
                          {/* PCでのみ表示する投稿ボタン */}
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="bg-black text-white hover:bg-gray-800 hidden md:flex shadow-sm"
                            onClick={() => router.push('/CreatePost')}
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
                              onClick={() => router.push('/CreatePost')}
                              aria-label="投稿する"
                            >
                              <PenSquare className="h-4 w-4" />
                            </button>
                          </div>
                          
                          {/* PC画面での通知ドロップダウン */}
                          <div className="hidden md:block">
                            <NotificationDropdown />
                          </div>
                          
                          {/* 管理者ページへのリンク（管理者ユーザーの場合のみ表示） */}
                          {user?.email && isAdminUser(user.email) && (
                            <Link href="/admin" passHref>
                              <Button
                                variant="outline"
                                className="hidden md:inline-flex items-center justify-center mr-2"
                                onClick={(e) => {
                                  // クリック時の確認ダイアログを表示
                                  if (!window.confirm('管理ページに移動しますか？')) {
                                    e.preventDefault(); // キャンセル時は遷移を中止
                                  } else {
                                    console.log('管理ページへ移動します', user.email);
                                  }
                                }}
                              >
                                管理ページ
                              </Button>
                            </Link>
                          )}
                          
                          {/* アバター */}
                          <div className="flex items-center">
                            <Button 
                              variant="ghost" 
                              className="p-0.5 ml-0 rounded-full hover:bg-gray-100 transition-colors"
                              onClick={() => setUserMenuOpen(!userMenuOpen)}  
                            >
                              <Avatar className="h-7 w-7 border border-gray-200">
                                <AvatarImage src={user?.user_metadata?.avatar_url || "https://github.com/shadcn.png"} alt={user?.email || "User"} />
                                <AvatarFallback className="bg-gray-100 text-gray-700 text-xs">
                                  {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                                </AvatarFallback>
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
                              <Link href="/Login">
                                <Button variant="ghost" className="text-gray-700 text-xs px-2 py-1 hover:bg-gray-100 transition-colors">
                                  ログイン
                                </Button>
                              </Link>
                              <Link href="/Register">
                                <Button className="bg-black text-white hover:bg-gray-800 text-xs px-2 py-1 shadow-sm transition-colors">
                                  会員登録
                                </Button>
                              </Link>
                            </div>
                          </div>
                          
                          {/* PC表示のログインボタン類 */}
                          <div className="hidden md:flex items-center gap-2">
                            <Link href="/Login">
                              <Button variant="ghost" className="text-gray-700 text-sm px-3 py-1.5 hover:bg-gray-100 transition-colors">
                                ログイン
                              </Button>
                            </Link>
                            <Link href="/Register">
                              <Button className="bg-black text-white hover:bg-gray-800 text-sm px-3 py-1.5 shadow-sm transition-colors">
                                会員登録
                              </Button>
                            </Link>
                          </div>
                        </>
                      )}
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
                  ref={setTabButtonRef(index)}
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

    {/* ユーザーメニュー - ユーザーがログインしている場合のみ表示 */}
      {user && (
        <UserMenu 
            isOpen={userMenuOpen} 
          onClose={() => setUserMenuOpen(false)}
          username={user?.user_metadata?.full_name || user?.email?.split('@')[0] || "ユーザー"}
          avatarUrl={user?.user_metadata?.avatar_url || "https://github.com/shadcn.png"}
          isDesktop={!isMobile}
          anchorPosition={{ top: 64, right: 16 }}
        />
      )}

      {/* 投稿ボタン（モバイルでは右下フローティングボタン） - ユーザーがログインしている場合のみ表示 */}
      {/* {user && (
        <Button 
          variant="link" 
          size="sm" 
          className="fixed right-4 bottom-20 z-50 md:hidden bg-black text-white p-4 rounded-full shadow-lg"
          onClick={() => router.push('/create-post')}
        >
          <PenSquare className="h-6 w-6" />
        </Button>
      )} */}

      {/* モバイル表示でのメニュー（ボトムナビゲーション） */}
      {/* <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 md:hidden z-40 px-2">
        <Button variant="ghost" size="sm" className="flex flex-col items-center justify-center h-full" onClick={() => router.push('/')}>
          <Search className="h-5 w-5 text-gray-600" />
          <span className="text-xs text-gray-600 mt-1">検索</span>
        </Button>
        
        <Button variant="ghost" size="sm" className="flex flex-col items-center justify-center h-full" onClick={() => router.push('/popular')}>
          <Heart className="h-5 w-5 text-gray-600" />
          <span className="text-xs text-gray-600 mt-1">おすすめ</span>
        </Button>
        
        <Button variant="ghost" size="sm" className="flex flex-col items-center justify-center h-full" onClick={() => router.push('/messages')}>
          <MessageSquare className="h-5 w-5 text-gray-600" />
          <span className="text-xs text-gray-600 mt-1">メッセージ</span>
        </Button>
      </div> */}
    </>
  );
};

export default Header;