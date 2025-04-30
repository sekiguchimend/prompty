"use client";

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Search, PenSquare, Bell, ChevronRight, Heart, MessageSquare, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useToast } from './ui/use-toast';
import NotificationDropdown from './NotificationDropdown';
import UserMenu from './UserMenu';
import { PostItem, getFollowingPosts, getTodayForYouPosts } from '../data/posts';
import { useAuth } from '../lib/auth-context'; // AuthContextからuseAuthをインポート
import { supabase } from '../lib/supabaseClient';

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  // useAuthフックを使用してログイン状態を取得
  const { user, isLoading, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false); // モバイル検索表示状態
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('all');
  const [userMenuOpen, setUserMenuOpen] = useState(false); // ユーザーメニュー表示状態
  const userProfile = useUserProfile(user?.id);
  const tabButtonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  
  // 表示用の名前とアバターURLを取得
  const displayName = userProfile?.display_name || userProfile?.username || user?.email?.split('@')[0] || "ユーザー";
  const profileAvatarUrl = userProfile?.avatar_url || user?.user_metadata?.avatar_url || "https://github.com/shadcn.png";

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

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('🔍 ヘッダーから検索実行:', searchQuery.trim());
      setMobileSearchOpen(false);
      // URLを直接構築して遷移（検索キーワードを確実に反映）
      const searchUrl = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
      
      // 現在のURLと同じ検索クエリの場合、強制的にページをリロード
      if (pathname === '/search' && searchParams?.get('q') === searchQuery.trim()) {
        console.log('🔄 同じクエリでリロード:', searchUrl);
        window.location.href = searchUrl; // 完全なページリロード
      } else {
        console.log('🔀 新しいクエリで遷移:', searchUrl);
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
    
    // フォローページの場合、遷移前にデータをプリロードする
    if (tabId === 'following' && user) {
      // 先にローディング状態を表示するためのスムーズな遷移
      router.prefetch('/Following');
    }
    
    // 対応するパスに遷移
    router.push(selectedTab.path);
  };

  // キーボードショートカットリスナー
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

  // ログアウト処理を追加
  const handleLogout = async () => {
    try {
      // AuthContextのsignOut関数を呼び出し
      await signOut();      
      // ログインページにリダイレクト
      setTimeout(() => {
        window.location.href = '/Login'; // 完全なページリロードのためlocation.hrefを使用
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
        {/* サイト名とナビゲーション */}
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* サイト名 */}
            <div className={`flex items-center ${mobileSearchOpen ? 'hidden' : ''}`}>
              <div className="flex items-center z-20">
                <Link href="/" className="flex items-center">
                  <Image 
                    src="https://qrxrulntwojimhhhnwqk.supabase.co/storage/v1/object/public/prompt-thumbnails/prompty_logo.jpg" 
                    alt="Prompty" 
                    className="object-contain" 
                    style={{
                      width: 'auto',
                      height: '32px',
                      maxWidth: '100%',
                      display: 'block'
                    }} 
                    width={32}
                    height={32}
                    priority
                  />
                </Link>
              </div>
            </div>
            
            {/* モバイル検索バーが開いているときは通常のヘッダーコンテンツを隠す */}
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
                    {/* 検索ボタンを追加 */}
                    <button
                      type="submit"
                      className="absolute right-10 text-gray-500 hover:text-gray-700 transition-colors bg-transparent px-2 py-1 rounded"
                      aria-label="検索する"
                    >
                      検索
                    </button>
                    {/* 閉じるボタンを追加 */}
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
                {/* PC画面での検索バー - 中央配置 */}
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
                                <AvatarImage src={profileAvatarUrl} alt={displayName} />
                                <AvatarFallback className="bg-gray-100 text-gray-700 text-xs">
                                  {displayName ? displayName.charAt(0).toUpperCase() : 'U'}
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
          username={displayName}
          avatarUrl={profileAvatarUrl}
          isDesktop={!isMobile}
          anchorPosition={{ top: 64, right: 16 }}
          followingUsersLink="/FollowingUsers"
        />
      )}
    </>
  );
};

export default memo(Header);
