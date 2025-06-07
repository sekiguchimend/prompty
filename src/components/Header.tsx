"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Search, PenSquare, Bell, ChevronRight, Heart, MessageSquare, X, Code, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useToast } from './ui/use-toast';
import NotificationDropdown from './notification-dropdown';
import UserMenu from './user-menu';
import { PostItem, getFollowingPosts, getTodayForYouPosts } from '../data/posts';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabaseClient';

// カテゴリタブMen
const categoryTabs = [
  { id: 'all', name: 'すべて', path: '/' },
  { id: 'following', name: 'フォロー中', path: '/following' },
  // { id: 'featured', name: '注目', path: '/featured' },
  { id: 'posts', name: '投稿企画', path: '/contest-page' },
  { id: 'contact', name: 'お問い合わせ', path: '/contact' },
  { id: 'feedback', name: 'フィードバック', path: '/feedback' },
];

// 管理者リストを定義
const ADMIN_EMAILS = ['queue@queuetech.jp', 'admin@queuetech.jp', 'queue@queue-tech.jp']; 

// プロフィール情報の型定義
interface UserProfile {
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

// ユーザープロフィール情報取得カスタムフック
const useUserProfile = (userId: string | undefined) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchUserProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, display_name, avatar_url')
          .eq('id', userId)
          .single();

        if (error) {
          console.error('ヘッダー: プロフィール取得エラー:', error);
          return;
        }

        if (data) {
          setUserProfile({
            username: data.username as string | undefined,
            display_name: data.display_name as string | undefined,
            avatar_url: data.avatar_url as string | undefined
          });
        }
      } catch (error) {
        console.error('ヘッダー: プロフィール取得中のエラー:', error);
      }
    };

    fetchUserProfile();
  }, [userId]);

  return userProfile;
};

// 画面サイズ監視カスタムフック
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

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

  return isMobile;
};

// 管理者チェック関数
const isAdminUser = (email: string | undefined) => {
  if (!email) return false;
  // 特定のメールアドレスリストに含まれるかチェック
  if (ADMIN_EMAILS.includes(email)) return true;
  // queuetech.jpドメインのメールアドレスかチェック
  return email.endsWith('@queuetech.jp') || email.endsWith('@queue-tech.jp');
};

