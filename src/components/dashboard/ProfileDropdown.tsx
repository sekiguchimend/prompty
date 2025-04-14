import React from 'react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Settings, LogOut, User, Bell, CreditCard } from 'lucide-react';

const ProfileDropdown: React.FC = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center hover:bg-gray-100 rounded-md px-2 py-1 transition-colors">
          <Avatar className="h-8 w-8 border border-gray-200">
            <AvatarImage src="https://source.unsplash.com/random/100x100?face" alt="@username" />
            <AvatarFallback className="bg-gray-200 text-gray-700">CN</AvatarFallback>
          </Avatar>
          <span className="ml-2 text-sm font-medium text-gray-700 hidden sm:inline-block">アカウント</span>
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 20 20" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 ml-1 text-gray-500"
          >
            <path 
              fillRule="evenodd" 
              clipRule="evenodd" 
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" 
              fill="currentColor"
            />
          </svg>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-1 rounded-md shadow-md border border-gray-200">
        <div className="p-2 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-800">しゅんや@勤勉的なアプリ運営</p>
          <p className="text-xs text-gray-500">me@example.com</p>
        </div>
        
        <div className="p-1">
          <DropdownMenuItem className="px-3 py-2 text-sm cursor-pointer rounded-md text-gray-700 focus:bg-gray-100 focus:text-gray-900">
            <User className="mr-3 h-4 w-4 text-gray-500" />
            プロフィール
          </DropdownMenuItem>
          <DropdownMenuItem className="px-3 py-2 text-sm cursor-pointer rounded-md text-gray-700 focus:bg-gray-100 focus:text-gray-900">
            <Bell className="mr-3 h-4 w-4 text-gray-500" />
            通知
          </DropdownMenuItem>
          <DropdownMenuItem className="px-3 py-2 text-sm cursor-pointer rounded-md text-gray-700 focus:bg-gray-100 focus:text-gray-900">
            <CreditCard className="mr-3 h-4 w-4 text-gray-500" />
            課金
          </DropdownMenuItem>
          <DropdownMenuItem className="px-3 py-2 text-sm cursor-pointer rounded-md text-gray-700 focus:bg-gray-100 focus:text-gray-900">
            <Settings className="mr-3 h-4 w-4 text-gray-500" />
            設定
          </DropdownMenuItem>
        </div>
        
        <DropdownMenuSeparator className="my-1 bg-gray-100" />
        
        <div className="p-1">
          <DropdownMenuItem className="px-3 py-2 text-sm cursor-pointer rounded-md text-gray-700 focus:bg-gray-100 focus:text-gray-900">
            <LogOut className="mr-3 h-4 w-4 text-gray-500" />
            ログアウト
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown; 