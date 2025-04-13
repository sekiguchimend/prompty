import React, { useState, useEffect } from 'react';
import { Search, PenSquare, Bell, X, ChevronRight, Heart, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from './ui/command';
import { useToast } from './ui/use-toast';
import NotificationDropdown from './NotificationDropdown';
import UserMenu from './UserMenu';
import { PostItem, getFollowingPosts, getTodayForYouPosts } from '../data/posts';

// カテゴリタブ
const categoryTabs = [
  { id: 'all', name: 'すべて' },
  { id: 'following', name: 'フォロー中' },
  { id: 'featured', name: '注目' },
  { id: 'posts', name: '投稿企画' },
];

const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  // This would normally come from an auth context
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false); // モバイル検索表示状態
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [userMenuOpen, setUserMenuOpen] = useState(false); // ユーザーメニュー表示状態
  
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
      setOpen(false);
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
    
    // 投稿企画タブが選択された場合、コンテストページに遷移
    if (tabId === 'posts') {
      navigate('/contests');
      return;
    }
  };

  // Open search dialog on keyboard shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isMobile) {
          setMobileSearchOpen(true);
        } else {
          setOpen((open) => !open);
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
                <span className="text-xl font-bold"><span className="text-prompty-primary">p</span><span className="text-black">rompty</span><span className="ml-1 text-pink-400">🌸</span></span>
              </Link>
            </div>
            
            {/* モバイル検索バーが開いているときは通常のヘッダーコンテンツを隠す */}
            {mobileSearchOpen ? (
              <div className="flex w-full items-center">
                <form onSubmit={handleSearchSubmit} className="flex-1">
                  <div className="relative flex items-center">
                    <Search className="absolute left-3 h-5 w-5 text-gray-500" />
                    <Input
                      type="search"
                      placeholder="キーワードやクリエイターで検索"
                      className="w-full bg-gray-100 pl-10 pr-10 rounded-md border-none h-10"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="absolute right-3 text-gray-500"
                      onClick={closeMobileSearch}
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
                        type="search"
                        placeholder="キーワードやクリエイターで検索"
                        className="w-full bg-gray-100 pl-9 rounded-md border-none"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onClick={() => setOpen(true)}
                      />
                      <kbd className="absolute right-2.5 top-2.5 hidden h-5 select-none items-center gap-1 rounded border bg-gray-100 px-1.5 font-mono text-xs text-gray-500 md:flex">
                        <span className="text-xs">⌘</span>K
                      </kbd>
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
              {categoryTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`py-1.5 px-4 rounded-full text-xs font-medium transition-colors ${
                    tab.id === 'all'
                      ? 'bg-gray-800 text-white shadow-sm'
                      : tab.id === activeTab
                        ? 'bg-gray-800 text-white shadow-sm'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => changeTab(tab.id)}
                >
                  {tab.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* メインのコンテンツエリア - ヘッダーの下にマージンを設ける。スマホとPCで異なる値を設定 */}
      <div className="pt-20 md:pt-16">
        {/* スマホ用タブコンテンツを表示 */}
        {isMobile && activeTab === 'following' && (
          <div className="bg-white mt-14 md:mt-0">
            <div className="pb-3 px-4 flex items-center">
              <h2 className="text-xl font-bold">フォロー中</h2>
              <span className="text-gray-500 ml-1">
                <ChevronRight className="h-5 w-5" />
              </span>
            </div>
            
            {/* フォロー中の投稿一覧（写真のような表示） */}
            <div className="divide-y divide-gray-100 ">
              {followingPosts.map((post) => (
                <article key={post.id} className="px-4 py-5">
                  <div className="flex">
                    <div className="flex-1 pr-4 overflow-hidden">
                      <h3 className="font-medium text-[15px] mb-2.5 leading-tight line-clamp-2">{post.title}</h3>
                      <div className="flex items-center mt-2.5">
                        <div className="w-5 h-5 rounded-full overflow-hidden mr-1.5">
                          <img src={post.user.avatarUrl} alt={post.user.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs text-gray-500">{post.user.name}</span>
                        <span className="text-xs text-gray-500 ml-2">{post.postedAt}</span>
                      </div>
                      <div className="flex items-center mt-2.5">
                        <button className="flex items-center text-gray-400 mr-4">
                          <Heart className="h-[14px] w-[14px] mr-1.5" />
                          <span className="text-xs">{post.likeCount}</span>
                        </button>
                        <button className="flex items-center text-gray-400">
                          <MessageSquare className="h-[14px] w-[14px]" />
                        </button>
                      </div>
                    </div>
                    <div className="w-[104px] h-[58px] flex-shrink-0 bg-gray-100 rounded-md overflow-hidden shadow-sm">
                      <img src={post.thumbnailUrl} alt={post.title} className="w-full h-full object-cover" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
            
            {/* 今日のあなたに */}
            <div className="pt-6 pb-3 px-4 flex items-center justify-between">
              <div className="flex items-center">
                <h2 className="text-xl font-bold">今日のあなたに</h2>
                <span className="text-gray-500 ml-1">
                  <ChevronRight className="h-5 w-5" />
                </span>
              </div>
            </div>
            
            {/* 今日のあなたに投稿一覧 */}
            <div className="divide-y divide-gray-100">
              {todayForYouPosts.map((post) => (
                <article key={post.id} className="px-4 py-5">
                  <div className="flex">
                    <div className="flex-1 pr-4 overflow-hidden">
                      <h3 className="font-medium text-[15px] mb-2.5 leading-tight line-clamp-2">{post.title}</h3>
                      <div className="flex items-center mt-2.5">
                        <div className="w-5 h-5 rounded-full overflow-hidden mr-1.5">
                          <img src={post.user.avatarUrl} alt={post.user.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs text-gray-500">{post.user.name}</span>
                        <span className="text-xs text-gray-500 ml-2">{post.postedAt}</span>
                      </div>
                      <div className="flex items-center mt-2.5">
                        <button className="flex items-center text-gray-400 mr-4">
                          <Heart className="h-[14px] w-[14px] mr-1.5" />
                          <span className="text-xs">{post.likeCount}</span>
                        </button>
                        <button className="flex items-center text-gray-400">
                          <MessageSquare className="h-[14px] w-[14px]" />
                        </button>
                      </div>
                    </div>
                    <div className="w-[104px] h-[58px] flex-shrink-0 bg-gray-100 rounded-md overflow-hidden shadow-sm">
                      <img src={post.thumbnailUrl} alt={post.title} className="w-full h-full object-cover" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* PCのみに表示する検索ダイアログ */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="キーワードやクリエイターで検索..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearchSubmit(e);
            }
          }}
        />
        <CommandList>
          <CommandEmpty>検索結果がありません</CommandEmpty>
          {searchQuery && (
            <CommandGroup heading="サジェスチョン">
              <CommandItem
                onSelect={() => {
                  setOpen(false);
                  navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                  setSearchQuery('');
                }}
              >
                <Search className="mr-2 h-4 w-4" />
                <span>{searchQuery}</span> を検索
              </CommandItem>
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>

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