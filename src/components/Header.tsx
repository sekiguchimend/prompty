
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Link, useNavigate } from 'react-router-dom';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from './ui/command';
import { useToast } from './ui/use-toast';
import { useIsMobile } from '../hooks/use-mobile';

const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);

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
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <a href="/" className="flex items-center">
            <span className="text-2xl font-bold">n<span>o⁺e</span></span>
            <span className="ml-1 text-pink-400">🌸</span>
          </a>
        </div>
        
        {!isMobile && (
          <div className="hidden md:flex md:flex-1 md:justify-center md:px-4 max-w-xs mx-auto">
            <div className="relative w-full">
              <form onSubmit={handleSearchSubmit} className="w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="検索"
                  className="w-full bg-gray-100 pl-9 rounded-full border-none h-9"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onClick={() => setOpen(true)}
                />
              </form>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost" size="sm" className="text-gray-700">
              ログイン
            </Button>
          </Link>
          <Link to="/register">
            <Button size="sm" className="bg-black text-white hover:bg-gray-800">
              会員登録
            </Button>
          </Link>
        </div>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="検索..."
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
