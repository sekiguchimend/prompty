import React, { useState, memo } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useRouter } from 'next/router';
import { useToast } from '../ui/use-toast';

interface SearchBarProps {
  isMobile?: boolean;
  onMobileClose?: () => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = memo(({
  isMobile = false,
  onMobileClose,
  className,
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (searchQuery.trim()) {
      onMobileClose?.();
      
      // URLを直接構築して遷移
      const searchUrl = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
      
      // 現在のURLと同じ検索クエリの場合、強制的にページをリロード
      if (router.pathname === '/search' && router.query?.q === searchQuery.trim()) {
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

  if (isMobile) {
    return (
      <div className={`fixed inset-0 bg-white z-50 flex flex-col ${className}`}>
        {/* モバイル検索ヘッダー */}
        <div className="flex items-center p-4 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileClose}
            aria-label="検索を閉じる"
          >
            <X className="h-5 w-5" />
          </Button>
          <span className="ml-2 text-lg font-medium">検索</span>
        </div>
        
        {/* モバイル検索フォーム */}
        <form onSubmit={handleSearchSubmit} className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="search"
              placeholder="プロンプトを検索..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-3 text-lg"
              autoFocus
            />
          </div>
          <Button
            type="submit"
            className="w-full mt-4"
            disabled={!searchQuery.trim()}
          >
            検索
          </Button>
        </form>
      </div>
    );
  }

  // デスクトップ検索バー
  return (
    <form onSubmit={handleSearchSubmit} className={`flex-1 max-w-xl ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          type="search"
          placeholder="プロンプトを検索..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-10 pr-4 w-full"
        />
      </div>
    </form>
  );
});

SearchBar.displayName = 'SearchBar'; 