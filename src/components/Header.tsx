import React, { useState, useEffect } from 'react';
import { Search, PenSquare, Menu, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from './ui/command';
import { useToast } from './ui/use-toast';
import NotificationDropdown from './NotificationDropdown';

const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  // This would normally come from an auth context
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false); // モバイル検索表示状態
  const [isMobile, setIsMobile] = useState(false);

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

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
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
            {/* タイトル部分 - 左寄せ */}
            <div className="flex items-center">
              <a href="/" className="flex items-center">
                <span className="text-xl md:text-2xl font-bold text-prompty-primary">p<span className="text-black">rompty</span></span>
                <span className="ml-1 text-pink-400">🌸</span>
              </a>
            </div>
            
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
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3">
              {isLoggedIn ? (
                <>
                  {/* PCでのみ表示する投稿ボタン */}
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="bg-black text-white hover:bg-gray-800 hidden md:flex"
                    onClick={() => navigate('/create-post')}
                  >
                    <PenSquare className="mr-2 h-4 w-4" />
                    投稿
                  </Button>
                  
                  {/* スマホ画面のアイコン群 - 右寄せ */}
                  <div className="flex items-center gap-1 sm:gap-2 md:hidden">
                    {/* 検索アイコン */}
                    <button 
                      className="p-1 sm:p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-700" 
                      onClick={openMobileSearch}
                      aria-label="検索"
                    >
                      <Search className="h-5 w-5" />
                    </button>
                    
                    {/* 投稿アイコン */}
                    <button
                      className="p-1 sm:p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-700"
                      onClick={() => navigate('/create-post')}
                      aria-label="投稿する"
                    >
                      <PenSquare className="h-5 w-5" />
                    </button>
                    
                    {/* 通知ドロップダウン */}
                    <NotificationDropdown />
                  </div>
                  
                  {/* PC画面での通知ドロップダウン */}
                  <div className="hidden md:block">
                    <NotificationDropdown />
                  </div>
                  
                  {/* アバター */}
                  <Button 
                    variant="ghost" 
                    className="p-0 sm:p-1 ml-0 sm:ml-1"
                    onClick={toggleLogin} // For demo purposes
                  >
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8 border border-gray-200">
                      <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                      <AvatarFallback className="bg-gray-100 text-gray-700 text-xs sm:text-sm">U</AvatarFallback>
                    </Avatar>
                  </Button>
                </>
              ) : (
                <>
                  {/* 未ログイン時のモバイル検索アイコン */}
                  <button 
                    className="md:hidden p-1 sm:p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-700" 
                    onClick={openMobileSearch}
                    aria-label="検索"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                  
                  <Link to="/login">
                    <Button variant="ghost" className="text-gray-700 text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 md:text-sm md:px-4 md:py-2">
                      ログイン
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button className="bg-black text-white hover:bg-gray-800 text-xs px-1.5 py-0.5 sm:px-2 sm:py-1 md:text-sm md:px-4 md:py-2">
                      会員登録
                    </Button>
                  </Link>
                  <Link to="/business" className="hidden md:inline-block">
                    <Button variant="ghost" className="text-gray-700">
                      法人の方
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    onClick={toggleLogin} // For demo purposes
                    className="text-gray-700 text-xs border border-gray-200 px-1 py-0.5 md:text-sm md:px-3 md:py-1"
                  >
                    デモ切替
                  </Button>
                </>
              )}
            </div>
          </>
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
    </header>
  );
};

export default Header;