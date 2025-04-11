import React, { useState } from 'react';
import { Search, Bell, PenSquare, Menu } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from './ui/command';
import { useToast } from './ui/use-toast';

const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  // This would normally come from an auth context
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);

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

  // Open search dialog on keyboard shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center">
          <a href="/" className="flex items-center mr-6">
            <span className="text-2xl font-bold text-prompty-primary">p<span className="text-black">rompty</span></span>
            <span className="ml-1 text-pink-400">🌸</span>
          </a>
        </div>
        
        <div className="hidden md:flex md:flex-1 md:justify-center md:px-4">
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

        <div className="flex items-center gap-4">
          {/* モバイル表示時の検索アイコン */}
          <button 
            className="md:hidden text-gray-700" 
            onClick={() => setOpen(true)}
            aria-label="検索"
          >
            <Search className="h-6 w-6" />
          </button>

          {isLoggedIn ? (
            <>
              <Button 
                variant="secondary" 
                size="sm" 
                className="bg-black text-white hover:bg-gray-800 hidden md:flex"
                onClick={() => navigate('/create-post')}
              >
                <PenSquare className="mr-2 h-4 w-4" />
                投稿
              </Button>
              
              <button className="relative">
                <Bell className="h-6 w-6 text-gray-700" />
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
              </button>
              
              <Button 
                variant="ghost" 
                className="p-1"
                onClick={toggleLogin} // For demo purposes
              >
                <Avatar className="h-8 w-8 border border-gray-200">
                  <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                  <AvatarFallback className="bg-gray-100 text-gray-700">U</AvatarFallback>
                </Avatar>
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="text-gray-700 text-xs px-2 py-1 md:text-sm md:px-4 md:py-2">
                  ログイン
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-black text-white hover:bg-gray-800 text-xs px-2 py-1 md:text-sm md:px-4 md:py-2">
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
      </div>

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
