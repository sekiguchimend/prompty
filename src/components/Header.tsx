
import React from 'react';
import { Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Link } from 'react-router-dom';

const Header = () => {
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
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="キーワードやクリエイターで検索"
              className="w-full bg-gray-100 pl-9 rounded-md border-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login">
            <Button variant="ghost" className="text-gray-700">
              ログイン
            </Button>
          </Link>
          <Button className="bg-black text-white hover:bg-gray-800">
            会員登録
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
