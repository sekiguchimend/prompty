
import React, { useState } from 'react';
import { Search, Bell, PenSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const Header = () => {
  // This would normally come from an auth context
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Toggle login state (for demo purposes)
  const toggleLogin = () => {
    setIsLoggedIn(!isLoggedIn);
  };

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
          {isLoggedIn ? (
            <>
              <Button 
                variant="secondary" 
                size="sm" 
                className="bg-black text-white hover:bg-gray-800 hidden md:flex"
                onClick={() => console.log('Post new content')}
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
                <Button variant="ghost" className="text-gray-700">
                  ログイン
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-black text-white hover:bg-gray-800">
                  会員登録
                </Button>
              </Link>
              <Link to="/business" className="hidden md:inline-block">
                <Button variant="ghost" className="text-gray-700">
                  法人の方
                </Button>
              </Link>
              <Button 
                className="hidden" 
                variant="ghost" 
                onClick={toggleLogin} // For demo purposes
              >
                デモ切替
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