const Header = () => {
  const router = useRouter();
  const pathname = router.pathname;
  const queryParams = router.query;
  const { toast } = useToast();
  const { user, isLoading, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('all');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userProfile = useUserProfile(user?.id);
  const tabButtonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const displayName = userProfile?.display_name || userProfile?.username || user?.email?.split('@')[0] || "ユーザー";
  const profileAvatarUrl = userProfile?.avatar_url || user?.user_metadata?.avatar_url || "https://github.com/shadcn.png";

  useEffect(() => {
    const currentPath = pathname || '/';

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setMobileSearchOpen(false);
      const searchUrl = `/search?q=${encodeURIComponent(searchQuery.trim())}`;

      if (pathname === '/search' && queryParams?.q === searchQuery.trim()) {
        window.location.href = searchUrl;
      } else {
        router.push(searchUrl);
      }
      setSearchQuery('');
    } else {
      toast({
        title: "検索キーワードを入力してください",
        description: "キーワードを入力して検索してください",
        variant: "destructive",
      });
    }
  };

  const openMobileSearch = () => {
    setMobileSearchOpen(true);
  };

  const closeMobileSearch = () => {
    setMobileSearchOpen(false);
    setSearchQuery('');
  };

  const changeTab = (tabId: string) => {
    setActiveTab(tabId);

    const selectedTab = categoryTabs.find(tab => tab.id === tabId);
    if (!selectedTab) return;

    if (tabId === 'following' && user) {
      router.prefetch('/following');
    }

    router.push(selectedTab.path);
  };

  useEffect(() => {
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

  const handleLogout = async () => {
    try {
      await signOut();      
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    } catch (error) {
      console.error('🔴 Header: Logout error:', error);
      alert('ログアウト中にエラーが発生しました。ページをリロードしてください。');
    }
  };

  const setTabButtonRef = useCallback((index: number) => (el: HTMLButtonElement | null) => {
    tabButtonsRef.current[index] = el;
  }, []);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className={`flex items-center ${mobileSearchOpen ? 'hidden' : ''}`}>
              <div className="flex items-center z-20">
                <Link href="/" className="flex items-center">
                  <Image 
                    src="https://qrxrulntwojimhhhnwqk.supabase.co/storage/v1/object/public/prompt-thumbnails//prompty_logo(1).png" 
                    alt="Prompty" 
                    className="object-contain"
                    width={100}
                    height={40}
                    style={{
                      objectFit: 'contain',
                      maxHeight: '30px',
                      width: 'auto'
                    }}
                    priority
                    quality={90}
                    sizes="(max-width: 768px) 80px, 100px"
                    loading="eager"
                  />
                </Link>
              </div>
            </div>

            {mobileSearchOpen ? (
              <div className="flex w-full items-center">
                <form onSubmit={handleSearchSubmit} className="flex-1">
                  <div className="relative flex items-center">
                    <Search className="absolute left-3 h-5 w-5 text-gray-500" />
                    <Input
                      type="text"
                      placeholder="キーワードで検索"
                      className="w-full bg-gray-100 pl-10 rounded-md border-none h-10"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="absolute right-10 text-gray-500 hover:text-gray-700 transition-colors bg-transparent px-2 py-1 rounded"
                      aria-label="検索する"
                    >
                      検索
                    </button>
                    <button
                      type="button"
                      onClick={closeMobileSearch}
                      className="absolute right-1 text-gray-500 hover:text-gray-700 transition-colors"
                      aria-label="検索を閉じる"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                <div className="hidden md:flex md:flex-1 md:justify-center md:px-4 mx-4">
                  <div className="relative w-full max-w-md">
                    <form onSubmit={handleSearchSubmit} className="w-full">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        type="text"
                        placeholder="キーワードでやクリエイターで検索"
                        className="w-full bg-gray-100 pl-9 rounded-md border-none"
                        value={searchQuery}
                        onChange={handleSearchChange}
                      />
                      <button
                        type="submit"
                        className="absolute right-2.5 top-2.5 h-5 select-none items-center gap-1 rounded bg-transparent hover:bg-gray-200 px-1.5 text-xs text-gray-500 flex"
                      >
                        検索
                      </button>
                    </form>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {!isLoading && (
                    <>
                      {!user ? (
                        <>
                          <div className="flex items-center gap-3 md:hidden">
                            <button 
                              className="text-gray-700 p-1.5 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                              onClick={openMobileSearch}
                              aria-label="検索"
                            >
                              <Search className="h-5 w-5" />
                            </button>

                            <div className="flex items-center gap-2">
                              <Link href="/login">
                                <Button variant="ghost" className="text-gray-700 text-xs px-2 py-1 hover:bg-gray-100 transition-colors">
                                  ログイン
                                </Button>
                              </Link>
                              <Link href="/register">
                                <Button className="bg-black text-white hover:bg-gray-800 text-xs px-2 py-1 shadow-sm transition-colors">
                                  会員登録
                                </Button>
                              </Link>
                            </div>
                          </div>

                          <div className="hidden md:flex items-center gap-2">
                            <Link href="/login">
                              <Button variant="ghost" className="text-gray-700 text-sm px-3 py-1.5 hover:bg-gray-100 transition-colors">
                                ログイン
                              </Button>
                            </Link>
                            <Link href="/register">
                              <Button className="bg-black text-white hover:bg-gray-800 text-sm px-3 py-1.5 shadow-sm transition-colors">
                                会員登録
                              </Button>
                            </Link>
                          </div>
                        </>
                      ) : (
                        <>
                          <Button 
                            variant="secondary" 
                            size="sm" 
                            className="bg-black text-white hover:bg-gray-800 hidden md:flex shadow-sm"
                            onClick={() => router.push('/create-post')}
                          >
                            <PenSquare className="mr-2 h-4 w-4" />
                            投稿
                          </Button>

                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="hidden md:flex items-center gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                            onClick={() => router.push('/code-generator')}
                          >
                            <Code className="h-4 w-4" />
                            AI生成
                          </Button>

                          <div className="flex items-center gap-3 md:hidden">
                            <button 
                              className="text-gray-700 p-1.5 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                              onClick={openMobileSearch}
                              aria-label="検索"
                            >
                              <Search className="h-5 w-5" />
                            </button>

                            <div className="p-1.5 flex items-center justify-center">
                              <NotificationDropdown />
                            </div>

                            {user?.email && isAdminUser(user.email) && (
                              <button
                                className="bg-red-600 text-white p-2 rounded-full flex items-center justify-center shadow-sm hover:bg-red-700 transition-colors"
                                onClick={() => {
                                  if (window.confirm('管理ページに移動しますか？')) {
                                    router.push('/admin');
                                  }
                                }}
                                aria-label="管理ページ"
                              >
                                <Settings className="h-4 w-4" />
                              </button>
                            )}
                            
                            <button
                              className="bg-purple-600 text-white p-2 rounded-full flex items-center justify-center shadow-sm hover:bg-purple-700 transition-colors"
                              onClick={() => router.push('/code-generator')}
                              aria-label="AI生成"
                            >
                              <Code className="h-4 w-4" />
                            </button>

                            <button
                              className="bg-black text-white p-2 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-800 transition-colors"
                              onClick={() => router.push('/create-post')}
                              aria-label="投稿する"
                            >
                              <PenSquare className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="hidden md:block">
                            <NotificationDropdown />
                          </div>

                          {user?.email && isAdminUser(user.email) && (
                            <Link href="/admin" passHref>
                              <Button
                                variant="outline"
                                className="hidden md:inline-flex items-center justify-center mr-2"
                                onClick={(e) => {
                                  if (!window.confirm('管理ページに移動しますか？')) {
                                    e.preventDefault();
                                  } else {
                                    console.log('管理ページへ移動します', user.email);
                                  }
                                }}
                              >
                                管理ページ
                              </Button>
                            </Link>
                          )}

                          <div className="flex items-center">
                            <Button 
                              variant="ghost" 
                              className="p-0.5 ml-0 rounded-full hover:bg-gray-100 transition-colors"
                              onClick={() => setUserMenuOpen(!userMenuOpen)}  
                            >
                              <Avatar className="h-7 w-7 border border-gray-200">
                                <AvatarImage src={profileAvatarUrl} alt={displayName} />
                                <AvatarFallback className="bg-gray-100 text-gray-700 text-xs">
                                  {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
                                </AvatarFallback>
                              </Avatar>
                            </Button>
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

      {user && (
        <UserMenu 
          isOpen={userMenuOpen} 
          onClose={() => setUserMenuOpen(false)}
          username={displayName}
          avatarUrl={profileAvatarUrl}
          isDesktop={!isMobile}
          anchorPosition={{ top: 64, right: 16 }}
          followingUsersLink="/following-users"
        />
      )}
    </>
  );
};

export default Header;
